import * as fs from "fs";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_amplify as amplify,
  aws_iam as iam,
  aws_certificatemanager as acm,
  aws_route53 as route53,
} from "aws-cdk-lib";
import * as path from "node:path";
export interface PlaneProps {
  certArn: string;
  appName: "control-plane" | "intersection";
}
class Plane extends Construct {
  constructor(scope: Construct, id: string, props: PlaneProps) {
    super(scope, id);
    const accessToken = new cdk.CfnParameter(this, "AccessToken", {
      noEcho: true,
      type: "String",
    });
    const serviceRole = new iam.Role(this, "ServiceRole", {
      assumedBy: new iam.ServicePrincipal("amplify.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmplifyBackendDeployFullAccess"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("ReadOnlyAccess"),
      ],
      inlinePolicies: {
        root: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:CreateLogGroup",
                "logs:DescribeLogGroups",
              ],
              resources: ["*"],
            }),
          ],
        }),
      },
    });
    const app = new amplify.CfnApp(this, "App", {
      name: props.appName,
      accessToken: cdk.Fn.ref(accessToken.logicalId),
      autoBranchCreationConfig: {
        enableAutoBranchCreation: false,
      },
      basicAuthConfig: {
        enableBasicAuth: false,
      },
      buildSpec: fs
        .readFileSync(path.join(__dirname, "..", "amplify.yml"))
        .toString("utf-8"),
      cacheConfig: {
        type: "AMPLIFY_MANAGED_NO_COOKIES",
      },
      computeRoleArn: undefined,
      customHeaders: undefined,
      customRules: [
        {
          source: "/<*>",
          target: "/index.html",
          status: "404-200",
        },
      ],
      description: "control plane",
      enableBranchAutoDeletion: false,
      environmentVariables: [
        {
          name: "AMPLIFY_DIFF_DEPLOY",
          value: "false",
        },
        {
          name: "AMPLIFY_MONOREPO_APP_ROOT",
          value: `projects/${props.appName}`,
        },
      ],
      iamServiceRole: serviceRole.roleArn,
      oauthToken: undefined,
      platform: "WEB",
      repository:
        "https://github.com/horietakehiro/deep-dive-multi-tenant-saas-on-aws",
    });

    new amplify.CfnBranch(this, "MainBranch", {
      appId: app.attrAppId,
      branchName: "main",
      stage: "PRODUCTION",
      enableAutoBuild: true,
      framework: "web",
      // backend
    });
    new amplify.CfnDomain(this, "Domain", {
      appId: app.attrAppId,
      domainName: "ht-burdock.com",
      subDomainSettings: [
        {
          branchName: "main",
          prefix: props.appName,
        },
      ],
      autoSubDomainCreationPatterns: [],
      certificateSettings: {
        certificateType: "CUSTOM",
        customCertificateArn: props.certArn,
      },
    });
  }
}

export interface MixDeployModelStackProps extends cdk.StackProps {
  cert: acm.ICertificate;
}
export class MixDeployModelStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MixDeployModelStackProps) {
    super(scope, id, props);

    new Plane(this, "ControlPlane", {
      certArn: props.cert.certificateArn,
      appName: "control-plane",
    });
    new Plane(this, "ApplicationPlane", {
      certArn: props.cert.certificateArn,
      appName: "intersection",
    });
  }
}

export interface CustomCertStackProps extends cdk.StackProps {
  domaineName: string;
  hostedZoneId: string;
}
export class CustomCertStack extends cdk.Stack {
  public readonly certificate: acm.ICertificate;
  constructor(scope: Construct, id: string, props: CustomCertStackProps) {
    super(scope, id, props);
    this.certificate = new acm.Certificate(this, "Certificate", {
      domainName: props.domaineName,
      validation: acm.CertificateValidation.fromDns(
        route53.PublicHostedZone.fromHostedZoneId(
          this,
          "HostedZone",
          props.hostedZoneId
        )
      ),
    });
  }
}
