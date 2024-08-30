import { reactComponent } from "./mock/react"
import {
  extractBetweenMatchedLines,
  extractMatchedLines,
} from "@/src/utils/file-extraction"

describe("Extraction functions work", () => {
  test("extractMatchedLines", () => {
    const reactImport = extractMatchedLines({
      fileContent: reactComponent,
      searchStrings: ["import"],
    })

    expect(reactImport).toContain("import")
    expect(reactImport).toContain("import X")
  })
  test("extractBetweenMatchedLines", () => {
    const content = extractBetweenMatchedLines({
      fileContent: reactComponent,
      startString: "<div>",
      endString: "</div>",
    })

    const lines = content.split("\n")
    expect(lines.length).toBe(3)
    expect(content).toContain("<h1>")
  })
})
