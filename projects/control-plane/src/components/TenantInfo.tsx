import * as React from "react";
import Box from "@mui/material/Box";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "../../amplify/data/resource";

import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import { BaseProps, StateKey } from "./utils";

export interface TenantInfoProps extends BaseProps {}
export default function TenantInfo(props: TenantInfoProps) {
  const client = generateClient<Schema>();

  const userAttributes = props.stateRepository.get("userAttributes", null);
  const [tenant, setTenant] = React.useState<StateKey["tenant"]>(
    props.stateRepository.get("tenant", null)
  );

  React.useEffect(() => {
    const getTenant = async () => {
      if (userAttributes === null) {
        return;
      }

      const tenantId = userAttributes["custom:tenantId"];
      console.log(`テナントID[${tenantId}]の情報を取得`);
      const res = await client.models.Tenant.get({ id: tenantId });
      console.log(res);
      props.stateRepository.set("tenant", res.data, setTenant);
    };
    getTenant();
  }, []);
  return (
    <React.Fragment>
      {/* <CssBaseline /> */}
      <Container>
        <Box sx={{ width: "100%" }}>
          <p>テナントID : {tenant?.id}</p>
          <p>テナント名 : {tenant?.name}</p>
          <p>ステータス : {tenant?.status}</p>
          <p>テナントURL : {tenant?.status}</p>
        </Box>
      </Container>
    </React.Fragment>
  );
}
