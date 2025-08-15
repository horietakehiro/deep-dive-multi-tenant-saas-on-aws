import { Button, Stack } from "@mui/material";
import { Show, useNotifications, type DataSource } from "@toolpad/core";
import { useNavigate, useOutletContext } from "react-router";
import type { RootContext } from "../models/context";
import { status } from "../models/tenant";

export const tenantDataSourceFactory: (
  client: RootContext["client"],
  tenant: NonNullable<RootContext["tenant"]>,
  setTenant: (tenant: NonNullable<RootContext["tenant"]>) => void
) => DataSource<NonNullable<RootContext["tenant"]>> &
  Required<
    Pick<DataSource<NonNullable<RootContext["tenant"]>>, "getOne" | "updateOne">
  > = (client, tenant, setTenant) => {
  return {
    fields: [
      {
        field: "id",
        headerName: "ID",
        editable: false,
      },
      {
        field: "name",
        headerName: "Name",
        editable: true,
      },
      {
        field: "status",
        headerName: "Status",
        editable: false,
        type: "singleSelect",
        valueOptions: [...status],
      },
      {
        field: "url",
        headerName: "Application URL",
        editable: false,
      },
    ],
    getOne: async (id) => {
      if (tenant === undefined || id !== tenant.id) {
        throw Error("tenant is invalid");
      }
      return tenant;
    },
    updateOne: async (id, data) => {
      if (tenant === undefined || id !== tenant.id) {
        throw Error("tenant is invalid");
      }
      const newTenant = { ...tenant, ...data };
      await client.updateTenant(newTenant);
      setTenant(newTenant);
      return newTenant;
    },
  };
};

export default function Tenant() {
  const { tenant, setTenant, client } = useOutletContext() as RootContext;
  const navigate = useNavigate();
  const notifications = useNotifications();

  return (
    tenant !== undefined && (
      <>
        <Stack direction={"column"} spacing={2} alignItems={"center"}>
          <Show<NonNullable<RootContext["tenant"]>>
            id={tenant.id}
            dataSource={tenantDataSourceFactory(client, tenant, setTenant)}
            pageTitle="Information"
            onEditClick={() => {
              console.log("hoge");
              navigate("/tenant/edit", {});
            }}
          />
          <Button
            variant="contained"
            size="large"
            sx={{
              width: "50%",
            }}
            onClick={async () => {
              console.log(`tenant ${tenant.id} activation starting`);
              const updateTenantResponse = await client.updateTenant({
                ...tenant,
                status: "activating",
              });
              console.log(updateTenantResponse);
              if (
                updateTenantResponse.errors !== undefined ||
                updateTenantResponse.data === null
              ) {
                notifications.show("Tenant activation failed", {
                  autoHideDuration: 3000,
                  severity: "error",
                });
                return;
              }
              const activateTenantResponse = await client.activateTenant({
                tenantId: tenant.id,
              });
              console.log(activateTenantResponse);
              if (
                activateTenantResponse.errors !== undefined ||
                activateTenantResponse.data === null
              ) {
                notifications.show("Tenant activation failed", {
                  autoHideDuration: 3000,
                  severity: "error",
                });
                return;
              }
              setTenant({ ...updateTenantResponse.data });
              notifications.show("Tenant activation starting...", {
                autoHideDuration: 3000,
                severity: "success",
              });
            }}
            disabled={tenant.status !== "pending"}
          >
            ACTIVATE TENANT
          </Button>
        </Stack>
      </>
    )
  );
}
