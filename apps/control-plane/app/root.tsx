import React from "react";
import { Outlet } from "react-router";
import outputs from "../amplify_outputs.json";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";

import "@aws-amplify/ui-react/styles.css";
import "./styles/app.css";
import "./styles/amplify.css";
// import "./styles/index.css";
import type { AuthUser } from "aws-amplify/auth";

Amplify.configure(outputs);

export interface OutletContext {
  authUser: AuthUser;
}
export default function App() {
  const [authUser, setAuthUser] = React.useState<AuthUser | undefined>(
    undefined
  );
  return (
    <React.StrictMode>
      <Authenticator>
        {({ user }) => {
          setAuthUser(user);
          return <Outlet context={{ authUser } as OutletContext} />;
        }}
      </Authenticator>
    </React.StrictMode>
  );
}
