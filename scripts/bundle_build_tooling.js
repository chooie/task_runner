require("esbuild")
  .build({
    bundle: true,
    sourcemap: true,
    entryPoints: ["src/main.js"],
    /**
     * Can't include esbuild because it relies on binaries
     * Error: The esbuild JavaScript API cannot be bundled. Please mark the
     * "esbuild" package as external so it's not included in the bundle.
     *
     * More information: The file containing the code for esbuild's JavaScript
     * API (build_output/out.js)
     * does not appear to be inside the esbuild package on the file system,
     * which usually means that the esbuild package was bundled into another
     * file. This is problematic because the API needs to run a binary
     * executable inside the esbuild package which is located using a relative
     * path from the API code to the executable. If the esbuild package is
     * bundled, the relative path will be incorrect and the executable won't be
     * found.
     */
    external: ["chokidar", "esbuild", "mocha", "source-map-support"],
    outfile: "build_output/out.js",
    platform: "node",
  })
  .catch(() => process.exit(1));
