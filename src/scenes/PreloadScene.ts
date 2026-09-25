// @ts-nocheck
import {SOUTH_RIVER_ASSET} from '../world/SouthRiver';
import {SOUTH_BRIDGE_ASSET} from '../world/SouthRiverBridge';
import {OLD_ROAD_B4D_TEXTURES} from '../world/OldRoadVisuals';
import {ESCARPMENT_ASSETS} from '../world/OldRoadEscarpmentAssets';
import {ESCARPMENT_NATURAL_ASSETS} from '../world/OldRoadEscarpmentNaturalAssets';
import {OLD_ROAD_PROP_ASSETS} from '../world/OldRoadProps';
import {PLAYER_APPEARANCE_ORDER,PLAYER_DIRECTION_ROWS,PLAYER_VISUAL_STATES,playerDirectionRowForAppearance,playerOutlineTextureKey,playerTextureKey} from '../character/PlayerAppearance';
export class PreloadScene extends Phaser.Scene{
  constructor(){super('PreloadScene')}
  preload(){
    this.load.image('aether_main_menu','assets/images/ui/main_menu_aether.png');
    for(const asset of Object.values(OLD_ROAD_PROP_ASSETS))this.load.image(asset.key,asset.path);
    for(const asset of Object.values(ESCARPMENT_ASSETS))this.load.image(asset.key,asset.path);
    for(const asset of Object.values(ESCARPMENT_NATURAL_ASSETS))this.load.image(asset.key,asset.path);
    for(const key of Object.values(OLD_ROAD_B4D_TEXTURES).flat())
      this.load.image(key,`assets/images/environment/outskirts/old-road-b4d/${key}.png`);
    // Apenas os sprites utilizados na cena atual permanecem no preload.
    this.load.spritesheet('traveler','assets/images/characters/npcs/traveler.png',{frameWidth:128,frameHeight:160});
    this.load.spritesheet('city_dog','assets/images/characters/ambient/city_dog.png',{frameWidth:144,frameHeight:96});
    this.load.spritesheet('city_cat','assets/images/characters/ambient/city_cat.png',{frameWidth:144,frameHeight:96});
    this.load.spritesheet('city_bird','assets/images/characters/ambient/city_bird.png',{frameWidth:64,frameHeight:48});
    this.load.spritesheet('city_rat_gray','assets/images/characters/ambient/city_rat_gray.png',{frameWidth:112,frameHeight:64});
    this.load.spritesheet('city_rat_brown','assets/images/characters/ambient/city_rat_brown.png',{frameWidth:112,frameHeight:64});
    this.load.spritesheet('city_rat_dark','assets/images/characters/ambient/city_rat_dark.png',{frameWidth:112,frameHeight:64});

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
    // Atores roteirizados do prólogo: folhas reais de ação, não imagens
    // estáticas deslocadas pelo código. Todas as células preservam a base.
    this.load.spritesheet('prologue_young_wolf','assets/images/characters/prologue/prologue_young_wolf_sheet_v2.png',{frameWidth:362,frameHeight:724});
    this.load.spritesheet('prologue_goblin_scout','assets/images/characters/prologue/prologue_goblin_scout_sheet_v2.png',{frameWidth:362,frameHeight:724});
    // Prompt 9D-A: volta corporal completa (8 direções) para caminhada e
    // ataque. Hit/morte continuam nas folhas v2, pois já são adequados.
    this.load.spritesheet('prologue_young_wolf_8dir','assets/images/characters/prologue/prologue_young_wolf_8dir_v3.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('prologue_goblin_scout_8dir','assets/images/characters/prologue/prologue_goblin_scout_8dir_v3.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('aether_patrolman','assets/images/characters/prologue/aether_patrolman_sheet_v2.png',{frameWidth:520,frameHeight:756});
    this.load.image('abandoned_wagon_v3','assets/images/environment/outskirts/prologue/abandoned_wagon_v3.png');
    // Assets independentes da cena da emboscada: decoracao fixa no mundo.
    this.load.image('road_blood_pool_01','assets/images/environment/outskirts/prologue/blood-trail/road_blood_pool_01.png');
    this.load.image('road_blood_pool_02','assets/images/environment/outskirts/prologue/blood-trail/road_blood_pool_02.png');
    this.load.image('road_blood_pool_03','assets/images/environment/outskirts/prologue/blood-trail/road_blood_pool_03.png');
    this.load.image('road_blood_trail_01','assets/images/environment/outskirts/prologue/blood-trail/road_blood_trail_01.png');
    this.load.image('road_blood_trail_02','assets/images/environment/outskirts/prologue/blood-trail/road_blood_trail_02.png');
    this.load.image('road_blood_trail_03','assets/images/environment/outskirts/prologue/blood-trail/road_blood_trail_03.png');
    this.load.image('road_fallen_traveler_01','assets/images/environment/outskirts/prologue/blood-trail/road_fallen_traveler_01.png');
    this.load.image('road_fallen_traveler_02','assets/images/environment/outskirts/prologue/blood-trail/road_fallen_traveler_02.png');
    this.load.image('road_skeletal_remains_01','assets/images/environment/outskirts/prologue/blood-trail/road_skeletal_remains_01.png');
    this.load.image('road_skeletal_remains_02','assets/images/environment/outskirts/prologue/blood-trail/road_skeletal_remains_02.png');
    this.load.image('road_wagon_scatter_crate_01','assets/images/environment/outskirts/prologue/wagon-scatter/road_wagon_scatter_crate_01.png');
    this.load.image('road_wagon_scatter_barrel_01','assets/images/environment/outskirts/prologue/wagon-scatter/road_wagon_scatter_barrel_01.png');
    this.load.image('road_wagon_scatter_supplies_01','assets/images/environment/outskirts/prologue/wagon-scatter/road_wagon_scatter_supplies_01.png');
    // Round 66: as ações usam células maiores para manter a mesma escala do
    // repouso, a mesma linha dos pés e espaço para gestos altos sem recorte.
    this.load.spritesheet('merchant_iso_action','assets/images/characters/npcs/isometric/merchant_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('blacksmith_iso_action','assets/images/characters/npcs/isometric/blacksmith_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('healer_iso_action','assets/images/characters/npcs/isometric/healer_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('healer_iso_devastated_action','assets/images/characters/npcs/isometric/healer_iso_devastated_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('tavernkeeper_iso_action','assets/images/characters/npcs/isometric/tavernkeeper_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('scholar_iso_action','assets/images/characters/npcs/isometric/scholar_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('artisan_iso_action','assets/images/characters/npcs/isometric/artisan_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('guard_iso_action','assets/images/characters/npcs/isometric/guard_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('south_guard_iso_action','assets/images/characters/npcs/isometric/south_guard_iso_action.png',{frameWidth:256,frameHeight:256});
    this.load.spritesheet('elder_mira_iso_action','assets/images/characters/npcs/isometric/elder_mira_iso_action.png',{frameWidth:256,frameHeight:256});

    this.load.spritesheet('traveler_iso_walk_v2','assets/images/characters/npcs/isometric/traveler_iso_walk_v2.png',{frameWidth:208,frameHeight:240});

    this.load.image('merchant_shop','assets/images/environment/buildings/merchant_shop.png');
    this.load.image('blacksmith_shop','assets/images/environment/buildings/blacksmith_shop.png');

    this.load.image('chimney_smoke_wisp','assets/images/environment/buildings/chimney_smoke_wisp.png');
	    this.load.image('healer_house','assets/images/environment/buildings/healer_house.png');
	    this.load.image('healer_house_abandoned','assets/images/environment/buildings/healer_house_abandoned.png');
    this.load.image('tavern_house','assets/images/environment/buildings/tavern_house.png');
    this.load.image('scholar_house','assets/images/environment/buildings/scholar_house.png');
    this.load.image('artisan_house','assets/images/environment/buildings/artisan_house.png');
    this.load.image('waystone_dormant','assets/images/environment/world/waystone_dormant.png');
    this.load.image('waystone_city_dormant','assets/images/environment/world/waystone_city_dormant.png');
    this.load.image('city_fountain','assets/images/environment/city/props/city_fountain.png');
    this.load.image('city_tree','assets/images/environment/city/props/city_tree.png');
    this.load.image('city_bench','assets/images/environment/city/props/city_bench.png');
    this.load.image('street_crates','assets/images/environment/city/props/street_crates.png');

    this.load.spritesheet('iso_grass_tufts','assets/images/environment/isometric/isometric_grass_tufts.png',{frameWidth:96,frameHeight:96});
    this.load.image('iso_city_wall','assets/images/environment/isometric/isometric_city_wall_v2_aligned.png');
    this.load.image('iso_city_wall_south_long','assets/images/environment/isometric/isometric_city_wall_south_long.png');
    this.load.image('iso_city_wall_broken','assets/images/environment/isometric/isometric_city_wall_broken.png');
    this.load.image('iso_city_wall_side_corner','assets/images/environment/isometric/isometric_city_wall_side_corner.png');
    this.load.image('iso_city_gate','assets/images/environment/isometric/isometric_city_gate_v3.png');
    this.load.image('iso_city_gate_east','assets/images/environment/isometric/isometric_city_gate_east_v3.png');
    this.load.image('iso_city_gate_north_construction','assets/images/environment/isometric/isometric_city_gate_north_construction.png');
    this.load.image('iso_city_corner_tower','assets/images/environment/isometric/isometric_city_corner_tower.png');
    this.load.image('iso_goblin_battering_ram_broken','assets/images/environment/isometric/isometric_goblin_battering_ram_broken.png');
    this.load.image('iso_city_grass','assets/images/environment/isometric/isometric_city_grass.png');
    this.load.image('iso_pavement_tile_a','assets/images/environment/isometric/iso_pavement_tile_a.png');
    this.load.image('iso_pavement_tile_b','assets/images/environment/isometric/iso_pavement_tile_b.png');
    this.load.image('iso_pavement_tile_c','assets/images/environment/isometric/iso_pavement_tile_c.png');
    this.load.image('iso_pavement_tile_d','assets/images/environment/isometric/iso_pavement_tile_d.png');
    this.load.image('iso_waystone_garden','assets/images/environment/isometric/isometric_waystone_garden.png');

    this.load.image(SOUTH_RIVER_ASSET.key,SOUTH_RIVER_ASSET.path);
    this.load.image(SOUTH_BRIDGE_ASSET.key,SOUTH_BRIDGE_ASSET.path);
    this.load.image('ancient_riverbank_tree_01','assets/images/environment/outskirts/south-river/ancient_riverbank_tree_01.png');
    this.load.image('riverbank_rock_outcrop_01','assets/images/environment/outskirts/south-river/riverbank_rock_outcrop_01.png');
    this.load.image('riverbank_fern_clearing_01','assets/images/environment/outskirts/south-river/riverbank_fern_clearing_01.png');
    this.load.image('riverbank_cattails_01','assets/images/environment/outskirts/south-river/riverbank_cattails_01.png');
    this.load.image('riverbank_mossy_clearing_01','assets/images/environment/outskirts/south-river/riverbank_mossy_clearing_01.png');
    this.load.image('riverbank_reeds_01','assets/images/environment/outskirts/south-river/riverbank_reeds_01.png');
    this.load.image('riverbank_fallen_ancient_log_01','assets/images/environment/outskirts/south-river/riverbank_fallen_ancient_log_01.png');
    this.load.image('riverbank_muddy_patch_01','assets/images/environment/outskirts/south-river/riverbank_muddy_patch_01.png');
    this.load.image('riverbank_rocky_patch_01','assets/images/environment/outskirts/south-river/riverbank_rocky_patch_01.png');
    this.load.image('riverbank_grass_mud_transition_01','assets/images/environment/outskirts/south-river/riverbank_grass_mud_transition_01.png');
    this.load.image('riverbank_grassy_path_patch_01','assets/images/environment/outskirts/south-river/riverbank_grassy_path_patch_01.png');
    // 9D-B4.0B: um material contínuo e tileable fica mascarado exatamente no
    // território lógico dos Arredores. Os detalhes abaixo são transparentes e
    // discretos; a Estrada Velha permanece na camada modular acima do chão.
    this.load.image('outskirts_ground_b4_surface','assets/images/environment/outskirts/terrain-b4/outskirts_ground_b4_surface.png');
    this.load.image('outskirts_ground_b4_detail_0','assets/images/environment/outskirts/terrain-b4/outskirts_ground_b4_detail_0.png');
    this.load.image('outskirts_ground_b4_detail_1','assets/images/environment/outskirts/terrain-b4/outskirts_ground_b4_detail_1.png');
    this.load.image('outskirts_ground_b4_detail_2','assets/images/environment/outskirts/terrain-b4/outskirts_ground_b4_detail_2.png');
    this.load.image('outskirts_ground_b4_detail_3','assets/images/environment/outskirts/terrain-b4/outskirts_ground_b4_detail_3.png');

    // 9D-B3.2: quatro peças extraídas da prancha fornecida, sem labels.

    this.load.image('outskirts_aether_sign_v2','assets/images/environment/outskirts/v2/outskirts_aether_sign_v2.png');

    this.load.image('bottom_hud_frame_v2','assets/images/ui/hud/bottom_hud_frame_v2.png');
    this.load.image('hud_action_healing','assets/images/ui/hud/actions/healing.png');
    this.load.image('hud_action_mana','assets/images/ui/hud/actions/mana.png');
    this.load.image('hud_action_skills','assets/images/ui/hud/actions/skills.png');
    this.load.image('hud_action_inventory','assets/images/ui/hud/actions/inventory.png');
    this.load.image('hud_action_map','assets/images/ui/hud/actions/map.png');
    this.load.image('hud_action_controls','assets/images/ui/hud/actions/controls.png');
    this.load.image('hud_action_menu','assets/images/ui/hud/actions/menu.png');
    this.load.image('city_map_exact_2_5d','assets/images/ui/map/city_map_exact_2_5d.png');

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
    this.load.image('portrait_darian','assets/images/ui/dialogue/portraits/portrait_darian.png');
    for(const appearanceId of PLAYER_APPEARANCE_ORDER){
      for(const state of PLAYER_VISUAL_STATES){
        const key=playerTextureKey(appearanceId,state);
        const playerSheetConfig=appearanceId==='mage_f'
          ?{frameWidth:96,frameHeight:96,margin:1,spacing:2}
          :{frameWidth:96,frameHeight:96};
        this.load.spritesheet(key,`assets/images/characters/player/${appearanceId}_${state}.png`,playerSheetConfig);
        this.load.spritesheet(playerOutlineTextureKey(appearanceId,state),`assets/images/characters/player/${appearanceId}_${state}_outline.png`,playerSheetConfig);
      }
    }

    this.load.spritesheet('elder_feeder_iso_v3','assets/images/characters/ambient/elder_feeder_iso_v3.png',{frameWidth:208,frameHeight:224});
    const g=this.add.graphics();
    g.fillStyle(0xff6b6b).fillRect(0,0,32,32);g.generateTexture('enemy',32,32);
    g.clear();g.fillStyle(0x4b9b5a).fillRect(0,0,32,32);g.generateTexture('grass',32,32);
    g.clear();g.fillStyle(0xb59b71).fillRect(0,0,32,32);g.generateTexture('path',32,32);
    g.clear();g.fillStyle(0x3c8a50).fillCircle(16,11,12);g.fillStyle(0x6b4934).fillRect(12,12,8,20);g.generateTexture('tree-placeholder',32,32);
    g.clear();g.fillStyle(0x4a6572).fillRect(0,0,96,96);g.fillStyle(0x7ee0ff).fillRect(42,16,12,64);g.generateTexture('player-fallback',96,96);
    // Textura técnica invisível do corpo autoritativo. A arte equipada vive
    // em PlayerVisual e nunca redimensiona este GameObject físico de 32×16.
    g.clear();g.fillStyle(0xffffff,1).fillRect(0,0,32,16);g.generateTexture('player-logical-body',32,16);
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
      for(const [direction] of Object.entries(PLAYER_DIRECTION_ROWS)){
        const row=playerDirectionRowForAppearance(appearanceId,direction);
        const start=row*4,end=start+3,animation=`${texture}-walk-${direction}`;
        if(!this.anims.exists(animation))this.anims.create({key:animation,frames:this.anims.generateFrameNumbers(texture,{start,end}),frameRate:8,repeat:-1});
      }
    }
    this.scene.start('MenuScene');
  }
}
