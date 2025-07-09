import { type ResourcesConfig } from "aws-amplify";
import { list, uploadData } from "aws-amplify/storage";
import { BaseProps, State } from "../../../control-plane/src/components/utils";
import React from "react";
import {
  Button,
  Container,
  CssBaseline,
  Paper,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
export interface FilesProps extends BaseProps {
  tenant: State["tenant"];
  resourcesConfig: ResourcesConfig;
}

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

type BucketInfo = Required<
  Required<Required<ResourcesConfig>["Storage"]>["S3"]
>["buckets"][string];

export const Files = (props: FilesProps) => {
  const [tenantBucket, setTenantBucket] = React.useState<BucketInfo | null>(
    null
  );
  const [files, setFiles] = React.useState<string[]>([]);

  React.useEffect(() => {
    console.log(props);
    const tenant = props.tenant;
    if (tenant === null) {
      return;
    }
    console.log(
      `テナントID[${tenant.id}]に合致するバケット名をamplify_outputsから取得する`
    );
    const buckets = Object.entries(
      props.resourcesConfig.Storage!.S3.buckets ?? {}
    );
    console.log(buckets);
    const tenantBuckets = buckets.filter(([name]) => name.includes(tenant.id));
    if (tenantBuckets.length === 0) {
      console.error(`テナント[${tenant.id}]に該当するストレージが存在しない`);
      return;
    }
    setTenantBucket(tenantBuckets[0][1]);
    const listFiles = async () => {
      const files = await list({
        path: "data/",
        options: {
          bucket: tenantBuckets[0][1],
        },
      });
      setFiles(files.items.map((item) => item.path));
    };
    listFiles();
  }, [props.tenant]);

  const handleUploadFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    console.log(event);
    if (tenantBucket === null) {
      console.log("テナントバケットが設定されていない");
      return;
    }
    const uploadFiles = event.target.files;
    if (uploadFiles === null || uploadFiles.length === 0) {
      console.log("アップロード対象のファイルが設定されていない");
      return;
    }
    await uploadData({
      path: `data/${uploadFiles[0].name}`,
      data: uploadFiles[0],
      options: {
        bucket: tenantBucket,
      },
    });
    setFiles([...files, uploadFiles[0].name]);
  };

  return (
    <React.Fragment>
      <CssBaseline />
      <Container>
        <Button
          component="label"
          role={undefined}
          variant="contained"
          tabIndex={-1}
        >
          Upload files
          <VisuallyHiddenInput
            type="file"
            // onChange={(event) => console.log(event.target.files)}
            onChange={handleUploadFile}
            multiple
          />
        </Button>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>
                  Tenant[{props.tenant!.name}] / Bucket[
                  {tenantBucket?.bucketName ?? ""}]
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file) => (
                <TableRow
                  key={file}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {file}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </React.Fragment>
  );
};
