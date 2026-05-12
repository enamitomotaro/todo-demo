use std::collections::HashMap;

use jsonwebtoken::DecodingKey;
use serde::Deserialize;

/// Google JWK の取得 URL（公開エンドポイント）
const GOOGLE_JWKS_URL: &str = "https://www.googleapis.com/oauth2/v3/certs";

/// Google JWK を `kid` → `DecodingKey` で索引したキャッシュ。
///
/// 最小実装ではプロセスライフタイムでキャッシュ（再取得しない）。
/// 起動時に失敗してもサーバーは起動するが、auth エンドポイントは 500 系を返す。
#[derive(Clone, Default)]
pub struct JwkCache {
    pub keys: HashMap<String, DecodingKey>,
}

#[derive(Deserialize)]
struct JwksResponse {
    keys: Vec<Jwk>,
}

#[derive(Deserialize)]
struct Jwk {
    kid: String,
    n: String,
    e: String,
}

impl JwkCache {
    /// `https://www.googleapis.com/oauth2/v3/certs` から JWK を取得して構築する。
    pub async fn fetch() -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let resp: JwksResponse = reqwest::get(GOOGLE_JWKS_URL).await?.json().await?;
        let mut keys = HashMap::new();
        for k in resp.keys {
            // jsonwebtoken の `from_rsa_components` は JWK の base64url 文字列をそのまま受ける
            let dk = DecodingKey::from_rsa_components(&k.n, &k.e)?;
            keys.insert(k.kid, dk);
        }
        Ok(Self { keys })
    }
}
