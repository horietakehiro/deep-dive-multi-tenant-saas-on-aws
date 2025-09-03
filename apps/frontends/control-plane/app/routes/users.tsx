import { useOutletContext } from "react-router";
import type { IRepository } from "@intersection/backend/lib/domain/port/repository";
import type { RootContext } from "../lib/domain/model/context";
import type { Tenant, User } from "@intersection/backend/lib/domain/model/data";
import { Crud, type DataSource } from "@toolpad/core";
import { createUserIdentity } from "../lib/domain/service/create-user-identity";

type Repository = Pick<
  IRepository,
  | "getUser"
  | "createUser"
  | "deleteUser"
  | "updateUser"
  | "listUserRoles"
  | "createCognitoUser"
  | "deleteCognitoUser"
>;
export type Context = Pick<RootContext, "tenant"> & {
  repository: Repository;
};
const usersDataSourceFactory: (
  tenant: Tenant,
  repository: Repository
) => DataSource<User> = (tenant, repository) => {
  return {
    fields: [
      { field: "id", headerName: "ID", editable: false },
      { field: "name", headerName: "Name", editable: true },
      { field: "email", headerName: "Email", editable: true },
      {
        field: "role",
        headerName: "Role",
        editable: true,
        valueOptions: repository.listUserRoles(),
        type: "singleSelect",
      },
      { field: "departmentName", headerName: "Department", editable: true },
      { field: "teamName", headerName: "Team", editable: true },
    ],
    getMany: async () => {
      const res = await tenant.users();
      if (res.data === null || res.errors !== undefined) {
        console.error(res.errors);
        throw Error("list users failed");
      }
      return {
        items: res.data,
        itemCount: res.data.length,
      };
    },
    getOne: async (id) => {
      const res = await repository.getUser({ id: id.toString() });
      if (res.data === null || res.errors !== undefined) {
        console.error(res.errors);
        throw Error("get users failed");
      }
      return res.data;
    },
    createOne: async (props) => {
      const res = await createUserIdentity(
        tenant,
        {
          email: props.email!,
          role: props.role!,
          name: props.name!,
        },
        repository
      );
      console.log(res);
      if (res.result === "NG") {
        throw Error("create user failed");
      }
      return res.data;
    },
  };
};
export default function Users() {
  const { tenant, repository } = useOutletContext<Context>();
  if (tenant === undefined) {
    return <></>;
  }
  const usersDataSource = usersDataSourceFactory(tenant, repository);
  return (
    <Crud<User>
      dataSource={usersDataSource}
      rootPath="/users"
      pageTitles={{
        list: "Users",
        show: "Detail",
        create: "Create new user",
        edit: "Edit user",
      }}
    />
  );
}
