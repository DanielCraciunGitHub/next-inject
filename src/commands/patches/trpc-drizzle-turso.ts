import { readFileContent } from "@/src/utils/file-fetching"
import { injectFile } from "@/src/utils/file-injection"
import { injectInner, injectOuter } from "@/src/utils/file-transforms"

export async function patchTrpcDrizzleTurso() {
  const trpcServer = "src/server/trpc.ts"

  let trpcContent = await readFileContent(trpcServer)

  trpcContent = injectOuter({
    direction: "above",
    fileContent: trpcContent,
    insertContent: imports,
  })

  trpcContent = injectInner({
    direction: "below",
    fileContent: trpcContent,
    insertContent: "db,",
    insertPoint: "...opts,",
  })

  await injectFile({
    fileContent: trpcContent,
    filePath: trpcServer,
    successColor: "yellow",
  })
}

const imports = `import { db } from "@/db"`
