import type { Schema } from "./data";

export const CUSTOM_USER_ATTRIBUTES = {
  TENANT_ID: "custom:tenantId",
  TENANT_NAME: "custom:tenantName",
  ROLE: "custom:tenantRole",
  OWNER_NAME: "custom:ownerName",
  OWNER_DEPARTMENT_NAME: "custom:ownerDepartmentName",
  OWNER_TEAM_NAME: "custom:ownerTeamName",
} as const;

export type CustomUserAttributes = {
  [key in (typeof CUSTOM_USER_ATTRIBUTES)[Exclude<
    keyof typeof CUSTOM_USER_ATTRIBUTES,
    "ROLE"
  >]]: string;
} & {
  [key in (typeof CUSTOM_USER_ATTRIBUTES)["ROLE"]]: Schema["UserRole"]["type"];
};

export type SignupUserAttributes = {
  email: string;
} & CustomUserAttributes;
