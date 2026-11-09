import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", "bin/cli": "bin/cli.ts" },
  format: ["esm", "cjs"],
  dts: { entry: "src/index.ts" },
  clean: true,
  splitting: false,
  sourcemap: true,
  target: "node18",
  outDir: "dist",
});
