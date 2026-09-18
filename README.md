# Pirate Battle

Um shooter naval 2D desenvolvido com React, TypeScript e PixiJS. O jogador assume o controle de um navio pirata navegando por uma arena, desviando de ilhas e enfrentando navios inimigos ("Shooters" e "Chasers") até o tempo acabar ou sua vida chegar a zero.

## 🚀 Tecnologias e Stack
- **Interface e Menus:** React
- **Linguagem:** TypeScript (Strict Mode)
- **Renderização do Jogo:** PixiJS (via Canvas)
- **Gerenciamento de Estado de Jogo:** Simulação Orientada a Tempo (Delta-time) com OOP.
- **Gerenciamento de Build e Tooling:** Vite + ESLint + TypeScript

## 🕹️ Controles
O jogo suporta múltiplas entradas pelo teclado:
- **Movimentação:** Teclas `W`, `S`, `A`, `D` ou **Setas do Teclado**.
- **Ataque Frontal:** Tecla `Espaço`
- **Ataque Lateral:** Teclas `Q` e `E` (dispara 3 canhões simultâneos de cada lado)
- **Auto-pause:** O jogo é pausado automaticamente se a janela/aba perder o foco.

## ⚠️ Limitações Conhecidas (Restrição de Tempo)
Devido ao prazo rigoroso de entrega da avaliação, as seguintes funcionalidades foram projetadas na arquitetura mas suprimidas da implementação final para focar na fluidez do gameplay obrigatório:
1. **Mocking Avançado e MSW:** A infraestrutura de histórico e ranking prevê a utilização do TanStack Query + Axios, porém foram criados placeholders/despriorizados para focar nos requisitos gráficos obrigatórios do Canvas.
2. **Testes E2E (Playwright):** Como o estado contínuo de combate do Canvas é hostil a testes de regressão visual instantâneos, os testes Playwright precisaram ser despriorizados em função de features de jogabilidade essenciais. 
3. **Touch Controls (Mobile):** O canvas é responsivo, mas o hud on-screen com D-pad não foi implementado. Recomenda-se jogar pelo desktop/teclado.

## 🛠️ Como rodar o projeto localmente

```bash
# 1. Instale as dependências
npm install

# 2. Inicie o servidor de desenvolvimento
npm run dev

# 3. Acesse no navegador.
```
