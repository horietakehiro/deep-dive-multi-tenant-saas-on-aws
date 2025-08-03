import type { Route } from "./+types/home";
import Box from "@mui/material/Box";

export default function Welcome() {
  return (
    <Box sx={{ textAlign: "center", justifyContent: "center" }}>Welcome</Box>
  );
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

// export default function Home() {
//   return <Welcome />;
// }
