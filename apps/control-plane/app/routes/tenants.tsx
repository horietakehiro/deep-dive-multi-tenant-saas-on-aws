import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import type { Schema } from "amplify/data/resource";
import type { Route } from "./+types/tenants";

interface ITenantClient {
  list: () => Promise<Schema["Tenant"]["type"][]>;
}

type Loader = ({
  params,
}: Route.ClientLoaderArgs) => Promise<Schema["Tenant"]["type"][]>;
export const clientLoaderFactory = (client: ITenantClient): Loader => {
  return async () => {
    return client.list();
  };
};

// const client = generateClient<Schema>();
export const clientLoader = clientLoaderFactory({
  list: async () => {
    return [];
  },
});

export default function Tenants({ loaderData }: Route.ComponentProps) {
  return (
    <Box sx={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={loaderData}
        columns={[{ field: "id" }, { field: "name" }]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
        pageSizeOptions={[10]}
        checkboxSelection={false}
      />
    </Box>
  );
}
