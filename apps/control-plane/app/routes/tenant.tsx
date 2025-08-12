import { Button, Stack } from "@mui/material";
import { Show, type DataSource } from "@toolpad/core";
import { useNavigate, useOutletContext } from "react-router";
import type { OutletContext } from "~/models/context";
import { status } from "~/models/tenant";

export const tenantDataSourceFactory: (
  client: OutletContext["client"],
  tenant: NonNullable<OutletContext["tenant"]>,
  setTenant: (tenant: NonNullable<OutletContext["tenant"]>) => void
) => DataSource<NonNullable<OutletContext["tenant"]>> &
  Required<
    Pick<
      DataSource<NonNullable<OutletContext["tenant"]>>,
      "getOne" | "updateOne"
    >
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
      await client.models.Tenant.update(newTenant);
      setTenant(newTenant);
      return newTenant;
    },
  };
};

export default function Tenant() {
  const { tenant, setTenant, client } = useOutletContext() as OutletContext;
  const navigate = useNavigate();

  console.log(tenant);

  return (
    tenant !== undefined && (
      <>
        <Stack direction={"column"} spacing={2} alignItems={"center"}>
          <Show<NonNullable<OutletContext["tenant"]>>
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
            onClick={async () =>
              console.log(
                await client.queries.invokeApplicationPlaneDeployment({
                  tenantId: tenant.id,
                })
              )
            }
          >
            ACTIVATE TENANT
          </Button>
        </Stack>
      </>
    )
  );
}
