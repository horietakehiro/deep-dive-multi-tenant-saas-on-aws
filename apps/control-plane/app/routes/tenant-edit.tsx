import { Edit } from "@toolpad/core";
import { useNavigate, useOutletContext } from "react-router";
import { tenantDataSourceFactory } from "./tenant";
import type { RootContext } from "../models/context";
import type { Context as C } from "./tenant";
export type Context = C;
export default function TenantEdit() {
  const { tenant, setTenant, client } = useOutletContext() as RootContext;
  const navigate = useNavigate();
  return tenant !== undefined ? (
    <Edit<typeof tenant>
      id={tenant.id}
      dataSource={tenantDataSourceFactory(client, tenant, setTenant)}
      pageTitle="Edit Tenant Information"
      onSubmitSuccess={() => navigate("/tenant")}
    />
  ) : (
    <></>
  );
}
