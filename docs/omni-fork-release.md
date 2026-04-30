# Omni Fork Release Process

This fork can be consumed by Omni Terminal as a normal versioned npm package instead of a Git branch dependency.

## Package Shape

- Source branch: `codex/nomeida-market-cache` while the Omni cache work is fork-only.
- Generated Git dist branch: `codex/nomeida-market-cache-npm-dist` for Docker-safe Git fallback.
- Preferred npm package: `@intheta/hyperliquid`.
- Deno remains a source/build-time tool in this repository only. Omni and Omni Docker builds should consume generated
  npm output.

## Local Build And Smoke Test

```sh
NPM_PACKAGE_NAME=@intheta/hyperliquid \
NPM_PACKAGE_VERSION=0.32.2-omni.1 \
deno task verify:npm
```

The smoke test builds `build/npm`, runs `npm pack`, installs the tarball into a clean temp package, and imports every
public entry point.

## Publish npm Package

Run the `Omni npm release` workflow from GitHub Actions.

Inputs:

- `package_name`: `@intheta/hyperliquid`
- `version`: an immutable fork version such as `0.32.2-omni.1`
- `tag`: `omni` for normal fork releases, or `latest` only after intentionally making the fork package stable
- `dry_run`: keep `true` until the workflow has built and verified the package

Required secret:

- `NPM_TOKEN` with publish rights for the npm scope.

After publish, Omni can depend on the fork without renaming imports:

```json
{
  "@nktkas/hyperliquid": "npm:@intheta/hyperliquid@0.32.2-omni.1"
}
```

## Publish Git Dist Branch Fallback

```sh
NPM_PACKAGE_NAME=@intheta/hyperliquid \
NPM_PACKAGE_VERSION=0.32.2-omni.1 \
deno task publish:npm-dist-branch -- --remote fork --branch codex/nomeida-market-cache-npm-dist
```

Use this only when npm publishing is unavailable. The dist branch root is generated output and should not be edited by
hand.

## Upstream Sync

1. Fetch upstream `nktkas/hyperliquid`.
2. Merge or rebase upstream into the fork source branch.
3. Run:

```sh
deno task check
deno test -A tests/utils/marketCache.test.ts
NPM_PACKAGE_NAME=@intheta/hyperliquid deno task verify:npm
```

4. Publish a new `-omni.N` package version.
5. Bump Omni Terminal's dependency and run its targeted Hyperliquid cache/order-ticket tests.
