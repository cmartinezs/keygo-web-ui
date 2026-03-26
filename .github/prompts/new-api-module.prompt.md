---
description: "Add a new API module for a backend domain (endpoint functions following BaseResponse pattern)"
argument-hint: "Domain name and list of endpoints to implement"
agent: "agent"
---

Create a new API module in `src/api/` for a backend domain following keygo-ui conventions.

## Instructions

1. **Create the module** at `src/api/<domain>.ts`:
   - Use the shared Axios client from `src/api/client.ts`
   - Each function returns a typed Promise (unwrapping `BaseResponse<T>.data`)
   - Naming: `get*`, `create*`, `update*`, `delete*`

2. **Import types** from `src/types/` — never define DTOs inside the API module.

3. **If the endpoint doesn't exist yet** in the backend:
   - Add a MSW handler in `src/mocks/handlers.ts` matching the same URL and method
   - Mark the function with a comment `// ⏳ pendiente`

4. **Pattern:**
   ```ts
   import { apiClient } from './client'
   import type { BaseResponse } from '@/types/base'
   import type { MyData, CreateMyDataRequest } from '@/types/myDomain'

   export async function getMyItems(): Promise<MyData[]> {
     const res = await apiClient.get<BaseResponse<MyData[]>>('/my-endpoint')
     return res.data.data
   }

   export async function createMyItem(payload: CreateMyDataRequest): Promise<MyData> {
     const res = await apiClient.post<BaseResponse<MyData>>('/my-endpoint', payload)
     return res.data.data
   }
   ```

5. **Reference files:**
   - [src/api/client.ts](../src/api/client.ts)
   - [src/types/base.ts](../src/types/base.ts)
   - [src/mocks/handlers.ts](../src/mocks/handlers.ts)
   - [docs/FRONTEND_DEVELOPER_GUIDE.md](../docs/FRONTEND_DEVELOPER_GUIDE.md) — Sección 14 (inventario de endpoints)

## Expected output

- `src/api/<domain>.ts` — API functions for the domain
- (if needed) Updated `src/mocks/handlers.ts` — MSW handlers for pending endpoints
- (if new types) `src/types/<domain>.ts` — DTOs for the domain
