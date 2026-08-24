# Round 35A — Fidelidade dos Retratos dos NPCs

Esta atualização parte do Round 34 e substitui os retratos anteriores pelos retratos de alta resolução aprovados, alinhados aos sprites usados no mapa.

Retratos atualizados:
- Aldren Voss / Mercador — turbante vermelho, branco/vermelho/dourado e acessórios de mercador.
- Borin Ferramão / Ferreiro — coque, barba, avental de couro, luvas e ferramentas.
- Elara Veyn / Curandeira — roupa verde e branca, cajado/cristal e identidade herbalista.
- Garrick Brenn / Taverneiro — avental, caneca e aparência correspondente ao sprite.
- Lysandra Vael / Erudita — vestes azuis, livro e acessórios arcanos.
- Maelis Tessara / Artesã — roupa clara/verde, cachecol e ferramentas de costura.
- Mira Edevane / Anciã — cabelos grisalhos, manto verde, cajado/cristal azul.
- Kael Dorn / Guarda do Portão Leste — armadura de aço, tabardo azul e lança.
- Tomas Belmon / Morador — roupa civil marrom e branca, bolsa transversal.
- Darian Kestrel / Viajante — manto vermelho, equipamento de viagem e mochila.

Bren Harrow / Guarda do Sul mantém temporariamente o retrato específico já presente no Round 34, pois o conjunto aprovado desta rodada não contém um novo retrato correspondente ao sprite `south_guard`.

Integração:
- As chaves de preload e `portraitKey` foram mantidas, portanto nenhuma lógica de diálogo precisou ser alterada.
- As novas imagens foram preparadas para a proporção exata da área de retrato da `NpcDialoguePanel` e redimensionadas para 652×880 para manter boa qualidade sem carregar as imagens originais inteiras.
- Fallback por sprite permanece funcionando.
