import type { ResourcesConfig } from "aws-amplify";
import type { CustomUserAttributes } from "./user";
export type AppType = "control-plane" | "application-plane";
export interface CommonConfig {
  appType: AppType;
}
export interface ProductionConfig {
  type: "PRODUCTION";
  amplifyConfigFn: () => Promise<ResourcesConfig>;
}
export interface NoAmplifyConfig {
  type: "NO_AMPLIFY";
  dummyUserAttributes: CustomUserAttributes;
}
export type Config = CommonConfig & (NoAmplifyConfig | ProductionConfig);
