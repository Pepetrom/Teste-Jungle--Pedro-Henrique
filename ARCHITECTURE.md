# Arquitetura e Decisões de Engenharia

O projeto "Pirate Battle" utiliza uma arquitetura separada entre a Árvore do DOM (React) e a Simulação WebGL (PixiJS), garantindo alta performance e controle estrito do ciclo de vida dos componentes.

## Separação de Responsabilidades (React x PixiJS)
- **UI e Menus (React):** O React atua estritamente fora do escopo de 60 FPS da simulação de jogo. Telas como Menu, Ranking, História e Pausa são renderizadas pelo DOM padrão, oferecendo acessibilidade total (leitura de tela, navegação por tab) nativa. O React monta o container onde o canvas será instanciado.
- **Simulação Contínua (PixiJS):** A engine do Pixi toma o controle dentro da classe `GameApp.ts`, onde toda a lógica de física, renderização de texturas pesadas (Sprites, Parallax de fundo, AnimatedSprites) reside. Callbacks são expostas para informar ao React quando um evento que afeta a UI (como atualização de Placar/Tempo) ocorre, garantindo um binding unilateral e leve (one-way data flow) sem re-renders abusivos do React a cada frame.

## Ciclo da Simulação e Independência de Framerate
O núcleo da simulação em `GameApp.ts` utiliza `deltaSeconds` para basear os movimentos no tempo ao invés de quadros. 
```typescript
const deltaSeconds = delta / 60;
this.player.x += speed * deltaSeconds;
```
Isso garante que computadores mais fracos (que rodem a 30 FPS, por exemplo) terão o navio percorrendo a mesma distância absoluta que computadores a 60 FPS ou 144 FPS.

## Gerenciamento de Recursos
- **Carregamento Otimizado (Spritesheets):** Evitamos dezenas de conexões concorrentes empacotando navios e texturas estáticas em JSON Spritesheets (`PIXI.Assets.load()`).
- **Estados de Dano e Reciclagem Visual:** Não trocamos as Sprites (nós visuais na árvore) quando os navios tomam dano. O `Entity.sprite.texture` é simplesmente re-atribuído a um estado deteriorado (`stateTextures[idx]`), mantendo as referências e transformações ativas.
- **Limpeza Profunda:** Sempre que a partida encerra (ou é reiniciada/abandonada no Pause), a classe `GameApp.ts` invoca `destroy(true, true)` em todo o conteúdo gráfico, e anula as referências internas para que o Garbage Collector do Javascript limpe a RAM imediatamente.

## Tratamento de Dados (Local x Remoto)
Na arquitetura proposta, o módulo de histórico deveria conectar-se via Axios/TanStack Query em cima da mock api do MSW. 
Contudo, em virtude da limitação drástica do deadline temporal para submissão do teste, o escopo foi restringido:
A simulação persistiu configurada para armazenamento em memória temporal / `localStorage`, evitando quebrar a aplicação caso endpoints de MSW ficassem ausentes na máquina do avaliador ao compilar rapidamente o build de deploy. Modos offline e persistência leve em localStorage foram priorizados para manter a robustez da aplicação.
