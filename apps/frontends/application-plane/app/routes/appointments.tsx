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
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { PageContainer, useLocalStorageState, type Codec } from "@toolpad/core";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  DialogsProvider,
  useDialogs,
  type DialogProps,
} from "@toolpad/core/useDialogs";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { DataGrid, type GridRowSelectionModel } from "@mui/x-data-grid";
import type { Tenant, User } from "@intersection/backend/lib/domain/model/data";
import { useOutletContext } from "react-router";
import type { RootContext } from "../lib/domain/model/context";

import type {
  ResourceFields,
  SchedulerRef,
} from "@aldabil/react-scheduler/types";
import { Scheduler } from "@aldabil/react-scheduler";
import type { Route } from "./+types/appointments";
import type { IRepository } from "@intersection/backend/lib/domain/port/repository";
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({ type: "include", ids: new Set() });

  useEffect(() => {
    const f = async () => {
      // 全ユーザをDBから取得
      const res = await tenant.users();
      if (res.data === null || res.errors !== undefined) {
        throw Error("list users failed");
      }

      // 選択済みのユーザはチェック状態にする
      const selectedUsers = res.data.filter((u) =>
        selectedUserIds.includes(u.id)
      );
      setRowSelectionModel({
        type: "include",
        ids: new Set(selectedUsers.map((u) => u.id)),
      });
      // 初期状態では全ユーザを表示する
      setAllUsers([...res.data]);
      setLoading(false);
    };
    f();
  }, []);
  return (
    <Dialog
      fullWidth
      open={open}
      onClose={() =>
        onClose(allUsers.filter((u) => selectedUserIds.includes(u.id)))
      }
    >
      <DialogTitle>Select Users (up to 5)</DialogTitle>
      <DialogContent>
        <Stack direction={"column"}>
          <FormGroup>
            <FormControlLabel
              sx={{ justifyContent: "flex-end" }}
              control={<Switch checked={selectedOnly} />}
              label="show selected users only"
              value={selectedOnly}
              onChange={(event) =>
                setSelectedOnly(
                  (event as ChangeEvent<HTMLInputElement>).target.checked
                )
              }
            />
          </FormGroup>
          <Box height={500} width={"100%"}>
            <DataGrid<User>
              loading={loading}
              rows={allUsers.filter((U) => {
                // 選択状態のユーザのみ表示する
                if (selectedOnly) {
                  return rowSelectionModel.ids.has(U.id);
                }
                return true;
              })}
              columns={[{ field: "email" }, { field: "name" }]}
              checkboxSelection
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={(newRowSelectionModel) => {
                setRowSelectionModel(newRowSelectionModel);
              }}
              keepNonExistentRowsSelected
              showToolbar
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          // to={""}
          onClick={() =>
            onClose(allUsers.filter((u) => rowSelectionModel.ids.has(u.id)))
          }
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const usersCodec: Codec<User[]> = {
  parse: (value) => JSON.parse(value),
  stringify: (value) => JSON.stringify(value),
};

export type Context = Pick<RootContext, "tenant" | "authUser"> & {
  repository: Pick<IRepository, "listAppointments">;
};
export const clientLoader = () => {
  return {
    useOutletContext: () => useOutletContext<Context>(),
  };
};
export default function Appointments({
  loaderData,
}: Pick<Route.ComponentProps, "loaderData">) {
  const { tenant, repository, authUser } = loaderData.useOutletContext();
  const [mode, setMode] = useLocalStorageState<"default" | "tabs">(
    "mode",
    "default"
  );
  const [selectedUsers, setSelectedUsers] = useLocalStorageState<User[]>(
    "selectedUsers",
    [],
    {
      codec: usersCodec,
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
                  const newSelectedUsers = await dialogs.open(
                    SelectUsersDiablog,
                    {
                      tenant: tenant!,
                      selectedUserIds: selectedUsers
                        ? selectedUsers.map((u) => u.id)
                        : [],
                    }
                  );
                  setSelectedUsers(newSelectedUsers);
                  calendarRef.current?.scheduler.handleState(
                    newSelectedUsers,
                    "resources"
                  );
                }}
              >
                SELECT USERS
              </Button>
            </Stack>
            <Scheduler
              ref={calendarRef}
              resources={selectedUsers!}
              resourceFields={
                {
                  idField: "id",
                  textField: "name",
                  subTextField: "email",
                  avatarField: "name",
                  // colorField: "color",
                } as { [key in keyof ResourceFields]: keyof User }
              }
              getRemoteEvents={async () => {
                const appointments = await Promise.all(
                  (selectedUsers ?? []).map(async (u) => {
                    return (await u.appointmentMadeBy()).data;
                  })
                );
                return appointments.flat().map((a) => ({
                  event_id: a.id,
                  title: a.description,
                  start: new Date(2025, 9, 17),
                  end: new Date(2025, 9, 17),
                }));
              }}
              // viewerExtraComponent={(fields, event) => {
              //   return (
              //     <div>
              //       {fields.map((field, i) => {
              //         if (field.name === "admin_id") {
              //           const admin = field.options?.find(
              //             (fe) => fe.id === event["admin_id"]
              //           );
              //           return (
              //             <Typography
              //               key={i}
              //               style={{ display: "flex", alignItems: "center" }}
              //               color="textSecondary"
              //               variant="caption"
              //               noWrap
              //             >
              //               <PersonRoundedIcon /> {admin?.text}
              //             </Typography>
              //           );
              //         } else {
              //           return "";
              //         }
              //       })}
              //     </div>
              //   );
              // }}
            />
          </Stack>
        </PageContainer>
      </DialogsProvider>
    </ThemeProvider>
  );
}
