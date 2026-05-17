<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:test-writing-rules -->
# Test Writing Requirements

After completing any code implementation, you MUST write test code for it before finishing.

## Rules

- Every new function, hook, component, or utility must have corresponding tests.
- Tests go in a `__tests__/` folder next to the source file, or as `<filename>.test.ts(x)` alongside the source.
- Run existing tests to confirm nothing is broken after changes.

## What to test

- **Components**: render output, user interactions, edge cases (empty/error states)
- **Hooks**: state transitions, side effects, returned values
- **Utilities/functions**: expected output, boundary conditions, error handling

## Example

Source: `hooks/use-upload.ts` → Test: `hooks/__tests__/use-upload.test.ts`  
Source: `components/RecorderPanel.tsx` → Test: `components/__tests__/RecorderPanel.test.tsx`
<!-- END:test-writing-rules -->
