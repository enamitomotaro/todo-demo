//! `openapi.json` を生成するスクリプト。
//!
//! 使い方: `cargo run --bin generate_openapi`
//! 出力先: `<crate root>/openapi.json`（フロントが `bun run api:gen` で読み込む）。

use std::fs;
use std::path::PathBuf;

use todo_demo_server::ApiDoc;
use utoipa::OpenApi;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let json = ApiDoc::openapi().to_pretty_json()?;
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("openapi.json");
    fs::write(&path, json)?;
    println!("wrote {}", path.display());
    Ok(())
}
