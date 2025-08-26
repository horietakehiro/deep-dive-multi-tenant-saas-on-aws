import path from "path";
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    alias: {
      "@/cfn-types": path.resolve(
        __dirname,
        "../node_modules/@horietakehiro/aws-cdk-utul/lib/types/cfn-resource-types"
      ),
      "@/cfn-types/*": path.resolve(
        __dirname,
        "../node_modules/@horietakehiro/aws-cdk-utul/lib/types/cfn-resource-types/*"
      ),
    },
  },
});
