import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { PageContainer } from "@toolpad/core";
export default function Home() {
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
        <Typography variant="h2">WELCOME </Typography>
      </Box>
    </PageContainer>
  );
}
