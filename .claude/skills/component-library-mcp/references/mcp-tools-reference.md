# Component Library MCP — Tools Reference

Quick reference for all tools exposed by the MCP server.

---

## `list_components`

Lists all components currently in the library.

**Input:** none

**Output:**
```json
{
  "count": 3,
  "components": ["my-button", "my-date-picker", "my-modal"]
}
```

---

## `get_component`

Returns the full source, styles, and generated docs for a component.

**Input:**
```json
{ "component": "my-button" }
```

**Output:**
```json
{
  "component": "my-button",
  "source": "// .tsx source...",
  "styles": "// .scss source...",
  "docs": "// readme.md content..."
}
```

---

## `get_stories`

Returns the Storybook stories file for a component.

**Input:**
```json
{ "component": "my-button" }
```

**Output:** Raw `.stories.ts` file content

---

## `get_framework_usage`

Returns the framework-specific generated proxy/wrapper code.

**Input:**
```json
{
  "component": "my-button",
  "framework": "react"  // "angular" | "react" | "vue" | "vanilla"
}
```

**Output:** Snippet from the generated proxy file, or vanilla HTML usage

---

## `get_component_tests`

Returns the unit test and e2e test files for a component.

**Input:**
```json
{ "component": "my-button" }
```

**Output:**
```json
{
  "unitTests": "// .spec.tsx content...",
  "e2eTests": "// .e2e.ts content..."
}
```

---

## Error Responses

All tools return `isError: true` with a helpful message when:
- Component name doesn't exist → suggests `list_components`
- Framework proxy not built → suggests `npx stencil build`
- Stories not created yet → explains the situation
