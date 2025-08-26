import { Amplify } from "aws-amplify";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
// import { env } from "../../../.amplify/generated/env/pre-sign-up";
import { env } from "$amplify/env/pre-sign-up";

import { amplifyRepositoryFactory } from "../../../lib/adaptor/repository";
import type { IRepositoryFactory } from "../../../lib/domain/port/repository";
import { preSingUpServiceFactory } from "../../../lib/domain/service/pre-sign-up-service";

export const handler = preSingUpServiceFactory(
  {
    type: "PRODUCTION",
    amplifyConfigFn: async () => {
      const { resourceConfig, libraryOptions } =
        await getAmplifyDataClientConfig(env);
      Amplify.configure(resourceConfig, libraryOptions);
      return resourceConfig;
    },
  },
  amplifyRepositoryFactory as IRepositoryFactory<"createTenant">
);
