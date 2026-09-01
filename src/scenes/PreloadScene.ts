// @ts-nocheck
import {PLAYER_APPEARANCE_ORDER,PLAYER_DIRECTION_ROWS,PLAYER_VISUAL_STATES,playerOutlineTextureKey,playerTextureKey} from '../character/PlayerAppearance';
export class PreloadScene extends Phaser.Scene{
  constructor(){super('PreloadScene')}
  preload(){
    // Os dois atlases 2D abaixo ainda pertencem aos trabalhadores da fazenda
    // nos Arredores. Os antigos NPCs urbanos foram substituídos por versões
    // isométricas e não são mais carregados.
    this.load.spritesheet('resident','assets/images/characters/npcs/resident.png',{frameWidth:128,frameHeight:160});
    this.load.spritesheet('traveler','assets/images/characters/npcs/traveler.png',{frameWidth:128,frameHeight:160});
    this.load.spritesheet('city_dog','assets/images/characters/ambient/city_dog.png',{frameWidth:144,frameHeight:96});this.load.spritesheet('city_cat','assets/images/characters/ambient/city_cat.png',{frameWidth:144,frameHeight:96});this.load.spritesheet('city_bird','assets/images/characters/ambient/city_bird.png',{frameWidth:64,frameHeight:48});this.load.spritesheet('city_rat_gray','assets/images/characters/ambient/city_rat_gray.png',{frameWidth:112,frameHeight:64});this.load.spritesheet('city_rat_brown','assets/images/characters/ambient/city_rat_brown.png',{frameWidth:112,frameHeight:64});this.load.spritesheet('city_rat_dark','assets/images/characters/ambient/city_rat_dark.png',{frameWidth:112,frameHeight:64});this.load.spritesheet('city_chicken_white','assets/images/characters/ambient/city_chicken_white.png',{frameWidth:80,frameHeight:80});this.load.spritesheet('city_chicken_brown','assets/images/characters/ambient/city_chicken_brown.png',{frameWidth:80,frameHeight:80});this.load.spritesheet('city_chicken_cream','assets/images/characters/ambient/city_chicken_cream.png',{frameWidth:80,frameHeight:80});
    this.load.image('merchant_iso','assets/images/characters/npcs/isometric/merchant_iso.png');
    this.load.image('blacksmith_iso','assets/images/characters/npcs/isometric/blacksmith_iso.png');
    this.load.image('blacksmith_iso_empty','assets/images/characters/npcs/isometric/blacksmith_iso_empty.png');
    this.load.image('blacksmith_hammer','assets/images/characters/npcs/isometric/blacksmith_hammer.png');
	    this.load.image('healer_iso','assets/images/characters/npcs/isometric/healer_iso.png');
	    this.load.image('healer_iso_devastated','assets/images/characters/npcs/isometric/healer_iso_devastated.png');
    this.load.image('tavernkeeper_iso','assets/images/characters/npcs/isometric/tavernkeeper_iso.png');
    this.load.image('scholar_iso','assets/images/characters/npcs/isometric/scholar_iso.png');
    this.load.image('artisan_iso','assets/images/characters/npcs/isometric/artisan_iso.png');
    this.load.image('elder_mira_iso','assets/images/characters/npcs/isometric/elder_mira_iso.png');
    this.load.image('general_iso','assets/images/characters/npcs/isometric/general_iso.png');
    this.load.image('guard_iso','assets/images/characters/npcs/isometric/guard_iso.png');
    this.load.image('south_guard_iso','assets/images/characters/npcs/isometric/south_guard_iso.png');
    // Round 66: as ações usam células maiores para manter a mesma escala do
    // repouso, a mesma linha dos pés e espaço para gestos altos sem recorte.
    this.load.spritesheet('merchant_iso_action','assets/images/characters/npcs/isometric/merchant_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('blacksmith_iso_action','assets/images/characters/npcs/isometric/blacksmith_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('healer_iso_action','assets/images/characters/npcs/isometric/healer_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('tavernkeeper_iso_action','assets/images/characters/npcs/isometric/tavernkeeper_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('scholar_iso_action','assets/images/characters/npcs/isometric/scholar_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('artisan_iso_action','assets/images/characters/npcs/isometric/artisan_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('guard_iso_action','assets/images/characters/npcs/isometric/guard_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('south_guard_iso_action','assets/images/characters/npcs/isometric/south_guard_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('elder_mira_iso_action','assets/images/characters/npcs/isometric/elder_mira_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('general_iso_action','assets/images/characters/npcs/isometric/general_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('resident_iso_walk','assets/images/characters/npcs/isometric/resident_iso_walk.png',{frameWidth:208,frameHeight:224});
    this.load.spritesheet('traveler_iso_walk','assets/images/characters/npcs/isometric/traveler_iso_walk.png',{frameWidth:208,frameHeight:224});
    this.load.spritesheet('city_ground','assets/images/environment/city/city_ground.png',{frameWidth:32,frameHeight:32});
    this.load.image('merchant_shop','assets/images/environment/buildings/merchant_shop.png');
    this.load.image('blacksmith_shop','assets/images/environment/buildings/blacksmith_shop.png');
    this.load.spritesheet('chimney_smoke','assets/images/environment/buildings/chimney_smoke.png',{frameWidth:96,frameHeight:96});
	    this.load.image('healer_house','assets/images/environment/buildings/healer_house.png');
	    this.load.image('healer_house_abandoned','assets/images/environment/buildings/healer_house_abandoned.png');
    this.load.image('tavern_house','assets/images/environment/buildings/tavern_house.png');
    this.load.image('scholar_house','assets/images/environment/buildings/scholar_house.png');
    this.load.image('artisan_house','assets/images/environment/buildings/artisan_house.png');
    this.load.image('residential_house_red','assets/images/environment/buildings/residential_house_red.png');
    this.load.image('residential_house_blue','assets/images/environment/buildings/residential_house_blue.png');
    this.load.image('residential_house_green','assets/images/environment/buildings/residential_house_green.png');
    this.load.image('residential_house_orange','assets/images/environment/buildings/residential_house_orange.png');
    this.load.image('waystone_dormant','assets/images/environment/world/waystone_dormant.png');
    this.load.image('city_fountain','assets/images/environment/city/props/city_fountain.png');
    this.load.image('city_tree','assets/images/environment/city/props/city_tree.png');
    this.load.image('street_crates','assets/images/environment/city/props/street_crates.png');
    this.load.image('street_barrels','assets/images/environment/city/props/street_barrels.png');
    this.load.image('street_logs','assets/images/environment/city/props/street_logs.png');
    this.load.image('street_lamppost','assets/images/environment/city/props/street_lamppost.png');
    this.load.image('street_flower_fence','assets/images/environment/city/props/street_flower_fence.png');
    this.load.image('chicken_coop','assets/images/environment/city/props/chicken_coop.png');
    this.load.image('city_chicken_fence','assets/images/environment/city/props/city_chicken_fence.png');
    this.load.image('iso_grass_patch','assets/images/environment/isometric/isometric_grass_patch.png');
    this.load.spritesheet('iso_grass_tufts','assets/images/environment/isometric/isometric_grass_tufts.png',{frameWidth:96,frameHeight:96});
    this.load.image('iso_city_wall','assets/images/environment/isometric/isometric_city_wall.png');
    this.load.image('iso_city_gate','assets/images/environment/isometric/isometric_city_gate.png');
    this.load.image('iso_city_gate_east','assets/images/environment/isometric/isometric_city_gate_east.png');
    this.load.image('iso_city_grass','assets/images/environment/isometric/isometric_city_grass.png');
    this.load.image('iso_city_pavement','assets/images/environment/isometric/isometric_city_pavement.png');
    this.load.image('iso_residential_ground','assets/images/environment/isometric/isometric_residential_ground.png');
    this.load.image('outskirts_dirt_path','assets/images/environment/outskirts/outskirts_dirt_path.png');
    this.load.image('outskirts_water_patch','assets/images/environment/outskirts/outskirts_water_patch.png');
    this.load.image('outskirts_rock_cluster','assets/images/environment/outskirts/outskirts_rock_cluster.png');
    this.load.image('outskirts_wood_bridge','assets/images/environment/outskirts/outskirts_wood_bridge.png');
    this.load.image('outskirts_fence_segment','assets/images/environment/outskirts/outskirts_fence_segment.png');
    this.load.image('outskirts_reeds','assets/images/environment/outskirts/outskirts_reeds.png');
    this.load.image('outskirts_bush_cluster','assets/images/environment/outskirts/outskirts_bush_cluster.png');
    this.load.image('outskirts_grass_patch','assets/images/environment/outskirts/outskirts_grass_patch.png');
    this.load.image('farmhouse','assets/images/environment/outskirts/farm/farmhouse.png');
    this.load.image('farm_barn','assets/images/environment/outskirts/farm/barn.png');
    this.load.image('farm_empty_wagon','assets/images/environment/outskirts/farm/empty_wagon.png');
    this.load.image('farm_crop_wheat','assets/images/environment/outskirts/farm/crop_wheat.png');
    this.load.image('farm_crop_cabbage','assets/images/environment/outskirts/farm/crop_cabbage.png');
    this.load.image('farm_crop_vegetables','assets/images/environment/outskirts/farm/crop_vegetables.png');
    this.load.spritesheet('farm_cow','assets/images/characters/ambient/farm/cow.png',{frameWidth:112,frameHeight:84});
    this.load.spritesheet('farm_pig','assets/images/characters/ambient/farm/pig.png',{frameWidth:96,frameHeight:72});
    this.load.spritesheet('farm_horse','assets/images/characters/ambient/farm/horse.png',{frameWidth:128,frameHeight:96});
    this.load.image('npc_key_f','assets/images/ui/npc_interaction/keycap_f.png');
    this.load.image('npc_key_t','assets/images/ui/npc_interaction/keycap_t.png');
    this.load.image('bottom_hud_frame','assets/images/ui/hud/bottom_hud_frame.png');
    this.load.image('dialogue_body_panel','assets/images/ui/dialogue/dialogue_body_panel.png');
    this.load.image('dialogue_header_bar','assets/images/ui/dialogue/dialogue_header_bar.png');
    this.load.image('dialogue_portrait_frame','assets/images/ui/dialogue/dialogue_portrait_frame.png');
    this.load.image('dialogue_button_blue','assets/images/ui/dialogue/dialogue_button_blue.png');
    this.load.image('dialogue_button_green','assets/images/ui/dialogue/dialogue_button_green.png');
    this.load.image('dialogue_button_red','assets/images/ui/dialogue/dialogue_button_red.png');
    this.load.image('dialogue_key_esc','assets/images/ui/dialogue/dialogue_key_esc.png');
    this.load.image('portrait_aldren','assets/images/ui/dialogue/portraits/portrait_aldren.png');
    this.load.image('portrait_borin','assets/images/ui/dialogue/portraits/portrait_borin.png');
	    this.load.image('portrait_elara','assets/images/ui/dialogue/portraits/portrait_elara.png');
	    this.load.image('portrait_elara_devastated','assets/images/ui/dialogue/portraits/portrait_elara_devastated.png');
    this.load.image('portrait_garrick','assets/images/ui/dialogue/portraits/portrait_garrick.png');
    this.load.image('portrait_lysandra','assets/images/ui/dialogue/portraits/portrait_lysandra.png');
    this.load.image('portrait_maelis','assets/images/ui/dialogue/portraits/portrait_maelis.png');
    this.load.image('portrait_mira','assets/images/ui/dialogue/portraits/portrait_mira.png');
    this.load.image('portrait_general','assets/images/ui/dialogue/portraits/portrait_general.png');
    this.load.image('portrait_kael','assets/images/ui/dialogue/portraits/portrait_kael.png');
    this.load.image('portrait_bren','assets/images/ui/dialogue/portraits/portrait_bren.png');
    this.load.image('portrait_tomas','assets/images/ui/dialogue/portraits/portrait_tomas.png');
    this.load.image('portrait_darian','assets/images/ui/dialogue/portraits/portrait_darian.png');
    for(const appearanceId of PLAYER_APPEARANCE_ORDER){
      for(const state of PLAYER_VISUAL_STATES){
        const key=playerTextureKey(appearanceId,state);
        this.load.spritesheet(key,`assets/images/characters/player/${appearanceId}_${state}.png`,{frameWidth:96,frameHeight:96});
        this.load.spritesheet(playerOutlineTextureKey(appearanceId,state),`assets/images/characters/player/${appearanceId}_${state}_outline.png`,{frameWidth:96,frameHeight:96});
      }
    }
    this.load.spritesheet('elder_feeder_iso','assets/images/characters/ambient/elder_feeder_iso.png',{frameWidth:208,frameHeight:224});
    const g=this.add.graphics();
    g.fillStyle(0xff6b6b).fillRect(0,0,32,32);g.generateTexture('enemy',32,32);
    g.clear();g.fillStyle(0x4b9b5a).fillRect(0,0,32,32);g.generateTexture('grass',32,32);
    g.clear();g.fillStyle(0xb59b71).fillRect(0,0,32,32);g.generateTexture('path',32,32);
    g.clear();g.fillStyle(0x3c8a50).fillCircle(16,11,12);g.fillStyle(0x6b4934).fillRect(12,12,8,20);g.generateTexture('tree-placeholder',32,32);
    g.clear();g.fillStyle(0x4a6572).fillRect(0,0,96,96);g.fillStyle(0x7ee0ff).fillRect(42,16,12,64);g.generateTexture('player-fallback',96,96);
    g.destroy();
    this.load.once('complete',()=>{
      const defaultKey=playerTextureKey('warrior_m','base');
      this.registry.set('playerTextureKey',this.textures.exists(defaultKey)?defaultKey:'player-fallback');
    });
  }
  create(){
    for(const appearanceId of PLAYER_APPEARANCE_ORDER)for(const state of PLAYER_VISUAL_STATES){
      const texture=playerTextureKey(appearanceId,state);
      if(!this.textures.exists(texture))continue;
      for(const [direction,row] of Object.entries(PLAYER_DIRECTION_ROWS)){
        const start=row*4,end=start+3,animation=`${texture}-walk-${direction}`;
        if(!this.anims.exists(animation))this.anims.create({key:animation,frames:this.anims.generateFrameNumbers(texture,{start,end}),frameRate:8,repeat:-1});
      }
    }
    this.scene.start('MenuScene');
  }
}
