import { env } from "$amplify/env/create-user-identity";
import { createUserIdentityFactory } from "lib/domain/service/create-user-identity";

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  SecretsManagerClient,
  GetRandomPasswordCommand,
} from "@aws-sdk/client-secrets-manager";
const cognitoClient = new CognitoIdentityProviderClient({});
const smClient = new SecretsManagerClient({});
export const handler = createUserIdentityFactory(
  env.USER_POOL_ID,
  async (args) => await cognitoClient.send(new AdminCreateUserCommand(args)),
  async (args) => await smClient.send(new GetRandomPasswordCommand(args))
);
