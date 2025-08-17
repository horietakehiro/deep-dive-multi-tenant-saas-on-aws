import { type DataSource, Crud } from "@toolpad/core/Crud";
import type { AmplifyClient } from "../models/context";
import type { Schema } from "../..//amplify/data/resource";
import { useOutletContext } from "react-router";

type User = Schema["User"]["type"];
export type Context = {
  client: Pick<
    AmplifyClient,
    "createUser" | "updateUser" | "listUsers" | "deleteUser" | "getUser"
  >;
};
export const usersDataSourceFactory: (
  client: Context["client"]
) => DataSource<User> = (client) => {
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
        field: "email",
        headerName: "Email",
        editable: true,
      },
      {
        field: "departmentName",
        headerName: "Depardment",
        editable: true,
      },
      {
        field: "teamName",
        headerName: "Team",
      },
    ],
    getMany: async (params) => {
      // TODO: filter and sort and pagination
      const res = await client.listUsers();
      console.log(res);
      if (res.errors !== undefined || res.data === null) {
        throw Error("list users failed");
      }
      return {
        items: res.data,
        itemCount: res.data.length,
      };
    },
    createOne: async (props) => {
      const res = await client.createUser({
        name: props.name!,
        email: props.email!,
        ...props,
      });
      if (res.errors !== undefined || res.data === null) {
        throw Error("create users failed");
      }
      return res.data;
    },
    updateOne: async (prosp) => {
      throw Error();
    },
    deleteOne: async (props) => {
      throw Error();
    },
    getOne: async (props) => {
      const res = await client.getUser({ id: props.toString() });
      if (res.errors !== undefined || res.data === null) {
        throw Error("get use failed");
      }
      return res.data;
    },
  };
};
export default function Users() {
  const { client } = useOutletContext<Context>();

  return (
    <Crud<User> dataSource={usersDataSourceFactory(client)} rootPath="/users" />
  );
}
