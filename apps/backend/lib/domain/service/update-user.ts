import type { Tracer } from "@aws-lambda-powertools/tracer";
import type { Config } from "../model/config";
import type { IRepository, IRepositoryFactory } from "../port/repository";
import type { Logger } from "@aws-lambda-powertools/logger";
import { MetricUnit, type Metrics } from "@aws-lambda-powertools/metrics";
import type { Schema } from "../model/data";

export interface UpdateUserFactoryProps {
  repositoryFactory: IRepositoryFactory<"updateUser">;
  config: Config;
  tracer: Tracer;
  logger: Logger;
  metrics: Metrics;
}
type UpdateUser = (
  args: Pick<
    Parameters<Schema["updateUser"]["functionHandler"]>["0"],
    "arguments"
  >
) => ReturnType<Schema["updateUser"]["functionHandler"]>;

export const updateUserFactory: (
  props: UpdateUserFactoryProps
) => UpdateUser = (props) => {
  return async ({ arguments: args }) => {
    props.logger.appendKeys({ tenantId: args.tenantId! });
    props.metrics.addDimension("tenantId", args.tenantId!);
    props.tracer.putAnnotation("tenantId", args.tenantId!);

    props.logger.debug(JSON.stringify(args));
    props.logger.info("ユーザ情報を更新");

    const { updateUser } = await props.repositoryFactory(props.config);
    const res = await updateUser(args);
    props.logger.debug(JSON.stringify(res));

    props.metrics.addMetric("UpdatedUsers", MetricUnit.Count, 1);

    return res;
  };
};
