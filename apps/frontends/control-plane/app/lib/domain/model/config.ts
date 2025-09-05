import { Amplify, type ResourcesConfig } from "aws-amplify";
import type { Config } from "@intersection/backend/lib/domain/model/config";
import outputs from "@intersection/backend/amplify_outputs.json";
// import outputs from "../../../../../../backend/amplify_outputs.json";
const configFactory = (): Config => {
  // const noAmplify: string | undefined = import.meta.env.VITE_NO_AMPLIFY;
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
