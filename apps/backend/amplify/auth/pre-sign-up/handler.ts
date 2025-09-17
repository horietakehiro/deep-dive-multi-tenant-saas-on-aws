import { Amplify } from "aws-amplify";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
// import { env } from "../../../.amplify/generated/env/pre-sign-up";
import { env } from "$amplify/env/pre-sign-up";

import { amplifyRepositoryFactory } from "../../../lib/adaptor/repository";
import type { IRepositoryFactory } from "../../../lib/domain/port/repository";
import { onboardTenantFactory } from "../../../lib/domain/service/onboard-tenant-process";

export const handler = onboardTenantFactory(
  {
    type: "PRODUCTION",
    appType: "control-plane",
    amplifyConfigFn: async () => {
      const { resourceConfig, libraryOptions } =
        await getAmplifyDataClientConfig(env);
      Amplify.configure(resourceConfig, libraryOptions);
      return resourceConfig;
    },
  },
  amplifyRepositoryFactory as IRepositoryFactory<"createTenant" | "createUser">
);
