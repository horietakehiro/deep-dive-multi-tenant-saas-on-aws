import { deleteUserIdentityFactory } from "../delete-user-identity";

describe("Cognitoユーザープール上からのユーザーアイデンティティの削除", () => {
  test("Cognitoからユーザーアイデンティティを削除出来る", async () => {
    const f = deleteUserIdentityFactory("", async () => ({
      $metadata: {},
    }));
    const res = await f({
      arguments: {
        userId: "user-1",
      },
    });
    expect(res).toBe("success");
  });
});
