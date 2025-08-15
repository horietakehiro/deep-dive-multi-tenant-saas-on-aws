import type { Schema } from "amplify/data/resource";
import { getTenantFromUserAttributes } from "../tenant";

describe("カスタムユーザー属性からのテナント情報の取得", () => {
  test("カスタム属性のテナントIDと一致するテナント情報を取得できる", async () => {
    const tenant = await getTenantFromUserAttributes(
      () =>
        Promise.resolve({
          "custom:tenantId": "id",
          "custom:tenantName": "name",
        }),
      {
        getTenant: ({ id }) => {
          if (id !== "id") {
            throw Error("invalid id passed");
          }
          const data: Required<Readonly<Schema["Tenant"]["type"]>> = {
            id: "id",
            createdAt: "",
            updatedAt: "",
            status: "active",
            name: "",
            url: null,
          };
          return Promise.resolve({
            data: data,
          });
        },
      }
    );
    expect(tenant.id).toBe("id");
  });

  test("カスタム属性と一致するテナント情報が存在しない場合は例外が上がる", async () => {
    const f = async () => {
      await getTenantFromUserAttributes(
        () =>
          Promise.resolve({
            "custom:tenantId": "id",
            "custom:tenantName": "name",
          }),
        {
          getTenant() {
            return Promise.resolve({
              data: null,
            });
          },
        }
      );
    };

    await expect(f()).rejects.toThrow(Error);
  });
  test("テナント情報時にエラーが発生した場合は例外を上げる", async () => {
    const f = async () => {
      await getTenantFromUserAttributes(
        () =>
          Promise.resolve({
            "custom:tenantId": "id",
            "custom:tenantName": "name",
          }),
        {
          getTenant() {
            const data: Required<Readonly<Schema["Tenant"]["type"]>> = {
              id: "",
              createdAt: "",
              updatedAt: "",
              status: "active",
              name: "",
              url: null,
            };
            return Promise.resolve({
              data: data,
              errors: [
                {
                  errorInfo: {},
                  errorType: "",
                  message: "",
                },
              ],
              extensions: undefined,
            });
          },
        }
      );
    };
    await expect(f()).rejects.toThrow(Error);
  });
});
