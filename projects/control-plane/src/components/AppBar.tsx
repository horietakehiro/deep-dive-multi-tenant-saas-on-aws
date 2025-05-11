// import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { UseAuthenticator } from "@aws-amplify/ui-react-core";
type SignOut = UseAuthenticator["signOut"];

export interface MyAppBarProps {
  signOut: SignOut | undefined;
  username: string;
}
export default function MyAppBar(props: MyAppBarProps) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="absolute">
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
            WELCOM {props.username}
          </Typography>
          <Button color="inherit" onClick={props.signOut}>
            SIGNOUT
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
