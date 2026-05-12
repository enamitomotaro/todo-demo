use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use axum_extra::extract::{
    CookieJar,
    cookie::{Cookie, SameSite},
};

use crate::_common::app_state::AppState;

/// セッション Cookie を削除して 204 を返す。
#[utoipa::path(
    post,
    path = "/auth-api/logout",
    tag = "authApi",
    responses(
        (status = NO_CONTENT, description = "ログアウト成功（Cookie 削除）"),
        (status = UNAUTHORIZED, description = "セッション無効"),
    ),
)]
pub async fn post_logout(State(state): State<AppState>, jar: CookieJar) -> Response {
    // 削除 Cookie は元 Cookie と name / path / domain / secure / same_site / http_only が
    // 一致しないと一部ブラウザ（特に SameSite を厳格化した最新 Chrome）が上書きを無視する
    // ことがある。`_post_google_handler` / `_post_dev_login_handler` の発行属性をそのまま
    // ミラーする。
    let removal = Cookie::build(("session", ""))
        .http_only(true)
        .secure(state.config.cookie_secure)
        .same_site(SameSite::Lax)
        .path("/")
        .build();
    let updated_jar = jar.remove(removal);
    (StatusCode::NO_CONTENT, updated_jar).into_response()
}
