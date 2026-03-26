---
description: "Scaffold a new Zustand store for a new domain feature"
argument-hint: "Store name and state shape description"
agent: "agent"
---

Create a new Zustand store for a domain feature in keygo-ui following project conventions.

## Instructions

1. **Create the store** at `src/stores/<featureName>Store.ts`:
   - Use Zustand 5 `create()` with an interface for the state + actions
   - Named export for the hook: `use<FeatureName>Store`
   - No persistence to localStorage — memory only

2. **Type the state and actions** strictly:
   ```ts
   interface FeatureStore {
     items: Item[]
     selectedId: string | null
     setItems: (items: Item[]) => void
     select: (id: string) => void
     clear: () => void
   }
   ```

3. **Use the store in components** via the hook, selecting only the needed slice to avoid unnecessary re-renders.

4. **Reference files:**
   - [src/auth/tokenStore.ts](../src/auth/tokenStore.ts) — Example store structure
   - [src/types/](../src/types/) — DTOs to type state

## Expected output

- `src/stores/<featureName>Store.ts` — Zustand store with typed state and actions
