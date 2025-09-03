import type { User } from "@intersection/backend/lib/domain/model/data";
import { notImplementedFn } from "@intersection/backend/lib/util";
import type { IRepository } from "@intersection/backend/lib/domain/port/repository";
import { deleteUserIdentity } from "../delete-user-identity";

describe("ユーザーアイデンティティの削除", () => {
  test("CognitoユーザープールとDynamoDBユーザーテーブルの両方からユーザーアイデンティティを削除出来る", async () => {
    const res = await deleteUserIdentity("user-1", {
      createUser: notImplementedFn,
      deleteUser: async (...args) => ({
        data: {
          id: args[0].id,
          name: "test-name",
          email: "test@example.com",
        } as User,
      }),
      deleteCognitoUser: async () => ({ data: null }),
    });

    expect(res.result).toBe("OK");
    expect(res.message).toMatch(/succeeded/);
    expect(res.data).toEqual(null);
  });
  test("DynamoDB上のユーザーアイデンティティの削除に失敗した場合はNGを返す", async () => {
    const res = await deleteUserIdentity("user-1", {
      deleteUser: async () => ({
        errors: [{ errorInfo: {}, errorType: "", message: "" }],
        data: null,
      }),
      createUser: notImplementedFn,
      deleteCognitoUser: notImplementedFn,
    });
    expect(res.result).toBe("NG");
    expect(res.message).toMatch(/failed/);
  });
  test("Cognito上のユーザーアイデンティティの削除に失敗した場合はDynamoDB上のユーザーアイデンティティをロールバックする", async () => {
    const mockCreateUser = vi.fn<IRepository["createUser"]>(async (props) => ({
      data: { id: props.id!, ...props } as User,
    }));
    const res = await deleteUserIdentity("user-1", {
      deleteUser: async ({ id }) => ({
        data: { id, name: "test-name", email: "test@example.com" } as User,
      }),
      deleteCognitoUser: async () => ({
        data: null,
        errors: [{ errorInfo: {}, errorType: "", message: "" }],
      }),
      createUser: mockCreateUser,
    });

    expect(res.result).toBe("NG");
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user-1",
      })
    );
  });
});
