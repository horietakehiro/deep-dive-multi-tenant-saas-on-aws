#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import {
  CustomCertStack,
  FullStackSiloDeployModelStack,
} from "../lib/full-stack-silo-deploy-model";

const app = new cdk.App();
const certStack = new CustomCertStack(app, "CustomCertStack", {
  env: {
    region: "us-east-1",
    account: "382098889955",
  },
  crossRegionReferences: true,
  domaineName: "*.ht-burdock.com",
  hostedZoneId: "Z039399416TTZBHG4C8OO",
});
const appStack = new FullStackSiloDeployModelStack(
  app,
  "FullStackSiloDeployModelStack",
  {
    env: {
      region: "ap-northeast-1",
      account: "382098889955",
    },
    crossRegionReferences: true,
    cert: certStack.certificate,
  }
);

appStack.addDependency(certStack);
