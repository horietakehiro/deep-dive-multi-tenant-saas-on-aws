import { defineFunction } from "@aws-amplify/backend";

export const captureDataEvents = defineFunction({
  name: "capture-data-events",
  resourceGroupName: "data",
  timeoutSeconds: 60,
});
