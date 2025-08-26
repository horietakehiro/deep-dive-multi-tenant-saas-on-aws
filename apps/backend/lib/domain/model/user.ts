export const CUSTOM_USER_ATTRIBUTES = {
  TENANT_ID: "custom:tenantId",
  TENANT_NAME: "custom:tenantName",
  ROLE: "custom:tenantRole",
} as const;
export type CustomUserAttributes = {
  [key in (typeof CUSTOM_USER_ATTRIBUTES)["TENANT_ID" | "TENANT_NAME"]]: string;
} & {
  [key in (typeof CUSTOM_USER_ATTRIBUTES)["ROLE"]]: "OWNER" | "ADMIN" | "USER";
};

export type SignupUserAttributes = {
  email: string;
} & CustomUserAttributes;
