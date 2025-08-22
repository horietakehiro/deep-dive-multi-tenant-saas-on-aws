import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { PageContainer } from "@toolpad/core";
import { useOutletContext } from "react-router";
// import type { RootContext } from "../models/context";

import { CUSTOM_USER_ATTRIBUTES } from "backend/lib/domain/model/user";
import { type RootContext } from "control-plane/app/lib/domain/model/context";
export default function Home() {
  const { authUser } = useOutletContext<RootContext>();
  return (
    <PageContainer>
      <Box
        sx={{
          textAlign: "center",
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
        }}
      >
        <Typography variant="h2">
          WELCOME {authUser.signInDetails?.loginId}{" "}
          {CUSTOM_USER_ATTRIBUTES.ROLE}
        </Typography>
      </Box>
    </PageContainer>
  );
}
