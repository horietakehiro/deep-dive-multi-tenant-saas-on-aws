import type { ResourcesConfig } from "aws-amplify";
export type AppType = "control-plane" | "application-plane";
export interface CommonConfig {
  appType: AppType;
}
export interface ProductionConfig {
  type: "PRODUCTION";
  amplifyConfigFn: () => Promise<ResourcesConfig>;
}
export type Config = CommonConfig & ProductionConfig;
