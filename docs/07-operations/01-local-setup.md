# Setup local

## Comandos principales

```bash
npm run dev
npm run build
npm run lint
npm run format
npm run test
```

## Variables de entorno esperadas

```env
VITE_KEYGO_BASE=http://localhost:8080/keygo-server
VITE_TENANT_SLUG=keygo
VITE_CLIENT_ID=keygo-ui
VITE_REDIRECT_URI=http://localhost:5173/callback
```

## Reglas operativas

- `api-docs.json` es la referencia para integrar backend.
- Si un endpoint no está disponible, se mockea con MSW.
- El puerto local esperado para desarrollo es `5173`.
