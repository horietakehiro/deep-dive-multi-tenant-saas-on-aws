import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { PageContainer, useLocalStorageState, type Codec } from "@toolpad/core";
import { useEffect, useRef, useState } from "react";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import {
  DialogsProvider,
  useDialogs,
  type DialogProps,
} from "@toolpad/core/useDialogs";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { DataGrid } from "@mui/x-data-grid";
import type { Tenant, User } from "@intersection/backend/lib/domain/model/data";
import { useOutletContext } from "react-router";
import type { RootContext } from "../lib/domain/model/context";

import type { SchedulerRef } from "@aldabil/react-scheduler/types";
import { Scheduler } from "@aldabil/react-scheduler";
type SelectUsersProps = {
  tenant: Tenant;
  selectedUserIds: string[];
};
export const SelectUsersDiablog = ({
  open,
  onClose,
  payload,
}: DialogProps<SelectUsersProps, User[]>) => {
  const { tenant, selectedUserIds } = payload;
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<(User & { selected: boolean })[]>([]);
  useEffect(() => {
    const f = async () => {
      const res = await tenant.users();
      console.log(res);
      if (res.data === null || res.errors !== undefined) {
        throw Error("list users failed");
      }
      setUsers(
        res.data.map((u) => ({
          ...u,
          selected: selectedUserIds.includes(u.id),
        }))
      );
      setLoading(false);
    };

    f();
  }, []);
  return (
    <Dialog
      fullWidth
      open={open}
      onClose={() =>
        onClose(users.filter((u) => selectedUserIds.includes(u.id)))
      }
    >
      <DialogTitle>Select Users (up to 5)</DialogTitle>
      <DialogContent>
        <Stack direction={"column"}>
          <FormGroup>
            <FormControlLabel
              sx={{ justifyContent: "flex-end" }}
              control={<Switch defaultChecked={false} />}
              label="show selected users only"
              value={false}
            />
          </FormGroup>
          <Box height={500} width={"100%"}>
            <DataGrid<User>
              loading={loading}
              rows={users}
              columns={[{ field: "email" }, { field: "name" }]}
              checkboxSelection
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() =>
            onClose(users.filter((u) => selectedUserIds.includes(u.id)))
          }
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const users_codec: Codec<User[]> = {
  parse: (value) => JSON.parse(value),
  stringify: (value) => JSON.stringify(value),
};

export type Context = Pick<RootContext, "tenant">;
/**
 * TODO:
 *  - メンバを動的に追加出来るようにする
 *  - ビューモードの切替とメンバの追加状況を永続化
 * @returns
 */
export default function Appointments() {
  const { tenant } = useOutletContext<Context>();
  const [mode, setMode] = useLocalStorageState<"default" | "tabs">(
    "mode",
    "default"
  );
  const [selectedUsers, setSelectedUsers] = useLocalStorageState<User[]>(
    "resources",
    [],
    {
      codec: users_codec,
    }
  );

  const dialogs = useDialogs();
  const calendarRef = useRef<SchedulerRef>(null);

  const theme = createTheme({
    colorSchemes: {
      dark: true,
    },
  });
  return (
    // このコンポーネントはtoolpadのコンポーネントでは無いため明示的にカラーモードを設定する
    <ThemeProvider theme={theme}>
      <DialogsProvider>
        <PageContainer>
          <Stack direction={"column"}>
            <Stack
              direction={"row"}
              spacing={2}
              // padding={2}
              useFlexGap
              justifyContent={"flex-end"}
              alignItems={"center"}
              divider={<Divider orientation="vertical" />}
            >
              <FormControl>
                <FormLabel id="resource-view-mode-selection-form-group">
                  View Mode
                </FormLabel>
                <RadioGroup
                  row
                  aria-labelledby="resource-view-mode-selection-form-group"
                  name="resource-view-mode-selection-form-group"
                  value={mode}
                  onChange={(event) => {
                    const value = event.target.value as "tabs" | "default";
                    setMode(value);
                    calendarRef.current?.scheduler.handleState(
                      value,
                      "resourceViewMode"
                    );
                  }}
                >
                  <FormControlLabel
                    value="default"
                    control={<Radio size="small" />}
                    label="default"
                  />
                  <FormControlLabel
                    value="tabs"
                    control={<Radio size="small" />}
                    label="tabs"
                  />
                </RadioGroup>
              </FormControl>
              <Button
                size="small"
                variant={"contained"}
                startIcon={<GroupAddIcon />}
                sx={{
                  height: "75%",
                }}
                onClick={async () => {
                  const selectedUsers = await dialogs.open(SelectUsersDiablog, {
                    tenant: tenant!,
                    selectedUserIds: [],
                  });
                  setSelectedUsers(selectedUsers);
                  calendarRef.current?.scheduler.handleState(
                    selectedUsers,
                    "resources"
                  );
                  console.log(selectedUsers);
                }}
              >
                SELECT USERS
              </Button>
              {/* </div> */}
            </Stack>
            <Scheduler
              ref={calendarRef}
              resources={selectedUsers!}
              // resources={RESOURCES}
              // resources={[{}]}
              hourFormat="24"
              day={{
                startHour: 0,
                endHour: 23,
                step: 30,
              }}
              // week={}
              resourceFields={{
                idField: "admin_id",
                textField: "title",
                subTextField: "mobile",
                avatarField: "title",
                colorField: "color",
              }}
              viewerExtraComponent={(fields, event) => {
                return (
                  <div>
                    {fields.map((field, i) => {
                      if (field.name === "admin_id") {
                        const admin = field.options?.find(
                          (fe) => fe.id === event["admin_id"]
                        );
                        return (
                          <Typography
                            key={i}
                            style={{ display: "flex", alignItems: "center" }}
                            color="textSecondary"
                            variant="caption"
                            noWrap
                          >
                            <PersonRoundedIcon /> {admin?.text}
                          </Typography>
                        );
                      } else {
                        return "";
                      }
                    })}
                  </div>
                );
              }}
            />
          </Stack>
        </PageContainer>
      </DialogsProvider>
    </ThemeProvider>
  );
}
