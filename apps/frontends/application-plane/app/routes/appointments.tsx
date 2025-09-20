import {
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { PageContainer, useLocalStorageState, type Codec } from "@toolpad/core";
import { useEffect, useRef, useState } from "react";
import { DialogsProvider, useDialogs } from "@toolpad/core/useDialogs";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import type {
  Appointment,
  Spot,
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
import { SelectUsersDiablog } from "./appointments/select-users-dialog";
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
  const [fields, setFields] = useState<FieldProps[]>([]);

  const dialogs = useDialogs();
  const calendarRef = useRef<SchedulerRef>(null);

  const theme = createTheme({
    colorSchemes: {
      dark: true,
    },
  });

  useEffect(() => {
    calendarRef.current?.scheduler.handleState(mode, "resourceViewMode");
  }, []);
  useEffect(() => {
    if (tenant === undefined) {
      return;
    }
    const f = async () => {
      const res = await tenant.spots();
      setSpots(res.data);
    };
    f();
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
          return (await u.appointmentMadeBy()).data;
        })
      );
      const events: Event[] = await appointments.flat().map((a) => {
        let color: "#ff0000" | "#00d9ff" | "#008053";
        switch (a.status) {
          case "approved":
            color = "#008053";
            break;
          case "requested":
            color = "#00d9ff";
            break;
          case "rejected":
            color = "#ff0000";
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
        options: selectedUsers
          .filter((u) =>
            madeWith !== madeBy && madeWith !== undefined
              ? u.id === madeWith
              : u.id !== madeBy
          )
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
        // default:
        //   madeWith !== madeBy && madeWith !== undefined ? madeWith : undefined,
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
    setFields(fields.map((f) => ({ ...f })));
  }, [madeWith, spots, selectedUsers]);

  useEffect(() => {
    calendarRef.current?.scheduler.handleState(
      fields.map((f) => ({ ...f })),
      "fields"
    );
  }, [fields]);

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
                } as { [key in keyof ResourceFields]: keyof SelectedUser }
              }
              fields={fields}
              onCellClick={(...args) => {
                if (args[3] !== undefined) {
                  setMadeWith(args[3] as string);
                }
              }}
              onConfirm={async (...args) => {
                if (args[1] === "create") {
                  const event = args[0];
                  const res = await repository.createAppoinment({
                    userIdMadeBy: event["madeBy"],
                    userIdMadeWith: event["madeWith"],
                    datetimeFrom: event.start.toISOString(),
                    datetimeTo: event.end.toISOString(),
                    status: event["status"],
                    description: event["title"]?.toString()!,
                    spotId: event["spot"],
                  });
                  console.log(res);
                }
                return {
                  ...args[0],
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
