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
| `src/game.js` | Ponto de entrada fino: só importa `controller/game.js` |
| `vite.config.js` | Plugin que injeta o SDK do Bridge e `base` relativo |
| `public/playgama-bridge-config.json` | Config exigida pelo Bridge |

Organização em MVC (`src/`):

| Pasta | Conteúdo |
|---|---|
| `model/` | `i18n.js` (idioma/traduções), `recipes.js` (receitas), `levels.js` (temas/níveis/slots), `state.js` (estado de jogo `G`, jogador `P`, nível atual) — sem Three.js de renderização |
| `view/` | `scene.js` (cena/câmera/renderer/helpers), `materials.js` (materiais compartilhados), `room.js` (cafeteria + tema "Café Noir"), `stations.js` (estações básicas/fancy, chocolate, pratos), `items.js` (meshes dos itens), `people.js` (bonecos), `hud.js` (DOM: pontuação, tickets, balões, etiquetas, guia de receitas) |
| `controller/` | `input.js` (teclado/clique/botões), `game.js` (interação com estações, spawn de clientes, loop principal, integração com o Bridge) |

Toda a lógica e o visual são os mesmos de antes; é apenas uma reorganização de arquivos para facilitar expandir o jogo.

Rodar: `npx vite` (dev, porta 5173; `?debug` expõe `window.__cafe`). Build: `npx vite build` → `dist/`.

## 3. Mecânicas

**Controles:** WASD/setas movem; Espaço/E interage; Q/X solta o item; botões AÇÃO/SOLTAR; clique no chão ou numa estação leva o cozinheiro até lá (limitado à área andável). O cozinheiro vira de frente para a estação/balcão mais próximo.

**Receitas (nível 1)**
- Espresso: Copo → Máquina (4s) → pegar.
- Latte: Copo → Leite (3s, copo fica preso na máquina) → pegar; ou Espresso → Leite.
- Croissant: Massa → Forno (5s; queima após 6s se não retirado → lixo).

**Receitas extras (desde o nível 2, estação Chocolate, 2,5s)**
- Mocha: Espresso → Chocolate.
- Mocha Latte: Latte → Chocolate.
- Choco Croissant: Croissant → Chocolate.

**Receitas extras (nível 3, estação Mel, 2,5s)**
- Honey Latte: Latte → Mel.
- Waffle com Mel: Croissant → Mel.

No nível 3, os clientes podem pedir qualquer uma das 8 receitas (as 6 dos níveis 1-2 mais as 2 novas de mel), não só as novas.

**Servir:** o pedido só é entregue se o cozinheiro estiver diante de um prato com cliente esperando. Prato vazio: aviso e o item é mantido. Item errado no prato de um cliente: perde 1 coração.

**Vidas e pontuação:** 3 corações (níveis 1-2) ou 4 (níveis 3-4); erro de pedido ou cliente que perde a paciência custa 1; zero = game over. Cada entrega dá 10 pontos + bônus pela paciência restante.

## 4. Níveis

O projeto planejado contém **5 níveis** no total. Atualmente, 3 estão completos:

| | Nível 1 | Nível 2 | Nível 3 |
|---|---|---|---|
| Ambiente | Café aconchegante (madeira clara, tijolo) | "Café Noir": paredes verdes, piso cinza, neon, banquetas, abajur | "Café Dourado": tons quentes, ouro, placa neon, visual sofisticado |
| Clientes simultâneos | 3 | 5 | 7 |
| Spawn | a cada 6–10s | a cada 4–7s | a cada 3–5s |
| Paciência | 55s | 50s | 45s |
| Pratos | 3 | 6 | 7 |
| Máquinas | básicas | "fancy" (cromo/dourado, cúpula de vidro, forno com visor brilhante, fonte de chocolate) | "deluxe" (rosé/mármore) + nova estação de Mel |

Ao vencer um nível, o botão vira "Próximo nível". O nível liberado é salvo no storage do Bridge (`max_level`), junto com `best_score`.
Para testes existe um **dropdown de nível** no HUD que reinicia o jogo no nível escolhido (remover antes de publicar).

## 5. Integração Playgama Bridge

Inicialização antes do jogo, idioma via plataforma, `best_score`/`max_level` no storage do Bridge, pausa, `game_ready`, interstitial no game over, mensagens `level_started`/`level_completed`/`level_failed`.

## 6. Histórico do que foi feito

1. Brainstorming e escolha de um cozy game de cafeteria em Three.js.
2. Evolução para cozinha estilo Overcooked, visual moderno.
3. Integração do Bridge SDK e build com Vite.
4. Ajustes por feedback: direção do movimento, etiquetas nas máquinas, painel de receitas, leite com barra de espera, soltar itens, cozinheiro/clientes de frente, pratos no balcão, animação de membros, balões com emoji, corações em vez de perder na hora, clique para andar, regra de entrega no prato certo, correções de pedidos.
5. Nível 2 (novo ambiente, 5 clientes), novos pratos, máquinas fancy e seletor de nível para testes.
6. Nível 3 (novo ambiente "Café Dourado", 7 clientes, estação de Mel com 2 receitas, máquinas "deluxe", spawn e paciência mais desafiadores).

## 7. Pendências para publicar na Playgama

Nada foi publicado ainda. Requisitos do checklist ainda em aberto:
- Música e SFX em arquivo real (ogg/mp3) + botão de mudo + tratamento de áudio/pausa do Bridge.
- Substituir emojis usados como ícones (balões, tickets, HUD) por arte própria.
- Tutorial e dificuldade progressiva.
- Controles de toque e bloqueio do menu de long-press no mobile.
- Remover o dropdown de testes.

Fluxo de publicação (após aprovação): `get_game_checklist` → `create_application` (título em inglês) → `npx vite build` → zip do conteúdo de `dist/` → upload e polling do status → 3 capas (quadrada, retrato, paisagem) → `update_application_form` → `publish_sandbox` → link público.

## Atualização: níveis 3 e 4

- **Nível 3 (Café Dourado):** máquinas deluxe, estação de Mel, 7 clientes, 4 corações, fileira de mesas e porta dourada.
- **Nível 4 (Café Royal):** sala maior (mais profundidade, câmera com zoom out), 8 clientes simultâneos, 4 corações, novo pedido **Honey Espresso** (Espresso → Mel), chef com traje elegante (jaqueta preta com detalhes dourados, gravata-borboleta e toque alto), pilares de mármore, topiárias, duas fileiras de mesas e porta real com carpete violeta.
- O croissant não queima mais no forno.
