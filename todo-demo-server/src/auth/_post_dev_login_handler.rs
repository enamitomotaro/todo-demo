//! 開発専用バックドア。`DEV_BYPASS_AUTH=true` のときのみ有効。
//!
//! Google OAuth のセットアップ前にフロントの動作確認を行うため、ダミーユーザーで
//! 本物のセッション JWT を発行する。本番では `dev_bypass_auth=false` で 404 を返す。

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
use jsonwebtoken::{Algorithm, EncodingKey, Header, encode};
use sea_orm::{ActiveValue::Set, DbErr, EntityTrait, sea_query::OnConflict};
use serde::Serialize;
use strum_macros::AsRefStr;
use utoipa::ToSchema;

use crate::_common::app_state::AppState;
use crate::_common::auth_middleware::SessionClaims;
use crate::_common::handler_helper::to_error_response;
use crate::auth::model as user;

/// セッション Cookie 有効期間（`_post_google_handler` と同じ 7 日）。
const SESSION_MAX_AGE_SECS: i64 = 60 * 60 * 24 * 7;

/// dev バイパスで作成されるダミーユーザーの `google_sub` キー。
/// 通常 Google が発行する値と衝突しないプレフィックスを採用する。
const DEV_USER_SUB: &str = "dev-user:local";

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PostDevLoginResponse {
    pub id: i64,
    pub email: String,
    pub name: String,
    pub picture: Option<String>,
}

impl From<user::Model> for PostDevLoginResponse {
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
pub enum PostDevLoginError {
    #[error("{0}", self.as_ref())]
    NotFound,
    #[error("{0}", self.as_ref())]
    DbError { e: DbErr },
    #[error("{0}", self.as_ref())]
    SessionSignFailed,
}

impl From<PostDevLoginError> for StatusCode {
    fn from(e: PostDevLoginError) -> Self {
        match e {
            PostDevLoginError::NotFound => StatusCode::NOT_FOUND,
            PostDevLoginError::DbError { .. } | PostDevLoginError::SessionSignFailed => {
                StatusCode::INTERNAL_SERVER_ERROR
            }
        }
    }
}

#[utoipa::path(
    post,
    path = "/auth-api/dev-login",
    tag = "authApi",
    responses(
        (status = OK, body = PostDevLoginResponse, description = "dev バイパスでログイン成功"),
        (status = NOT_FOUND, description = "DEV_BYPASS_AUTH=false のとき"),
    ),
)]
pub async fn post_dev_login(State(state): State<AppState>, jar: CookieJar) -> Response {
    match handle(&state).await {
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
                Json(PostDevLoginResponse::from(user)),
            )
                .into_response()
        }
        Err(e) => to_error_response(e),
    }
}

async fn handle(state: &AppState) -> Result<(user::Model, String), PostDevLoginError> {
    if !state.config.dev_bypass_auth {
        return Err(PostDevLoginError::NotFound);
    }

    // ダミーユーザーを upsert（key: google_sub）。フィールドは固定値で十分。
    let now = Utc::now();
    let am = user::ActiveModel {
        google_sub: Set(DEV_USER_SUB.to_string()),
        email: Set("dev@example.com".to_string()),
        name: Set("Dev User".to_string()),
        picture: Set(None),
        created_at: Set(now),
        ..Default::default()
    };
    let user = user::Entity::insert(am)
        .on_conflict(
            OnConflict::column(user::Column::GoogleSub)
                .update_columns([user::Column::Email, user::Column::Name])
                .to_owned(),
        )
        .exec_with_returning(&state.db)
        .await
        .map_err(|e| PostDevLoginError::DbError { e })?;

    // 本物の `/auth-api/google` と同じ署名鍵・アルゴリズムで発行する。
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
    .map_err(|_| PostDevLoginError::SessionSignFailed)?;

    Ok((user, token))
}
