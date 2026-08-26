# Round 66 — Contato e Profundidade da Cidade

## Correções entregues

- A colisão dos quatro lados da muralha agora cobre a base visível inteira e usa um envelope contínuo, sem frestas entre módulos.
- Os dois corredores de portão permanecem livres, enquanto qualquer tentativa de entrar na pedra fora deles é bloqueada.
- Os módulos visuais de cada trecho do muro têm o mesmo comprimento, altura, sobreposição e alinhamento em pixels.
- O contorno dourado exige que a linha dos pés do jogador esteja atrás da linha de apoio do objeto; contato frontal não ativa mais o efeito.
- Aldren, Lysandra, Borin, Elara, Garrick e Maelis foram alinhados às entradas visíveis, entre 12 e 14 pixels à frente de suas fachadas.
- O ateliê de Maelis foi transferido para um lote a sudoeste da praça, fora da projeção da taverna e da botica.
- As rotas do morador, cachorro e gato foram recalculadas para o novo lote. O gato continua caminhando horizontalmente na tela.
- As seis folhas de ação profissional foram reconstruídas em quatro células de `256x256`, com proporção corporal e apoio dos pés estabilizados. Gestos altos conservam espaço para copo, martelo e cajado.
- Saves anteriores recebem margem segura em relação ao novo envelope dos muros.

## Verificação

```bash
npm run check
npm run validate:isometric-city
npm run build
```

A auditoria também produz e confere a planta em `ROUND66_CITY_VISUAL_QA.png`.
