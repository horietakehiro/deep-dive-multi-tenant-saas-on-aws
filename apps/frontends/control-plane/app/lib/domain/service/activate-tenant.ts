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
  // validation
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
  if (updateResponse.errors !== undefined || updateResponse.data === null) {
    console.log(updateResponse.errors);
    return {
      result: "NG",
      message: "updating tenant status failed",
      tenant,
    };
  }
  const activationResponse = await requestTenantActivation({
    tenantId: tenant.id,
  });
  // rollback
  if (activationResponse.errors !== undefined) {
    console.log(activationResponse.errors);
    const rollbackTenant = await updateTenant({
      ...updateResponse.data,
      status: "activationFailed",
    });
    return {
      result: "NG",
      message: "activating tenant failed",
      tenant: rollbackTenant.data!,
    };
  }

  return {
    result: "OK",
    message: "tenant activation successfully requested",
    tenant: updateResponse.data,
  };
};
