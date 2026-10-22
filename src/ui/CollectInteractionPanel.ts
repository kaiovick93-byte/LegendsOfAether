import {getItemDefinition} from '../items/itemCatalog';
import {ContextualInteractionPanel, type ContextualInteractionScene,
  type ContextualInteractionTarget} from './ContextualInteractionPanel';

type CollectScene = ContextualInteractionScene & {loot?: any; collect?: () => void};

// Existing HUD names and original textures, keyed by the unchanged catalog IDs.
const POTION_PRESENTATION = {
  healing_potion: {name: 'Poção de Vida', iconTexture: 'hud_action_healing', nameColor: '#ff7474'},
  mana_potion: {name: getItemDefinition('mana_potion').name, iconTexture: 'hud_action_mana', nameColor: '#75baff'}
};

function readCollectTarget(scene: CollectScene): ContextualInteractionTarget | null {
  const target = scene.prologue?.enabled ? scene.prologue.getInteractionTarget() : null;
  if (target?.collectName) return {sprite: target.sprite, name: target.collectName,
    key: 'E', action: 'Coletar', iconTexture: target.collectIcon,
    iconMaxWidth: 60, iconMaxHeight: 56, actionColor: '#f4eee1'};

  // Only scenes already wired to LootManager.collectNear can offer loose potions.
  // Read the first target selected by E; do not skip earlier non-potion drops.
  if (typeof scene.collect !== 'function' || !scene.player) return null;
  const drop = scene.loot?.getCollectTarget(scene.player.x, scene.player.y);
  const presentation = drop && POTION_PRESENTATION[drop.item.id];
  if (!presentation) return null;
  return {sprite: drop.container, ...presentation, key: 'E', action: 'Coletar',
    iconMaxWidth: 52, iconMaxHeight: 52, actionColor: '#f4eee1'};
}

export class CollectInteractionPanel extends ContextualInteractionPanel {
  constructor(scene: CollectScene) {
    super(scene, () => readCollectTarget(scene), {prefix: 'collect', initialIcon: 'street_crates', compactWhenCrowded: true});
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  destroy() {
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    super.destroy();
  }
}
