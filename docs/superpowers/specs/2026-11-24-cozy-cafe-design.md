# Cozy Café — Design Spec

**Status:** implementado (níveis 1–2), não publicado. **Alvo:** Playgama (Bridge SDK obrigatório).

## Objetivo
Cozy game 3D isométrico estilo Overcooked: o jogador é o cozinheiro de uma cafeteria, prepara bebidas e comidas e entrega o pedido certo no prato do cliente antes que a paciência acabe.

## Decisões de design
- **Three.js + Vite** com câmera ortográfica isométrica; bonecos procedurais com animação de braços/pernas.
- **Entrada:** WASD/setas, Espaço/E (ação), Q/X (soltar), botões AÇÃO/SOLTAR, clique para andar até o ponto/estação (área andável limitada).
- **Estações como máquina de estados** (`brewing|steaming|baking|dipping → done → burnt`), com barra de progresso e item preso na máquina.
- **Entrega por prato:** só vale se o cozinheiro estiver diante de um prato com cliente; item errado custa 1 coração.
- **Vidas:** 3 corações; erro ou cliente impaciente = −1; 0 = game over. Turno de 150s.
- **Níveis dirigidos por dados** (`LEVELS`, `THEMES`, `SLOT_SETS`): `applyLevel(n)` troca cores, decoração, pratos, máquinas e receitas.
- **i18n:** PT/EN via `platform.language`; EN é o fallback.
- **Bridge:** init antes do jogo, storage (`best_score`, `max_level`), pausa, `game_ready`, interstitial no game over, `level_*`.

## Receitas
| Nível | Prato | Fluxo |
|---|---|---|
| 1 | Espresso | Copo → Máquina (4s) |
| 1 | Latte | Copo → Leite (3s) ou Espresso → Leite |
| 1 | Croissant | Massa → Forno (5s; queima em +6s) |
| 2 | Mocha | Espresso → Chocolate (2,5s) |
| 2 | Mocha Latte | Latte → Chocolate |
| 2 | Choco Croissant | Croissant → Chocolate |

## Níveis
- **1:** café aconchegante, 3 clientes, spawn 6–10s, paciência 55s, máquinas básicas.
- **2:** "Café Noir", 5 clientes, spawn 4–7s, paciência 50s, máquinas fancy (dourado/cromo) e estação de chocolate.

## Fora de escopo até agora / pendências
Áudio real + mute, ícones sem emoji, tutorial, dificuldade progressiva, controles de toque, remover o dropdown de testes, publicação.
