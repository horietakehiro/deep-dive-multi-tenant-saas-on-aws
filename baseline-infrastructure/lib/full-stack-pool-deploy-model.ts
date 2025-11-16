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
export interface BackendProps {
  certArn: string;
  branch: string;
  accessToken: string;
  appRoot: string;
}
export class Backend extends Construct {
  public readonly appId: string;
  constructor(scope: Construct, id: string, props: BackendProps) {
    super(scope, id);
    const serviceRole = new iam.Role(this, "ServiceRole", {
      assumedBy: new iam.ServicePrincipal("amplify.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmplifyBackendDeployFullAccess"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("ReadOnlyAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSCodeArtifactAdminAccess"
        ),
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
      name: "full-stack-pool-deploy-model-backend",
      accessToken: props.accessToken,
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
      customRules: [
        {
          source: "/<*>",
          target: "/index.html",
          status: "404-200",
        },
      ],
      enableBranchAutoDeletion: false,
      environmentVariables: [
        {
          name: "AMPLIFY_DIFF_DEPLOY",
          value: "false",
        },
        {
          name: "AMPLIFY_MONOREPO_APP_ROOT",
          value: props.appRoot,
        },
      ],
      iamServiceRole: serviceRole.roleArn,
      repository:
        "https://github.com/horietakehiro/deep-dive-multi-tenant-saas-on-aws",
    });

    new amplify.CfnBranch(this, "Branch", {
      appId: app.attrAppId,
      branchName: props.branch,
      stage: "PRODUCTION",
      enableAutoBuild: true,
      framework: "web",
    });

    this.appId = app.attrAppId;
  }
}

interface ControlPlaneProps extends BackendProps {
  backendAppId: string;
}
export class ControlPlane extends Construct {
  constructor(scope: Construct, id: string, props: ControlPlaneProps) {
    super(scope, id);
    const serviceRole = new iam.Role(this, "ServiceRole", {
      assumedBy: new iam.ServicePrincipal("amplify.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmplifyBackendDeployFullAccess"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("ReadOnlyAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSCodeArtifactAdminAccess"
        ),
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
      name: "full-stack-pool-deploy-model-frontend-control-plane",
      accessToken: props.accessToken,
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
      customRules: [
        {
          source: "/<*>",
          target: "/index.html",
          status: "404-200",
        },
      ],
      enableBranchAutoDeletion: false,
      environmentVariables: [
        {
          name: "AMPLIFY_DIFF_DEPLOY",
          value: "false",
        },
        {
          name: "AMPLIFY_MONOREPO_APP_ROOT",
          value: props.appRoot,
        },
        {
          name: "BACKEND_APP_ID",
          value: props.backendAppId,
        },
      ],
      iamServiceRole: serviceRole.roleArn,
      repository:
        "https://github.com/horietakehiro/deep-dive-multi-tenant-saas-on-aws",
    });

    new amplify.CfnBranch(this, "Branch", {
      appId: app.attrAppId,
      branchName: props.branch,
      stage: "PRODUCTION",
      enableAutoBuild: true,
      framework: "web",
    });

    new amplify.CfnDomain(this, "Domain", {
      appId: app.attrAppId,
      domainName: "ht-burdock.com",
      subDomainSettings: [
        {
          branchName: props.branch,
          prefix: "control-plane",
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

export interface FullStackPoolDeployModelStackProps extends cdk.StackProps {
  cert: acm.ICertificate;
  branch: string;
}
export class FullStackPoolDeployModelStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: FullStackPoolDeployModelStackProps
  ) {
    super(scope, id, props);
    const accessToken = new cdk.CfnParameter(this, "AccessToken", {
      noEcho: true,
      type: "String",
    });

    const backend = new Backend(this, "Backend", {
      accessToken: accessToken.valueAsString,
      branch: props.branch,
      certArn: props.cert.certificateArn,
      appRoot: "apps/backend",
    });

    new ControlPlane(this, "ControlPlane", {
      accessToken: accessToken.valueAsString,
      branch: props.branch,
      certArn: props.cert.certificateArn,
      appRoot: "apps/frontends/control-plane",
      backendAppId: backend.appId,
    });

    // new AmplifyApp(this, "ControlPlane", {
    //   certArn: props.cert.certificateArn,
    //   branch: props.branch,
    // });

    // new ApplicationPlane()
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
