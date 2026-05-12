use axum::{
    Router, middleware,
    routing::{get, post},
};

use crate::_common::app_state::AppState;
use crate::_common::auth_middleware::auth_middleware;
use crate::auth::_get_me_handler::get_me;
use crate::auth::_post_dev_login_handler::post_dev_login;
use crate::auth::_post_google_handler::post_google;
use crate::auth::_post_logout_handler::post_logout;

/// `/auth-api/*` ルート。`logout` と `me` のみ認証必須にする。
/// `/auth-api/dev-login` は開発専用バックドアで、`DEV_BYPASS_AUTH=false` のとき 404。
pub fn auth_router(state: AppState) -> Router<AppState> {
    let protected = Router::new()
        .route("/auth-api/logout", post(post_logout))
        .route("/auth-api/me", get(get_me))
        .route_layer(middleware::from_fn_with_state(state, auth_middleware));

    Router::new()
        .route("/auth-api/google", post(post_google))
        .route("/auth-api/dev-login", post(post_dev_login))
        .merge(protected)
}
