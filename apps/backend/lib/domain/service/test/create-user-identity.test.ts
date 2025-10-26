import type { User } from "../../../domain/model/data";
import { createUserIdentityFactory } from "../create-user-identity";
import { notImplementedFn } from "../../../util";

describe("ユーザーアイデンティティの作成", () => {
  test("CognitoとDynamoDBにユーザーアイデンティティを作成出来る", async () => {
    const expectedUserId = "test-id";
    const f = createUserIdentityFactory(
      "",
      async (args) => {
        console.log(args);
        return {
          User: {
            Attributes: [{ Name: "sub", Value: expectedUserId }],
          },
          $metadata: {},
        };
      },
      async (args) => {
        console.debug(args);
        return {
          RandomPassword: "password",
          $metadata: {},
        };
      },
      async (args) => {
        return {
          data: {
            id: args.id,
          } as User,
        };
      },
      notImplementedFn
    );
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
      Parameters<typeof createUserIdentityFactory>["1"]
    >(async (args) => {
      console.debug(args);
      return {
        User: {
          Attributes: [{ Name: "sub", Value: "test-id" }],
        },
        $metadata: {},
      };
    });
    const f = createUserIdentityFactory(
      "",
      mockCreateCognitoUser,
      async (args) => {
        console.debug(args);
        return {
          RandomPassword: "random-password",
          $metadata: {},
        };
      },
      async () => ({ data: { id: "test-id" } as User }),
      notImplementedFn
    );
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
      Parameters<typeof createUserIdentityFactory>["4"]
    >(async (args) => {
      console.debug(args);
      return {
        $metadata: {},
      };
    });

    const f = createUserIdentityFactory(
      "",
      async (args) => {
        console.log(args);
        return {
          User: {
            Attributes: [{ Name: "sub", Value: "test-id" }],
          },
          $metadata: {},
        };
      },
      async (args) => {
        console.debug(args);
        return {
          RandomPassword: "password",
          $metadata: {},
        };
      },
      async (args) => {
        console.log(args);
        return {
          data: null,
          errors: [],
        };
      },
      mockDeleteCognitoUser
    );

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
