// import * as React from "react";
import MUIAppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { UseAuthenticator } from "@aws-amplify/ui-react-core";
import { BaseProps, State } from "./utils";
import React from "react";
import { fetchUserAttributes } from "aws-amplify/auth";
type SignOut = UseAuthenticator["signOut"];

export interface AppBarProps extends BaseProps {
  signOut: SignOut | undefined;
  signedIn: boolean;
  userAttributes: State["userAttributes"];
  setUserAttributes: (u: State["userAttributes"]) => void;
}
export default function AppBar(props: AppBarProps) {
  React.useEffect(() => {
    const getUserAttributes = async () => {
      const res = await fetchUserAttributes();
      console.log(res);
      props.stateRepository.set(
        "userAttributes",
        res as State["userAttributes"],
        props.setUserAttributes
      );
    };
    if (props.signedIn) {
      getUserAttributes();
    }
  }, [props.signedIn]);
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
            WELCOM {props.userAttributes?.email ?? ""}
          </Typography>
          <Button color="inherit" onClick={props.signOut}>
            SIGNOUT
          </Button>
        </Toolbar>
      </MUIAppBar>
    </Box>
  );
}
