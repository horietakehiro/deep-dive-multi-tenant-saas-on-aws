import { Amplify } from "aws-amplify";
import type { Config, ProductionConfig } from "backend/lib/domain/model/config";
import outputs from "backend/amplify_outputs.json";

const configFactory = (): Config => {
  const noAmplify: string | undefined = import.meta.env.VITE_NO_AMPLIFY;
  console.debug(noAmplify);
  if (noAmplify === undefined) {
    return {
      type: "PRODUCTION",
      amplifyConfigFn: async () => await Amplify.configure(outputs),
    };
  }
  return {
    type: "NO_AMPLIFY",
    dummyUserAttributes: {
      "custom:tenantId": "dummy-id",
      "custom:tenantName": "dummy-name",
      "custom:tenantRole": "ADMIN",
    },
  };
};

Amplify.configure(outputs);
export const config = configFactory();
