import type {GameObjects} from 'phaser';
import {ContextualInteractionPanel, type ContextualInteractionScene} from './ContextualInteractionPanel';

export const EXAMINE_INTERACTION_ASSETS = [
  {key: 'interacao_moldura_dourada', path: 'assets/images/ui/interaction/examinar/interacao_moldura_dourada.png'},
  {key: 'interacao_moldura_azul_ativada', path: 'assets/images/ui/interaction/examinar/interacao_moldura_azul_ativada.png'},
  {key: 'interacao_icone_olho_dourado', path: 'assets/images/ui/interaction/examinar/interacao_icone_olho_dourado.png'},
  {key: 'interacao_tecla_vazia', path: 'assets/images/ui/interaction/examinar/interacao_tecla_vazia.png'}
] as const;

type ExamineTarget = {sprite?: GameObjects.Image; examineName?: string; activated?: boolean};

/** Adapter for the two approved F targets; interaction and saved flags stay in the prologue. */
export class ExamineInteractionPanel extends ContextualInteractionPanel {
  constructor(scene: ContextualInteractionScene, readTarget: () => ExamineTarget | null) {
    super(scene, () => {
      const target = readTarget();
      return target?.examineName ? {...target, name: target.examineName, key: 'F', action: 'Examinar',
        iconTexture: 'interacao_icone_olho_dourado'} : null;
    }, {prefix: 'examine', initialIcon: 'interacao_icone_olho_dourado', iconName: 'examineEye'});
  }
}
