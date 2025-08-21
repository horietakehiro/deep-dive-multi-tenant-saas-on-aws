import { generateClient } from "aws-amplify/data";
import { type Config, config } from "./config";
import type { AmplifyClient } from "../../../control-plane/app/models/data";
import type { Schema } from "../../../control-plane/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "../../amplify_outputs.json";
Amplify.configure(outputs);

const amplifyClient = generateClient<Schema>();
const getTenantFactory = (config: Config): AmplifyClient["getTenant"] => {
  if (config.noAmplify) {
    return (props) => {
      return Promise.resolve({
        data: {
          id: props.id,
          name: "dummy-tenant",
          status: "active",
          url: "",
          createdAt: "",
          updatedAt: "",
          users: () => {
            throw Error("NotImplemented");
          },
          appointments: () => {
            throw Error("NotImplemented");
          },
          spots: () => {
            throw Error("NotImplemented");
          },
        },
      });
    };
  }
  return amplifyClient.models.Tenant.get;
};
export const client: Pick<AmplifyClient, "getTenant"> = {
  getTenant: getTenantFactory(config),
};
