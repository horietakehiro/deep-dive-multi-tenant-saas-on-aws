import MUIAppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { UseAuthenticator } from "@aws-amplify/ui-react-core";
import { type BaseProps } from "./../../../control-plane/src/components/utils";
type SignOut = UseAuthenticator["signOut"];

export interface AppBarProps extends BaseProps {
  signOut: SignOut | undefined;
  signedIn: boolean;
}
export default function AppBar(props: AppBarProps) {
  return (
    <Box sx={{}}>
      <MUIAppBar position="absolute" sx={{ width: "100%" }}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            INTERSECTION
          </Typography>
          <Button color="inherit" onClick={props.signOut}>
            SIGNOUT
          </Button>
        </Toolbar>
      </MUIAppBar>
    </Box>
  );
}
