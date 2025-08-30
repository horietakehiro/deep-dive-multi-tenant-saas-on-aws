import type { Tenant } from "@intersection/backend/lib/domain/model/data";
import { activateTenant } from "../activate-tenant";
import type { IRepository } from "@intersection/backend/lib/domain/port/repository";

describe("テナントアクティベーションサービス", () => {
  const mockUpdateTenant: IRepository["updateTenant"] = async (...args) => ({
    data: { status: args[0].status, id: "test-id" } as Tenant,
  });

  test("pending状態のテナントのステータスを更新してアクティベーションの開始をリクエスト出来る", async () => {
    const res = await activateTenant(
      { id: "test-id", status: "pending" } as Tenant,
      mockUpdateTenant,
      async () => ({ data: "" })
    );
    expect(res.result).toBe("OK");
    expect(res.tenant.status).toBe("activating");
  });
  test("pending状態以外の場合はNGがレスポンスされる", async () => {
    const res = await activateTenant(
      { id: "test-id", status: "inactive" } as Tenant,
      mockUpdateTenant,
      async () => ({ data: "" })
    );
    expect(res.result).toBe("NG");
    expect(res.message).toBe("tenant with status inactive cannot be activated");
    expect(res.tenant.status).toBe("inactive");
  });
  test("テナントステータス更新後のアクティベーションの開始のリクエストに失敗した場合はステータスをactivationFailedに更新する", async () => {
    const res = await activateTenant(
      { id: "test-id", status: "pending" } as Tenant,
      mockUpdateTenant,
      async () => {
        throw Error();
      }
    );
    expect(res.result).toBe("NG");
    expect(res.message).toBe("activation tenant failed");
    expect(res.tenant.status).toBe("activationFailed");
  });
});
