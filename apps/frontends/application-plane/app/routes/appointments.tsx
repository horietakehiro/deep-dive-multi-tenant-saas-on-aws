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
  ProcessedEvent,
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

const userIdsCodec: Codec<string[]> = {
  parse: (value) => JSON.parse(value),
  stringify: (value) => JSON.stringify(value),
};

export type Context = Pick<RootContext, "tenant" | "authUser"> & {
  repository: Pick<IRepository, "listAppointments" | "getUser">;
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
  // ローカルストレージに保存する情報
  // ※ユーザーデータ自体を保存するとlazyLoaderメソッドが使用不能になるためID(文字列)のみ保存する
  const [selectedUserIds, setSelectedUserIds] = useLocalStorageState<string[]>(
    "selectedUserIds",
    [],
    { codec: userIdsCodec }
  );
  const [selectedUsers, setSelectedUsers] = useState<
    (User & { userId: string })[]
  >([]);
  const [events, setEvents] = useState<ProcessedEvent[]>([]);

  const dialogs = useDialogs();
  const calendarRef = useRef<SchedulerRef>(null);

  const theme = createTheme({
    colorSchemes: {
      dark: true,
    },
  });

  useEffect(() => {
    const f = async () => {
      const users = await Promise.all(
        (selectedUserIds ?? []).map(async (id) => {
          const res = await repository.getUser({ id });
          return { ...res.data!, userId: res.data!.id };
        })
      );
      setSelectedUsers(users);
    };
    f();
  }, [selectedUserIds]);

  useEffect(() => {
    const f = async () => {
      // TODO: イベントの時刻フィルタリング
      const appointments = await Promise.all(
        (selectedUsers ?? []).map(async (u) => {
          console.log(u);
          return (await u.appointmentMadeBy()).data;
        })
      );
      const events: ProcessedEvent[] = await appointments.flat().map((a) => ({
        event_id: a.id,
        title: a.description,
        start: new Date(a.datetimeFrom),
        end: new Date(a.datetimeTo),
        subtitle: undefined,
        userId: a.userIdMadeBy,
      }));
      console.log(events);
      setEvents(events);

      calendarRef.current?.scheduler.handleState(events, "events");
      calendarRef.current?.scheduler.handleState(selectedUsers, "resources");
    };
    f();
  }, [selectedUsers]);

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
                      selectedUserIds: selectedUserIds ?? [],
                    }
                  );
                  console.log(newSelectedUsers);
                  setSelectedUserIds(newSelectedUsers.map((u) => u.id));
                  setSelectedUsers(
                    newSelectedUsers.map((u) => ({ ...u, userId: u.id }))
                  );
                  calendarRef.current?.scheduler.handleState(
                    selectedUsers,
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
                  idField: "userId",
                  textField: "name",
                  subTextField: "email",
                  avatarField: "name",
                  // colorField: "color",
                } //as { [key in keyof ResourceFields]: keyof User }
              }
              fields={[
                {
                  // サブタイトルの入力項目は表示されないようにする
                  name: "subtitle",
                  type: "hidden",
                  default: undefined,
                },
                {
                  name: "description",
                  type: "input",
                  config: {
                    label: "Description",
                    rows: 4,
                    multiline: true,
                  },
                },
                {
                  name: "makeWith",
                  type: "select",
                  options: [{ id: 1, text: "hoge", value: "fuga" }],
                  config: {
                    label: "Make with",
                  },
                },
                {
                  name: "makeBy",
                  type: "hidden",
                  default: "ffffffffffffffffffffffffff",
                },
                {
                  name: "status",
                  type: "hidden",
                  default: "",
                },
              ]}
              onCellClick={(...args) => console.log(args)}
              onConfirm={async (...args) => {
                console.log(args);
                return {
                  ...args[0],
                  userId: "47948a28-9001-704e-30a6-fcd81e564041",
                };
              }}
              // getRemoteEvents={async () => {
              //   // const appointments = await Promise.all(
              //   //   (selectedUsers ?? []).map(async (u) => {
              //   //     console.log(u);
              //   //     return (await u.appointmentMadeBy()).data;
              //   //   })
              //   // );
              //   // return appointments.flat().map((a) => ({
              //   //   event_id: a.id,
              //   //   title: a.description,
              //   //   start: new Date(a.datetimeFrom),
              //   //   end: new Date(a.datetimeTo),
              //   // }));
              // }}
              events={events}
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
