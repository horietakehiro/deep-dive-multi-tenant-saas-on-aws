import React from "react";
import { Outlet } from "react-router";

import "@aws-amplify/ui-react/styles.css";
import "./styles/app.css";
import "./styles/amplify.css";

export default function App() {
  return (
    <React.StrictMode>
      <Outlet />
    </React.StrictMode>
  );
}
