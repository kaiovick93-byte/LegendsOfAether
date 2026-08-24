# Round 48 — Expansão visual dos Arredores da Cidade

## O que foi feito
- Ampliação do mapa de `WorldScene` para **4200 x 2400**.
- Expansão visual dos **Arredores da Cidade** mantendo a cidade original coesa.
- Novo layout com:
  - **Fazenda** com casa, galpão, coop, plantações, cercas, carroça e cavalo.
  - **Animais de ambientação** na fazenda: vacas, porcos, galinhas e cavalo.
  - **Dois trabalhadores rurais** como ambientação viva.
  - **Riacho sinuoso** e **lago** como marcos visuais do mapa.
  - **Formações rochosas** e afloramentos de pedra.
  - **Totens/estátuas antigas** com musgo.
  - **Ruínas antigas** para reforço de lore e exploração futura.
  - **Entrada de caverna** com prompt visual **"F - Entrar"**; por enquanto exibe mensagem de que a área ainda não está liberada.
  - **Portal da Floresta** reposicionado para o **extremo direito** do mapa, com aparência inspirada na floresta.
- Atualização do **HUD/Minimapa** com novo tamanho de mundo e novos marcadores.
- Redistribuição dos **spawn points** dos inimigos placeholder para o mapa expandido.
- Novos nomes de localidade no HUD:
  - Fazenda dos Arredores
  - Totens Musgosos
  - Ruínas Antigas
  - Lago do Salgueiro
  - Boca da Caverna
  - Portal da Floresta

## Observações
- Os monstros continuam como placeholder, conforme combinado.
- A caverna já possui presença visual e sinalização, mas ainda não leva a outra área.
- Os assets de alguns animais dos arredores foram resolvidos com **texturas geradas em runtime** para já viabilizar o layout e a leitura visual da área.

## Próximos passos sugeridos
1. Refinar **colisão e circulação** nos arredores após o seu teste.
2. Criar a **quest da fazenda** para liberar a taverna.
3. Implementar os **monstros próprios dos arredores**.
4. Abrir a **caverna** como primeira missão externa.
5. Refinar ainda mais lore visual com pontos menores de interesse e objetos colecionáveis.
