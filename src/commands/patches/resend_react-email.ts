import { readFileContent } from "@/src/utils/file-fetching"
import { injectFile } from "@/src/utils/file-injection"
import { injectInner, injectOuter, merge } from "@/src/utils/file-transforms"

export async function patchResendReactEmail() {
  const emailAction = "src/app/_actions/email.tsx"

  let actionContent = await readFileContent(emailAction)

  actionContent = injectOuter({
    direction: "above",
    fileContent: actionContent,
    insertContent: welcomeEmailImport,
  })

  actionContent = injectInner({
    direction: "below",
    fileContent: actionContent,
    insertContent: merge("// INJECTED CONTENT", reactContent),
    insertPoint: "resend.emails.send",
  })

  await injectFile({
    fileContent: actionContent,
    filePath: emailAction,
    successColor: "red",
  })
}

const reactContent = `react: WelcomeEmail({ firstName: name }),`
const welcomeEmailImport = `import { WelcomeEmail } from "@/react-email/emails/welcome"`
