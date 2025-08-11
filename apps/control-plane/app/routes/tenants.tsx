import type { Schema } from "amplify/data/resource";
import type { Route } from "./+types/tenants";
import { Crud, DataSourceCache, type DataSource } from "@toolpad/core";
import { generateClient } from "aws-amplify/data";
import { status } from "../models/tenant";
import type { StandardSchemaV1 } from "@standard-schema/spec";

type Tenant = Schema["Tenant"]["type"];
const client = generateClient<Schema>();

let tenants: Tenant[] = [];

export const clientLoader = async ({
  params,
}: Partial<Route.ClientLoaderArgs>) => {
  console.log(params);
  if (params !== undefined && tenants.length !== 0) {
    console.log("skip listing tenants");
    return tenants;
  }
  console.log("list tenants...");
  const res = await client.models.Tenant.list();
  if (res.errors !== undefined) {
    console.error(res.errors);
    throw Error("Tenants could not be read");
  }
  tenants = [...res.data];
  console.log(tenants);
  return tenants;
};
export const tenantsDataSource: DataSource<Tenant> = {
  fields: [
    {
      field: "id",
      headerName: "ID",
    },
    {
      field: "name",
      headerName: "Name",
    },
    {
      field: "status",
      headerName: "Status",
      type: "singleSelect",
      valueOptions: [...status],
    },
  ],
  getMany: async () => {
    const tenants = await clientLoader({});
    return {
      items: tenants,
      itemCount: tenants.length,
    };
  },
  getOne: async (tenantId) => {
    const res = await client.models.Tenant.get({ id: tenantId.toString() });
    if (res.errors !== undefined || res.data === null) {
      throw Error(`Tenant ${tenantId.toString()} failed to be read`);
    }
    return res.data;
  },
  createOne: async (data) => {
    const name = data.name!;
    const status = data.status!;
    const newTenant = await client.models.Tenant.create({
      name,
      status,
    });

    if (newTenant.errors !== undefined || newTenant.data === null) {
      throw Error("tenant creation failed");
    }
    tenants = [...tenants, newTenant.data];
    return newTenant.data;
  },
  updateOne: async (id, data) => {
    let updatedTenant: Tenant | null = null;
    tenants = tenants.map((t) => {
      if (t.id === id.toString()) {
        updatedTenant = { ...t, ...data };
        return updatedTenant;
      }
      return t;
    });
    if (updatedTenant === null) {
      throw Error(`Tenant ${id} not found`);
    }
    const res = await client.models.Tenant.update(updatedTenant);
    if (res.errors !== undefined || res.data === null) {
      throw Error(`Tenant ${id} failed to be updated`);
    }

    return updatedTenant;
  },
  deleteOne: async (tenantId) => {
    const res = await client.models.Tenant.delete({ id: tenantId.toString() });
    if (res.errors !== undefined) {
      throw Error("tenant deletion failed");
    }
  },
  validate: (formValue) => {
    let issues: StandardSchemaV1.Issue[] = [];
    if (formValue.name === undefined) {
      issues = [...issues, { message: "name is required", path: ["name"] }];
    }
    if (formValue.status === undefined || formValue.status === null) {
      issues = [...issues, { message: "status is required", path: ["status"] }];
    }

    return { issues };
  },
};

const dataSourceCache = new DataSourceCache({});

export default function Tenants({}: Route.ComponentProps) {
  return (
    <Crud<Tenant>
      dataSource={tenantsDataSource}
      dataSourceCache={dataSourceCache}
      rootPath="/tenants"
      // initialPageSize={10}
    />
  );
}
