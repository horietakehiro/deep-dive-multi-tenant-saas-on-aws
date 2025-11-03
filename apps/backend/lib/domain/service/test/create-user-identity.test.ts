import type { User } from "../../../domain/model/data";
import {
  createUserIdentityFactory,
  type CreateUserIdentityProps,
} from "../create-user-identity";
import { notImplementedFn } from "../../../util";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { Logger } from "@aws-lambda-powertools/logger";
import { Metrics } from "@aws-lambda-powertools/metrics";

describe("ユーザーアイデンティティの作成", () => {
  const expectedUserId = "test-id";
  const props: CreateUserIdentityProps = {
    userPoolId: "",
    createCognitoUser: async (args) => {
      console.log(args);
      return {
        User: {
          Attributes: [{ Name: "sub", Value: expectedUserId }],
        },
        $metadata: {},
      };
    },
    generatePassword: async (args) => {
      console.debug(args);
      return {
        RandomPassword: "password",
        $metadata: {},
      };
    },
    deleteCognitoUser: notImplementedFn,
    config: {
      appType: "control-plane",
      type: "PRODUCTION",
      amplifyConfigFn: notImplementedFn,
    },
    repositoryFactory: async () => {
      return {
        createUser: async () => ({
          data: { id: expectedUserId } as User,
        }),
      };
    },
    tracer: new Tracer(),
    logger: new Logger(),
    metrics: new Metrics(),
  };
  test("CognitoとDynamoDBにユーザーアイデンティティを作成出来る", async () => {
    const f = createUserIdentityFactory(props);
    const res = await f({
      arguments: {
        email: "test@example.com",
        tenantId: "tenant-id",
        role: "ADMIN",
        name: "test-name",
      },
    });
    expect(res!.id).toBe(expectedUserId);
  });
  test("ユーザーアイデンティティにはランダムパスワードが仮パスワードとして設定される", async () => {
    const mockCreateCognitoUser = vi.fn<
      CreateUserIdentityProps["createCognitoUser"]
    >(async (args) => {
      console.debug(args);
      return {
        User: {
          Attributes: [{ Name: "sub", Value: "test-id" }],
        },
        $metadata: {},
      };
    });
    const f = createUserIdentityFactory({
      ...props,
      createCognitoUser: mockCreateCognitoUser,
      generatePassword: async (args) => {
        console.debug(args);
        return {
          RandomPassword: "random-password",
          $metadata: {},
        };
      },
    });
    await f({
      arguments: {
        email: "test@example.com",
        tenantId: "tenant-id",
        role: "ADMIN",
        name: "test-name",
      },
    });
    expect(mockCreateCognitoUser).toHaveBeenCalledWith(
      expect.objectContaining({
        TemporaryPassword: "random-password",
      })
    );
  });

  test("DynamoDB上へのユーザの作成に失敗した場合はロールバックする", async () => {
    const mockDeleteCognitoUser = vi.fn<
      CreateUserIdentityProps["deleteCognitoUser"]
    >(async (args) => {
      console.debug(args);
      return {
        $metadata: {},
      };
    });

    const f = createUserIdentityFactory({
      ...props,
      repositoryFactory: async () => {
        return {
          createUser: async () => ({ data: null }),
        };
      },
      deleteCognitoUser: mockDeleteCognitoUser,
    });
    const res = await f({
      arguments: {
        email: "test@example.com",
        tenantId: "tenant-id",
        role: "ADMIN",
        name: "test-name",
      },
    });

    expect(res).toBe(null);
    expect(mockDeleteCognitoUser).toHaveBeenCalledWith({
      UserPoolId: "",
      Username: "test-id",
    });
  });
});
