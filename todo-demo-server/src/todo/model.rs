use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// `todos` テーブルの Entity（手書き）。
///
/// 注意: `utoipa::ToSchema` は **derive しない**。`Model` は DB 列をそのまま晒すため
/// API 契約には使わず、ハンドラごとに `<Handler>Request` / `<Handler>Response` を別途定義する。
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "todos")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i64,
    /// 認証済みユーザーの id を保存する（フェーズ 1 のレガシーレコードは 0）。
    pub user_id: i64,
    pub title: String,
    pub completed: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
