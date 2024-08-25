import { Command } from "commander"

import { injectFile, injectGithubFiles } from "../../utils/file-injection"

import { handleError } from "../../utils/handle-error"

import { installDeps } from "../../utils/package-management"

import {
  fetchLocalAndRemoteFile,
  fetchRemoteFile,
  fileExists,
} from "@/src/utils/file-fetching"
import {
  extractBetweenMatchedLines,
  extractMatchedLines,
} from "@/src/utils/file-extraction"
import { injectInner, injectOuter } from "@/src/utils/file-transforms"
import { patchResendReactEmail } from "../patches/resend_react-email"
import { patchPeerPlugin } from "@/src/utils/project-info"

export const resend = new Command()
  .name("resend")
  .description("Inject resend into your app")
  .action(async function (this: Command) {
    try {
      await installDeps(["resend"])

      const emailAction = "src/app/_actions/email.tsx"
      const resendDemo = "src/components/Resend/ResendDemo.tsx"

      await injectGithubFiles({
        filePaths: [emailAction, resendDemo],
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

      await patchPeerPlugin("react-email", patchResendReactEmail)
    } catch (error) {
      handleError(error)
    }
  })
