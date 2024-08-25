import { Command } from "commander"

import { injectFile, injectGithubFiles } from "../../utils/file-injection"
import { injectOuter, merge } from "@/src/utils/file-transforms"

import { handleError } from "../../utils/handle-error"

import { installDeps } from "../../utils/package-management"
import {
  extractBetweenMatchedLines,
  extractMatchedLines,
} from "../../utils/file-extraction"
import { fetchRemoteFile, fileExists } from "@/src/utils/file-fetching"

import { fetchLocalAndRemoteFile } from "@/src/utils/file-fetching"
import { injectInner } from "@/src/utils/file-transforms"

export const stripe = new Command()
  .name("stripe")
  .description("Inject stripe into your app")
  .action(async function (this: Command) {
    try {
      await installDeps(["stripe"])

      const stripeAction = "src/app/_actions/stripe.ts"
      const stripeConfig = "src/lib/stripe.ts"

      const stripeWebhook = "src/app/api/webhooks/stripe/route.ts"

      const stripeButton = "src/components/Stripe/StripeButton.tsx"
      const stripeDemo = "src/components/Stripe/StripeDemo.tsx"

      const subCard = "src/components/Stripe/SubscriptionCard.tsx"
      const oneOffCard = "src/components/Stripe/OneOffCard.tsx"

      await injectGithubFiles({
        filePaths: [
          stripeAction,
          stripeWebhook,
          stripeButton,
          stripeDemo,
          stripeConfig,
          oneOffCard,
          subCard,
        ],
      })

      const mainPagePath = "src/app/(Navigation)/page.tsx"
      if (fileExists(mainPagePath)) {
        let { rc: remotePage, lc: localPage } =
          await fetchLocalAndRemoteFile(mainPagePath)

        const remotePageImports = extractMatchedLines({
          fileContent: remotePage,
          searchStrings: ["import { Demo"],
        })
        localPage = injectOuter({
          direction: "above",
          fileContent: localPage,
          insertContent: remotePageImports,
        })

        const demoStripe = extractMatchedLines({
          fileContent: remotePage,
          searchStrings: ["<Demo />"],
        })

        localPage = injectInner({
          insertContent: demoStripe,
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

      const utilsPath = "src/lib/utils.ts"
      if (fileExists(utilsPath)) {
        let { rc: remoteUtils, lc: localUtils } =
          await fetchLocalAndRemoteFile(utilsPath)

        const formatFunction = extractBetweenMatchedLines({
          fileContent: remoteUtils,
          startString: "export function formatProductPrice",
        })

        localUtils = merge(localUtils, formatFunction)

        await injectFile({ fileContent: localUtils, filePath: utilsPath })
      } else {
        let remoteUtils = await fetchRemoteFile({ filePath: utilsPath })

        const formatFunction = extractBetweenMatchedLines({
          fileContent: remoteUtils,
          startString: "export function formatProductPrice",
        })

        await injectFile({ fileContent: formatFunction, filePath: utilsPath })
      }
    } catch (error) {
      handleError(error)
    }
  })
