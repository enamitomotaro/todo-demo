use axum::{Router, routing::get};

use crate::_common::app_state::AppState;
use crate::health::_get_healthz_handler::get_healthz;

pub fn health_router() -> Router<AppState> {
    Router::new().route("/healthz", get(get_healthz))
}
