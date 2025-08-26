import { Stack } from "@mui/material";
import { Show, type DataSource } from "@toolpad/core";
import { useNavigate, useOutletContext } from "react-router";

import type { Tenant } from "@intersection/backend/lib/domain/model/data";
import type { IRepository } from "@intersection/backend/lib/domain/port/repository";
import type { RootContext } from "../lib/domain/model/context";

export const tenantDataSourceFactory: (
  repository: Pick<IRepository, "getTenant" | "updateTenant">,
  tenant: RootContext["tenant"],
  setTenant: RootContext["setTenant"]
) => DataSource<Tenant> &
  Required<Pick<DataSource<Tenant>, "getOne" | "updateOne">> = (
  repository,
  tenant,
  setTenant
) => {
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
      },
    ],
    getOne: async (id) => {
      const res = await repository.getTenant({ id: id.toString() });
      if (res.data == null) {
        throw Error("tenant get failed");
      }
      return res.data;
    },
    updateOne: async (...args) => {
      const res = await repository.updateTenant({
        ...tenant!,
        ...args[1],
      });
      if (res.data === null) {
        throw Error("tenant update failed");
      }
      setTenant({ ...res.data });
      return res.data;
    },
  };
};

export type Context = Pick<RootContext, "tenant" | "setTenant"> & {
  repository: Pick<IRepository, "updateTenant" | "getTenant">;
};
export default function Tenant() {
  const {
    tenant,
    setTenant,
    repository: { updateTenant, getTenant },
  } = useOutletContext<Context>();

  //   const navigate = useNavigate();
  //   const notifications = useNotifications();

  const tenantDataSource = tenantDataSourceFactory(
    { getTenant, updateTenant },
    tenant,
    setTenant
  );

  return tenant === undefined ? (
    <></>
  ) : (
    <>
      <Stack direction={"column"} spacing={2} alignItems={"center"}>
        <Show<Tenant>
          id={tenant.id}
          dataSource={tenantDataSource}
          pageTitle="Detail"
          onEditClick={() => {
            //   navigate("/tenant/edit", {});
          }}
        ></Show>
      </Stack>
    </>
  );
}
