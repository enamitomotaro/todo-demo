use axum::{
    Extension,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use sea_orm::{ColumnTrait, DbErr, EntityTrait, QueryFilter};
use strum_macros::AsRefStr;

use crate::_common::app_state::AppState;
use crate::_common::auth_middleware::AuthUser;
use crate::_common::handler_helper::to_void;
use crate::todo::model as todo;

#[derive(Debug, thiserror::Error, AsRefStr)]
pub enum DeleteTodoError {
    #[error("{0}", self.as_ref())]
    DbError { e: DbErr },
    #[error("{0}", self.as_ref())]
    NotFound,
}

impl From<DeleteTodoError> for StatusCode {
    fn from(e: DeleteTodoError) -> Self {
        match e {
            DeleteTodoError::DbError { .. } => StatusCode::INTERNAL_SERVER_ERROR,
            DeleteTodoError::NotFound => StatusCode::NOT_FOUND,
        }
    }
}

#[utoipa::path(
    delete,
    path = "/todo-api/todos/{id}",
    tag = "todoApi",
    params(("id" = i64, Path, description = "Todo の id")),
    responses(
        (status = NO_CONTENT, description = "削除成功"),
        (status = UNAUTHORIZED, description = "未認証"),
        (status = NOT_FOUND, description = "id に該当する Todo が無い（他ユーザーの Todo も NotFound）"),
    ),
)]
pub async fn delete_todo(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(id): Path<i64>,
) -> impl IntoResponse {
    let result = async {
        // user_id でも絞り込むことで「他人の Todo を消す」攻撃を防ぐ
        let res = todo::Entity::delete_many()
            .filter(todo::Column::Id.eq(id))
            .filter(todo::Column::UserId.eq(auth_user.id))
            .exec(&state.db)
            .await
            .map_err(|e| DeleteTodoError::DbError { e })?;
        if res.rows_affected == 0 {
            return Err(DeleteTodoError::NotFound);
        }
        Ok(())
    }
    .await;
    to_void(result)
}
