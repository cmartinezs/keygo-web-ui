---
description: "Scaffold a new reusable UI component with props interface and Tailwind styling"
argument-hint: "Component name and purpose"
agent: "agent"
---

Create a new reusable component in the keygo-ui project following project conventions.

## Instructions

1. **Create the component** at `src/components/<ComponentName>.tsx`:
   - Named export (not default)
   - Define a `<ComponentName>Props` interface above the component
   - Use Tailwind CSS v4 classes for styling
   - Use shadcn/ui primitives where appropriate (Button, Card, Input, Dialog, etc.)
   - TypeScript strict — no `any`

2. **If the component fetches data**, use `useQuery` from TanStack Query referencing a function in `src/api/`.

3. **Write a basic test** at `src/components/<ComponentName>.test.tsx`:
   - Use `@testing-library/react` with semantic queries (`getByRole`, `getByText`)
   - Mock API calls with MSW if the component fetches data

4. **Reference files:**
   - [src/components/](../src/components/) — Existing components for patterns
   - [src/types/](../src/types/) — Available DTOs
   - [src/api/client.ts](../src/api/client.ts)

## Expected output

- `src/components/<ComponentName>.tsx` — Component with typed props and Tailwind styling
- `src/components/<ComponentName>.test.tsx` — Basic render + interaction tests
