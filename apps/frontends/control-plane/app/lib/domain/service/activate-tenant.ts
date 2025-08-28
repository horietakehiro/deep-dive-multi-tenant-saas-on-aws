import type { Tenant } from "@intersection/backend/lib/domain/model/data";
import type { IRepository } from "@intersection/backend/lib/domain/port/repository";

export const activateTenant = async (
  tenant: Tenant,
  updateTenant: IRepository["updateTenant"],
  requestTenantActivation: IRepository["requestTenantActivation"]
) => {
  if (tenant.status !== "pending") {
    throw Error(`tenant with status ${tenant.status} cannot be activated`);
  }

  const updateResponse = await updateTenant({
    ...tenant,
    status: "activating",
  });
  if (updateResponse.data === null) {
    console.log(updateResponse.errors);
    throw Error("activate tenant failed");
  }

  const activationResponse = await requestTenantActivation({
    tenantId: tenant.id,
  });
  // TODO:
  return updateResponse.data;
};
