use axum::{Extension, extract::State, http::StatusCode, response::IntoResponse};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ActiveValue::Set, DbErr};
use serde::{Deserialize, Serialize};
use strum_macros::AsRefStr;
use utoipa::ToSchema;

use crate::_common::app_json::AppJson;
use crate::_common::app_state::AppState;
use crate::_common::auth_middleware::AuthUser;
use crate::_common::handler_helper::to_json;
use crate::todo::model as todo;

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PostTodoRequest {
    pub title: String,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PostTodoResponse {
    pub id: i64,
    pub user_id: i64,
    pub title: String,
    pub completed: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<todo::Model> for PostTodoResponse {
    fn from(m: todo::Model) -> Self {
        Self {
            id: m.id,
            user_id: m.user_id,
            title: m.title,
            completed: m.completed,
            created_at: m.created_at,
            updated_at: m.updated_at,
        }
    }
}

#[derive(Debug, thiserror::Error, AsRefStr)]
pub enum PostTodoError {
    #[error("{0}", self.as_ref())]
    DbError { e: DbErr },
    #[error("{0}", self.as_ref())]
    ValidationError,
}

impl From<PostTodoError> for StatusCode {
    fn from(e: PostTodoError) -> Self {
        match e {
            PostTodoError::DbError { .. } => StatusCode::INTERNAL_SERVER_ERROR,
            PostTodoError::ValidationError => StatusCode::BAD_REQUEST,
        }
    }
}

#[utoipa::path(
    post,
    path = "/todo-api/todos",
    tag = "todoApi",
    request_body = PostTodoRequest,
    responses(
        (status = OK, body = PostTodoResponse, description = "作成された Todo"),
        (status = UNAUTHORIZED, description = "未認証"),
    ),
)]
pub async fn post_todo(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    AppJson(req): AppJson<PostTodoRequest>,
) -> impl IntoResponse {
    let result = async {
        let title = req.title.trim();
        if title.is_empty() {
            return Err(PostTodoError::ValidationError);
        }
        let now = Utc::now();
        let am = todo::ActiveModel {
            user_id: Set(auth_user.id),
            title: Set(title.to_string()),
            completed: Set(false),
            created_at: Set(now),
            updated_at: Set(now),
            ..Default::default()
        };
        am.insert(&state.db)
            .await
            .map_err(|e| PostTodoError::DbError { e })
    }
    .await;
    to_json::<todo::Model, PostTodoResponse, PostTodoError>(result)
}
