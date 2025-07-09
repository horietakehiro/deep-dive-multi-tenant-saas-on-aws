import { styled } from "@mui/material/styles";
import MUIAppBar, { AppBarProps as MUIAppBarProps } from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { UseAuthenticator } from "@aws-amplify/ui-react-core";
import { BaseProps, State } from "./utils";
import React from "react";
import { fetchUserAttributes } from "aws-amplify/auth";
import {
  Avatar,
  CssBaseline,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import Settings from "@mui/icons-material/Settings";
type SignOut = UseAuthenticator["signOut"];

const drawerWidth = 240;

interface AppBarProps extends MUIAppBarProps {
  open?: boolean;
}

const AppBar = styled(MUIAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(["width", "margin"], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

export interface HeaderProps extends BaseProps {
  signOut: SignOut | undefined;
  signedIn: State["signedIn"];
  leftMenuOpened: State["leftMenuOpened"];
  setLeftMenuOpened: (s: State["leftMenuOpened"]) => void;
  userAttributes: State["userAttributes"];
  setUserAttributes: (s: State["userAttributes"]) => void;
}

export default function Header(props: HeaderProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

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

  const handleLeftMenuOpened = () => {
    props.stateRepository.set("leftMenuOpened", true, props.setLeftMenuOpened);
  };
  return (
    <>
      <CssBaseline />
      <AppBar position="fixed" open={props.leftMenuOpened}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={[
              { marginRight: 5 },
              props.leftMenuOpened && { display: "none" },
            ]}
            onClick={handleLeftMenuOpened}
            role="button"
            aria-hidden={false}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            WELCOM {props.userAttributes?.email ?? ""}
          </Typography>
          {/* <Button color="inherit" onClick={props.signOut}>
            SIGNOUT
          </Button> */}
          <React.Fragment>
            <Tooltip title="Account settings">
              <IconButton
                onClick={handleClick}
                size="small"
                sx={{ ml: 2 }}
                aria-controls={open ? "account-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  <PersonIcon />
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={open}
              onClose={handleClose}
              onClick={handleClose}
              slotProps={{
                paper: {
                  elevation: 0,
                  sx: {
                    overflow: "visible",
                    filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                    mt: 1.5,
                    "& .MuiAvatar-root": {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    "&::before": {
                      content: '""',
                      display: "block",
                      position: "absolute",
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: "background.paper",
                      transform: "translateY(-50%) rotate(45deg)",
                      zIndex: 0,
                    },
                  },
                },
              }}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
              <MenuItem onClick={handleClose}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleClose}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleClose}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Signout
              </MenuItem>
            </Menu>
          </React.Fragment>
        </Toolbar>
      </AppBar>
    </>
  );
}
