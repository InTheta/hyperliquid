// deno-lint-ignore-file no-import-prefix

/**
 * Builds the npm package and publishes the generated package root to a Git branch.
 *
 * @example
 * ```sh
 * deno run -A .github/scripts/publish_npm_dist_branch.ts \
 *   --remote fork \
 *   --branch codex/nomeida-market-cache-npm-dist
 * ```
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function option(name: string, fallback?: string): string | undefined {
  const prefix = `--${name}=`;
  for (let index = 0; index < Deno.args.length; index += 1) {
    const arg = Deno.args[index];
    if (arg === `--${name}`) return Deno.args[index + 1];
    if (arg.startsWith(prefix)) return arg.slice(prefix.length);
  }
  return fallback;
}

function flag(name: string): boolean {
  return Deno.args.includes(`--${name}`);
}

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

async function copyDir(source: string, target: string): Promise<void> {
  await Deno.mkdir(target, { recursive: true });
  for await (const entry of Deno.readDir(source)) {
    const from = `${source}/${entry.name}`;
    const to = `${target}/${entry.name}`;
    if (entry.isDirectory) {
      await copyDir(from, to);
    } else if (entry.isFile) {
      await Deno.copyFile(from, to);
    } else if (entry.isSymlink) {
      await Deno.symlink(await Deno.readLink(from), to);
    }
  }
}

const remote = option("remote", Deno.env.get("DIST_REMOTE") ?? "origin")!;
const remoteUrl = option("remote-url") ?? await output("git", ["remote", "get-url", remote]);
const branch = option("branch", Deno.env.get("DIST_BRANCH") ?? "codex/nomeida-market-cache-npm-dist")!;
const sourceRef = await output("git", ["rev-parse", "--short", "HEAD"]);
const noPush = flag("no-push");

await run("deno", ["run", "-A", ".github/scripts/build_npm.ts"]);

const packageDir = `${Deno.cwd()}/build/npm`;
const packageJson = JSON.parse(await Deno.readTextFile(`${packageDir}/package.json`)) as {
  name?: string;
  version?: string;
};
const distDir = await Deno.makeTempDir({ prefix: "hyperliquid-npm-dist-" });

try {
  await copyDir(packageDir, distDir);
  await run("git", ["init", "-b", branch], distDir);
  await run("git", ["config", "user.name", "hyperliquid dist publisher"], distDir);
  await run("git", ["config", "user.email", "dist-publisher@users.noreply.github.com"], distDir);
  await run("git", ["add", "-A"], distDir);
  await run("git", [
    "commit",
    "-m",
    `Build npm dist for ${sourceRef}`,
    "-m",
    `${packageJson.name ?? "package"}@${packageJson.version ?? "unknown"}`,
  ], distDir);

  if (noPush) {
    await Deno.stdout.write(encoder.encode(`Built npm dist branch ${branch} at ${distDir}\n`));
  } else {
    await run("git", ["remote", "add", "dist", remoteUrl], distDir);
    await run("git", ["push", "--force", "dist", `HEAD:${branch}`], distDir);
  }
} finally {
  if (!noPush) await Deno.remove(distDir, { recursive: true });
}
