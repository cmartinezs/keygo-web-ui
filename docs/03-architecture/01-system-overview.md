# Arquitectura general

KeyGo UI es una SPA React montada sobre Vite con TypeScript estricto.

## Stack

| Capa          | Herramienta                    |
| ------------- | ------------------------------ |
| Bundler       | Vite                           |
| UI            | React                          |
| Lenguaje      | TypeScript strict              |
| Routing       | React Router                   |
| Estado global | Zustand                        |
| Datos remotos | TanStack Query                 |
| HTTP          | Axios                          |
| Formularios   | React Hook Form + Zod          |
| JWT           | jose                           |
| Estilos       | Tailwind CSS + shadcn/ui       |
| Testing       | Vitest + Testing Library + MSW |

## Flujo de datos

`API -> TanStack Query -> container -> props -> presenter`

Zustand queda reservado para estado global de sesión y preferencias compartidas.

## Principios técnicos

1. Tokens solo en memoria.
2. Requests tipadas y desacopladas de la UI.
3. Guards por autenticación y rol desde la capa de routing.
4. Loader global solo para bootstrap crítico; cargas parciales se resuelven localmente.
