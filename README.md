# todo-demo

Google OAuth 認証付きのシンプルな Todo Web アプリ。**フロント / サーバー分離**のモノレポ構成。

- `todo-demo-front/` — Next.js 16 (Pages Router) + MUI v9 + TypeScript + Bun
- `todo-demo-server/` — Rust + axum + sea-orm + Postgres

## 構成

```
todo-demo/
├─ Makefile              # 同時起動・OpenAPI 同期のショートカット
├─ docker-compose.yml    # 開発用 Postgres
├─ todo-demo-front/      # フロントエンド
└─ todo-demo-server/     # バックエンド
```

## アーキテクチャ概要

```
[ブラウザ] ──HTTPS──> [todo-demo-front (Next.js)]
                          │  Google ID Token を渡す
                          ▼
                     [todo-demo-server (Rust/axum)]  ──> Postgres
                          │
                          └──> Google Identity Platform（JWK 取得・ID Token 検証）
```

- フロントとサーバーは **REST(JSON) で疎結合**
- API 契約のソースはサーバー側 `openapi.json`（utoipa で自動生成）→ フロントが TS 型を生成して取り込む
- 認証: Google OAuth ID Token → サーバーが Google JWK で検証 → 独自セッション JWT (HS256) を発行 → **httpOnly Cookie** で保持
- 開発用バックドア: `DEV_BYPASS_AUTH=true` のとき `/auth-api/dev-login` が有効化され、Google OAuth 設定なしで動作確認できる

### API パス規約

- `/auth-api/*` — 認証（Google ログイン / ログアウト / `me` / dev-login）
- `/todo-api/*` — Todo CRUD

## 前提条件

| ツール | 推奨バージョン | 用途 |
|--------|-------------|------|
| **Node.js** | 20.9 以上 | Next.js 16 の最低要件 |
| **Bun** | latest | フロントのパッケージマネージャ / 実行 |
| **Rust** | stable | サーバー（`rust-toolchain.toml` で指定） |
| **Docker** | latest | ローカル Postgres |
| **GNU Make** | - | 同時起動コマンド（任意） |

インストール:

```bash
# Bun
curl -fsSL https://bun.sh/install | bash

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Docker Desktop は公式サイトから
```

## クイックスタート（5 分で起動）

開発用バックドア（`DEV_BYPASS_AUTH`）で **Google OAuth 設定なしで起動**できます。

### 1. 環境変数ファイルを作成

以下の内容で **2 ファイル**を新規作成してください。値はそのまま使えます（DB は `docker-compose.yml` と合致）。

#### `todo-demo-server/.env.local`

```bash
# Postgres 接続文字列（docker-compose.yml の db サービスに対応）
DATABASE_URL=postgres://todo:todo@localhost:5438/todo

# axum のバインドアドレス
BIND_ADDR=0.0.0.0:8088

# Google OAuth クライアント ID（dev bypass 利用時は空で OK）
GOOGLE_CLIENT_ID=

# セッション JWT 署名鍵（32 バイト以上の乱数推奨。後述コマンドで再生成可）
SESSION_JWT_SECRET=please-change-me-to-a-cryptographically-random-secret-of-32-bytes-or-more

# CORS で許可するフロントのオリジン
CORS_ORIGIN=http://localhost:3008

# セッション Cookie の Secure 属性（ローカル HTTP は false / 本番 HTTPS は true）
COOKIE_SECURE=false

# 開発用バックドア。true のとき /auth-api/dev-login が有効化される（本番は必ず false）
DEV_BYPASS_AUTH=true
```

#### `todo-demo-front/.env.local`

```bash
# バックエンドのベース URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8088

# Google OAuth クライアント ID（dev bypass 利用時は空で OK）
NEXT_PUBLIC_GOOGLE_CLIENT_ID=

# 開発用バックドアの表示可否（サーバー側 DEV_BYPASS_AUTH と組で運用）
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
```

> `.env.local.example` から `cp` しても OK ですが、その場合は `DEV_BYPASS_AUTH` と `NEXT_PUBLIC_DEV_BYPASS_AUTH` を **`true`** に書き換えてください。

#### 必須・任意の早見表

| 変数 | 必須 | dev bypass で起動するか |
|------|------|----------------------|
| `DATABASE_URL` | **必須** | 上記の値そのままで OK |
| `SESSION_JWT_SECRET` | **必須** | プレースホルダのままでも起動するが**変更推奨**（下記） |
| `GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | 任意 | 空でも起動する（dev bypass のとき） |
| `DEV_BYPASS_AUTH` / `NEXT_PUBLIC_DEV_BYPASS_AUTH` | 任意 | **`true` にすること**（OAuth なしで使うため） |
| その他 | 任意 | 例ファイルのデフォルト値で OK |

#### `SESSION_JWT_SECRET` の生成（推奨）

```bash
# macOS / Linux
openssl rand -base64 48
# 出力結果を SESSION_JWT_SECRET に貼り付け
```

> Google OAuth を本格的に使う場合は後述の「Google OAuth セットアップ」を参照。

### 2. 依存インストール

```bash
make install
# 内訳:
#   cd todo-demo-front && bun install
#   cd todo-demo-server && cargo build   ← 初回は数分
```

### 3. 起動

```bash
make dev
```

これで以下が同時に起動します:

- **Postgres**（Docker、`localhost:5438`）
- **サーバー**（`http://localhost:8088`）
- **フロント**（`http://localhost:3008`）

`Ctrl-C` で全部停止（DB ボリュームは `./.docker/pgdata` に残る）。

### 4. 動作確認

ブラウザで `http://localhost:3008` を開き、ログイン画面の「**Dev ログイン**」ボタンで認証バイパスして `/todos` に遷移できれば OK。

サーバー単体のヘルスチェック:

```bash
curl http://localhost:8088/healthz
# {"status":"ok"}
```

## Google OAuth セットアップ（本物の認証を使う場合）

1. **Google Cloud Console** で新規プロジェクトを作成
   - https://console.cloud.google.com/
2. **OAuth 同意画面** を設定
   - User Type: **External**
   - App name / サポートメール等を入力
   - スコープは `openid` / `email` / `profile` のみで十分
3. **認証情報 → OAuth 2.0 クライアント ID** を発行
   - アプリケーションの種類: **ウェブ アプリケーション**
   - 承認済みの **JavaScript 生成元**: `http://localhost:3008`
   - 承認済みの **リダイレクト URI**: （`@react-oauth/google` は不要）
4. **両** `.env.local` を以下のように更新:
   ```bash
   # todo-demo-server/.env.local
   GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
   DEV_BYPASS_AUTH=false

   # todo-demo-front/.env.local
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
   NEXT_PUBLIC_DEV_BYPASS_AUTH=false
   ```
5. サーバーとフロントを再起動（`make dev` を Ctrl-C → もう一度 `make dev`）

## コマンド一覧

### Make（モノレポルート）

```bash
make install     # フロント・サーバーの依存を一括インストール
make dev         # DB + サーバー + フロントを同時起動
make front       # フロントのみ
make server      # サーバーのみ（DB は起動する）
make db          # Postgres のみ起動
make db.down     # Postgres 停止
make openapi     # OpenAPI 再生成（サーバー → フロント）
```

### フロント単体（`cd todo-demo-front`）

```bash
bun dev          # http://localhost:3008
bun run build    # プロダクションビルド
bun run lint     # Biome リント
bun run format   # Biome フォーマット
bun run api:gen  # サーバーの openapi.json から TS 型を再生成
```

### サーバー単体（`cd todo-demo-server`）

```bash
cargo run                        # http://localhost:8088
cargo run --bin generate_openapi # openapi.json 生成
cargo clippy --all-targets       # Lint
cargo fmt                        # フォーマット
```

## OpenAPI 同期フロー

サーバーのハンドラ Request/Response や `#[utoipa::path]` を変更したら **必ず**:

```bash
make openapi
```

これで以下が走ります:

```
todo-demo-server/src/**/*.rs (#[utoipa::path])
    ↓ cargo run --bin generate_openapi
todo-demo-server/openapi.json
    ↓ bun run api:gen
todo-demo-front/src/apis/generated/TodoApi.ts   ← 編集禁止
```

## ポート

| プロセス | ポート |
|---------|--------|
| フロント (Next.js) | 3008 |
| サーバー (axum) | 8088 |
| Postgres | 5438（コンテナ内部は 5432） |

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| DB 接続失敗 (`Connection refused`) | `make db` を実行。`docker compose ps` で `db` が `healthy` を確認 |
| DB を初期化したい | `make db.down && rm -rf .docker/pgdata && make db` |
| CORS エラー | サーバー `.env.local` の `CORS_ORIGIN` が `http://localhost:3008` と一致しているか |
| 401 ループ | Cookie が送られているか / `credentials: 'include'` がついているか |
| `client.todoApi.xxx` 型エラー | `make openapi` で再生成 |
| Google ログインボタンが出ない | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` を設定したか / 承認済み JavaScript 生成元に `http://localhost:3008` を登録したか |
| ポート衝突 (`EADDRINUSE`) | 既存の `make dev` プロセスが残っていないか確認 |

## ライセンス

個人学習用プロジェクト（ライセンス未指定）。
