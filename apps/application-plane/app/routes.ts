import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("./layouts/dashboard.tsx", [
    index("./routes/home.tsx"),
    route("appointments/*", "./routes/appointments.tsx"),
  ]),
] satisfies RouteConfig;
