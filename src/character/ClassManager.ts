// @ts-nocheck
import {CLASSES} from './CharacterClass';
export class ClassManager{constructor(){this.current='warrior'}select(player,id){this.current=CLASSES[id]?id:'warrior';player.applyClass(this.current)}load(player,id){this.current=CLASSES[id]?id:'warrior';player.applyClass(this.current)}serialize(){return this.current}getCurrent(){return this.current}}
