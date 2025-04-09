import { build, context } from "esbuild";

const isWatching = !!process.argv.includes("--watch");

const buildOptions = {
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  platform: "node",
  format: "esm",
  minify: !isWatching,
  sourcemap: false,
  packages: "external",
};

if (isWatching) {
  context(buildOptions).then((ctx) => {
    ctx.watch();
  });
} else {
  build(buildOptions);
}
