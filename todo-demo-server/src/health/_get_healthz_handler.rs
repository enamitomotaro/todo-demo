use axum::{Json, response::IntoResponse};
use serde::Serialize;
use utoipa::ToSchema;

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct GetHealthzResponse {
    pub status: String,
}

/// ヘルスチェック。Phase 3 のロードバランサ / ヘルスチェッカーから叩かれる想定。
#[utoipa::path(
    get,
    path = "/healthz",
    tag = "system",
    responses(
        (status = OK, body = GetHealthzResponse, description = "サーバー起動中")
    ),
)]
pub async fn get_healthz() -> impl IntoResponse {
    Json(GetHealthzResponse {
        status: "ok".to_string(),
    })
}
