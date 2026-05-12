use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// `users` テーブル Entity。Google OAuth の `sub` を upsert キーにする。
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i64,
    /// Google ID Token の `sub`。upsert キーになる。
    #[sea_orm(unique)]
    pub google_sub: String,
    pub email: String,
    pub name: String,
    pub picture: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
