// @ts-nocheck
export class PreloadScene extends Phaser.Scene{
  constructor(){super('PreloadScene')}
  preload(){
    this.load.spritesheet('merchant','assets/images/characters/npcs/merchant.png',{frameWidth:128,frameHeight:160});
    this.load.spritesheet('blacksmith','assets/images/characters/npcs/blacksmith.png',{frameWidth:128,frameHeight:160});this.load.spritesheet('healer','assets/images/characters/npcs/healer.png',{frameWidth:128,frameHeight:160});this.load.spritesheet('scholar','assets/images/characters/npcs/scholar.png',{frameWidth:128,frameHeight:160});this.load.spritesheet('tavernkeeper','assets/images/characters/npcs/tavernkeeper.png',{frameWidth:128,frameHeight:160});this.load.spritesheet('resident','assets/images/characters/npcs/resident.png',{frameWidth:128,frameHeight:160});this.load.spritesheet('traveler','assets/images/characters/npcs/traveler.png',{frameWidth:128,frameHeight:160});this.load.spritesheet('elder_mira','assets/images/characters/npcs/elder_mira.png',{frameWidth:128,frameHeight:160});this.load.spritesheet('artisan','assets/images/characters/npcs/artisan.png',{frameWidth:128,frameHeight:160});this.load.spritesheet('guard','assets/images/characters/npcs/guard.png',{frameWidth:128,frameHeight:160});this.load.spritesheet('south_guard','assets/images/characters/npcs/south_guard.png',{frameWidth:128,frameHeight:160});this.load.spritesheet('city_dog','assets/images/characters/ambient/city_dog.png',{frameWidth:64,frameHeight:48});this.load.spritesheet('city_cat','assets/images/characters/ambient/city_cat.png',{frameWidth:64,frameHeight:48});this.load.spritesheet('elder_feeder','assets/images/characters/ambient/elder_feeder.png',{frameWidth:96,frameHeight:112});this.load.spritesheet('city_bird','assets/images/characters/ambient/city_bird.png',{frameWidth:32,frameHeight:24});this.load.spritesheet('city_rat_gray','assets/images/characters/ambient/city_rat_gray.png',{frameWidth:80,frameHeight:48});this.load.spritesheet('city_rat_brown','assets/images/characters/ambient/city_rat_brown.png',{frameWidth:80,frameHeight:48});this.load.spritesheet('city_rat_dark','assets/images/characters/ambient/city_rat_dark.png',{frameWidth:80,frameHeight:48});this.load.spritesheet('city_chicken_white','assets/images/characters/ambient/city_chicken_white.png',{frameWidth:80,frameHeight:80});this.load.spritesheet('city_chicken_brown','assets/images/characters/ambient/city_chicken_brown.png',{frameWidth:80,frameHeight:80});this.load.spritesheet('city_chicken_cream','assets/images/characters/ambient/city_chicken_cream.png',{frameWidth:80,frameHeight:80});
    this.load.spritesheet('city_ground','assets/images/environment/city/city_ground.png',{frameWidth:32,frameHeight:32});
    this.load.image('city_wall_h','assets/images/environment/city/city_wall_horizontal.png');
    this.load.image('city_wall_v','assets/images/environment/city/city_wall_vertical.png');
    this.load.image('city_tower','assets/images/environment/city/city_tower.png');
    this.load.image('gate_south','assets/images/environment/city/gate_south.png');
    this.load.image('gate_east','assets/images/environment/city/gate_east.png');
    this.load.image('merchant_shop','assets/images/environment/buildings/merchant_shop.png');
    this.load.image('blacksmith_shop','assets/images/environment/buildings/blacksmith_shop.png');
    this.load.image('healer_house','assets/images/environment/buildings/healer_house.png');
    this.load.image('tavern_house','assets/images/environment/buildings/tavern_house.png');
    this.load.image('scholar_house','assets/images/environment/buildings/scholar_house.png');
    this.load.image('artisan_house','assets/images/environment/buildings/artisan_house.png');
    this.load.image('residential_house_red','assets/images/environment/buildings/residential_house_red.png');
    this.load.image('residential_house_blue','assets/images/environment/buildings/residential_house_blue.png');
    this.load.image('residential_house_green','assets/images/environment/buildings/residential_house_green.png');
    this.load.image('residential_house_orange','assets/images/environment/buildings/residential_house_orange.png');
    this.load.image('waystone_dormant','assets/images/environment/world/waystone_dormant.png');
    this.load.image('city_well','assets/images/environment/city/props/city_well_round56.png');
    this.load.image('street_crates','assets/images/environment/city/props/street_crates.png');
    this.load.image('street_barrels','assets/images/environment/city/props/street_barrels.png');
    this.load.image('street_logs','assets/images/environment/city/props/street_logs.png');
    this.load.image('street_lamppost','assets/images/environment/city/props/street_lamppost.png');
    this.load.image('street_flower_fence','assets/images/environment/city/props/street_flower_fence.png');
    this.load.image('chicken_coop','assets/images/environment/city/props/chicken_coop.png');
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
    this.load.image('npc_prompt_panel','assets/images/ui/npc_interaction/npc_prompt_panel.png');
    this.load.image('npc_key_f','assets/images/ui/npc_interaction/keycap_f.png');
    this.load.image('npc_key_t','assets/images/ui/npc_interaction/keycap_t.png');
    this.load.image('npc_icon_talk','assets/images/ui/npc_interaction/icon_talk.png');
    this.load.image('npc_icon_shop','assets/images/ui/npc_interaction/icon_shop.png');
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
    this.load.image('portrait_garrick','assets/images/ui/dialogue/portraits/portrait_garrick.png');
    this.load.image('portrait_lysandra','assets/images/ui/dialogue/portraits/portrait_lysandra.png');
    this.load.image('portrait_maelis','assets/images/ui/dialogue/portraits/portrait_maelis.png');
    this.load.image('portrait_mira','assets/images/ui/dialogue/portraits/portrait_mira.png');
    this.load.image('portrait_kael','assets/images/ui/dialogue/portraits/portrait_kael.png');
    this.load.image('portrait_bren','assets/images/ui/dialogue/portraits/portrait_bren.png');
    this.load.image('portrait_tomas','assets/images/ui/dialogue/portraits/portrait_tomas.png');
    this.load.image('portrait_darian','assets/images/ui/dialogue/portraits/portrait_darian.png');
    this.load.spritesheet('player','assets/images/characters/player.png',{frameWidth:96,frameHeight:96});
    const g=this.add.graphics();
    g.fillStyle(0xff6b6b).fillRect(0,0,32,32);g.generateTexture('enemy',32,32);
    g.clear();g.fillStyle(0x4b9b5a).fillRect(0,0,32,32);g.generateTexture('grass',32,32);
    g.clear();g.fillStyle(0xb59b71).fillRect(0,0,32,32);g.generateTexture('path',32,32);
    g.clear();g.fillStyle(0x3c8a50).fillCircle(16,11,12);g.fillStyle(0x6b4934).fillRect(12,12,8,20);g.generateTexture('tree-placeholder',32,32);
    g.clear();g.fillStyle(0x4a6572).fillRect(0,0,96,96);g.fillStyle(0x7ee0ff).fillRect(42,16,12,64);g.generateTexture('player-fallback',96,96);
    g.destroy();
    this.load.once('complete',()=>{
      if(!this.textures.exists('player')) this.registry.set('playerTextureKey','player-fallback');
      else this.registry.set('playerTextureKey','player');
    });
  }
  create(){
    const dirs={down:[0,3],up:[4,7],left:[8,11],right:[12,15]};
    for(const d of Object.keys(dirs)){
      const [start,end]=dirs[d];
      const key=this.registry.get('playerTextureKey')||'player';
      this.anims.create({key:`player-walk-${d}`,frames:this.anims.generateFrameNumbers(key,{start,end}),frameRate:8,repeat:-1});
    }
    this.scene.start('MenuScene');
  }
}
