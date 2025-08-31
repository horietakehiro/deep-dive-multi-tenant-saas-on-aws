import type { Tenant } from "@intersection/backend/lib/domain/model/data";
import type { IRepository } from "@intersection/backend/lib/domain/port/repository";
import type { ServiceResponse } from "app/lib/domain/service/type";

export const activateTenant = async (
  tenant: Tenant,
  updateTenant: IRepository["updateTenant"],
  requestTenantActivation: IRepository["requestTenantActivation"]
): Promise<ServiceResponse<Tenant>> => {
  // validation
  if (tenant.status !== "pending") {
    return {
      result: "NG",
      message: `tenant with status ${tenant.status} cannot be activated`,
      data: tenant,
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
      data: tenant,
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
      data: rollbackTenant.data!,
    };
  }

  return {
    result: "OK",
    message: "tenant activation successfully requested",
    data: updateResponse.data,
  };
};
