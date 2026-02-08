import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "server/index": "src/server/index.ts",
    "server/hono": "src/server/hono.ts",
    "server/next": "src/server/next.ts",
    "client/index": "src/client/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
});
