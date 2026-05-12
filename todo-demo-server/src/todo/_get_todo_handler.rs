use axum::{
    Extension,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use sea_orm::{ColumnTrait, DbErr, EntityTrait, QueryFilter};
use serde::Serialize;
use strum_macros::AsRefStr;
use utoipa::ToSchema;

use crate::_common::app_state::AppState;
use crate::_common::auth_middleware::AuthUser;
use crate::_common::handler_helper::to_json;
use crate::todo::model as todo;

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct GetTodoResponse {
    pub id: i64,
    pub user_id: i64,
    pub title: String,
    pub completed: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<todo::Model> for GetTodoResponse {
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
pub enum GetTodoError {
    #[error("{0}", self.as_ref())]
    DbError { e: DbErr },
    #[error("{0}", self.as_ref())]
    NotFound,
}

impl From<GetTodoError> for StatusCode {
    fn from(e: GetTodoError) -> Self {
        match e {
            GetTodoError::DbError { .. } => StatusCode::INTERNAL_SERVER_ERROR,
            GetTodoError::NotFound => StatusCode::NOT_FOUND,
        }
    }
}

#[utoipa::path(
    get,
    path = "/todo-api/todos/{id}",
    tag = "todoApi",
    params(("id" = i64, Path, description = "Todo の id")),
    responses(
        (status = OK, body = GetTodoResponse),
        (status = UNAUTHORIZED, description = "未認証"),
        (status = NOT_FOUND, description = "id に該当する Todo が無い（他ユーザーの Todo も NotFound）"),
    ),
)]
pub async fn get_todo(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(id): Path<i64>,
) -> impl IntoResponse {
    let result = async {
        todo::Entity::find_by_id(id)
            .filter(todo::Column::UserId.eq(auth_user.id))
            .one(&state.db)
            .await
            .map_err(|e| GetTodoError::DbError { e })?
            .ok_or(GetTodoError::NotFound)
    }
    .await;
    to_json::<todo::Model, GetTodoResponse, GetTodoError>(result)
}
