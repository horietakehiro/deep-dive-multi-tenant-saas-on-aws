import { Outlet } from "react-router";
import "./app.css";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";

export default function App() {
  return (
    <ReactRouterAppProvider>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </ReactRouterAppProvider>
  );
}
