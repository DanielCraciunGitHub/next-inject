import { Command } from "commander"

import { injectFile, injectGithubFiles } from "../../utils/file-injection"
import { injectOuter } from "@/src/utils/file-transforms"

import { handleError } from "../../utils/handle-error"

import {
  extractBetweenMatchedLines,
  extractMatchedLines,
} from "../../utils/file-extraction"
import { fetchRemoteFolderFiles, fileExists } from "@/src/utils/file-fetching"

import { fetchLocalAndRemoteFile } from "@/src/utils/file-fetching"
import { injectInner } from "@/src/utils/file-transforms"
import { installDeps } from "@/src/utils/package-management"

export const lp = new Command()
  .name("lp")
  .description("Inject a beautiful landing page into your app")
  .action(async function (this: Command) {
    try {
      await installDeps(["react-youtube"])

      const landingPagePaths = await fetchRemoteFolderFiles({
        filePath: "src/components/LandingPage",
      })
      const svgPaths = await fetchRemoteFolderFiles({
        filePath: "src/components/SVG",
      })

      await injectGithubFiles({
        filePaths: [...landingPagePaths, ...svgPaths],
      })

      const mainPagePath = "src/app/(Navigation)/page.tsx"
      if (fileExists(mainPagePath)) {
        let { rc: remotePage, lc: localPage } =
          await fetchLocalAndRemoteFile(mainPagePath)

        const remotePageImports = extractMatchedLines({
          fileContent: remotePage,
          searchStrings: ["import LandingPage"],
        })
        localPage = injectOuter({
          fileContent: localPage,
          direction: "above",
          insertContent: remotePageImports,
        })

        localPage = injectInner({
          insertContent: "<LandingPage />",
          direction: "above",
          fileContent: localPage,
          insertPoint: "</section",
        })

        await injectFile({
          filePath: mainPagePath,
          fileContent: localPage,
          successColor: "yellow",
        })
      }
      const configPath = "src/config/next-inject.tsx"
      if (fileExists(configPath)) {
        let { rc: remoteConfig, lc: localConfig } =
          await fetchLocalAndRemoteFile(configPath)

        const navlinks = extractBetweenMatchedLines({
          fileContent: remoteConfig,
          startString: "// SP",
          endString: "// EP",
        })
        localConfig = injectInner({
          insertContent: navlinks,
          fileContent: localConfig,
          direction: "below",
          insertPoint: `href: "/"`,
          offset: 2,
        })

        await injectFile({
          filePath: configPath,
          fileContent: localConfig,
          successColor: "yellow",
        })
      } else {
        handleError(`The file path ${configPath} does not exist!`)
      }

      //   await patchPeerPlugin("drizzle-turso", patchNextAuthDrizzleTurso)
    } catch (error) {
      handleError(error)
    }
  })
