import { Crud, type DataModel, type DataSource } from "@toolpad/core/Crud";
import type { Route } from "./+types/admin-users";

export interface AdminUser extends DataModel {
  id: string;
  email: string;
}
let adminUsers: AdminUser[] = [
  {
    id: "u1",
    email: "u1@example.com",
  },
  {
    id: "u2",
    email: "u2@example.com",
  },
];
export const adminUserDataSource: DataSource<AdminUser> = {
  fields: [
    { field: "id", headerName: "ID" },
    { field: "email", headerName: "EMAIL" },
  ],
  getMany: async ({ paginationModel }) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 750);
    });

    let processedAdminUsers = [...adminUsers];

    const start = paginationModel.page * paginationModel.pageSize;
    const end = start + paginationModel.pageSize;
    const paginatedAdminUsers = processedAdminUsers.slice(start, end);

    return {
      items: paginatedAdminUsers,
      itemCount: processedAdminUsers.length,
    };
  },
  getOne: async (userId) => {
    const user = adminUsers.find((u) => u.id === userId.toString());
    if (!user) {
      throw Error("User not found");
    }
    return user;
  },

  // deleteOne: async ({id:})
};

export default function AdminUsers({}: Route.ComponentProps) {
  return (
    <Crud<AdminUser>
      dataSource={adminUserDataSource}
      rootPath="/admin-users"
      initialPageSize={10}
      pageTitles={{}}
    ></Crud>
  );
}
