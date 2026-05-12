//! todo-demo-server のライブラリ root。
//!
//! `main.rs` と `bin/generate_openapi.rs` から共有される。`#[utoipa::path]` は
//! `utoipauto` が `./src` 配下を自動走査して `ApiDoc` に集約する。
//!
//! 機能ごと（`auth/` `todo/` `health/`）に handler + router + model を完結させる
//! 垂直スライス構造。共通基盤は `_common/`、OpenAPI 出力スクリプトは `bin/`。

pub mod _common;
pub mod auth;
pub mod health;
pub mod todo;

use utoipa::OpenApi;
use utoipauto::utoipauto;

/// OpenAPI 仕様のエントリ。`generate_openapi` バイナリが `to_pretty_json()` を呼ぶ。
#[utoipauto(paths = "./src")]
#[derive(OpenApi)]
#[openapi(
    info(
        title = "Todo Demo API",
        version = "0.1.0",
        description = "Todo Demo の REST API。フロントの型生成元。",
    ),
    tags(
        (name = "system",  description = "ヘルスチェック等のシステムエンドポイント"),
        (name = "todoApi", description = "Todo CRUD"),
        (name = "authApi", description = "Google OAuth 認証（フェーズ 2）"),
    ),
)]
pub struct ApiDoc;
