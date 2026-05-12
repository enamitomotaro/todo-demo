use axum::{Router, http};
use tower_http::{
    cors::CorsLayer,
    trace::{DefaultMakeSpan, DefaultOnRequest, DefaultOnResponse, TraceLayer},
};
use tracing::Level;
use tracing_subscriber::{EnvFilter, layer::SubscriberExt, util::SubscriberInitExt};

use todo_demo_server::_common::app_config::AppConfig;
use todo_demo_server::_common::app_state::AppState;
use todo_demo_server::auth::router::auth_router;
use todo_demo_server::health::router::health_router;
use todo_demo_server::todo::router::todo_router;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // .env.local をロード（存在しなくてもエラーにしない。本番は環境変数で直接注入する想定）
    dotenvy::from_filename(".env.local").ok();

    // tracing 初期化（デフォルトで INFO、RUST_LOG で上書き可）
    tracing_subscriber::registry()
        .with(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,tower_http=info,axum=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = AppConfig::from_env();
    let bind_addr = config.bind_addr.clone();
    let cors_origin = config.cors_origin.clone();

    let state = AppState::new(config).await?;

    // CORS: credentials を許可するためオリジンは明示。ワイルドカード `*` 不可。
    let cors = CorsLayer::new()
        .allow_origin(cors_origin.parse::<http::HeaderValue>()?)
        .allow_credentials(true)
        .allow_headers([http::header::CONTENT_TYPE])
        .allow_methods([
            http::Method::GET,
            http::Method::POST,
            http::Method::PUT,
            http::Method::DELETE,
            http::Method::OPTIONS,
        ]);

    // 各リクエストのメソッド/パス/ステータス/所要時間を INFO で記録する。
    // デフォルトの DEBUG レベルだと `RUST_LOG=info` 時に出ないため明示的に INFO 化する。
    let trace_layer = TraceLayer::new_for_http()
        .make_span_with(DefaultMakeSpan::new().level(Level::INFO))
        .on_request(DefaultOnRequest::new().level(Level::INFO))
        .on_response(DefaultOnResponse::new().level(Level::INFO));

    let app = Router::new()
        .merge(health_router())
        .merge(auth_router(state.clone()))
        .merge(todo_router(state.clone()))
        .layer(cors)
        .layer(trace_layer)
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(&bind_addr).await?;
    tracing::info!("listening on {}", bind_addr);
    axum::serve(listener, app).await?;
    Ok(())
}
