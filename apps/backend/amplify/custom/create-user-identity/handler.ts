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

import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("create-user-identity");
const cognitoClient = new CognitoIdentityProviderClient({});
const smClient = new SecretsManagerClient({});
export const handler = createUserIdentityFactory({
  userPoolId: env.USER_POOL_ID,
  createCognitoUser: async (args) =>
    await cognitoClient.send(new AdminCreateUserCommand(args)),
  generatePassword: async (args) =>
    await smClient.send(new GetRandomPasswordCommand(args)),
  repositoryFactory:
    amplifyRepositoryFactory as IRepositoryFactory<"createUser">,
  deleteCognitoUser: async (args) =>
    await cognitoClient.send(new AdminDeleteUserCommand(args)),
  config: {
    type: "PRODUCTION",
    appType: "control-plane",
    amplifyConfigFn: async () => {
      const { resourceConfig, libraryOptions } =
        await getAmplifyDataClientConfig(env);
      Amplify.configure(resourceConfig, libraryOptions);
      return resourceConfig;
    },
  },
  tracer: tracer,
});
