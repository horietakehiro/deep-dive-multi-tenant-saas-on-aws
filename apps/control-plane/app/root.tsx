import React from "react";
import { Outlet } from "react-router";
import outputs from "../amplify_outputs.json";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "amplify/data/resource";

import "@aws-amplify/ui-react/styles.css";
import "./styles/app.css";
import "./styles/amplify.css";
import type { RootContext } from "./models/context";
import { formFileds, services } from "./models/authenticator";

Amplify.configure(outputs);
const client = generateClient<Schema>();

export default function App() {
  const [tenant, setTenant] = React.useState<
    Schema["Tenant"]["type"] | undefined
  >(undefined);
  return (
    <React.StrictMode>
      <Authenticator services={services} formFields={formFileds}>
        {({ user }) => {
          if (user === undefined) {
            return <></>;
          }
          return (
            <Outlet
              context={
                {
                  authUser: user,
                  tenant,
                  setTenant,
                  client: {
                    getTenant: client.models.Tenant.get,
                    updateTenant: client.models.Tenant.update,
                    activateTenant:
                      client.queries.invokeApplicationPlaneDeployment,
                  },
                } satisfies RootContext
              }
            />
          );
        }}
      </Authenticator>
    </React.StrictMode>
  );
}
