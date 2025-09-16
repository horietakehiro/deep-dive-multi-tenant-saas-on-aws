import { Amplify, type ResourcesConfig } from "aws-amplify";
import type { Config } from "@intersection/backend/lib/domain/model/config";
import outputs from "@intersection/backend/amplify_outputs.json";
const configFactory = (): Config => {
  return {
    appType: "control-plane",
    type: "PRODUCTION",
    amplifyConfigFn: async () => {
      Amplify.configure(outputs);
      return outputs as ResourcesConfig;
    },
  };
};

export const config = configFactory();
