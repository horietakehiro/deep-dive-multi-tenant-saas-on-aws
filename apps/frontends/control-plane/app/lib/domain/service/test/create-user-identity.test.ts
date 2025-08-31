import type { Tenant, User } from "@intersection/backend/lib/domain/model/data";
import {
  createUserIdentity,
  validate,
} from "app/lib/domain/service/create-user-identity";
import { notImplementedFn } from "@intersection/backend/lib/util";
import type { IRepository } from "@intersection/backend/lib/domain/port/repository";

const tenant = { id: "tenant-id" } as Tenant;
const user = {
  email: "test@example.com",
  name: "test-name",
  role: "ADMIN",
} as User;

describe("ユーザーアイデンティティの作成時の検証", () => {
  const validationTestCases: { user: Partial<User>; expected: boolean }[] = [
    { user: {}, expected: false },
    { user: { email: "test@example.com", name: "user-name" }, expected: false },
    { user: { departmentName: "" }, expected: false },
    {
      user: { email: "test@example.com", name: "user-name", role: "USER" },
      expected: true,
    },
  ];

  validationTestCases.forEach((testCase, i) => {
    test(`ユーザー情報を検証出来る(${i})`, () => {
      expect(validate(testCase.user)).toBe(testCase.expected);
    });
  });
});
describe("ユーザーアイデンティティの作成", () => {
  test("CognitoユーザープールとDynamoDBユーザーテーブルの両方にユーザーアイデンティティを作成出来る", async () => {
    const res = await createUserIdentity(tenant, user, {
      createUser: async (props) => ({
        data: {
          id: props.id!,
          name: props.name,
          email: props.email,
          role: props.role,
          tenantId: "tenant-id",
        } as User,
      }),
      createCognitoUser: async () => ({
        data: { sub: "user-id" },
      }),
      deleteCognitoUser: notImplementedFn,
    });

    expect(res.result).toBe("OK");
    expect(res.message).toMatch(/succeeded/);
    expect(res.data).toEqual({
      id: "user-id",
      tenantId: "tenant-id",
      email: "test@example.com",
      name: "test-name",
      role: "ADMIN",
    } as User);
  });
  test("Cognitoユーザープールへのユーザーアイデンティティの作成に失敗した場合はNGを返す", async () => {
    const res = await createUserIdentity(tenant, user, {
      createCognitoUser: async () => ({
        data: null,
        errors: [{ errorInfo: {}, errorType: "", message: "" }],
      }),
      createUser: notImplementedFn,
      deleteCognitoUser: notImplementedFn,
    });
    expect(res.result).toBe("NG");
    expect(res.data).toBe(null);
  });
  test("DynamoDBへのユーザーアイデンティティの作成に失敗した場合はロールバック(Cognitoユーザープール上のユーザーアイデンティティを削除)してNGを返す", async () => {
    const mockDeleteCognitoUser = vi.fn<IRepository["deleteCognitoUser"]>(
      async () => ({
        data: "",
      })
    );
    const res = await createUserIdentity(tenant, user, {
      createUser: async () => ({
        data: null,
        errors: [{ errorInfo: {}, errorType: "", message: "" }],
      }),
      createCognitoUser: async () => ({
        data: { sub: "user-id" },
      }),
      deleteCognitoUser: mockDeleteCognitoUser,
      // deleteCognitoUser: notImplementedFn,
    });

    expect(res.result).toBe("NG");
    expect(res.data).toBe(null);
    expect(mockDeleteCognitoUser).toHaveBeenCalledWith({
      tenantId: "tenant-id",
      email: user.email,
    });
  });
  test("ユーザー情報の検証に失敗した場合はNGを返す", async () => {
    const res = await createUserIdentity(
      tenant,
      {},
      {
        createUser: notImplementedFn,
        createCognitoUser: notImplementedFn,
        deleteCognitoUser: notImplementedFn,
      }
    );
    expect(res.result).toBe("NG");
    expect(res.message).toMatch(/validate/);
    expect(res.data).toBe(null);
  });
});
