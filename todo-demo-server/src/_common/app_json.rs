use axum::{
    Json,
    extract::{FromRequest, Request, rejection::JsonRejection},
    response::{IntoResponse, Response},
};
use serde::de::DeserializeOwned;
use serde_json::json;

/// `axum::Json<T>` の薄いラッパ extractor。
///
/// 既定の `Json<T>` はパース失敗時にプレーンテキストの 4xx を返してしまうため、
/// API 規約「すべてのエラーは `{ code, message }` JSON で返す」を満たすよう変換する。
///
/// ハンドラ側は `Json<T>` を `AppJson<T>` に置き換えるだけで利用可能。
pub struct AppJson<T>(pub T);

impl<S, T> FromRequest<S> for AppJson<T>
where
    S: Send + Sync,
    T: DeserializeOwned,
{
    type Rejection = AppJsonRejection;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(payload) = Json::<T>::from_request(req, state).await?;
        Ok(AppJson(payload))
    }
}

/// `JsonRejection` を `{ code, message }` 形式に正規化する rejection 型。
pub struct AppJsonRejection(pub JsonRejection);

impl From<JsonRejection> for AppJsonRejection {
    fn from(r: JsonRejection) -> Self {
        Self(r)
    }
}

impl IntoResponse for AppJsonRejection {
    fn into_response(self) -> Response {
        // `JsonRejection` の具体的なバリアントから `code` を決定（クライアント側で
        // ハンドリングしやすいように分類する）。
        let code = match &self.0 {
            JsonRejection::JsonDataError(_) => "ValidationError",
            JsonRejection::JsonSyntaxError(_) => "InvalidJson",
            JsonRejection::MissingJsonContentType(_) => "InvalidContentType",
            JsonRejection::BytesRejection(_) => "InvalidRequest",
            // `JsonRejection` は `#[non_exhaustive]` のため必須
            _ => "InvalidRequest",
        };
        let status = self.0.status();
        let message = self.0.body_text();
        (
            status,
            Json(json!({ "code": code, "message": message })),
        )
            .into_response()
    }
}
