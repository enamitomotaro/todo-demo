use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use axum_extra::extract::CookieJar;
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use serde::{Deserialize, Serialize};

use crate::_common::app_state::AppState;

/// 認証済みユーザー情報。`auth_middleware` が `req.extensions_mut()` に挿入する。
#[derive(Clone, Debug)]
pub struct AuthUser {
    pub id: i64,
}

/// 独自セッション JWT のクレーム（HS256）。
#[derive(Debug, Serialize, Deserialize)]
pub struct SessionClaims {
    pub sub: String,
    pub exp: usize,
    pub iat: usize,
}

/// セッション JWT を検証して `AuthUser` をリクエスト extensions に挿入する。
///
/// 検証失敗時はそのリクエストを止めて `401 Unauthorized` を返す。
pub async fn auth_middleware(
    State(state): State<AppState>,
    jar: CookieJar,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let token = jar
        .get("session")
        .ok_or(StatusCode::UNAUTHORIZED)?
        .value()
        .to_string();

    let claims = verify_session_jwt(&token, &state.config.session_jwt_secret)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;
    let id: i64 = claims.sub.parse().map_err(|_| StatusCode::UNAUTHORIZED)?;
    req.extensions_mut().insert(AuthUser { id });
    Ok(next.run(req).await)
}

/// HS256 のセッション JWT を検証し、クレームを返す。
pub fn verify_session_jwt(
    token: &str,
    secret: &str,
) -> Result<SessionClaims, jsonwebtoken::errors::Error> {
    let key = DecodingKey::from_secret(secret.as_bytes());
    let validation = Validation::new(Algorithm::HS256);
    let data = decode::<SessionClaims>(token, &key, &validation)?;
    Ok(data.claims)
}
