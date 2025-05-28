import { styled, useTheme, Theme, CSSObject } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MUIListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MailIcon from "@mui/icons-material/Mail";
import GroupIcon from "@mui/icons-material/Group";
import PaymentIcon from "@mui/icons-material/Payment";

import { BaseProps, State } from "./utils";
import { CssBaseline } from "@mui/material";
import { ReactNode } from "react";

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        "& .MuiDrawer-paper": openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
      },
    },
  ],
}));

interface ListItemProps {
  text: string;
  icon: ReactNode;
  opened: boolean;
}
const ListItem = (props: ListItemProps) => {
  return (
    <MUIListItem key={props.text} disablePadding sx={{ display: "block" }}>
      <ListItemButton
        sx={[
          {
            minHeight: 48,
            px: 2.5,
          },
          props.opened
            ? {
                justifyContent: "initial",
              }
            : {
                justifyContent: "center",
              },
        ]}
      >
        <ListItemIcon
          sx={[
            {
              minWidth: 0,
              justifyContent: "center",
            },
            props.opened
              ? {
                  mr: 3,
                }
              : {
                  mr: "auto",
                },
          ]}
          children={props.icon}
        ></ListItemIcon>
        <ListItemText
          primary={props.text}
          sx={[
            props.opened
              ? {
                  opacity: 1,
                }
              : {
                  opacity: 0,
                },
          ]}
        />
      </ListItemButton>
    </MUIListItem>
  );
};
export interface LeftMenuProps extends BaseProps {
  leftMenuOpened: State["leftMenuOpened"];
  setLeftMenuOpened: (s: State["leftMenuOpened"]) => void;
}
export default function LeftMenu(props: LeftMenuProps) {
  const theme = useTheme();
  const handleClosed = () => {
    props.stateRepository.set("leftMenuOpened", false, props.setLeftMenuOpened);
  };
  return (
    <>
      <CssBaseline />
      <Drawer variant="permanent" open={props.leftMenuOpened}>
        <DrawerHeader>
          <IconButton onClick={handleClosed}>
            {theme.direction === "rtl" ? (
              <ChevronRightIcon />
            ) : (
              <ChevronLeftIcon />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          <ListItem
            icon={<MailIcon />}
            opened={props.leftMenuOpened}
            text="Notifications"
          />
          <ListItem
            icon={<GroupIcon />}
            opened={props.leftMenuOpened}
            text="Users"
          />
          <ListItem
            icon={<PaymentIcon />}
            opened={props.leftMenuOpened}
            text="Billing"
          />
        </List>
      </Drawer>
    </>
  );
}
