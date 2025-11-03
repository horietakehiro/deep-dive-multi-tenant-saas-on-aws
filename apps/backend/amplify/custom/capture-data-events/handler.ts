import type { DynamoDBStreamHandler } from "aws-lambda";

export const handler: DynamoDBStreamHandler = async (event) => {
  event.Records.forEach((r) => {
    console.log(r);
    r.dynamodb?.ApproximateCreationDateTime;
  });
};
