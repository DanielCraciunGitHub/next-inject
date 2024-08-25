import { Command } from "commander"

import { injectFile, injectGithubFiles } from "../../utils/file-injection"

import { handleError } from "../../utils/handle-error"

import { installDeps, installDevDeps } from "../../utils/package-management"
import { fetchLocalAndRemoteFile, fileExists } from "@/src/utils/file-fetching"
import { extractMatchedLines } from "@/src/utils/file-extraction"
import { injectInner, injectOuter } from "@/src/utils/file-transforms"

export const sanity = new Command()
  .name("sanity")
  .description("Inject sanity CMS into your app")
  .action(async function (this: Command) {
    try {
      await installDeps([
        "@sanity/cli",
        "@sanity/image-url",
        "@sanity/vision",
        "next-sanity",
        "sanity",
        "styled-components",
      ])
      await installDevDeps(["@sanity/types"])

      const sanityCli = "sanity.cli.ts"
      const sanityConfig = "sanity.config.ts"
      const sanityStudio = "src/app/studio/[[...tool]]/page.tsx"
      const sanityEnv = "src/sanity/env.ts"
      const sanityClient = "src/sanity/lib/client.ts"
      const sanityImage = "src/sanity/lib/image.ts"
      const sanitySchema = "src/sanity/schema.tsx"
      const blogPosts = "src/components/Sanity/BlogPosts.tsx"
      const blogFetching = "src/sanity/lib/blogs.ts"

      await injectGithubFiles({
        filePaths: [
          sanityCli,
          sanityConfig,
          sanityStudio,
          sanityEnv,
          sanityClient,
          sanityImage,
          sanitySchema,
          blogPosts,
          blogFetching,
        ],
      })

      const mainPagePath = "src/app/(Navigation)/page.tsx"
      if (fileExists(mainPagePath)) {
        let { rc: remotePage, lc: localPage } =
          await fetchLocalAndRemoteFile(mainPagePath)

        const remotePageImports = extractMatchedLines({
          fileContent: remotePage,
          searchStrings: ["import { Blog"],
        })
        localPage = injectOuter({
          fileContent: localPage,
          direction: "above",
          insertContent: remotePageImports,
        })

        const demo = extractMatchedLines({
          fileContent: remotePage,
          searchStrings: ["<BlogPosts />"],
        })

        localPage = injectInner({
          insertContent: demo,
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
    } catch (error) {
      handleError(error)
    }
  })
