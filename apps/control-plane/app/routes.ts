import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("./layouts/dashboard.tsx", [
    index("./routes/home.tsx"),
    route("tenant", "./routes/tenant.tsx"),
    route("tenant/edit", "./routes/tenant-edit.tsx"),
    // route("admin-users/:userId", "./routes/admin-users.tsx"),
  ]),
] satisfies RouteConfig;
