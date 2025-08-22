import type { ResourcesConfig } from "aws-amplify";
import type { CustomUserAttributes } from "./user";
interface ProductionConfig {
  type: "PRODUCTION";
  amplifyConfiguration: ResourcesConfig;
}
interface NoAmplifyConfig {
  type: "NO_AMPLIFY";
  dummyUserAttributes: CustomUserAttributes;
}
export type Config = NoAmplifyConfig | ProductionConfig;
