import { Command } from "commander"

import { injectFile, injectGithubFiles } from "../../utils/file-injection"

import { handleError } from "../../utils/handle-error"

import { installDeps, installDevDeps } from "../../utils/package-management"
import { extractMatchedLines } from "../../utils/file-extraction"

import {
  fetchLocalAndRemoteFile,
  fetchRemoteFolderFiles,
} from "@/src/utils/file-fetching"
import { injectInner } from "@/src/utils/file-transforms"
import { patchPeerPlugin } from "@/src/utils/project-info"
import { patchNextAuthDrizzleTurso } from "../patches/next-auth_drizzle-turso"
import { patchTrpcDrizzleTurso } from "../patches/trpc-drizzle-turso"

export const drizzleTurso = new Command()
  .name("drizzle-turso")
  .description("Inject drizzle and turso into your app")
  .action(async function (this: Command) {
    try {
      await installDeps(["@libsql/client", "drizzle-orm", "ulid", "dotenv"])
      await installDevDeps(["drizzle-kit"])

      const drizzleConfig = "drizzle.config.ts"
      const dbFiles = await fetchRemoteFolderFiles({ filePath: "src/db" })

      await injectGithubFiles({
        filePaths: [drizzleConfig, ...dbFiles],
      })

      const packageJson = "package.json"

      let { rc: remotePackage, lc: localPackage } =
        await fetchLocalAndRemoteFile(packageJson)

      const scripts = extractMatchedLines({
        fileContent: JSON.stringify(remotePackage, null, 2),
        searchStrings: [/drizzle-kit /],
      })

      localPackage = injectInner({
        direction: "below",
        insertPoint: /"scripts": {/,
        insertContent: scripts,
        fileContent: localPackage,
      })

      await injectFile({
        filePath: packageJson,
        fileContent: localPackage,
        successColor: "yellow",
      })

      await patchPeerPlugin("next-auth", patchNextAuthDrizzleTurso)
      await patchPeerPlugin("trpc", patchTrpcDrizzleTurso)
    } catch (error) {
      handleError(error)
    }
  })
