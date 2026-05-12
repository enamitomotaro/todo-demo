use axum::{Router, middleware, routing::get};

use crate::_common::app_state::AppState;
use crate::_common::auth_middleware::auth_middleware;
use crate::todo::_delete_todo_handler::delete_todo;
use crate::todo::_get_todo_handler::get_todo;
use crate::todo::_get_todos_handler::get_todos;
use crate::todo::_post_todo_handler::post_todo;
use crate::todo::_put_todo_handler::put_todo;

/// `/todo-api/*` 全ルートに `auth_middleware` を適用する。
pub fn todo_router(state: AppState) -> Router<AppState> {
    Router::new()
        .route("/todo-api/todos", get(get_todos).post(post_todo))
        .route(
            "/todo-api/todos/{id}",
            get(get_todo).put(put_todo).delete(delete_todo),
        )
        .route_layer(middleware::from_fn_with_state(state, auth_middleware))
}
