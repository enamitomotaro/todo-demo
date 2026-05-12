use axum::{Extension, extract::State, http::StatusCode, response::IntoResponse};
use sea_orm::{DbErr, EntityTrait};
use serde::Serialize;
use strum_macros::AsRefStr;
use utoipa::ToSchema;

use crate::_common::app_state::AppState;
use crate::_common::auth_middleware::AuthUser;
use crate::_common::handler_helper::to_json;
use crate::auth::model as user;

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct GetMeResponse {
    pub id: i64,
    pub email: String,
    pub name: String,
    pub picture: Option<String>,
}

impl From<user::Model> for GetMeResponse {
    fn from(u: user::Model) -> Self {
        Self {
            id: u.id,
            email: u.email,
            name: u.name,
            picture: u.picture,
        }
    }
}

#[derive(Debug, thiserror::Error, AsRefStr)]
pub enum GetMeError {
    #[error("{0}", self.as_ref())]
    DbError { e: DbErr },
    #[error("{0}", self.as_ref())]
    NotFound,
}

impl From<GetMeError> for StatusCode {
    fn from(e: GetMeError) -> Self {
        match e {
            GetMeError::DbError { .. } => StatusCode::INTERNAL_SERVER_ERROR,
            // セッションは有効だが DB に user が無い（削除済み等） → 401 扱い
            GetMeError::NotFound => StatusCode::UNAUTHORIZED,
        }
    }
}

#[utoipa::path(
    get,
    path = "/auth-api/me",
    tag = "authApi",
    responses(
        (status = OK, body = GetMeResponse),
        (status = UNAUTHORIZED, description = "未認証"),
    ),
)]
pub async fn get_me(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
) -> impl IntoResponse {
    let result = async {
        user::Entity::find_by_id(auth_user.id)
            .one(&state.db)
            .await
            .map_err(|e| GetMeError::DbError { e })?
            .ok_or(GetMeError::NotFound)
    }
    .await;
    to_json::<user::Model, GetMeResponse, GetMeError>(result)
}
