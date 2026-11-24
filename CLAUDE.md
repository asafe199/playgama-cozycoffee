# Cozy Café — contexto para agentes

Jogo Three.js (Vite) a ser publicado na Playgama. Leia `DOCUMENTACAO.md` e `docs/superpowers/specs/2026-11-24-cozy-cafe-design.md`.

- Instalar/rodar: `npm install && npx vite` (use `?debug` para expor `window.__cafe`). Build: `npx vite build`.
- Jogo em MVC sob `src/`: `model/` (dados e estado), `view/` (cena Three.js e HUD), `controller/` (input e game loop). `src/game.js` só importa `controller/game.js`. Bridge SDK é carregado antes via `src/main.js` e `vite.config.js`.
- Nada foi publicado ainda. Publicar só com aprovação do usuário (MCP `playgama-developer-cabinet`; ver pendências na documentação).
- Usuário fala português; commitar em marcos lógicos.
