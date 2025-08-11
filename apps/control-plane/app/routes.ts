import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("./layouts/dashboard.tsx", [
    index("./routes/home.tsx"),
    route("tenants/*", "./routes/tenants.tsx"),
    route("admin-users/*", "./routes/admin-users.tsx"),
    // route("admin-users/:userId", "./routes/admin-users.tsx"),
  ]),
] satisfies RouteConfig;
