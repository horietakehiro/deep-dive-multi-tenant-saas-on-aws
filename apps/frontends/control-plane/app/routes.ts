import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("./layouts/auth.tsx", [
    layout("./layouts/dashboard.tsx", [
      index("./routes/home.tsx"),
      route("tenant", "routes/tenant.tsx"),
      route("tenant/edit", "routes/tenant-edit.tsx"),
      route("spots/*", "routes/spots.tsx"),
      route("users/*", "routes/users.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
