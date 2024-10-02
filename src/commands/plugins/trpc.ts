import { Command } from "commander"

import { injectFile, injectGithubFiles } from "../../utils/file-injection"
import { injectOuter, searchAndReplace } from "@/src/utils/file-transforms"

import { handleError } from "../../utils/handle-error"

import {
  extractBetweenMatchedLines,
  extractMatchedLines,
} from "../../utils/file-extraction"
import { fetchRemoteFolderFiles, fileExists } from "@/src/utils/file-fetching"

import { fetchLocalAndRemoteFile } from "@/src/utils/file-fetching"

import { installDeps } from "@/src/utils/package-management"
import { patchPeerPlugin } from "@/src/utils/project-info"
import { patchTrpcNextAuth } from "../patches/trpc-next-auth"
import { patchTrpcDrizzleTurso } from "../patches/trpc-drizzle-turso"

export const trpc = new Command()
  .name("trpc")
  .description("Inject trpc into your app")
  .action(async function (this: Command) {
    try {
      await installDeps([
        "@tanstack/react-query",
        "@trpc/client@next",
        "@trpc/react-query@next",
        "@trpc/server@next",
        "superjson",
      ])

      const trpcPaths = await fetchRemoteFolderFiles({
        filePath: "src/server",
      })

      const trpcRouters = await fetchRemoteFolderFiles({
        filePath: "src/server/routers",
      })

      await injectGithubFiles({
        filePaths: [...trpcPaths, ...trpcRouters],
      })

      const providersPath = "src/components/next-inject-providers.tsx"
      if (fileExists(providersPath)) {
        let { rc: remoteProvider, lc: localProvider } =
          await fetchLocalAndRemoteFile(providersPath)

        const trpcImport = extractMatchedLines({
          fileContent: remoteProvider,
          searchStrings: ["import { TrpcProvider"],
        })!
        localProvider = injectOuter({
          insertContent: trpcImport,
          fileContent: localProvider,
          direction: "above",
        })

        const trpcProvider = extractBetweenMatchedLines({
          fileContent: remoteProvider,
          startString: "<TrpcProvider",
          endString: "</TrpcProvider>",
        })

        localProvider = searchAndReplace({
          targetString: "{children}",
          fileContent: localProvider,
          newContent: trpcProvider,
        })

        await injectFile({
          filePath: providersPath,
          fileContent: localProvider,
        })
      } else {
        handleError(`The file path ${providersPath} does not exist!`)
      }

      await patchPeerPlugin("next-auth", patchTrpcNextAuth)
      await patchPeerPlugin("drizzle-turso", patchTrpcDrizzleTurso)
    } catch (error) {
      handleError(error)
    }
  })
