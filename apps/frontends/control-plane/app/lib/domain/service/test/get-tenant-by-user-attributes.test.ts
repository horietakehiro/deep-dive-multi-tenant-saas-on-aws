import { getTenantByUserAttributes } from "../get-tenant-by-user-attributes";
import type { Tenant } from "@intersection/backend/lib/domain/model/data";

describe("ユーザー属性に対応したテナント情報の取得", () => {
  test("成功", async () => {
    const res = await getTenantByUserAttributes(
      async () => ({
        "custom:tenantId": "test-id",
        "custom:tenantName": "",
        "custom:tenantRole": "OWNER",
      }),
      async (props) => {
        if (props.id !== "test-id") {
          throw Error("wrong tenant id");
        }
        return {
          data: {
            id: "test-id",
            name: "test-name",
          } as Tenant,
        };
      }
    );
    expect(res.name).toBe("test-name");
  });

  test("失敗(該当するテナント情報無し)", async () => {
    const f = async () => {
      await getTenantByUserAttributes(
        async () => ({
          "custom:tenantId": "test-id",
          "custom:tenantName": "",
          "custom:tenantRole": "OWNER",
        }),
        async () => {
          return {
            data: null,
          };
        }
      );
    };
    await expect(() => f()).rejects.toThrowError("tenant get failed");
  });
  test("失敗(その他エラー)", async () => {
    const f = async () => {
      await getTenantByUserAttributes(
        async () => ({
          "custom:tenantId": "test-id",
          "custom:tenantName": "",
          "custom:tenantRole": "OWNER",
        }),
        async () => {
          return {
            data: {
              id: "test-id",
            } as Tenant,
            errors: [{ errorInfo: {}, errorType: "", message: "" }],
          };
        }
      );
    };
    await expect(() => f()).rejects.toThrowError("tenant get failed");
  });
});
