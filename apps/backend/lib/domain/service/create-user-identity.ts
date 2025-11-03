import type { Schema } from "../model/data";
import type {
  AdminCreateUserCommandInput,
  AdminCreateUserCommandOutput,
  AdminDeleteUserCommandInput,
  AdminDeleteUserCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";
import { CUSTOM_USER_ATTRIBUTES } from "../model/user";
import type {
  GetRandomPasswordCommandInput,
  GetRandomPasswordCommandOutput,
} from "@aws-sdk/client-secrets-manager";
import type { IRepositoryFactory } from "../port/repository";
import type { Config } from "../model/config";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { Logger } from "@aws-lambda-powertools/logger";
import { MetricUnit, type Metrics } from "@aws-lambda-powertools/metrics";
type CreateCognitoUser = (
  input: AdminCreateUserCommandInput
) => Promise<AdminCreateUserCommandOutput>;
type DeleteCognitoUser = (
  input: AdminDeleteUserCommandInput
) => Promise<AdminDeleteUserCommandOutput>;
type GeneratePassword = (
  input: GetRandomPasswordCommandInput
) => Promise<GetRandomPasswordCommandOutput>;
type CreateUserIdentity = (
  args: Pick<
    Parameters<Schema["createUserIdentity"]["functionHandler"]>["0"],
    "arguments"
  >
) => ReturnType<Schema["createUserIdentity"]["functionHandler"]>;

export interface CreateUserIdentityProps {
  userPoolId: string;
  createCognitoUser: CreateCognitoUser;
  generatePassword: GeneratePassword;
  repositoryFactory: IRepositoryFactory<"createUser">;
  deleteCognitoUser: DeleteCognitoUser;
  config: Config;
  tracer: Tracer;
  logger: Logger;
  metrics: Metrics;
}
/**
 * CognitoユーザープールとDynamoDB上にユーザーアイデンティティを作成する
 * @returns
 */
export const createUserIdentityFactory: (
  props: CreateUserIdentityProps
) => CreateUserIdentity = (props: CreateUserIdentityProps) => {
  return async ({ arguments: args }) => {
    try {
      props.logger.appendKeys({ tenantId: args.tenantId });
      props.metrics.addDimensions({ tenantId: args.tenantId, role: args.role });
      props.tracer.putAnnotation("tenantId", args.tenantId);

      props.logger.debug(JSON.stringify(args));

      props.logger.info("最初にCognito上にユーザを作成する");
      // ※初期パスワードはランダムで作成
      const createCognitoUserRes = await props.createCognitoUser({
        UserPoolId: props.userPoolId,
        Username: args.email,
        UserAttributes: [
          {
            Name: CUSTOM_USER_ATTRIBUTES.TENANT_ID,
            Value: args.tenantId,
          },
          {
            Name: CUSTOM_USER_ATTRIBUTES.ROLE,
            Value: args.role!,
          },
          {
            Name: "email",
            Value: args.email,
          },
        ],
        TemporaryPassword: (
          await props.generatePassword({
            PasswordLength: 12,
          })
        ).RandomPassword,
      });
      console.log(createCognitoUserRes);
      const sub =
        createCognitoUserRes.User?.Attributes?.filter(
          (a) => a.Name === "sub"
        ) ?? [];
      if (sub?.length === 0) {
        throw Error("sub not found");
      }

      props.logger.info("次にDynamoDB上にユーザを作成する");
      const repository = await props.repositoryFactory(props.config);
      const createDynamoUserRes = await repository.createUser({
        id: sub[0]?.Value,
        tenantId: args.tenantId,
        email: args.email,
        name: args.name,
        role: args.role,
      });
      console.log(createDynamoUserRes);
      if (
        createDynamoUserRes.errors !== undefined ||
        createDynamoUserRes.data === null
      ) {
        props.logger.warn(
          "DynamoDB上へのユーザ作成に失敗した場合はロールバックする"
        );
        await props.deleteCognitoUser({
          UserPoolId: props.userPoolId,
          Username: sub[0]?.Value,
        });
      }

      props.metrics.addMetric("CreatedUsers", MetricUnit.Count, 1);

      return createDynamoUserRes.data;
    } finally {
      // props.logger.resetKeys();
    }
  };
};
