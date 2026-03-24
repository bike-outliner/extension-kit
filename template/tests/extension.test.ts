describe("{{id}}", () => {
    const editor = bike.testEditor()
    const outline = editor.outline

    it("simple assert", () => {
        assert(true, "Expected true")
    })

    it("async test", async () => {
        const result = await new Promise<string>((resolve) => {
          setTimeout(() => resolve("done"), 100)
        })
        assert(result === "done", "Expected promise to resolve")
    })

    it("can create and read rows", () => {
        outline.transaction({ label: "test" }, () => {
            outline.insertRows(["Hello", "World"], outline.root)
        })
        assert.equal(outline.root.children.length, 2)
        assert.equal(outline.root.firstChild!.text.string, "Hello")
    })
})
