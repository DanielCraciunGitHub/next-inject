import { Command } from "commander"

import { injectGithubFiles } from "../../utils/file-injection"

import { handleError } from "../../utils/handle-error"

import { installDeps } from "../../utils/package-management"

import { fetchRemoteFolderFiles } from "../../utils/file-fetching"

export const waitlist = new Command()
  .name("waitlist")
  .description("Inject a waitlist into your app")
  .action(async function (this: Command) {
    try {
      await installDeps(["react-youtube"])

      const waitlist = "src/app/waitlist/page.tsx"
      const waitlistPaths = await fetchRemoteFolderFiles({
        filePath: "src/components/Waitlist",
      })

      await injectGithubFiles({
        filePaths: [waitlist, ...waitlistPaths],
      })
    } catch (error) {
      handleError(error)
    }
  })
