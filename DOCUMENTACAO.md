# Cozy Café — Documentação do projeto

## 1. Ideia

Um *cozy game* estilo Overcooked em 3D isométrico (Three.js) para publicar na **Playgama**.
Você é o cozinheiro de uma cafeteria: pega copos e massa, usa as máquinas, e entrega o pedido certo
no prato do cliente antes que a paciência dele acabe.

- Câmera isométrica ortográfica, visual moderno/aconchegante, bonecos com animação de braços e pernas.
- Turno de 150s. Terminando o turno, passa-se para o próximo nível.
- Idiomas: PT/EN (detectado via `platform.language` do Bridge; inglês é o fallback).

## 2. Stack e estrutura

- Vite + Three.js + `@playgama/bridge` (SDK obrigatório da Playgama).

| Arquivo | Função |
|---|---|
| `index.html` | HUD (pontos, tempo, seletor de nível, corações), tickets de pedidos, mensagens, botões AÇÃO/SOLTAR, overlay |
| `src/main.js` | Bootstrap: `bridge.initialize()` e só depois importa `game.js` |
| `src/game.js` | Todo o jogo (cena, estações, receitas, clientes, loop, entrada, i18n) |
| `vite.config.js` | Plugin que injeta o SDK do Bridge e `base` relativo |
| `public/playgama-bridge-config.json` | Config exigida pelo Bridge |

Rodar: `npx vite` (dev, porta 5173; `?debug` expõe `window.__cafe`). Build: `npx vite build` → `dist/`.

## 3. Mecânicas

**Controles:** WASD/setas movem; Espaço/E interage; Q/X solta o item; botões AÇÃO/SOLTAR; clique no chão ou numa estação leva o cozinheiro até lá (limitado à área andável). O cozinheiro vira de frente para a estação/balcão mais próximo.

**Receitas (nível 1)**
- Espresso: Copo → Máquina (4s) → pegar.
- Latte: Copo → Leite (3s, copo fica preso na máquina) → pegar; ou Espresso → Leite.
- Croissant: Massa → Forno (5s; queima após 6s se não retirado → lixo).

**Receitas extras (nível 2, estação Chocolate, 2,5s)**
- Mocha: Espresso → Chocolate.
- Mocha Latte: Latte → Chocolate.
- Choco Croissant: Croissant → Chocolate.

**Servir:** o pedido só é entregue se o cozinheiro estiver diante de um prato com cliente esperando. Prato vazio: aviso e o item é mantido. Item errado no prato de um cliente: perde 1 coração.

**Vidas e pontuação:** 3 corações; erro de pedido ou cliente que perde a paciência custa 1; zero = game over. Cada entrega dá 10 pontos + bônus pela paciência restante.

## 4. Níveis

| | Nível 1 | Nível 2 |
|---|---|---|
| Ambiente | Café aconchegante (madeira clara, tijolo) | "Café Noir": paredes verdes, piso cinza, neon, banquetas, abajur |
| Clientes simultâneos | 3 | 5 |
| Spawn | a cada 6–10s | a cada 4–7s |
| Paciência | 55s | 50s |
| Pratos | 3 | 6 |
| Máquinas | básicas | "fancy" (cromo/dourado, cúpula de vidro, forno com visor brilhante, fonte de chocolate) |

Ao vencer o nível 1, o botão vira "Próximo nível". O nível liberado é salvo no storage do Bridge (`max_level`), junto com `best_score`.
Para testes existe um **dropdown de nível** no HUD que reinicia o jogo no nível escolhido (remover antes de publicar).

## 5. Integração Playgama Bridge

Inicialização antes do jogo, idioma via plataforma, `best_score`/`max_level` no storage do Bridge, pausa, `game_ready`, interstitial no game over, mensagens `level_started`/`level_completed`/`level_failed`.

## 6. Histórico do que foi feito

1. Brainstorming e escolha de um cozy game de cafeteria em Three.js.
2. Evolução para cozinha estilo Overcooked, visual moderno.
3. Integração do Bridge SDK e build com Vite.
4. Ajustes por feedback: direção do movimento, etiquetas nas máquinas, painel de receitas, leite com barra de espera, soltar itens, cozinheiro/clientes de frente, pratos no balcão, animação de membros, balões com emoji, corações em vez de perder na hora, clique para andar, regra de entrega no prato certo, correções de pedidos.
5. Nível 2 (novo ambiente, 5 clientes), novos pratos, máquinas fancy e seletor de nível para testes.

## 7. Pendências para publicar na Playgama

Nada foi publicado ainda. Requisitos do checklist ainda em aberto:
- Música e SFX em arquivo real (ogg/mp3) + botão de mudo + tratamento de áudio/pausa do Bridge.
- Substituir emojis usados como ícones (balões, tickets, HUD) por arte própria.
- Tutorial e dificuldade progressiva.
- Controles de toque e bloqueio do menu de long-press no mobile.
- Remover o dropdown de testes.

Fluxo de publicação (após aprovação): `get_game_checklist` → `create_application` (título em inglês) → `npx vite build` → zip do conteúdo de `dist/` → upload e polling do status → 3 capas (quadrada, retrato, paisagem) → `update_application_form` → `publish_sandbox` → link público.
