import { Tracer } from "@aws-lambda-powertools/tracer";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import middy from "@middy/core";
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
import { Logger } from "@aws-lambda-powertools/logger";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { Metrics } from "@aws-lambda-powertools/metrics";
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";
const tracer = new Tracer({
  serviceName: "create-user-identity",
});
const logger = new Logger({
  serviceName: "create-user-identity",
  logLevel: "DEBUG",
});
const metrics = new Metrics({
  serviceName: "create-user-identity",
  namespace: "intersection/backend",
});

const cognitoClient = tracer.captureAWSv3Client(
  new CognitoIdentityProviderClient({})
);
const smClient = tracer.captureAWSv3Client(new SecretsManagerClient({}));
export const handler = middy(
  createUserIdentityFactory({
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
    tracer,
    logger,
    metrics,
  })
)
  .use(captureLambdaHandler(tracer))
  .use(injectLambdaContext(logger, { resetKeys: true }))
  .use(logMetrics(metrics));
