use axum::{
    Extension,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DbErr, EntityTrait, QueryFilter,
};
use serde::{Deserialize, Serialize};
use strum_macros::AsRefStr;
use utoipa::ToSchema;

use crate::_common::app_json::AppJson;
use crate::_common::app_state::AppState;
use crate::_common::auth_middleware::AuthUser;
use crate::_common::handler_helper::to_json;
use crate::todo::model as todo;

/// title / completed の **両方とも Option**。`Some` のフィールドだけ更新する。
#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PutTodoRequest {
    pub title: Option<String>,
    pub completed: Option<bool>,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PutTodoResponse {
    pub id: i64,
    pub user_id: i64,
    pub title: String,
    pub completed: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<todo::Model> for PutTodoResponse {
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
pub enum PutTodoError {
    #[error("{0}", self.as_ref())]
    DbError { e: DbErr },
    #[error("{0}", self.as_ref())]
    NotFound,
    #[error("{0}", self.as_ref())]
    ValidationError,
}

impl From<PutTodoError> for StatusCode {
    fn from(e: PutTodoError) -> Self {
        match e {
            PutTodoError::DbError { .. } => StatusCode::INTERNAL_SERVER_ERROR,
            PutTodoError::NotFound => StatusCode::NOT_FOUND,
            PutTodoError::ValidationError => StatusCode::BAD_REQUEST,
        }
    }
}

#[utoipa::path(
    put,
    path = "/todo-api/todos/{id}",
    tag = "todoApi",
    params(("id" = i64, Path, description = "Todo の id")),
    request_body = PutTodoRequest,
    responses(
        (status = OK, body = PutTodoResponse),
        (status = UNAUTHORIZED, description = "未認証"),
        (status = NOT_FOUND, description = "id に該当する Todo が無い（他ユーザーの Todo も NotFound）"),
        (status = BAD_REQUEST, description = "title が空"),
    ),
)]
pub async fn put_todo(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(id): Path<i64>,
    AppJson(req): AppJson<PutTodoRequest>,
) -> impl IntoResponse {
    let result = async {
        let entity = todo::Entity::find_by_id(id)
            .filter(todo::Column::UserId.eq(auth_user.id))
            .one(&state.db)
            .await
            .map_err(|e| PutTodoError::DbError { e })?
            .ok_or(PutTodoError::NotFound)?;

        let mut am: todo::ActiveModel = entity.into();
        if let Some(t) = req.title {
            let trimmed = t.trim();
            if trimmed.is_empty() {
                return Err(PutTodoError::ValidationError);
            }
            am.title = Set(trimmed.to_string());
        }
        if let Some(c) = req.completed {
            am.completed = Set(c);
        }
        am.updated_at = Set(Utc::now());
        am.update(&state.db)
            .await
            .map_err(|e| PutTodoError::DbError { e })
    }
    .await;
    to_json::<todo::Model, PutTodoResponse, PutTodoError>(result)
}
