export const CUSTOM_USER_ATTRIBUTES = {
  TENANT_ID: "custom:tenantId",
  TENANT_NAME: "custom:tenantName",
  ROLE: "custom:tenantRole",
} as const;
/**
 * Cognitoユーザープール上のテナント管理ユーザに設定されるカスタムユーザ属性
 */
export type CustomUserAttributes = {
  [key in (typeof CUSTOM_USER_ATTRIBUTES)["TENANT_ID" | "TENANT_NAME"]]: string;
} & {
  [key in (typeof CUSTOM_USER_ATTRIBUTES)["ROLE"]]: "ADMIN" | "USER";
};
/**
 * サインアップ時にバックエンドに渡す必要がある、テナント管理者のユーザー属性
 */
export type SignupUserAttributes = {
  email: string;
} & CustomUserAttributes;
