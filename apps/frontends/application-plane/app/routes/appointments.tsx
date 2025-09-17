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
import type {
  Appointment,
  Spot,
  Tenant,
  User,
} from "@intersection/backend/lib/domain/model/data";
import { useOutletContext } from "react-router";
import type { RootContext } from "../lib/domain/model/context";

import type {
  FieldProps,
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
  repository: Pick<
    IRepository,
    "listAppointments" | "getUser" | "createAppoinment" | "listSpots"
  >;
};
export const clientLoader = () => {
  return {
    useOutletContext: () => useOutletContext<Context>(),
  };
};

type Event = ProcessedEvent & {
  spot: string;
  madeBy: string;
  madeWith: string;
  status: Appointment["status"];
};
/**
 * react-schduler内でユーザIDと予約IDとのマッピングを管理出来るようにユーザID列を別名で設ける
 */
type SelectedUser = User & {
  madeBy: string;
};
export default function Appointments({
  loaderData,
}: Pick<Route.ComponentProps, "loaderData">) {
  const { tenant, repository, authUser } = loaderData.useOutletContext();

  // ローカルストレージに保存するステート情報
  const [mode, setMode] = useLocalStorageState<"default" | "tabs">(
    "mode",
    "default"
  );
  // ユーザー情報そのものをシリアライズして保存すると、デシリアライズ時にlazyLoaderメソッドが使用不能になるためID(文字列)のリストのみ保存する
  const [selectedUserIds, setSelectedUserIds] = useLocalStorageState<string[]>(
    "selectedUserIds",
    [],
    { codec: userIdsCodec }
  );

  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);

  // 予約の作成者≒ログインしている自分自身のユーザID
  const madeBy = authUser!.userId;
  const [madeWith, setMadeWith] = useState<string | undefined>(undefined);

  const dialogs = useDialogs();
  const calendarRef = useRef<SchedulerRef>(null);

  const theme = createTheme({
    colorSchemes: {
      dark: true,
    },
  });

  useEffect(() => {
    if (tenant === undefined) {
      return;
    }
    const f = async () => {
      const res = await tenant.spots();
      console.log(res);
      setSpots(res.data);
    };
    f();
    calendarRef.current?.scheduler.handleState(mode, "resourceViewMode");
  }, [tenant]);

  useEffect(() => {
    const f = async () => {
      const users: SelectedUser[] = await Promise.all(
        (selectedUserIds ?? []).map(async (id) => {
          const res = await repository.getUser({ id });
          return { ...res.data!, madeBy: res.data!.id };
        })
      );
      setSelectedUsers(users);
      calendarRef.current?.scheduler.handleState(selectedUsers, "resources");
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
      const events: Event[] = await appointments.flat().map((a) => {
        let color: "red" | "blue" | "green";
        switch (a.status) {
          case "approved":
            color = "green";
            break;
          case "requested":
            color = "blue";
            break;
          case "rejected":
            color = "red";
        }
        return {
          event_id: a.id,
          title: a.description,
          start: new Date(a.datetimeFrom),
          end: new Date(a.datetimeTo),
          madeBy: a.userIdMadeBy,
          madeWith: a.userIdMadeWith,
          status: a.status,
          spot: a.spotId!,
          color,
        };
      });
      console.log(events);
      setEvents(events);

      calendarRef.current?.scheduler.handleState(events, "events");
      calendarRef.current?.scheduler.handleState(selectedUsers, "resources");
    };
    f();
  }, [selectedUsers]);

  useEffect(() => {
    // APIで取得したデータをオプションとして利用出来るようフォームフィールドを更新する
    const fields = [
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
        name: "madeWith",
        type: "select",
        // 自分以外のユーザのみ選択可能にする
        options:
          madeWith !== madeBy
            ? selectedUsers
                .filter((u) => u.id === madeWith)
                .map((u) => ({
                  id: u.id,
                  text: `${u.name} (${u.email})`,
                  value: u.id,
                }))
            : selectedUsers
                .filter((u) => u.id !== madeBy)
                .map((u) => ({
                  id: u.id,
                  text: `${u.name} (${u.email})`,
                  value: u.id,
                })),
        config: {
          label: "Select the user make this appointment with.",
          // disabled: ,
        },
        // TODO: デフォルト値の設定がうまく行かない
        // default: ,
      },
      {
        name: "spot",
        type: "select",
        options: spots.map((s) => ({
          id: s.id,
          text: s.name,
          value: s.id,
        })),
        config: {
          label: "Spot",
        },
      },
      {
        name: "madeBy",
        type: "hidden",
        default: madeBy,
      },
      {
        name: "status",
        type: "hidden",
        default: "requested" satisfies Event["status"],
      },
    ] satisfies FieldProps[];

    calendarRef.current?.scheduler.handleState(fields, "fields");
  }, [madeWith, spots, selectedUsers]);

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
                  idField: "madeBy",
                  textField: "name",
                  subTextField: "email",
                  avatarField: "name",
                  // colorField: "color",
                } as { [key in keyof ResourceFields]: keyof SelectedUser }
              }
              onCellClick={(...args) => {
                setMadeWith(String(args[3]) as string);
              }}
              onConfirm={async (...args) => {
                console.log(args);
                repository;
                return {
                  ...args[0],
                  userId: "47948a28-9001-704e-30a6-fcd81e564041",
                };
              }}
              events={events}
            />
          </Stack>
        </PageContainer>
      </DialogsProvider>
    </ThemeProvider>
  );
}
