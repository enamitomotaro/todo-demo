use axum::{
    Extension,
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
};
use sea_orm::{ColumnTrait, DbErr, EntityTrait, Order, QueryFilter, QueryOrder};
use serde::{Deserialize, Serialize};
use strum_macros::AsRefStr;
use utoipa::{IntoParams, ToSchema};

use crate::_common::app_state::AppState;
use crate::_common::auth_middleware::AuthUser;
use crate::_common::handler_helper::to_json_list;
use crate::todo::model as todo;

#[derive(Debug, Deserialize, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct GetTodosQuery {
    /// `true` / `false` で完了状態に絞り込み。未指定で全件。
    pub completed: Option<bool>,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct GetTodosResponse {
    pub id: i64,
    pub user_id: i64,
    pub title: String,
    pub completed: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<todo::Model> for GetTodosResponse {
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
pub enum GetTodosError {
    #[error("{0}", self.as_ref())]
    DbError { e: DbErr },
}

impl From<GetTodosError> for StatusCode {
    fn from(e: GetTodosError) -> Self {
        match e {
            GetTodosError::DbError { .. } => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

#[utoipa::path(
    get,
    path = "/todo-api/todos",
    tag = "todoApi",
    params(GetTodosQuery),
    responses(
        (status = OK, body = Vec<GetTodosResponse>, description = "自分の Todo 一覧（createdAt 降順）"),
        (status = UNAUTHORIZED, description = "未認証"),
    ),
)]
pub async fn get_todos(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Query(query): Query<GetTodosQuery>,
) -> impl IntoResponse {
    let result = async {
        let mut q = todo::Entity::find().filter(todo::Column::UserId.eq(auth_user.id));
        if let Some(c) = query.completed {
            q = q.filter(todo::Column::Completed.eq(c));
        }
        q.order_by(todo::Column::CreatedAt, Order::Desc)
            .all(&state.db)
            .await
            .map_err(|e| GetTodosError::DbError { e })
    }
    .await;
    to_json_list::<todo::Model, GetTodosResponse, GetTodosError>(result)
}
