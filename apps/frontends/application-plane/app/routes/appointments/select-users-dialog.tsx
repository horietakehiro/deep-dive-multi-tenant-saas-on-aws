import type { Tenant, User } from "@intersection/backend/lib/domain/model/data";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Stack,
  Switch,
} from "@mui/material";
import { DataGrid, type GridRowSelectionModel } from "@mui/x-data-grid";
import type { DialogProps } from "@toolpad/core";
import { useEffect, useState, type ChangeEvent } from "react";

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
