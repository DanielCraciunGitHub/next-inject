import { addSpinner } from "@/src/commands/add"
import { injectFile } from "@/src/utils/file-injection"

import fs from "fs"

describe("Injection functions work", () => {
  test("injectFile", async () => {
    await injectFile({
      fileContent: "this is a test",
      filePath: "test",
    })

    expect(fs.existsSync("test")).toBe(true)
  })
  test("injectFileRecursive", async () => {
    await injectFile({
      fileContent: "this is a test",
      filePath: "testr/testr",
    })

    expect(fs.existsSync("testr/testr")).toBe(true)
  })

  afterAll(() => {
    fs.unlinkSync("test")
    fs.unlinkSync("testr/testr")
  })
})
