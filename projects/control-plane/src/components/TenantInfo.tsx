import * as React from "react";
import Box from "@mui/material/Box";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "../../amplify/data/resource";

import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import { BaseProps, State } from "./utils";

export interface TenantInfoProps extends BaseProps {
  userAttributes: State["userAttributes"];
  tenant: State["tenant"];
  setTenant: (s: State["tenant"]) => void;
}
export default function TenantInfo(props: TenantInfoProps) {
  const client = generateClient<Schema>();

  React.useEffect(() => {
    const getTenant = async () => {
      if (props.userAttributes === null) {
        return;
      }

      const tenantId = props.userAttributes["custom:tenantId"];
      console.log(`テナントID[${tenantId}]の情報を取得`);
      const res = await client.models.Tenant.get({ id: tenantId });
      console.log(res);
      props.stateRepository.set("tenant", res.data, props.setTenant);
    };
    getTenant();
  }, [props.userAttributes]);
  return (
    <React.Fragment>
      <CssBaseline />
      <Container>
        <Box sx={{ width: "100%" }}>
          <p>テナントID : {props.tenant?.id}</p>
          <p>テナント名 : {props.tenant?.name}</p>
          <p>ステータス : {props.tenant?.status}</p>
        </Box>
      </Container>
    </React.Fragment>
  );
}
