import { Command } from "commander"

import { injectFile, injectGithubFiles } from "../../utils/file-injection"

import { handleError } from "../../utils/handle-error"

import { installDeps } from "../../utils/package-management"

import { fetchRemoteFile } from "@/src/utils/file-fetching"

import path from "path"
import { cwd, setGlobalCwd } from "../add"
import { patchResendReactEmail } from "../patches/resend_react-email"
import { patchPeerPlugin } from "@/src/utils/project-info"

export const reactEmail = new Command()
  .name("react-email")
  .description("Inject react-email into your app")
  .action(async function (this: Command) {
    try {
      const email = "src/react-email/emails/welcome.tsx"
      const templateAsset = "src/react-email/emails/static/next-inject.webp"

      await injectGithubFiles({
        filePaths: [email, templateAsset],
      })

      const packageJson = "src/react-email/package.json"
      const packageJsonContent = await fetchRemoteFile({
        filePath: packageJson,
      })
      await injectFile({
        fileContent: JSON.stringify(packageJsonContent, null, 2),
        filePath: packageJson,
      })

      const prevCwd = cwd
      const tempCwd = path.join(cwd, "src/react-email")
      setGlobalCwd(tempCwd)
      await installDeps([])
      setGlobalCwd(prevCwd)

      await patchPeerPlugin("resend", patchResendReactEmail)
    } catch (error) {
      handleError(error)
    }
  })
