import { readFileContent } from "@/src/utils/file-fetching"
import { injectFile } from "@/src/utils/file-injection"
import { injectInner, injectOuter } from "@/src/utils/file-transforms"

export async function patchTrpcNextAuth() {
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
    insertContent: sessionCode,
    insertPoint: "export const createTRPCContext",
  })
  trpcContent = injectInner({
    direction: "below",
    fileContent: trpcContent,
    insertContent: "session,",
    insertPoint: "...opts,",
  })

  trpcContent = injectOuter({
    direction: "below",
    fileContent: trpcContent,
    insertContent: authProcedure,
  })

  await injectFile({
    fileContent: trpcContent,
    filePath: trpcServer,
    successColor: "yellow",
  })
}

const imports = `import { TRPCError } from "@trpc/server"
import { auth } from "@/lib/auth"
`

const sessionCode = `const session = await auth()`

const authProcedure = `export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})`
