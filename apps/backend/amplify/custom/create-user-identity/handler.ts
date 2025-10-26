import { env } from "$amplify/env/create-user-identity";
import { createUserIdentityFactory } from "lib/domain/service/create-user-identity";

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  SecretsManagerClient,
  GetRandomPasswordCommand,
} from "@aws-sdk/client-secrets-manager";
import { amplifyRepositoryFactory } from "lib/adaptor/repository";
import { Amplify } from "aws-amplify";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import type { IRepositoryFactory } from "lib/domain/port/repository";
const cognitoClient = new CognitoIdentityProviderClient({});
const smClient = new SecretsManagerClient({});
export const handler = createUserIdentityFactory(
  env.USER_POOL_ID,
  async (args) => await cognitoClient.send(new AdminCreateUserCommand(args)),
  async (args) => await smClient.send(new GetRandomPasswordCommand(args)),
  amplifyRepositoryFactory as IRepositoryFactory<"createUser">,
  async (args) => await cognitoClient.send(new AdminDeleteUserCommand(args)),
  {
    type: "PRODUCTION",
    appType: "control-plane",
    amplifyConfigFn: async () => {
      const { resourceConfig, libraryOptions } =
        await getAmplifyDataClientConfig(env);
      Amplify.configure(resourceConfig, libraryOptions);
      return resourceConfig;
    },
  }
);
