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
import type { OutletContext } from "./models/context";
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
          return (
            <Outlet
              context={
                { authUser: user, client, tenant, setTenant } as OutletContext
              }
            />
          );
        }}
      </Authenticator>
    </React.StrictMode>
  );
}
