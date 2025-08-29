import type { Tenant } from "@intersection/backend/lib/domain/model/data";
import type { IRepository } from "@intersection/backend/lib/domain/port/repository";

export interface ActivateTenantResponse {
  result: "OK" | "NG";
  message: string;
  tenant: Tenant;
}
export const activateTenant = async (
  tenant: Tenant,
  updateTenant: IRepository["updateTenant"],
  requestTenantActivation: IRepository["requestTenantActivation"]
): Promise<ActivateTenantResponse> => {
  if (tenant.status !== "pending") {
    return {
      result: "NG",
      message: `tenant with status ${tenant.status} cannot be activated`,
      tenant,
    };
  }
  const updateResponse = await updateTenant({
    ...tenant,
    status: "activating",
  });
  if (updateResponse.data === null) {
    console.log(updateResponse.errors);
    return {
      result: "NG",
      message: "activate tenant failed",
      tenant,
    };
  }
  const activationResponse = await requestTenantActivation({
    tenantId: tenant.id,
  });
  return {
    result: "OK",
    message: "activation succeeded",
    tenant: updateResponse.data,
  };
};
