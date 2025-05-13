import * as React from "react";
import Box from "@mui/material/Box";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "../../amplify/data/resource";

import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";

export interface TenantInfoProps {
  id: string;
}
export default function TenantInfo(props: TenantInfoProps) {
  const client = generateClient<Schema>({ authMode: "iam" });

  const [tenant, setTenant] = React.useState<Schema["Tenant"]["type"]>();
  const getTenant = async (tenantId: string) => {
    console.log(`テナントID[${tenantId}]の情報を取得`);
    const res = await client.models.Tenant.get({ id: tenantId });
    console.log(res);
    if (res.data) {
      setTenant(res.data);
    }
  };

  React.useEffect(() => {
    getTenant(props.id);
  });
  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="sm">
        <Box sx={{ height: "100vh" }}>
          テナント情報 : {JSON.stringify(tenant)}
        </Box>
      </Container>
    </React.Fragment>
  );
}
