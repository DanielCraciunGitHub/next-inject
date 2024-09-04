import { Command } from "commander"

import { injectFile, injectGithubFiles } from "../../utils/file-injection"

import { handleError } from "../../utils/handle-error"

import { installDeps } from "../../utils/package-management"

import {
  fetchLocalAndRemoteFile,
  fetchRemoteFolderFiles,
  fileExists,
} from "@/src/utils/file-fetching"
import {
  extractBetweenMatchedLines,
  extractMatchedLines,
} from "@/src/utils/file-extraction"
import { injectInner, injectOuter } from "@/src/utils/file-transforms"

export const resend = new Command()
  .name("resend")
  .description("Inject resend into your app")
  .action(async function (this: Command) {
    try {
      await installDeps(["resend"])

      const resendAction = "src/lib/send-email.tsx"
      const resendFiles = await fetchRemoteFolderFiles({
        filePath: "src/components/Resend",
      })

      await injectGithubFiles({
        filePaths: [resendAction, ...resendFiles],
      })

      const mainPagePath = "src/app/(Navigation)/page.tsx"
      if (fileExists(mainPagePath)) {
        let { rc: remotePage, lc: localPage } =
          await fetchLocalAndRemoteFile(mainPagePath)

        const remotePageImports = extractMatchedLines({
          fileContent: remotePage,
          searchStrings: ["import { ResendDemo"],
        })
        localPage = injectOuter({
          fileContent: localPage,
          direction: "above",
          insertContent: remotePageImports,
        })

        const resendDemoComponent = extractBetweenMatchedLines({
          fileContent: remotePage,
          startString: "<ResendDemo",
          endString: "/>",
        })
        localPage = injectInner({
          insertContent: resendDemoComponent,
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

      // await patchPeerPlugin("react-email", patchResendReactEmail)
    } catch (error) {
      handleError(error)
    }
  })
