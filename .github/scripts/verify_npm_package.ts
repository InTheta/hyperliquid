// deno-lint-ignore-file no-import-prefix

/**
 * Builds the generated npm package, packs it, installs it into a clean temp project,
 * and imports the public entry points. This is the smoke test Omni needs before
 * consuming the SDK as a versioned npm artifact.
 */

const decoder = new TextDecoder();

async function run(command: string, args: string[], cwd = Deno.cwd()): Promise<void> {
  const child = new Deno.Command(command, {
    args,
    cwd,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  }).spawn();
  const status = await child.status;
  if (!status.success) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

async function output(command: string, args: string[], cwd = Deno.cwd()): Promise<string> {
  const result = await new Deno.Command(command, {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  }).output();
  if (!result.success) {
    throw new Error(`${command} ${args.join(" ")} failed: ${decoder.decode(result.stderr).trim()}`);
  }
  return decoder.decode(result.stdout).trim();
}

await run("deno", ["run", "-A", ".github/scripts/build_npm.ts"]);

const packageDir = `${Deno.cwd()}/build/npm`;
const packageJson = JSON.parse(await Deno.readTextFile(`${packageDir}/package.json`)) as {
  name?: string;
  version?: string;
};

const tempRoot = await Deno.makeTempDir({ prefix: "hyperliquid-npm-verify-" });
try {
  const packOutput = await output("npm", ["pack", "--pack-destination", tempRoot], packageDir);
  const tarballName = packOutput.split(/\r?\n/).filter(Boolean).at(-1);
  if (!tarballName) throw new Error("Npm pack did not return a tarball name");
  const tarballPath = `${tempRoot}/${tarballName}`;

  const appDir = `${tempRoot}/consumer`;
  await Deno.mkdir(appDir, { recursive: true });
  await Deno.writeTextFile(
    `${appDir}/package.json`,
    JSON.stringify({ private: true, type: "module", dependencies: {} }, null, 2),
  );
  await run("npm", ["install", "--ignore-scripts", tarballPath], appDir);
  await Deno.writeTextFile(
    `${appDir}/smoke.mjs`,
    [
      `import * as sdk from ${JSON.stringify(packageJson.name)};`,
      `import * as utils from ${JSON.stringify(`${packageJson.name}/utils`)};`,
      `import * as info from ${JSON.stringify(`${packageJson.name}/api/info`)};`,
      `import * as exchange from ${JSON.stringify(`${packageJson.name}/api/exchange`)};`,
      `import * as subscription from ${JSON.stringify(`${packageJson.name}/api/subscription`)};`,
      `import * as signing from ${JSON.stringify(`${packageJson.name}/signing`)};`,
      "for (const [name, mod] of Object.entries({ sdk, utils, info, exchange, subscription, signing })) {",
      "  if (!mod || Object.keys(mod).length === 0) throw new Error(`${name} exported no symbols`);",
      "}",
      "console.log('npm smoke ok');",
      "",
    ].join("\n"),
  );
  await run("node", ["smoke.mjs"], appDir);
  console.log(`Verified ${packageJson.name}@${packageJson.version} npm package`);
} finally {
  await Deno.remove(tempRoot, { recursive: true });
}
