# WAYSTONE INTEGRATION

Arquivos adicionados/alterados neste patch:

- `assets/images/environment/world/waystone_dormant.png`
- `src/world/Waystone.ts`
- `src/scenes/PreloadScene.ts`

## Resultado
- O Marco de Senda agora usa o novo asset visual `monumento_arcano_adormecido` em versão desativada.
- O marco continua presente na Cidade de Aether e na Floresta.
- A mensagem permanece indicando que o sistema de teletransporte ainda não foi ativado.
- Caso o asset não carregue por algum motivo, o código mantém um fallback visual simples para evitar quebra.
