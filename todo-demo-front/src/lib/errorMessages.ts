// サーバーから返るエラー本文（`{ code, message }`）の `code` → 日本語メッセージ
// サーバー側は thiserror + AsRefStr で enum バリアント名をそのまま `code` に出すため、
// PascalCase で対応させる。
//
// 由来:
//   - Todo CRUD: DbError / NotFound / ValidationError
//   - 認証:      DbError / InvalidIdToken / JwkCacheEmpty / SessionSignFailed / ServerMisconfigured
//   - axum 由来 (AppJson extractor): ValidationError / InvalidJson / InvalidContentType / InvalidRequest
export const errorMessages: Record<string, string> = {
  // Todo / 共通
  DbError: 'サーバーでエラーが発生しました。時間をおいて再度お試しください。',
  NotFound: '対象のデータが見つかりませんでした。',
  ValidationError: '入力内容に誤りがあります。',

  // 認証
  InvalidIdToken: 'Google 認証に失敗しました。もう一度お試しください。',
  JwkCacheEmpty: '認証サービスが一時的に利用できません。時間をおいて再度お試しください。',
  SessionSignFailed: 'セッション発行に失敗しました。時間をおいて再度お試しください。',
  ServerMisconfigured: 'サーバー設定に問題があります。管理者にお問い合わせください。',

  // axum / 入力フォーマット
  InvalidJson: 'リクエストの JSON 形式に誤りがあります。',
  InvalidContentType: 'Content-Type ヘッダが不正です。',
  InvalidRequest: 'リクエストが不正です。',
};
