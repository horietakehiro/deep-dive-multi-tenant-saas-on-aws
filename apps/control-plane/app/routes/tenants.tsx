import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import React from "react";
import Box from "@mui/material/Box";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

const client = generateClient<Schema>();

export default function Tenants() {
  const [tenants, setTenants] = React.useState<Schema["Tenant"]["type"][]>([]);

  const columns: GridColDef<(typeof tenants)[number]>[] = [
    {
      field: "id",
    },
  ];

  React.useEffect(() => {
    console.log("get tenant list...");
    const listTenants = async () => {
      try {
        const res = await client.models.Tenant.list();
        console.log(res);
        setTenants([...res.data]);
      } catch (e) {
        console.error(e);
      }
    };

    listTenants();
  }, []);

  return (
    <Box sx={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={tenants}
        columns={columns}
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
