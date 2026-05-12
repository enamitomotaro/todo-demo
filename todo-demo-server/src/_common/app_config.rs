use serde::Deserialize;

/// `.env.local`（または直接環境変数）から読み出すアプリ設定。
///
/// `envy` が大文字環境変数を小文字フィールドへマップする。
/// `DATABASE_URL` と `SESSION_JWT_SECRET` は必須。それ以外は妥当なデフォルトを持つ。
#[derive(Clone, Debug, Deserialize)]
pub struct AppConfig {
    pub database_url: String,
    #[serde(default = "default_bind_addr")]
    pub bind_addr: String,
    #[serde(default)]
    pub google_client_id: String,
    pub session_jwt_secret: String,
    #[serde(default = "default_cors_origin")]
    pub cors_origin: String,
    /// セッション Cookie の `Secure` 属性。ローカル HTTP は false / 本番 HTTPS は true。
    #[serde(default)]
    pub cookie_secure: bool,
    /// `true` のときだけ `/auth-api/dev-login` を有効化する開発専用バックドア。
    /// 本番では必ず `false`（既定値）。
    #[serde(default)]
    pub dev_bypass_auth: bool,
}

fn default_bind_addr() -> String {
    "0.0.0.0:8088".to_string()
}

fn default_cors_origin() -> String {
    "http://localhost:3008".to_string()
}

impl AppConfig {
    /// 環境変数から `AppConfig` を構築する。
    pub fn from_env() -> Self {
        envy::from_env().unwrap_or_else(|e| panic!("AppConfig 読み込み失敗: {e}"))
    }
}
