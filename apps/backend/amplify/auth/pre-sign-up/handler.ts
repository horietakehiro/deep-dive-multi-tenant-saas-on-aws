import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "../../../.amplify/generated/env/pre-sign-up";
// import { env } from "$amplify/env/pre-sign-up";
import { preSingUpServiceFactory } from "../../../lib/domain/service/pre-sign-up";
import { amplifyRepositoryFactory } from "../../../lib/adaptor/repository";
import { Amplify } from "aws-amplify";

const repository = await amplifyRepositoryFactory({
  type: "PRODUCTION",
  amplifyConfigFn: async () => {
    const { resourceConfig, libraryOptions } =
      await getAmplifyDataClientConfig(env);
    Amplify.configure(resourceConfig, libraryOptions);
    return resourceConfig;
  },
});
export const handler = preSingUpServiceFactory(repository);
