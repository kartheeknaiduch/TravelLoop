import { defineConfig, InputTransformerFn } from "orval";
import path from "path";

const root = path.resolve(__dirname, "..");
const frontendApiSrc = path.resolve(root, "frontend", "src", "api");
const backendSchemaSrc = path.resolve(__dirname, "src", "schemas");

const titleTransformer: InputTransformerFn = (config) => {
  config.info ??= {};
  config.info.title = "Api";

  return config;
};

export default defineConfig({
  client: {
    input: {
      target: "./openapi.yaml",
      override: {
        transformer: titleTransformer,
      },
    },
    output: {
      workspace: frontendApiSrc,
      target: "generated",
      client: "react-query",
      mode: "split",
      baseUrl: "/api",
      clean: true,
      prettier: true,
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
        },
        mutator: {
          path: path.resolve(frontendApiSrc, "custom-fetch.ts"),
          name: "customFetch",
        },
      },
    },
  },
  schemas: {
    input: {
      target: "./openapi.yaml",
      override: {
        transformer: titleTransformer,
      },
    },
    output: {
      workspace: backendSchemaSrc,
      client: "zod",
      target: "generated",
      schemas: { path: "generated/types", type: "typescript" },
      mode: "split",
      clean: true,
      prettier: true,
      override: {
        zod: {
          coerce: {
            query: ["boolean", "number", "string"],
            param: ["boolean", "number", "string"],
            body: ["bigint", "date"],
            response: ["bigint", "date"],
          },
        },
        useDates: true,
        useBigInt: true,
      },
    },
  },
});
