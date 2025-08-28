import type { Tenant } from "@intersection/backend/lib/domain/model/data";
import { activateTenant } from "../activate-tenant";

describe("テナントアクティベーションサービス", () => {
  test("pending状態のテナントのステータスを更新してアクティベーションの開始をリクエスト出来る", async () => {
    const activatedTenant = await activateTenant(
      { id: "test-id", status: "pending" } as Tenant,
      async (...args) => ({
        data: { status: args[0].status, id: "test-id" } as Tenant,
      })
    );
    expect(activatedTenant.status).toBe("activating");
  });
  test("pending状態以外の場合はエラーとなる", async () => {
    const f = async () =>
      await activateTenant(
        { id: "test-id", status: "inactive" } as Tenant,
        async (...args) => ({
          data: { status: args[0].status, id: "test-id" } as Tenant,
        })
      );
    expect(() => f()).rejects.toThrow(
      "tenant with status inactive cannot be activated"
    );
  });
  test("アクティベーションの開始のリクエストに失敗した場合はステータスをactivationFailedに更新する", async () => {
    // TODO
  });
});
