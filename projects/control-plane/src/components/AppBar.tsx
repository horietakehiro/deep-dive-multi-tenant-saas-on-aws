// import * as React from "react";
import MUIAppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { UseAuthenticator } from "@aws-amplify/ui-react-core";
import { BaseProps, StateKey } from "./utils";
import React from "react";
import { fetchUserAttributes } from "aws-amplify/auth";
type SignOut = UseAuthenticator["signOut"];

export interface AppBarProps extends BaseProps {
  signOut: SignOut | undefined;
}
export default function AppBar(props: AppBarProps) {
  const [userAttributes, setUserAttributes] = React.useState<
    StateKey["userAttributes"]
  >(props.stateRepository.get("userAttributes", null));
  const signedIn = props.stateRepository.get("signedIn", false);

  React.useEffect(() => {
    const getUserAttributes = async () => {
      const res = await fetchUserAttributes();
      console.log(res);
      props.stateRepository.set(
        "userAttributes",
        res as StateKey["userAttributes"],
        setUserAttributes
      );
    };
    if (signedIn) {
      getUserAttributes();
    }
  }, [signedIn]);
  return (
    <Box sx={{ flexGrow: 1 }}>
      <MUIAppBar position="absolute">
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
            WELCOM {userAttributes?.email ?? ""}
          </Typography>
          <Button color="inherit" onClick={props.signOut}>
            SIGNOUT
          </Button>
        </Toolbar>
      </MUIAppBar>
    </Box>
  );
}
