use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use axum_extra::extract::{
    CookieJar,
    cookie::{Cookie, SameSite},
};
use chrono::{Duration, Utc};
use jsonwebtoken::{Algorithm, EncodingKey, Header, Validation, decode, decode_header, encode};
use sea_orm::{ActiveValue::Set, DbErr, EntityTrait, sea_query::OnConflict};
use serde::{Deserialize, Serialize};
use strum_macros::AsRefStr;
use utoipa::ToSchema;

use crate::_common::app_json::AppJson;
use crate::_common::app_state::AppState;
use crate::_common::auth_middleware::SessionClaims;
use crate::_common::handler_helper::to_error_response;
use crate::auth::model as user;

/// セッション Cookie 有効期間（7 日 = 604800 秒）
const SESSION_MAX_AGE_SECS: i64 = 60 * 60 * 24 * 7;

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PostGoogleRequest {
    /// フロントが `@react-oauth/google` で受け取った Google ID Token
    pub id_token: String,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PostGoogleResponse {
    pub id: i64,
    pub email: String,
    pub name: String,
    pub picture: Option<String>,
}

impl From<user::Model> for PostGoogleResponse {
    fn from(u: user::Model) -> Self {
        Self {
            id: u.id,
            email: u.email,
            name: u.name,
            picture: u.picture,
        }
    }
}

#[derive(Debug, thiserror::Error, AsRefStr)]
pub enum PostGoogleError {
    #[error("{0}", self.as_ref())]
    DbError { e: DbErr },
    #[error("{0}", self.as_ref())]
    InvalidIdToken,
    #[error("{0}", self.as_ref())]
    JwkCacheEmpty,
    #[error("{0}", self.as_ref())]
    SessionSignFailed,
    #[error("{0}", self.as_ref())]
    ServerMisconfigured,
}

impl From<PostGoogleError> for StatusCode {
    fn from(e: PostGoogleError) -> Self {
        match e {
            PostGoogleError::DbError { .. }
            | PostGoogleError::SessionSignFailed
            | PostGoogleError::JwkCacheEmpty
            | PostGoogleError::ServerMisconfigured => StatusCode::INTERNAL_SERVER_ERROR,
            PostGoogleError::InvalidIdToken => StatusCode::UNAUTHORIZED,
        }
    }
}

/// Google ID Token の中身。Google の OpenID Connect 仕様に従う。
#[derive(Debug, Deserialize)]
struct GoogleIdTokenClaims {
    sub: String,
    email: String,
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    picture: Option<String>,
}

#[utoipa::path(
    post,
    path = "/auth-api/google",
    tag = "authApi",
    request_body = PostGoogleRequest,
    responses(
        (status = OK, body = PostGoogleResponse, description = "ログイン成功（Set-Cookie: session=...）"),
        (status = UNAUTHORIZED, description = "ID Token が不正"),
    ),
)]
pub async fn post_google(
    State(state): State<AppState>,
    jar: CookieJar,
    AppJson(req): AppJson<PostGoogleRequest>,
) -> Response {
    let result = handle(&state, req).await;
    match result {
        Ok((user, token)) => {
            let cookie = Cookie::build(("session", token))
                .http_only(true)
                .secure(state.config.cookie_secure)
                .same_site(SameSite::Lax)
                .path("/")
                .max_age(time::Duration::seconds(SESSION_MAX_AGE_SECS))
                .build();
            let updated_jar = jar.add(cookie);
            (
                StatusCode::OK,
                updated_jar,
                Json(PostGoogleResponse::from(user)),
            )
                .into_response()
        }
        Err(e) => to_error_response(e),
    }
}

async fn handle(
    state: &AppState,
    req: PostGoogleRequest,
) -> Result<(user::Model, String), PostGoogleError> {
    if state.config.google_client_id.is_empty() {
        return Err(PostGoogleError::ServerMisconfigured);
    }
    if state.jwk_cache.keys.is_empty() {
        return Err(PostGoogleError::JwkCacheEmpty);
    }

    // 1. ID Token を検証
    let claims = verify_google_id_token(&req.id_token, state)
        .map_err(|_| PostGoogleError::InvalidIdToken)?;

    // 2. users テーブルへ upsert（key: google_sub）
    let now = Utc::now();
    let am = user::ActiveModel {
        google_sub: Set(claims.sub.clone()),
        email: Set(claims.email.clone()),
        name: Set(claims.name.clone().unwrap_or_default()),
        picture: Set(claims.picture.clone()),
        created_at: Set(now),
        ..Default::default()
    };
    let user = user::Entity::insert(am)
        .on_conflict(
            OnConflict::column(user::Column::GoogleSub)
                .update_columns([
                    user::Column::Email,
                    user::Column::Name,
                    user::Column::Picture,
                ])
                .to_owned(),
        )
        .exec_with_returning(&state.db)
        .await
        .map_err(|e| PostGoogleError::DbError { e })?;

    // 3. セッション JWT を発行
    let session_claims = SessionClaims {
        sub: user.id.to_string(),
        exp: (now + Duration::seconds(SESSION_MAX_AGE_SECS)).timestamp() as usize,
        iat: now.timestamp() as usize,
    };
    let token = encode(
        &Header::new(Algorithm::HS256),
        &session_claims,
        &EncodingKey::from_secret(state.config.session_jwt_secret.as_bytes()),
    )
    .map_err(|_| PostGoogleError::SessionSignFailed)?;

    Ok((user, token))
}

/// Google ID Token を JWK で検証し、クレームを返す。
fn verify_google_id_token(
    id_token: &str,
    state: &AppState,
) -> Result<GoogleIdTokenClaims, jsonwebtoken::errors::Error> {
    // ヘッダから kid を取り出し、対応する公開鍵を JWK キャッシュから検索
    let header = decode_header(id_token)?;
    let kid = header
        .kid
        .ok_or(jsonwebtoken::errors::ErrorKind::InvalidToken)?;
    let key = state.jwk_cache.keys.get(&kid).ok_or_else(|| {
        jsonwebtoken::errors::Error::from(jsonwebtoken::errors::ErrorKind::InvalidToken)
    })?;

    // aud / iss / exp を検証
    let mut validation = Validation::new(Algorithm::RS256);
    validation.set_audience(&[&state.config.google_client_id]);
    validation.set_issuer(&["accounts.google.com", "https://accounts.google.com"]);

    let data = decode::<GoogleIdTokenClaims>(id_token, key, &validation)?;
    Ok(data.claims)
}
