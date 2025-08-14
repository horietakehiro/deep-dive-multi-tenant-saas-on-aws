import { Edit } from "@toolpad/core";
import type { Schema } from "amplify/data/resource";
import { useNavigate, useOutletContext } from "react-router";
import { tenantDataSourceFactory } from "./tenant";
import type { RootContext } from "../models/context";

export default function TenantEdit() {
  const { tenant, setTenant, client } = useOutletContext() as RootContext;
  const navigate = useNavigate();
  console.log(tenant);

  return (
    tenant !== undefined && (
      <Edit<Schema["Tenant"]["type"]>
        id={tenant.id}
        dataSource={tenantDataSourceFactory(client, tenant, setTenant)}
        pageTitle="Edit Tenant Information"
        onSubmitSuccess={() => navigate("/tenant")}
      />
    )
  );
}
