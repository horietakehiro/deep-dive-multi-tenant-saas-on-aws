import { useNavigate, useOutletContext } from "react-router";
import {
  tenantDataSourceFactory,
  type Context as TenantContext,
} from "./tenant";
import { Edit } from "@toolpad/core";
export type Context = TenantContext;
export default function TenantEdit() {
  const { tenant, setTenant, repository } = useOutletContext<Context>();
  const tenantDataSource = tenantDataSourceFactory(
    repository,
    tenant,
    setTenant
  );
  const navigate = useNavigate();
  return tenant === undefined ? (
    <></>
  ) : (
    <Edit<typeof tenant>
      id={tenant.id}
      dataSource={tenantDataSource}
      pageTitle="Edit Tenant Detail"
      onSubmitSuccess={() => navigate("/tenant")}
    />
  );
}
