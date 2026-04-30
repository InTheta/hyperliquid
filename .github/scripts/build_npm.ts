// deno-lint-ignore-file no-import-prefix

/**
 * Builds the Deno library for working with NodeJS or publishing to npm
 *
 * @example
 * ```sh
 * deno run -A .github/scripts/build_npm.ts
 * ```
 */

import { build, emptyDir } from "jsr:@deno/dnt@^0.42.3";
import denoJson from "../../deno.json" with { type: "json" };

function env(name: string, fallback: string): string {
  return Deno.env.get(name)?.trim() || fallback;
}

/**
 * Convert part of jsr dependencies to npm in deno.json imports.
 * HACK: I don't know of any other way to instruct `@deno/dnt` to convert jsr dependencies into npm equivalents.
 */
async function modifyImports(): Promise<() => Promise<void>> {
  // Define mappings from jsr to npm
  const jsr2npm = {
    "jsr:@nktkas/rews": "npm:@nktkas/rews",
    "jsr:@noble/hashes": "npm:@noble/hashes",
    // "jsr:@std/async": "...", // No npm equivalent available
    // "jsr:@std/msgpack": "...", // No npm equivalent available
    "jsr:@valibot/valibot": "npm:valibot",
  };

  // Read and modify deno.json imports
  const rawConfig = await Deno.readTextFile("./deno.json");
  let tempConfig = rawConfig;
  for (const [jsr, npm] of Object.entries(jsr2npm)) {
    tempConfig = tempConfig.replace(jsr, npm);
  }
  await Deno.writeTextFile("./deno.json", tempConfig);

  // Return a restore function to revert changes in deno.json
  return async () => {
    await Deno.writeTextFile("./deno.json", rawConfig);
  };
}

const restoreConfig = await modifyImports();
try {
  const packageName = env("NPM_PACKAGE_NAME", denoJson.name);
  const packageVersion = env("NPM_PACKAGE_VERSION", denoJson.version);
  const packageDescription = env(
    "NPM_PACKAGE_DESCRIPTION",
    "Hyperliquid API SDK for all major JS runtimes, written in TypeScript.",
  );
  const packageHomepage = env("NPM_PACKAGE_HOMEPAGE", "https://github.com/InTheta/hyperliquid");
  const packageRepository = env("NPM_PACKAGE_REPOSITORY", "git+https://github.com/InTheta/hyperliquid.git");
  const packageBugsUrl = env("NPM_PACKAGE_BUGS_URL", "https://github.com/InTheta/hyperliquid/issues");
  const packageAuthorName = env("NPM_PACKAGE_AUTHOR_NAME", "nktkas / InTheta fork maintainers");
  const packageAuthorEmail = env("NPM_PACKAGE_AUTHOR_EMAIL", "github.turk9@passmail.net");
  const packageAuthorUrl = env("NPM_PACKAGE_AUTHOR_URL", "https://github.com/InTheta");

  await emptyDir("./build/npm");
  await build({
    entryPoints: Object.entries(denoJson.exports).map(([k, v]) => ({ name: k, path: v })),
    outDir: "./build/npm",
    shims: {},
    typeCheck: "both",
    test: false,
    package: {
      name: packageName,
      version: packageVersion,
      description: packageDescription,
      keywords: [
        "api",
        "library",
        "sdk",
        "javascript",
        "typescript",
        "cryptocurrency",
        "trading",
        "blockchain",
        "exchange",
        "web3",
        "dex",
        "hyperliquid",
      ],
      homepage: packageHomepage,
      bugs: {
        url: packageBugsUrl,
      },
      repository: {
        type: "git",
        url: packageRepository,
      },
      license: "MIT",
      author: {
        name: packageAuthorName,
        email: packageAuthorEmail,
        url: packageAuthorUrl,
      },
      sideEffects: false,
      engines: {
        node: ">=20.19.0",
      },
    },
    compilerOptions: {
      lib: ["ESNext", "DOM"],
      target: "Latest",
      sourceMap: true,
    },
  });
  await Promise.all([
    // Copy additional files to npm build directory
    Deno.copyFile("CONTRIBUTING.md", "build/npm/CONTRIBUTING.md"),
    Deno.copyFile("LICENSE", "build/npm/LICENSE"),
    Deno.copyFile("README.md", "build/npm/README.md"),
    Deno.copyFile("SECURITY.md", "build/npm/SECURITY.md"),
  ]);
} finally {
  await restoreConfig();
}
