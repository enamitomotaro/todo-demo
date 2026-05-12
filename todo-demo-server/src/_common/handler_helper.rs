use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Serialize;
use serde_json::json;
use std::fmt::Display;

/// 1 件返す系ハンドラ用。`Result<Model, Err>` を `200 OK + Resp` または `エラー応答` に変換する。
pub fn to_json<Model, Resp, Err>(result: Result<Model, Err>) -> Response
where
    Resp: From<Model> + Serialize,
    Err: Into<StatusCode> + Display + AsRef<str>,
{
    match result {
        Ok(model) => (StatusCode::OK, Json(Resp::from(model))).into_response(),
        Err(e) => to_error_response(e),
    }
}

/// リスト返す系ハンドラ用。各要素を `Resp::from` で変換する。
pub fn to_json_list<Model, Resp, Err>(result: Result<Vec<Model>, Err>) -> Response
where
    Resp: From<Model> + Serialize,
    Err: Into<StatusCode> + Display + AsRef<str>,
{
    match result {
        Ok(models) => {
            let resp: Vec<Resp> = models.into_iter().map(Resp::from).collect();
            (StatusCode::OK, Json(resp)).into_response()
        }
        Err(e) => to_error_response(e),
    }
}

/// ボディ無し（DELETE 等）用。成功時は 204 No Content を返す。
pub fn to_void<Err>(result: Result<(), Err>) -> Response
where
    Err: Into<StatusCode> + Display + AsRef<str>,
{
    match result {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => to_error_response(e),
    }
}

/// `{ code, message }` 形式のエラー応答を生成する。
///
/// - `code`: `AsRefStr` で派生する enum バリアント名
/// - `message`: thiserror の `#[error("{0}", self.as_ref())]` で同じく enum バリアント名
///
/// Cookie を併せて返す等、`to_json` を使えないハンドラからも呼べるよう `pub` にしている。
pub fn to_error_response<Err>(e: Err) -> Response
where
    Err: Into<StatusCode> + Display + AsRef<str>,
{
    let code = e.as_ref().to_string();
    let message = e.to_string();
    let status: StatusCode = e.into();
    (status, Json(json!({ "code": code, "message": message }))).into_response()
}
