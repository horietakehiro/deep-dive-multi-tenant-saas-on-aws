import type { PreAuthenticationTriggerHandler } from "aws-lambda";

export const handler: PreAuthenticationTriggerHandler = async (
  event,
  context
) => {
  event.request.clientMetadata;
  console.log(event);
  console.log(context);
};
