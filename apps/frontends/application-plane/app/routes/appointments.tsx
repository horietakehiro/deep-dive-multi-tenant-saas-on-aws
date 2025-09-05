import { Scheduler } from "@aldabil/react-scheduler";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { PageContainer } from "@toolpad/core";

export default function Appointments() {
  const theme = createTheme({
    colorSchemes: {
      dark: true,
    },
  });
  return (
    // このコンポーネントはtoolpadのコンポーネントでは無いため明示的にカラーモードを設定する
    <ThemeProvider theme={theme}>
      <PageContainer>
        <Scheduler
          view="month"
          fields={[
            {
              name: "hoge",
              type: "select",
              config: {
                label: "hogege",
              },
              options: [
                {
                  id: "1",
                  text: "hogefuga",
                  value: "g",
                },
              ],
            },
          ]}
          events={[
            {
              event_id: 1,
              title: "Event 1",
              start: new Date("2025/9/2 09:30"),
              end: new Date("2025/9/2 10:30"),
            },
            {
              event_id: 2,
              title: "Event 2",
              start: new Date("2025/9/2 10:00"),
              end: new Date("2025/9/2 11:00"),
            },
          ]}
        />
      </PageContainer>
    </ThemeProvider>
  );
}
