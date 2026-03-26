---
description: "Use when writing, reviewing, or fixing tests. Covers Vitest, Testing Library, MSW handlers, and patterns for unit, integration, and component tests."
---

# Testing — Vitest + Testing Library + MSW

## Stack de testing

| Herramienta | Uso |
|-------------|-----|
| **Vitest** | Test runner + assertions |
| **@testing-library/react** | Queries de usuario (ByRole, ByText…) |
| **@testing-library/user-event** | Interacciones de usuario (type, click…) |
| **MSW (Mock Service Worker)** | Mock de endpoints HTTP |

## Estructura de archivos

- Tests unitarios junto al módulo: `src/api/tenants.test.ts`
- Tests de componentes junto al componente: `src/components/MyComponent.test.tsx`
- Handlers MSW en: `src/mocks/handlers.ts`

## Convenciones de test

```ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('MyComponent', () => {
  it('muestra el título correctamente', () => {
    render(<MyComponent title="Hola" />)
    expect(screen.getByRole('heading', { name: 'Hola' })).toBeInTheDocument()
  })
})
```

- Preferir queries semánticas: `getByRole` > `getByText` > `getByTestId`.
- No usar `getByTestId` salvo cuando no hay alternativa semántica.
- Un test = un comportamiento. Evitar test que validen múltiples cosas.

## Mocking de API con MSW

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/v1/tenants', () => {
    return HttpResponse.json({
      success: true,
      message: 'OK',
      responseCode: 'SUCCESS',
      data: [{ id: '1', slug: 'acme', name: 'Acme Corp' }],
    })
  }),
]
```

- Respetar el shape `BaseResponse<T>` en todos los handlers MSW.
- Usar `http.get` / `http.post` / `http.put` / `http.delete` de `msw`.

## Tests de autenticación

- No mockear el store de Zustand directamente — usar `preloadedState` o wrappers de provider.
- Para simular distintos roles, configurar `tokenStore` con los roles deseados antes del test.

## Qué NO testear

- Implementación interna de componentes (state interno, refs).
- Estilos CSS / clases de Tailwind.
- La librería shadcn/ui en sí misma.
