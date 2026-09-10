// @ts-nocheck
import {GAME_WIDTH,GAME_HEIGHT} from '../config';

/**
 * Centraliza uma tela desenhada na referência histórica 960×540 dentro do
 * canvas nativo redimensionável. Só há deslocamento: nenhuma arte é ampliada.
 */
export function centerReferenceViewport(scene){
  const scrollX=(GAME_WIDTH-scene.scale.width)/2;
  const scrollY=(GAME_HEIGHT-scene.scale.height)/2;
  scene.cameras.main.setScroll(scrollX,scrollY).setZoom(1).setRoundPixels(false);
}
