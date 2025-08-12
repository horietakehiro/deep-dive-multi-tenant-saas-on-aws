export const CUSTOM_USER_ATTRIBUTES = {
  TENANT_ID: "custom:tenantId",
  TENANT_NAME: "custom:tenantName",
} as const;

/**
 * Cognitoユーザープール上のテナント管理ユーザに設定されるカスタムユーザ属性
 */
export type CustomUserAttributes = {
  [key in (typeof CUSTOM_USER_ATTRIBUTES)[keyof typeof CUSTOM_USER_ATTRIBUTES]]: string;
};
/**
 * サインアップ時にバックエンドに渡す必要がある、テナント管理者のユーザー属性
 */
export type SignupUserAttributes = {
  email: string;
} & CustomUserAttributes;
