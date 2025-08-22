import type { Config } from "backend/lib/domain/model/config";
import outputs from "../../../../amplify_outputs.json";

const configFactory = (): Config => {
  const noAmplify: string | undefined = import.meta.env.VITE_NO_AMPLIFY;
  console.debug(noAmplify);
  if (noAmplify === undefined) {
    return {
      type: "PRODUCTION",
      amplifyConfiguration: outputs,
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

export const config = configFactory();
