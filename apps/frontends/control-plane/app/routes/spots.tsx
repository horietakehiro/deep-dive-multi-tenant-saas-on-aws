import type { Spot, Tenant } from "@intersection/backend/lib/domain/model/data";
import type { IRepository } from "@intersection/backend/lib/domain/port/repository";
import { Crud, type DataSource } from "@toolpad/core";
import type { RootContext } from "app/lib/domain/model/context";
import { useOutletContext } from "react-router";

type Repository = Pick<
  IRepository,
  "createSpot" | "getSpot" | "updateSpot" | "deleteSpot"
>;
export type Context = Pick<RootContext, "tenant"> & { repository: Repository };

export const spotsDataSourceFactory: (
  tenant: Tenant,
  repository: Repository
) => DataSource<Spot> = (tenant, repository) => {
  return {
    fields: [
      { field: "id", headerName: "ID", editable: false },
      { field: "name", headerName: "Name", editable: true },
      { field: "description", headerName: "Description", editable: true },
      {
        field: "available",
        headerName: "Available",
        editable: true,
        valueOptions: [true, false],
        type: "boolean",
      },
    ],
    getMany: async () => {
      const res = await tenant.spots();
      if (res.errors !== undefined || res.data === null) {
        console.error(res.errors);
        throw Error("list spots failed");
      }
      // TODO: sort and filter and pagination

      return {
        items: res.data,
        itemCount: res.data.length,
      };
    },
    getOne: async (id) => {
      const res = await repository.getSpot({ id: id.toString() });
      if (res.errors !== undefined || res.data === null) {
        console.error(res.errors);
        throw Error("get tenant failed");
      }
      return res.data;
    },
    updateOne: async (id, props) => {
      const res = await repository.updateSpot({
        id: id.toString(),
        ...props,
        tenantId: tenant.id,
      });
      if (res.errors !== undefined || res.data === null) {
        console.error(res.errors);
        throw Error("update spot failed");
      }
      return res.data;
    },
    deleteOne: async (id) => {
      const res = await repository.deleteSpot({
        id: id.toString(),
      });
      if (res.data === null || res.errors !== undefined) {
        console.error(res.errors);
        throw Error("delete spot failed");
      }
      // return res.data,
    },
    // validate: notImplementedFn,
    createOne: async (props) => {
      const res = await repository.createSpot({
        name: props.name!,
        available: props.available!,
        ...props,
        tenantId: tenant.id,
      });
      if (res.errors !== undefined || res.data === null) {
        console.error(res);
        throw Error("create spot failed");
      }
      return res.data;
    },
  };
};

export default function Spots() {
  const { tenant, repository } = useOutletContext<Context>();
  if (tenant === undefined) {
    return <></>;
  }
  const spotsDataSource = spotsDataSourceFactory(tenant, repository);
  return (
    <Crud<Spot>
      dataSource={spotsDataSource}
      rootPath="/spots"
      pageTitles={{
        create: "Create new spot",
        edit: "Edit spot",
        show: "Detail",
        list: "Spots",
      }}
    />
  );
}
