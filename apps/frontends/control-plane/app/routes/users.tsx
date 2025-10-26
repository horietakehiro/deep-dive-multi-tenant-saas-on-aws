import { useOutletContext } from "react-router";
import type { IRepository } from "@intersection/backend/lib/domain/port/repository";
import type { RootContext } from "../lib/domain/model/context";
import type { Tenant, User } from "@intersection/backend/lib/domain/model/data";
import {
  Crud,
  type DataFieldRenderFormField,
  type DataSource,
} from "@toolpad/core";
import FormControl from "@mui/material/FormControl";
import { TextField } from "@mui/material";

type Repository = Pick<
  IRepository,
  | "getUser"
  | "createUser"
  | "deleteUser"
  | "updateUser"
  | "listUserRoles"
  | "createUserIdentity"
  | "deleteUserIdentity"
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
      { field: "id", headerName: "ID" },
      { field: "name", headerName: "Name" },
      {
        field: "email",
        headerName: "Email",
        // Emailは後から更新出来ないようにする
        renderFormField: (() => {
          let onCreate = false;
          const f: DataFieldRenderFormField = ({ value, onChange, error }) => {
            if (value === null) {
              onCreate = true; // 初回レンダリング時に値が未設定≒新規作成時と判断する
            }
            console.log(value);
            return (
              <FormControl error={!!error} fullWidth>
                <TextField
                  value={value}
                  label={"Email"}
                  disabled={!onCreate}
                  onChange={(event) => onChange(event.target.value)}
                />
              </FormControl>
            );
          };
          return f;
        })(),
      },
      {
        field: "role",
        headerName: "Role",
        valueOptions: repository.listUserRoles(),
        type: "singleSelect",
      },
      { field: "departmentName", headerName: "Department" },
      { field: "teamName", headerName: "Team" },
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
      // const res = await createUserIdentity(
      //   tenant,
      //   {
      //     email: props.email!,
      //     role: props.role!,
      //     name: props.name!,
      //   },
      //   repository
      // );
      const res = await repository.createUserIdentity({
        tenantId: tenant.id,
        email: props.email!,
        role: props.role!,
        name: props.name!,
      });
      console.log(res);
      if (res.data === null || res.data === undefined) {
        throw Error("create user failed");
      }
      return res.data;
    },
    updateOne: async (...args) => {
      const res = await repository.updateUser({
        id: args[0].toString(),
        ...args[1],
      });
      if (res.errors !== undefined || res.data === null) {
        throw Error("update user failed");
      }
      return res.data;
    },
    // TODO:
    deleteOne: async (...args) => {
      console.log(args);
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
