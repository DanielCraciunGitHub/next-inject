import { Command } from "commander"

import { injectGithubFiles, injectFile } from "../../utils/file-injection"
import { merge } from "@/src/utils/file-transforms"
import {
  extractBetweenMatchedLines,
  extractMatchedLines,
} from "../../utils/file-extraction"

import {
  fetchRemoteFile,
  fileExists,
  readFileContent,
} from "@/src/utils/file-fetching"
import { fetchLocalAndRemoteFile } from "@/src/utils/file-fetching"
import { handleError } from "../../utils/handle-error"

import { installDeps } from "../../utils/package-management"

export const metadata = new Command()
  .name("metadata")
  .description("Inject metadata into your app")
  .action(async function (this: Command) {
    try {
      await installDeps(["next-seo"])

      const metadataPath = "src/config/metadata.tsx"
      let metadataFile = await fetchRemoteFile({
        filePath: metadataPath,
      })

      // ! THE order here matters, because we search and replace content from start-EOF.
      const manifest = "src/app/manifest.ts"
      if (fileExists(manifest)) {
        const manifestContent = await readFileContent(manifest)
        metadataFile = merge(
          metadataFile,
          `// MOVED FROM ${manifest}`,
          manifestContent
        )
      }

      const robots = "src/app/robots.ts"
      if (fileExists(robots)) {
        const robotsContent = await readFileContent(robots)
        metadataFile = merge(
          metadataFile,
          `// MOVED FROM ${robots}`,
          robotsContent
        )
      }

      const sitemap = "src/app/sitemap.ts"
      if (fileExists(sitemap)) {
        const sitemapContent = await readFileContent(sitemap)
        metadataFile = merge(
          metadataFile,
          `// MOVED FROM ${sitemap}`,
          sitemapContent
        )
      }

      await injectFile({
        fileContent: metadataFile,
        filePath: metadataPath,
        successColor: "yellow",
      })

      await injectGithubFiles({
        filePaths: [manifest, sitemap, robots],
      })

      const mainLayoutPath = "src/app/layout.tsx"
      if (fileExists(mainLayoutPath)) {
        let { rc: remoteLayout, lc: localLayout } =
          await fetchLocalAndRemoteFile(mainLayoutPath)

        const layoutImports = extractMatchedLines({
          fileContent: remoteLayout,
          searchStrings: [/^import\s+\{.*metadata.*/i],
        })
        const layoutMetadataExports = extractBetweenMatchedLines({
          fileContent: remoteLayout,
          startString: "export const metadata",
        })

        localLayout = merge(layoutImports, localLayout, layoutMetadataExports)

        await injectFile({
          filePath: mainLayoutPath,
          fileContent: localLayout,
          successColor: "yellow",
        })
      }

      const mainPagePath = "src/app/(Navigation)/page.tsx"
      if (fileExists(mainPagePath)) {
        let { rc: remotePage, lc: localPage } =
          await fetchLocalAndRemoteFile(mainPagePath)

        const pageImports = extractMatchedLines({
          fileContent: remotePage,
          searchStrings: [/^import\s+\{.*metadata.*/i],
        })
        const pageMetadataExports = extractBetweenMatchedLines({
          fileContent: remotePage,
          startString: "export const metadata",
        })
        localPage = merge(pageImports, localPage, pageMetadataExports)

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
