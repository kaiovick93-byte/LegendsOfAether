// @ts-nocheck
import {SaveManager} from '../save/SaveManager';
import {legacyWorldPositionToIso} from '../world/AetherTerritoryLayout';

/**
 * Compatibilidade exclusiva para saves antigos. Os Arredores não são mais
 * uma segunda cena: este shim converte a posição legada uma única vez e entra
 * diretamente no território contínuo da AetherCityScene, sem fade ou mapa
 * duplicado.
 */
export class WorldScene extends Phaser.Scene{
  constructor(){super('WorldScene')}
  create(){
    const sm=new SaveManager(),save=sm.load();
    const transition=this.registry.get('transitionSpawn');
    const legacy=transition?.scene==='WorldScene'?transition:save?.scenePositions?.WorldScene;
    const position=Number.isFinite(legacy?.u)&&Number.isFinite(legacy?.v)
      ?{u:legacy.u,v:legacy.v}
      :legacyWorldPositionToIso(legacy);
    this.registry.remove('transitionSpawn');
    this.registry.set('aetherContinuousSpawn',{...position,facing:'up'});
    this.scene.start('AetherCityScene');
  }
}
