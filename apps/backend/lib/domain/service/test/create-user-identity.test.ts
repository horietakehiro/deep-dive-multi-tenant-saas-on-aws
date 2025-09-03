import { createUserIdentityFactory } from "../create-user-identity";

describe("Cognitoユーザープールへのユーザーアイデンティティの作成", () => {
  test("Cognitoにユーザーアイデンティティを作成出来る", async () => {
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
      }
    );
    const res = await f({
      arguments: {
        email: "test@example.com",
        tenantId: "tenant-id",
        role: "ADMIN",
      },
    });
    expect(res?.sub).toBe("test-id");
  });
  test("ユーザーアイデンティティにはランダムパスワードが仮パスワードとして設定される", async () => {
    const mockCreateUser = vi.fn<
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
    const f = createUserIdentityFactory("", mockCreateUser, async (args) => {
      console.debug(args);
      return {
        RandomPassword: "random-password",
        $metadata: {},
      };
    });
    await f({
      arguments: {
        email: "test@example.com",
        tenantId: "tenant-id",
        role: "ADMIN",
      },
    });
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        TemporaryPassword: "random-password",
      })
    );
  });
});
