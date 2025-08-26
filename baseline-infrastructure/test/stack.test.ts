import { App, Stack } from "aws-cdk-lib";
import { ControlPlane } from "../lib/full-stack-silo-deploy-model";
import { AWS_AMPLIFY_APP } from "@horietakehiro/aws-cdk-utul/lib/types/cfn-resource-types";
import {
  TypedTemplate,
  ExtraMatch,
} from "@horietakehiro/aws-cdk-utul/lib/assertions";

describe("コントロールプレーンコンストラクタ", () => {
  const app = new App();
  const stack = new Stack(app, "Test");
  new ControlPlane(stack, "ControlPlane", {
    branch: "main",
    certArn: "arn:aws:acm:Region:444455556666:certificate/certificate_ID",
  });
  const template = TypedTemplate.fromStack(stack);

  test("セキュア文字列パラメータとしてGitHubアクセストークンをAmplifyアプリケーションに設定している", () => {
    const params = template.findParameters("*", {
      NoEcho: true,
      Type: "String",
    });
    expect(params.length).toBe(1);
    const { id } = params[0];
    template.hasResource(
      AWS_AMPLIFY_APP({
        Properties: {
          AccessToken: ExtraMatch.ref(id),
        },
      })
    );
  });
  test("スナップショットテスト", () => {
    expect(template.template).toMatchSnapshot();
  });
});
