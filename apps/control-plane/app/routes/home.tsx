import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { PageContainer } from "@toolpad/core";
import { useOutletContext } from "react-router";
import type { OutletContext } from "~/models/context";
export default function Home() {
  if (useOutletContext === undefined) {
    throw Error("hgoeghoe");
  }
  const { authUser } = useOutletContext<OutletContext>();

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
          WELCOME {authUser.signInDetails?.loginId}
        </Typography>
      </Box>
    </PageContainer>
  );
}
