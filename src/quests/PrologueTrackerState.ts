import {PROLOGUE_QUEST_METADATA} from './questData';

export interface TrackedObjective {
  readonly questId: string;
  readonly questName: string;
  readonly objectiveId: string;
  readonly objectiveText: string;
  readonly completed?: boolean;
}

/** Read existing milestones only. Unknown completion is never shown as checked. */
function objectiveCompletion(state): boolean | undefined {
  switch (state.stage) {
    case 'EXAMINE_ROAD_SIGN': return state.tutorials?.interactionComplete;
    case 'DEFEAT_YOUNG_WOLF': return state.encounters?.youngWolf === 'defeated';
    case 'EXAMINE_RUINED_WAYSTONE': return state.waystone?.ruinedExamined;
    case 'COLLECT_TRAVEL_SUPPLIES':
    case 'POTION_HINT_PENDING': return state.tutorials?.collectionComplete;
    case 'INVESTIGATE_ROAD_BLOOD':
    case 'BLOOD_SCENE_WAIT_MOVEMENT': return state.tutorials?.bloodSceneTriggered;
    case 'RETURN_TO_ROAD_FACE_GOBLINS':
    case 'DEFEAT_GOBLIN_SCOUTS': return state.encounters?.goblinScoutsCompleted;
    case 'EXAMINE_ATTACKED_WAGON': return state.discoveries?.cart;
    case 'SPEAK_TO_PATROL':
    case 'VIEW_AETHER':
    case 'ENTER_AETHER':
    case 'FIND_SHELTER_IN_AETHER': return state.tavern?.introCompleted;
    case 'WAYSTONE_RESPONSE': return state.waystone?.reacted;
    // COMPLETED already displays the next instruction (speak to the General).
    // Prologue completion is NOT completion of that new instruction.
    default: return undefined;
  }
}

/** No writes, save migration, quest selection or duplicate objective strings. */
export function readPrologueTrackedObjective(state, objectiveText: string): TrackedObjective | null {
  if (!state || !objectiveText) return null;
  return {
    questId: PROLOGUE_QUEST_METADATA.id,
    questName: PROLOGUE_QUEST_METADATA.title,
    objectiveId: state.stage,
    objectiveText,
    completed: objectiveCompletion(state)
  };
}
