.PHONY: dev front server db db.down openapi install

# 依存インストール（初回セットアップ）
install:
	cd todo-demo-front && bun install
	cd todo-demo-server && cargo build

# Postgres コンテナだけ起動
db:
	docker compose up -d db

# DB 停止（データボリュームは ./.docker/pgdata に残る）
db.down:
	docker compose down

# DB → サーバー → フロントを同時起動（Ctrl-C で全停止、DB は残る）
dev: db
	@trap 'kill 0' INT; \
	(cd todo-demo-server && cargo run) & \
	(cd todo-demo-front && bun dev); \
	wait

front:
	cd todo-demo-front && bun dev

server: db
	cd todo-demo-server && cargo run

# OpenAPI 再生成（サーバー → フロントの順）
openapi:
	cd todo-demo-server && cargo run --bin generate_openapi
	cd todo-demo-front && bun run api:gen
