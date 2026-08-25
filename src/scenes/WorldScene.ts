// @ts-nocheck
import {Player} from '../entities/Player';import {Enemy} from '../entities/Enemy';import {Inventory} from '../inventory/Inventory';import {EquipmentManager} from '../equipment/EquipmentManager';import {AbilitySystem} from '../abilities/AbilitySystem';import {CombatSystem} from '../combat/CombatSystem';import {LootManager} from '../loot/LootManager';import {SaveManager} from '../save/SaveManager';import {ClassManager} from '../character/ClassManager';import {SkillManager} from '../skills/SkillManager';import {MapHud} from '../ui/MapHud';import {DeathOverlay} from '../ui/DeathOverlay';import {Npc} from '../npc/Npc';import {WanderingNpc} from '../npc/WanderingNpc';import {ShopPanel} from '../shop/ShopPanel';import {ChoiceDialogueBox} from '../ui/ChoiceDialogueBox';import {NpcDialoguePanel} from '../ui/NpcDialoguePanel';import {SfxManager} from '../audio/SfxManager';import {QuestManager} from '../quests/QuestManager';import {Waystone} from '../world/Waystone';import {AmbientCityLife} from '../world/AmbientCityLife';
export class WorldScene extends Phaser.Scene{
 constructor(){super('WorldScene')}
 create(){this.switching=false;this.cityConverted=true;this.worldWidth=4200;this.worldHeight=2400;this.cityLayout={left:80,top:80,right:1480,bottom:1120,width:1400,height:1040,plazaX:780,plazaY:600,fountainX:780,fountainY:770,eastGateX:1480,eastGateY:500,southGateX:780,southGateY:1120,spawnX:780,spawnY:1010};this.sm=new SaveManager();this.inv=new Inventory();this.player=new Player(this,this.cityLayout.spawnX,this.cityLayout.spawnY);this.classManager=new ClassManager();this.skillManager=new SkillManager(this.player);this.player.scene.skillManager=this.skillManager;this.equip=new EquipmentManager(this.player);this.sfx=new SfxManager(this);this.player.scene.sfx=this.sfx;this.loot=new LootManager(this,this.inv);this.combat=new CombatSystem(this,this.loot);this.abilities=new AbilitySystem(this,this.player);this.questManager=new QuestManager();this.loadGame();this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);this.cameras.main.setDeadzone(220,90);this.cameras.main.startFollow(this.player,true,.12,.12,0,-135);this.cameras.main.setRoundPixels(true);this.createOutskirtsGeneratedTextures();this.createWorld();if(this.cityConverted)this.createConvertedCityApproaches();else{this.createNpcsRound58();this.ambientLife=new AmbientCityLife(this,this.cityLayout)}this.createOutskirtsAmbientLife();this.spawnEnemies();this.setupInput();this.setupHud();this.installUnload();this.saveGame()}
 loadGame(){const save=this.sm.load(),pos=save?.scenePositions?.WorldScene,t=this.registry.get('transitionSpawn');if(save){this.player.loadState(save.player);this.inv.load(save.inventory);this.equip.load(save.equipment,this.inv);this.skillManager.load(save.skills);this.questManager.load(save.quests);this.classManager.load(this.player,save.characterClass||this.player.characterClass)}else{this.player.applyClass(this.registry.get('selectedClass')||'warrior');this.registry.remove('selectedClass');this.inv.add('healing_potion',2);this.inv.add('mana_potion',2);this.player.gold=25}if(t?.scene==='WorldScene'){this.player.setPosition(t.x,t.y);this.registry.remove('transitionSpawn')}else if(pos){const inCity=pos.x>=this.cityLayout.left&&pos.x<=this.cityLayout.right&&pos.y>=this.cityLayout.top&&pos.y<=this.cityLayout.bottom;const migrate=inCity&&!save?.worldFlags?.cityRound58Migrated;this.player.setPosition(migrate?this.cityLayout.spawnX:pos.x,migrate?this.cityLayout.spawnY:pos.y)}this.equip.sync()}
 createWorld(){
  // O primeiro quadro do atlas urbano é grama pixel art; ele substitui o
  // quadrado verde provisório que destoava dos demais assets.
  this.add.tileSprite(0,0,this.worldWidth,this.worldHeight,'city_ground',0).setOrigin(0);
  this.add.rectangle(0,0,this.worldWidth,this.worldHeight,0x16301f,.06).setOrigin(0);
  const c=this.cityLayout;this.safeRect={x:c.left,y:c.top,width:c.width,height:c.height};if(!this.cityConverted)this.drawCityGroundRound58();this.cityWalls=[];const makeWall=(x,y,w,h)=>{if(w<=0||h<=0)return null;const wall=this.add.rectangle(x,y,w,h,0x000000,0).setOrigin(.5);this.physics.add.existing(wall,true);this.cityWalls.push(wall);this.physics.add.collider(this.player,wall);return wall};const eastGap=128,southGap=128,wallInset=18,wallThickness=36;makeWall((c.left+c.right)/2,c.top+wallInset,c.width,wallThickness);makeWall(c.left+wallInset,(c.top+c.bottom)/2,wallThickness,c.height);makeWall(c.right-wallInset,(c.top+c.eastGateY-eastGap)/2,wallThickness,c.eastGateY-eastGap-c.top);makeWall(c.right-wallInset,(c.eastGateY+eastGap+c.bottom)/2,wallThickness,c.bottom-c.eastGateY-eastGap);makeWall((c.left+c.southGateX-southGap)/2,c.bottom-wallInset,c.southGateX-southGap-c.left,wallThickness);makeWall((c.southGateX+southGap+c.right)/2,c.bottom-wallInset,c.right-c.southGateX-southGap,wallThickness);if(!this.cityConverted){this.drawCityStructuresRound58();this.drawPlazaRound58();this.drawCityDetailsRound58();this.auditCityRound58()}
  this.add.rectangle(c.left,c.top,c.width,c.height,0x24314d,.025).setOrigin(0).setDepth(1);
  this.rightGate=this.add.zone(c.eastGateX,c.eastGateY,78,72);this.bottomGate=this.add.zone(c.southGateX,c.southGateY,88,78);
  this.createOutskirtsLayout();
 }

 createConvertedCityApproaches(){
  // Nos Arredores só permanecem as fachadas externas dos dois portões. Ao
  // cruzá-los a cena muda para a cidade isométrica oficial.
  const c=this.cityLayout;
  const east=this.add.image(c.eastGateX+8,c.eastGateY+98,'iso_city_gate_east').setOrigin(.5,1).setDisplaySize(300,272).setDepth(4.2);
  const south=this.add.image(c.southGateX,c.southGateY+84,'iso_city_gate').setOrigin(.5,1).setFlipX(true).setDisplaySize(288,201).setDepth(4.2);
  east.setName('entrada-isometrica-leste');south.setName('entrada-isometrica-sul');
 }

 createOutskirtsGeneratedTextures(){
  if(this.textures.exists('outskirts_cow'))return;
  const g=this.add.graphics();
  const mk=(key,w,h,draw)=>{g.clear();draw();g.generateTexture(key,w,h)};
  mk('outskirts_cow',64,48,()=>{g.fillStyle(0xf1e6cf,1);g.fillEllipse(30,24,34,20);g.fillStyle(0x4e4037,1);g.fillEllipse(22,18,9,6);g.fillEllipse(36,29,8,6);g.fillEllipse(31,22,6,5);g.fillStyle(0xc9bba3,1);g.fillEllipse(48,24,14,12);g.fillStyle(0x5f4a35,1);g.fillRect(18,28,3,12);g.fillRect(28,30,3,10);g.fillRect(36,30,3,10);g.fillRect(46,28,3,12);g.fillTriangle(50,17,56,15,52,22);g.fillTriangle(50,31,56,33,52,26)});
  mk('outskirts_pig',56,42,()=>{g.fillStyle(0xdb9da6,1);g.fillEllipse(25,22,30,18);g.fillEllipse(42,22,12,10);g.fillStyle(0xb86f78,1);g.fillRect(16,29,3,9);g.fillRect(26,30,3,8);g.fillRect(34,30,3,8);g.fillRect(42,29,3,9);g.fillEllipse(46,22,4,4);g.lineStyle(2,0xb86f78,1);g.beginPath();g.moveTo(11,24);g.lineTo(7,21);g.lineTo(10,18);g.strokePath()});
  mk('outskirts_horse',72,50,()=>{g.fillStyle(0x7e6045,1);g.fillEllipse(30,24,34,18);g.fillRect(40,15,8,16);g.fillEllipse(52,18,14,10);g.fillStyle(0x5b422f,1);g.fillRect(19,30,3,12);g.fillRect(29,30,3,12);g.fillRect(38,30,3,12);g.fillRect(47,30,3,12);g.fillRect(42,10,5,7);g.fillTriangle(53,12,59,10,55,16);g.fillTriangle(53,24,59,26,55,20);g.fillStyle(0x3b2b20,1);g.fillRect(16,17,6,3)});
  mk('outskirts_deer',58,42,()=>{g.fillStyle(0xb68d5f,1);g.fillEllipse(24,22,26,14);g.fillRect(31,16,7,12);g.fillEllipse(42,18,12,8);g.fillStyle(0x6c5038,1);g.fillRect(15,28,2,9);g.fillRect(24,28,2,8);g.fillRect(31,28,2,8);g.fillRect(38,28,2,9);g.lineStyle(2,0x7c6549,1);g.beginPath();g.moveTo(44,12);g.lineTo(46,7);g.lineTo(49,11);g.moveTo(44,12);g.lineTo(41,7);g.lineTo(38,10);g.strokePath()});
  mk('outskirts_rabbit',36,28,()=>{g.fillStyle(0xc8c3bc,1);g.fillEllipse(16,18,14,10);g.fillEllipse(24,16,10,8);g.fillRect(22,4,3,10);g.fillRect(26,5,3,9);g.fillStyle(0x9f988f,1);g.fillRect(11,20,3,5);g.fillRect(18,20,3,5)});
  g.destroy();
 }

 createWorldBlock(x,y,w,h){const b=this.add.rectangle(x,y,w,h,0x000000,0).setDepth(0);this.physics.add.existing(b,true);this.physics.add.collider(this.player,b);(this.worldBlocks??=[]).push(b);return b}

 stampPath(x1,y1,x2,y2,width=62,color=0xb39465,alpha=.26){
  const dist=Phaser.Math.Distance.Between(x1,y1,x2,y2),angle=Phaser.Math.Angle.Between(x1,y1,x2,y2);
  const spacing=Math.max(40,width*.72),steps=Math.max(2,Math.ceil(dist/spacing));
  for(let i=0;i<=steps;i++){
   const t=i/steps,x=Phaser.Math.Linear(x1,x2,t),y=Phaser.Math.Linear(y1,y2,t);
   const path=this.add.image(x,y,'outskirts_dirt_path').setDepth(.18).setRotation(angle).setAlpha(Math.max(.56,alpha*3.1));
   path.setDisplaySize(width*1.28,width*.62);
  }
 }

 createOutskirtsLayout(){
  this.outskirtsRegions={farm:new Phaser.Geom.Rectangle(1180,1140,940,620),totems:new Phaser.Geom.Rectangle(2320,250,620,520),ruins:new Phaser.Geom.Rectangle(2550,1120,720,520),lake:new Phaser.Geom.Rectangle(1980,1260,700,520),cave:new Phaser.Geom.Rectangle(3240,1620,340,220),portal:new Phaser.Geom.Rectangle(3840,500,180,260)};
  this.add.rectangle(this.cityLayout.right+20,50,this.worldWidth-this.cityLayout.right-80,this.worldHeight-110,0x7b3d2a,.05).setOrigin(0).setDepth(0);
  this.add.text(1780,85,'ARREDORES DA CIDADE',{fontFamily:'Arial',fontSize:22,color:'#ffd1a0',fontStyle:'bold'}).setOrigin(.5).setDepth(2);
  this.add.text(1780,115,'fazenda, água, ruínas antigas, caverna e portal da floresta',{fontFamily:'Arial',fontSize:12,color:'#e6cfb2'}).setOrigin(.5).setDepth(2);

  // Estradas principais e trilhas.
  this.stampPath(this.cityLayout.eastGateX+10,this.cityLayout.eastGateY,1680,500,68);this.stampPath(1680,500,1810,520,64);this.stampPath(1810,520,2180,650,64);this.stampPath(2180,650,2520,640,60);this.stampPath(2520,640,2970,640,64);this.stampPath(2970,640,3500,650,64);this.stampPath(3500,650,3920,640,68);
  this.stampPath(this.cityLayout.southGateX,this.cityLayout.southGateY,930,1210,60);this.stampPath(930,1210,1080,1300,60);this.stampPath(1080,1300,1280,1320,64);this.stampPath(1280,1320,1450,1365,68);this.stampPath(1450,1365,1900,1390,62);this.stampPath(1900,1390,1940,1440,58);this.stampPath(1940,1440,1970,1580,58);this.stampPath(1970,1580,2180,1680,60);this.stampPath(2180,1680,2470,1680,62);this.stampPath(2470,1680,2710,1510,58);
  this.stampPath(1780,520,1750,820,54);this.stampPath(1750,820,1640,1160,54); // ligação para a fazenda
  this.stampPath(2710,1510,2860,1430,54);this.stampPath(2860,1430,3030,1360,52); // ligação às ruínas, contornando o lago
  this.stampPath(3030,1360,3340,1680,56); // até a caverna
  this.stampPath(1970,1580,2090,1550,40,0xc1a77a,.16); // pequeno acesso de contemplação ao lago
  this.stampPath(2160,650,2450,430,48); // até os totens

  // Grama alta e manchas de vegetação.
  const herb=(x,y,s=1)=>this.add.image(x,y,'outskirts_grass_patch').setOrigin(.5,.72).setScale(.42*s).setDepth(.24);
  [[1540,220],[1580,330],[1840,404],[1510,1010],[1740,1110],[2140,1160],[2280,980],[2760,820],[3220,700],[3520,560],[2030,1750],[1180,1560],[1510,1650],[2860,1710]].forEach(p=>herb(p[0],p[1],1.15));

  // Riacho sinuoso. O núcleo da água agora possui colisão, exceto nas duas
  // travessias oficiais: uma ponte no eixo leste e uma ponte no eixo sul.
  const waterNode=(x,y,w,h,a=.92)=>{
   const water=this.add.image(x,y,'outskirts_water_patch').setDepth(.14).setAlpha(a);
   water.setDisplaySize(w,h);
   return water;
  };
  const streamNodes=[[1580,240,120,60],[1640,350,150,74],[1700,500,164,84],[1690,680,148,74],[1640,860,120,58],[1770,1050,148,70],[1930,1190,176,76],[2110,1290,158,72],[2280,1350,128,60]];
  streamNodes.forEach(n=>waterNode(...n));
  // Colliders menores que a arte da água preservam uma margem visual natural.
  [streamNodes[0],streamNodes[2],streamNodes[3],streamNodes[5],streamNodes[6],streamNodes[7],streamNodes[8]].forEach(n=>this.createWorldBlock(n[0],n[1],n[2]*.58,n[3]*.44));

  const bridge=(x,y,w=88,angle=0)=>{
   const b=this.add.image(x,y,'outskirts_wood_bridge').setDepth(.22).setAngle(angle);
   b.setDisplaySize(w,Math.max(38,w*.52));
   return b;
  };
  // Travessia do caminho que sai do Portão Leste.
  bridge(1700,500,104,-2);
  // Travessia do caminho que vem do Portão Sul.
  bridge(1680,876,88,0);

  // Vegetação de margem usando assets definitivos do kit dos Arredores.
  [[1542,232,.52],[1598,326,.46],[1646,458,.50],[1640,650,.48],[1730,1010,.50],[1874,1152,.52],[2048,1252,.48],[2182,1322,.44]].forEach(p=>this.add.image(p[0],p[1],'outskirts_reeds').setScale(p[2]).setDepth(.25));
  [[1580,270,.42],[1608,570,.48],[1818,1115,.46],[2140,1188,.50]].forEach(p=>this.add.image(p[0],p[1],'outskirts_bush_cluster').setScale(p[2]).setDepth(.245));

  // Lago.
  [[2190,1460,360,160],[2330,1510,330,170],[2440,1390,240,120]].forEach(n=>waterNode(...n,.96));
  this.add.image(2310,1465,'outskirts_water_patch').setDepth(.135).setDisplaySize(420,210).setAlpha(.18);
  this.createWorldBlock(2180,1460,236,92);this.createWorldBlock(2395,1490,238,96);this.createWorldBlock(2428,1390,142,64);this.createWorldBlock(2295,1370,92,50);
  this.add.text(2290,1290,'Lago do Salgueiro',{fontFamily:'Arial',fontSize:12,color:'#d7eff8'}).setOrigin(.5).setDepth(.3);
  [[2110,1390,.58],[2172,1578,.52],[2448,1570,.56],[2515,1426,.48]].forEach(p=>this.add.image(p[0],p[1],'outskirts_reeds').setScale(p[2]).setDepth(.25));
  [[2075,1518,.46],[2500,1505,.52],[2410,1318,.44]].forEach(p=>this.add.image(p[0],p[1],'outskirts_bush_cluster').setScale(p[2]).setDepth(.245));

  // Pedras e afloramentos.
  const rock=(x,y,w,h)=>{
   const r=this.add.image(x,y,'outskirts_rock_cluster').setDepth(.27).setOrigin(.5,.76);
   r.setDisplaySize(w,h);
   this.createWorldBlock(x,y+Math.max(2,h*.10),w*.50,h*.30);
   return r;
  };
  [[2860,760,92,60],[2960,700,84,56],[3070,760,110,66],[3200,860,120,74],[3330,920,92,56],[1560,610,72,46],[1605,735,64,40],[1180,1220,82,52]].forEach(r=>rock(...r));

  // Totens antigos.
  this.add.text(2580,300,'Santuário Musgoso',{fontFamily:'Arial',fontSize:12,color:'#d9d8b8'}).setOrigin(.5).setDepth(.32);
  const totem=(x,y,scale=1)=>{this.add.ellipse(x,y+4,48*scale,16*scale,0x000000,.12).setDepth(.28);this.add.rectangle(x,y-28*scale,24*scale,82*scale,0x7d8475,.96).setDepth(.32).setStrokeStyle(2,0xb9c0b0,.18);this.add.circle(x,y-54*scale,18*scale,0x8a907f,.95).setDepth(.33);this.add.rectangle(x,y-38*scale,10*scale,8*scale,0x53685a,.9).setDepth(.34);this.add.rectangle(x,y-18*scale,12*scale,6*scale,0x516c4e,.85).setDepth(.34);this.add.circle(x-10*scale,y+10*scale,7*scale,0x527241,.88).setDepth(.31);this.add.circle(x+12*scale,y+6*scale,6*scale,0x6a8d52,.88).setDepth(.31);this.createWorldBlock(x,y+10*scale,24*scale,24*scale)};
  totem(2460,460,1);totem(2590,410,.88);totem(2720,470,1.1);totem(2810,390,.82);
  this.stampPath(2520,640,2580,450,38,0xc1a77a,.16);

  // Ruínas antigas.
  this.add.text(2940,1170,'Ruínas Antigas',{fontFamily:'Arial',fontSize:12,color:'#e0d4bd'}).setOrigin(.5).setDepth(.32);
  const ruinColumn=(x,y,h=74)=>{this.add.rectangle(x,y-h/2,22,h,0xa3a29b,.94).setDepth(.31).setStrokeStyle(2,0xd4d0c7,.18);this.add.rectangle(x,y-h,30,8,0xbdb9b1,.95).setDepth(.32);this.add.circle(x-8,y-6,7,0x557043,.82).setDepth(.33);this.createWorldBlock(x,y-8,22,22)};
  ruinColumn(2800,1290,84);ruinColumn(2920,1340,72);ruinColumn(3050,1280,94);ruinColumn(3150,1390,68);
  this.add.rectangle(2970,1360,220,18,0x8a867e,.94).setAngle(-16).setDepth(.3).setStrokeStyle(2,0xc1bcb1,.16);
  this.add.rectangle(2860,1440,150,16,0x807c75,.92).setAngle(11).setDepth(.3);
  this.add.rectangle(3090,1444,182,14,0x7b766f,.9).setAngle(-9).setDepth(.3);
  this.add.circle(2990,1416,8,0x58764e,.84).setDepth(.31);this.add.circle(2890,1320,6,0x5b7b4a,.84).setDepth(.31);
  this.createWorldBlock(2970,1360,140,18);this.createWorldBlock(2860,1440,110,16);this.createWorldBlock(3090,1444,130,14);

  // Fazenda de Rowan — Round 55: núcleo rural definitivo.
  this.add.text(1590,1080,'Fazenda de Rowan',{fontFamily:'Arial',fontSize:12,color:'#f4e2b6'}).setOrigin(.5).setDepth(.32);

  // Construções próprias da fazenda, no mesmo padrão visual dos Arredores.
  this.farmHouse=this.add.image(1415,1315,'farmhouse').setOrigin(.5,1).setScale(.62).setDepth(3.05);
  this.createWorldBlock(1415,1286,158,58);
  this.farmShed=this.add.image(1655,1285,'farm_barn').setOrigin(.5,1).setScale(.60).setDepth(3.03);
  this.createWorldBlock(1655,1257,148,56);
  if(this.textures.exists('chicken_coop')){
   this.farmCoop=this.add.image(2040,1545,'chicken_coop').setOrigin(.5,1).setScale(.31).setDepth(3.05);
   this.createWorldBlock(2040,1526,48,20);
  }

  // Plantações definitivas: módulos do kit visual dos Arredores.
  const crop=(key,x,y,scale=.72)=>this.add.image(x,y,key).setOrigin(.5,.72).setScale(scale).setDepth(.245);
  crop('farm_crop_wheat',1910,1215,.72);
  crop('farm_crop_cabbage',2015,1215,.70);
  crop('farm_crop_vegetables',1960,1320,.66);
  // Pequenas trilhas de serviço conectam os canteiros sem cortar a estrada principal.
  this.stampPath(1805,1270,1880,1250,34,0xb39465,.18);
  this.stampPath(1880,1250,1960,1260,32,0xb39465,.16);

  // Equipamentos agrícolas reutilizam os props rústicos já consolidados na cidade.
  const farmProp=(key,x,y,scale=.32,depth=3.12)=>this.add.image(x,y,key).setOrigin(.5,1).setScale(scale).setDepth(depth);
  farmProp('street_barrels',1540,1338,.28,3.13);
  farmProp('street_crates',1724,1328,.26,3.12);
  farmProp('street_logs',1488,1352,.28,3.11);
  farmProp('street_crates',2044,1394,.24,3.10);
  // Saco de grãos e balde simples junto aos canteiros.
  this.add.ellipse(2022,1372,18,24,0xc6ad82,.95).setDepth(3.10).setStrokeStyle(1,0x8e744d,.35);
  this.add.rectangle(2022,1360,10,3,0xa48962,.95).setDepth(3.11);
  this.add.ellipse(2050,1378,15,8,0x6d6557,.94).setDepth(3.10).setStrokeStyle(1,0xbab09c,.4);

  // Cercas e currais.
  const fenceSpan=(x1,y1,x2,y2,posts=5)=>{
   for(let i=0;i<posts;i++){
    const t1=i/posts,t2=(i+1)/posts;
    const ax=Phaser.Math.Linear(x1,x2,t1),ay=Phaser.Math.Linear(y1,y2,t1);
    const bx=Phaser.Math.Linear(x1,x2,t2),by=Phaser.Math.Linear(y1,y2,t2);
    const len=Phaser.Math.Distance.Between(ax,ay,bx,by),ang=Phaser.Math.Angle.Between(ax,ay,bx,by);
    const f=this.add.image((ax+bx)/2,(ay+by)/2,'outskirts_fence_segment').setOrigin(.5,.67).setRotation(ang).setDepth(.27);
    f.setDisplaySize(Math.max(24,len+5),30);
   }
  };
  // Curral das vacas: ampliado para permitir circulação real do jogador.
  fenceSpan(1510,1435,1720,1435,7);fenceSpan(1510,1435,1510,1605,5);fenceSpan(1720,1435,1720,1605,5);
  fenceSpan(1510,1605,1555,1605,2);fenceSpan(1675,1605,1720,1605,2);
  this.createWorldBlock(1615,1435,210,8);this.createWorldBlock(1510,1520,8,170);this.createWorldBlock(1720,1520,8,170);this.createWorldBlock(1532.5,1605,45,8);this.createWorldBlock(1697.5,1605,45,8);
  // Chiqueiro: também ampliado, com portão útil de 120 px.
  fenceSpan(1760,1460,1930,1460,6);fenceSpan(1760,1460,1760,1605,5);fenceSpan(1930,1460,1930,1605,5);
  fenceSpan(1760,1605,1785,1605,1);fenceSpan(1905,1605,1930,1605,1);
  this.createWorldBlock(1845,1460,170,8);this.createWorldBlock(1760,1532.5,8,145);this.createWorldBlock(1930,1532.5,8,145);this.createWorldBlock(1772.5,1605,25,8);this.createWorldBlock(1917.5,1605,25,8);

  // Carroça vazia preparada para a futura quest de abastecimento da Taverna.
  this.farmWagon=this.add.image(1362,1410,'farm_empty_wagon').setOrigin(.5,.72).setScale(.47).setDepth(3.08);
  this.createWorldBlock(1368,1398,72,28);
  // O cavalo é criado em createOutskirtsAmbientLife para manter a animação idle.
  this.createWorldBlock(1277,1408,38,22);

  // Entrada da caverna.
  this.add.text(3400,1582,'Boca da Caverna',{fontFamily:'Arial',fontSize:12,color:'#d8d8df'}).setOrigin(.5).setDepth(.32);
  this.add.ellipse(3400,1738,250,110,0x000000,.12).setDepth(.18);
  this.add.ellipse(3400,1718,180,84,0x101318,.92).setDepth(.25).setStrokeStyle(3,0x4d535d,.35);
  [[3310,1710,70,44],[3350,1658,88,58],[3452,1656,100,62],[3490,1710,80,46]].forEach(r=>rock(...r));
  this.caveEntrance=this.add.zone(3400,1724,130,94);this.createWorldBlock(3400,1668,104,22);
  this.add.rectangle(3400,1626,122,22,0x1b2030,.54).setDepth(.3).setStrokeStyle(1,0x9099b0,.26);
  this.cavePromptText=this.add.text(3400,1626,'F - Entrar',{fontFamily:'Arial',fontSize:12,color:'#eef4ff',fontStyle:'bold',backgroundColor:'#1b2030',padding:{left:8,right:8,top:4,bottom:4}}).setOrigin(.5).setDepth(10).setVisible(false);

  // Portal da floresta.
  this.add.text(3920,470,'Portal da Floresta',{fontFamily:'Arial',fontSize:12,color:'#b8ffcb'}).setOrigin(.5).setDepth(.34);
  const portalTree=(x,y)=>{this.add.rectangle(x,y-18,12,48,0x60452e,.95).setDepth(.31);this.add.circle(x,y-42,24,0x4d7e41,.96).setDepth(.32);this.add.circle(x-14,y-36,18,0x5f9350,.94).setDepth(.32);this.add.circle(x+14,y-36,18,0x3f6d34,.94).setDepth(.32);this.createWorldBlock(x,y-4,20,28)};
  portalTree(3855,648);portalTree(3985,648);
  this.add.ellipse(3920,650,108,156,0x3ca36b,.18).setDepth(.23).setStrokeStyle(3,0x8bf0ad,.52);
  this.add.ellipse(3920,650,78,122,0x73e6a8,.28).setDepth(.24).setStrokeStyle(2,0xc8ffe0,.35);
  for(let i=0;i<6;i++)this.add.circle(3920+Math.cos(i*Math.PI/3)*32,650+Math.sin(i*Math.PI/3)*44,3,0xb7ffe3,.86).setDepth(.25);
  this.forestPortal=this.add.zone(3920,650,130,180);
 }

 createOutskirtsAmbientLife(){
  const makeWorker=(x,y,name,role,texture,idle='down')=>{const npc=new Npc(this,x,y,name,['O trabalho nos campos nunca termina.'],{role,portrait:'',idleProfile:'resident',idleFacing:idle});npc.setRealSprite?.(texture);npc.hideInteractionUi?.(true);npc.setRole(role);this.createWorldBlock(x,y+6,16,12);return npc};
  this.farmWorkerA=makeWorker(1542,1396,'Tomas Campina','Trabalhador rural','resident','down');
  this.farmWorkerB=makeWorker(1716,1326,'Selene Verdal','Agricultora','traveler','left');

  const bob=(go,dy=2,d=1150)=>this.tweens.add({targets:go,y:go.y-dy,duration:d,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
  const sway=(go,ax=2,d=1600)=>this.tweens.add({targets:go,angle:{from:-ax,to:ax},duration:d,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});

  // Animações próprias dos animais rurais definitivos.
  if(!this.anims.exists('farm-cow-idle'))this.anims.create({key:'farm-cow-idle',frames:this.anims.generateFrameNumbers('farm_cow',{frames:[0,1,0,2,0,3]}),frameRate:2.2,repeat:-1});
  if(!this.anims.exists('farm-pig-idle'))this.anims.create({key:'farm-pig-idle',frames:this.anims.generateFrameNumbers('farm_pig',{frames:[0,1,0,2,3,0]}),frameRate:2.4,repeat:-1});
  if(!this.anims.exists('farm-horse-idle'))this.anims.create({key:'farm-horse-idle',frames:this.anims.generateFrameNumbers('farm_horse',{frames:[0,1,0,2,0,3]}),frameRate:1.8,repeat:-1});

  this.farmCow1=this.add.sprite(1570,1502,'farm_cow',0).setOrigin(.5,.88).setScale(.68).setDepth(3.02);this.farmCow1.play('farm-cow-idle');
  this.farmCow2=this.add.sprite(1660,1540,'farm_cow',2).setOrigin(.5,.88).setScale(.64).setDepth(3.03);this.farmCow2.play('farm-cow-idle');this.farmCow2.setFlipX(true);
  this.farmPig1=this.add.sprite(1800,1515,'farm_pig',0).setOrigin(.5,.88).setScale(.62).setDepth(3.02);this.farmPig1.play('farm-pig-idle');
  this.farmPig2=this.add.sprite(1880,1550,'farm_pig',2).setOrigin(.5,.88).setScale(.58).setDepth(3.01);this.farmPig2.play('farm-pig-idle');this.farmPig2.setFlipX(true);
  this.farmHorse=this.add.sprite(1277,1408,'farm_horse',0).setOrigin(.5,.90).setScale(.68).setDepth(3.04);this.farmHorse.play('farm-horse-idle');
  // Os animais ficam sem collider individual: as cercas já definem o espaço físico
  // e isso evita bloquear o jogador dentro dos currais com o corpo de 58x58 px.

  const routeChicken=(texture,anim,x,y,pts,delay=0)=>{const s=this.add.sprite(x,y,texture,0).setOrigin(.5,.92).setScale(.30).setDepth(3+y/1000);s.play(anim);const walk=idx=>{const t=pts[idx%pts.length];const nx=pts[(idx+1)%pts.length];const dx=nx.x-s.x;s.setFlipX(dx<0);this.tweens.add({targets:s,x:nx.x,y:nx.y,duration:Phaser.Math.Distance.Between(s.x,s.y,nx.x,nx.y)*55,ease:'Linear',onComplete:()=>this.time.delayedCall(t.pause??700,()=>walk(idx+1))})};this.time.delayedCall(delay,()=>walk(0));return s};
  routeChicken('city_chicken_white','city-chicken-white-walk',2012,1510,[{x:2012,y:1510,pause:620},{x:2032,y:1494,pause:560},{x:2062,y:1508,pause:700},{x:2052,y:1536,pause:680},{x:2020,y:1542,pause:620}],300);
  routeChicken('city_chicken_brown','city-chicken-brown-walk',2070,1520,[{x:2070,y:1520,pause:580},{x:2092,y:1534,pause:680},{x:2074,y:1552,pause:720},{x:2048,y:1544,pause:640}],980);

  // Fauna de ambientação espalhada.
  this.deerA=this.add.image(2390,1638,'outskirts_deer').setOrigin(.5,.82).setScale(.68).setDepth(3.0);bob(this.deerA,2,1650);
  this.deerB=this.add.image(3040,1012,'outskirts_deer').setOrigin(.5,.82).setScale(.62).setDepth(2.95);sway(this.deerB,1.4,1540);
  this.rabbitA=this.add.image(2130,1588,'outskirts_rabbit').setOrigin(.5,.82).setScale(.76).setDepth(2.94);bob(this.rabbitA,1.5,900);
  this.rabbitB=this.add.image(2690,540,'outskirts_rabbit').setOrigin(.5,.82).setScale(.72).setDepth(2.94);bob(this.rabbitB,1.2,820);
  this.birdA=this.add.sprite(2230,1320,'city_bird',0).setOrigin(.5,.8).setScale(1.05).setDepth(2.9);this.birdA.play('city-bird-peck');
  this.birdB=this.add.sprite(2890,1270,'city_bird',2).setOrigin(.5,.8).setScale(1.0).setDepth(2.9);this.birdB.play('city-bird-flap');
 }

 cityDepth(y,offset=0){return 5+y/1000+offset}

 addCitySolidRound58(x,y,w,h,label='obstáculo'){
  const block=this.add.rectangle(x,y,w,h,0x000000,0).setDepth(0);
  this.physics.add.existing(block,true);this.physics.add.collider(this.player,block);
  (this.cityWalls??=[]).push(block);(this.cityObstacles??=[]).push({label,rect:new Phaser.Geom.Rectangle(x-w/2,y-h/2,w,h)});
  return block;
 }

 drawCityGroundRound58(){
  if(!this.textures.exists('city_pavement')||!this.textures.exists('city_grass'))return;
  const c=this.cityLayout;
  // Uma única textura percorre toda a cidade. Assim, as juntas de pedra não
  // reiniciam em cada rua nem formam os antigos carimbos de 32 px.
  this.cityPavement=this.add.image(c.left,c.top,'city_pavement').setOrigin(0).setDepth(.15);
  this.cityGrass=this.add.image(c.left,c.top,'city_grass').setOrigin(0).setDepth(.18);
  const grassMask=this.make.graphics({x:0,y:0,add:false});
  grassMask.fillStyle(0xffffff,1);
  grassMask.fillRoundedRect(110,110,1340,225,18);         // jardins do comércio
  grassMask.fillRoundedRect(105,555,315,190,18);          // jardim da Erudita
  grassMask.fillRoundedRect(1140,555,310,190,18);         // jardim da Artesã
  grassMask.fillRoundedRect(100,815,235,220,18);          // terreiro do galinheiro
  grassMask.fillRoundedRect(335,790,415,88,16);           // jardins residenciais oeste
  grassMask.fillRoundedRect(850,790,600,88,16);           // jardins residenciais leste
  this.cityGrassMask=grassMask.createGeometryMask();
  this.cityGrass.setMask(this.cityGrassMask);
}

 addCityBuildingRound58(key,x,y,targetHeight,footW,footH,label){
  if(!this.textures.exists(key))return null;
  const source=this.textures.get(key).getSourceImage(),scale=targetHeight/source.height;
  const image=this.add.image(x,y,key).setOrigin(.5,1).setScale(scale).setDepth(this.cityDepth(y));
  // O collider cobre somente a base apoiada no chão, nunca telhado/fachada.
  this.addCitySolidRound58(x,y-footH/2-3,footW,footH,label);
  const visualW=image.displayWidth*.88,visualH=image.displayHeight*.90;
  const entry={key,label,image,scale,targetHeight,baseRect:new Phaser.Geom.Rectangle(x-footW/2,y-footH-3,footW,footH),visualRect:new Phaser.Geom.Rectangle(x-visualW/2,y-visualH,visualW,visualH)};
  (this.cityBuildings??=[]).push(entry);return image;
 }

 drawCityStructuresRound58(){
  const c=this.cityLayout;this.cityBuildings=[];this.cityObstacles=[];
  // Os próprios módulos de pedra se sobrepõem. A antiga placa cinza opaca
  // atrás dos muros laterais foi removida, pois aparecia como um retângulo.
  const tileH=(x1,x2,y)=>{const len=x2-x1,count=Math.max(1,Math.ceil(len/124)),step=len/count;for(let i=0;i<count;i++)this.add.image(x1+step*(i+.5),y,'city_wall_h').setDisplaySize(step+4,64).setDepth(this.cityDepth(y))};
  const tileV=(y1,y2,x)=>{const len=y2-y1,count=Math.max(1,Math.ceil(len/124)),step=len/count;for(let i=0;i<count;i++)this.add.image(x,y1+step*(i+.5),'city_wall_v').setDisplaySize(64,step+4).setDepth(this.cityDepth(y1+step*(i+1)))};
  tileH(c.left,c.right,c.top);tileV(c.top,c.bottom,c.left);
  tileV(c.top,c.eastGateY-128,c.right);tileV(c.eastGateY+128,c.bottom,c.right);
  tileH(c.left,c.southGateX-128,c.bottom);tileH(c.southGateX+128,c.right,c.bottom);
  [[c.left,c.top],[c.right,c.top],[c.left,c.bottom],[c.right,c.bottom]].forEach(p=>this.add.image(p[0],p[1],'city_tower').setDepth(this.cityDepth(p[1],.08)));
  this.add.image(c.eastGateX,c.eastGateY,'gate_east').setDepth(this.cityDepth(c.eastGateY+112,.08));
  this.add.image(c.southGateX,c.southGateY,'gate_south').setDepth(this.cityDepth(c.southGateY+52,.08));
  // As torres dos portões possuem colisões próprias; só a abertura desenhada
  // permanece atravessável.
  this.cityGateColliders=[
   this.addCitySolidRound58(c.right-4,c.eastGateY-84,96,88,'Torre norte do Portão Leste'),
   this.addCitySolidRound58(c.right-4,c.eastGateY+84,96,88,'Torre sul do Portão Leste'),
   this.addCitySolidRound58(c.southGateX-84,c.bottom-4,88,96,'Torre oeste do Portão Sul'),
   this.addCitySolidRound58(c.southGateX+84,c.bottom-4,88,96,'Torre leste do Portão Sul')
  ];

  // Rua do comércio: estabelecimento, responsável e via frontal em sequência.
  this.merchantShop=this.addCityBuildingRound58('merchant_shop',220,335,190,144,36,'Loja de Aldren');
  this.blacksmithShop=this.addCityBuildingRound58('blacksmith_shop',500,335,185,142,38,'Ferraria de Borin');
  this.healerHouse=this.addCityBuildingRound58('healer_house',1060,335,190,150,38,'Botica de Elara');
  this.tavernHouse=this.addCityBuildingRound58('tavern_house',1330,335,190,160,40,'Taverna de Garrick');
  // Dois estabelecimentos laterais ligados ao anel da praça.
  this.scholarHouse=this.addCityBuildingRound58('scholar_house',250,745,200,150,44,'Casa de Lysandra');
  this.artisanHouse=this.addCityBuildingRound58('artisan_house',1310,745,195,148,40,'Oficina de Maelis');
  // Bairro residencial: quatro casas lado a lado, todas com altura visual igual.
  this.residentialHouseRed=this.addCityBuildingRound58('residential_house_red',430,970,190,120,34,'Casa vermelha');
  this.residentialHouseGreen=this.addCityBuildingRound58('residential_house_green',610,970,190,112,34,'Casa verde');
  this.residentialHouseBlue=this.addCityBuildingRound58('residential_house_blue',1030,970,190,135,35,'Casa azul');
  this.residentialHouseOrange=this.addCityBuildingRound58('residential_house_orange',1270,970,190,145,36,'Casa laranja');
 }

 drawPlazaRound58(){
  const c=this.cityLayout,solid=(x,y,w,h,label)=>this.addCitySolidRound58(x,y,w,h,label);
  // O Marco de Senda é criado exatamente em plazaX/plazaY no setupHud.
  // A fonte ocupa o setor sul sem disputar o centro do monumento.
  if(this.textures.exists('city_fountain')){
   this.cityFountain=this.add.image(c.fountainX,c.fountainY,'city_fountain').setOrigin(.5,.92).setScale(.46).setDepth(this.cityDepth(c.fountainY,.02));
   solid(c.fountainX,c.fountainY-8,88,28,'Base da fonte');
  }
  const lamp=(x,y)=>{if(this.textures.exists('street_lamppost'))this.add.image(x,y,'street_lamppost').setOrigin(.5,1).setScale(.62).setDepth(this.cityDepth(y));solid(x,y-5,10,10,'Base de poste')};
  lamp(520,445);lamp(1040,445);lamp(520,805);lamp(1040,805);
  const flower=(x,y)=>{if(this.textures.exists('street_flower_fence'))this.add.image(x,y,'street_flower_fence').setOrigin(.5,1).setScale(.36).setDepth(this.cityDepth(y))};
  flower(500,650);flower(1060,650);
 }

 drawCityDetailsRound58(){
  const solid=(x,y,w,h,label)=>this.addCitySolidRound58(x,y,w,h,label);
  const prop=(key,x,y,scale=.45,block=null)=>{if(!this.textures.exists(key))return null;const go=this.add.image(x,y,key).setOrigin(.5,1).setScale(scale).setDepth(this.cityDepth(y));if(block)solid(x,y-block.offsetY,block.w,block.h,block.label||key);return go};
  // Sem placas escritas no chão: cada estabelecimento é reconhecido pela arte e
  // pelo NPC posicionado em frente à fachada.
  prop('street_crates',130,360,.42,{w:24,h:12,offsetY:5,label:'Caixas da loja'});
  prop('street_logs',590,360,.42,{w:26,h:12,offsetY:5,label:'Lenha da ferraria'});
  prop('street_flower_fence',960,365,.38,null);
  prop('street_barrels',1410,365,.38,{w:22,h:12,offsetY:5,label:'Barris da taverna'});
  prop('street_crates',145,785,.38,{w:22,h:12,offsetY:5,label:'Caixas da erudita'});
  prop('street_logs',1410,785,.38,{w:24,h:12,offsetY:5,label:'Materiais da oficina'});
  prop('street_flower_fence',520,980,.34,null);prop('street_flower_fence',1150,980,.34,null);

  // Galinheiro ampliado em terreno próprio. A cerca urbana usa módulos
  // detalhados de madeira e pedra em vez do segmento simples dos Arredores.
  this.cityChickenYard=new Phaser.Geom.Rectangle(100,815,235,220);
  prop('chicken_coop',175,885,.52,{w:90,h:24,offsetY:8,label:'Base do galinheiro'});
  const fenceLine=(x1,y1,x2,y2)=>{
   const len=Phaser.Math.Distance.Between(x1,y1,x2,y2),angle=Phaser.Math.Angle.Between(x1,y1,x2,y2),count=Math.max(1,Math.ceil(len/106)),step=len/count;
   for(let i=0;i<count;i++){
    const t=(i+.5)/count,x=Phaser.Math.Linear(x1,x2,t),y=Phaser.Math.Linear(y1,y2,t);
    this.add.image(x,y,'city_chicken_fence').setOrigin(.5,.72).setDisplaySize(step+5,34).setRotation(angle).setDepth(this.cityDepth(y,.015));
   }
   const cx=(x1+x2)/2,cy=(y1+y2)/2;
   if(Math.abs(x2-x1)>=Math.abs(y2-y1))solid(cx,cy,Math.max(4,len),8,'Cerca do galinheiro');else solid(cx,cy,8,Math.max(4,len),'Cerca do galinheiro');
  };
  fenceLine(100,815,335,815);fenceLine(100,815,100,1035);fenceLine(335,815,335,1035);fenceLine(100,1035,175,1035);fenceLine(260,1035,335,1035);

  const tree=(x,y,scale=.44,flip=false)=>{if(!this.textures.exists('city_tree'))return null;const t=this.add.image(x,y,'city_tree').setOrigin(.5,.94).setScale(scale).setFlipX(flip).setDepth(this.cityDepth(y));solid(x,y-5,24,16,'Base de árvore');return t};
  tree(135,245,.46);tree(1425,245,.46,true);tree(125,660,.43,true);tree(1435,665,.43);tree(325,1060,.40);tree(1430,1020,.40,true);

  // Postes de luz seguem as ruas e ocupam os intervalos entre fachadas.
  [[355,450],[760,450],[920,450],[1195,450],[390,620],[390,880],[1170,620],[1170,880],[520,900],[1080,900]].forEach(p=>prop('street_lamppost',p[0],p[1],.58,{w:9,h:9,offsetY:4,label:'Base de poste'}));
 }

 auditCityRound58(){
  const c=this.cityLayout,issues=[];
  for(const b of this.cityBuildings||[]){
   if(b.baseRect.left<c.left+24||b.baseRect.right>c.right-24||b.baseRect.top<c.top+24||b.baseRect.bottom>c.bottom-24)issues.push(`${b.label}: footprint fora das muralhas`);
  }
  for(let i=0;i<(this.cityBuildings||[]).length;i++)for(let j=i+1;j<this.cityBuildings.length;j++){
   const a=this.cityBuildings[i],b=this.cityBuildings[j];if(Phaser.Geom.Intersects.RectangleToRectangle(a.visualRect,b.visualRect))issues.push(`${a.label} sobrepõe ${b.label}`);
  }
  const eastPassage=new Phaser.Geom.Rectangle(c.right-52,c.eastGateY-38,104,76),southPassage=new Phaser.Geom.Rectangle(c.southGateX-44,c.bottom-52,88,104);
  for(const o of this.cityObstacles||[]){if(o.label?.includes('Torre'))continue;if(Phaser.Geom.Intersects.RectangleToRectangle(o.rect,eastPassage)||Phaser.Geom.Intersects.RectangleToRectangle(o.rect,southPassage))issues.push(`${o.label}: invade passagem de portão`)}
  this.cityLayoutAudit={ok:issues.length===0,issues};if(issues.length)console.warn('[Cidade de Aether — auditoria Round 58]',issues);
 }

 drawCityGroundLegacyRound55(){
  if(!this.textures.exists('city_ground'))return;
  const tile=32,r=this.safeRect;
  const hash=(gx,gy,mod)=>Math.abs((gx*17+gy*31+gx*gy*3)%mod);
  for(let y=r.y;y<r.y+r.height;y+=tile){
   for(let x=r.x;x<r.x+r.width;x+=tile){
    const gx=Math.floor((x-r.x)/tile),gy=Math.floor((y-r.y)/tile);
    const frame=hash(gx,gy,10);
    this.add.image(x,y,'city_ground',frame).setOrigin(0).setDepth(.15);
   }
  }
  const stone=(x,y,frame)=>this.add.image(x,y,'city_ground',frame).setOrigin(0).setDepth(.2);
  const wear=(x,y,w,h,a=.12,rot=0)=>this.add.ellipse(x,y,w,h,0x846347,a).setAngle(rot).setDepth(.19);
  const pebbleCluster=(x,y,count=4,spread=12)=>{
   for(let i=0;i<count;i++){
    const px=x+((i%2===0?-1:1)*(4+(i*3)%spread));
    const py=y+((i<2?-1:1)*(3+(i*2)%spread));
    this.add.circle(px,py,1+(i%3),0xb6b2aa,.82).setDepth(.24);
   }
  };
  const herb=(x,y,scale=1)=>{
   this.add.ellipse(x-2*scale,y,4*scale,8*scale,0x5f8b45,.9).setAngle(-24).setDepth(.23);
   this.add.ellipse(x+2*scale,y,4*scale,8*scale,0x6ea653,.92).setAngle(24).setDepth(.23);
   this.add.ellipse(x,y-2*scale,4*scale,10*scale,0x467536,.92).setDepth(.23);
  };
  for(let y=316;y<=380;y+=32){
   for(let x=92;x<1100;x+=32){
    const gx=Math.floor(x/32),gy=Math.floor(y/32);
    stone(x,y,20+hash(gx,gy,10));
   }
  }
  for(let x=476;x<=572;x+=32){
   for(let y=380;y<820;y+=32){
    const gx=Math.floor(x/32),gy=Math.floor(y/32);
    stone(x,y,20+hash(gx,gy,10));
   }
  }
  const cx=540,cy=410;
  for(let y=cy-160;y<=cy+160;y+=32){
   for(let x=cx-192;x<=cx+192;x+=32){
    const dx=(x+16-cx)/192,dy=(y+16-cy)/160;
    if(dx*dx+dy*dy<=1.08){
      const gx=Math.floor(x/32),gy=Math.floor(y/32);
      const dist=Math.sqrt(dx*dx+dy*dy);
      const ring=dist>.78?28:dist>.46?24:20;
      stone(x,y,ring+hash(gx,gy,4));
    }
   }
  }
  for(let x=572;x<=700;x+=32){
   for(let y=508;y<=604;y+=32){
    const gx=Math.floor(x/32),gy=Math.floor(y/32);
    stone(x,y,24+hash(gx,gy,4));
   }
  }
  const dirtPath=(x1,y1,x2,y2)=>{
   const steps=Math.max(Math.abs(x2-x1),Math.abs(y2-y1))/32;
   for(let i=0;i<=steps;i++){
    const x=Math.round((x1+(x2-x1)*(i/steps))/32)*32;
    const y=Math.round((y1+(y2-y1)*(i/steps))/32)*32;
    stone(x,y,10+hash(x/32,y/32,10));
   }
  };
  dirtPath(252,348,252,236);
  dirtPath(476,348,476,236);
  dirtPath(700,348,700,236);
  dirtPath(348,412,348,548);
  dirtPath(764,412,764,548);
  dirtPath(220,600,220,706);
  dirtPath(348,548,348,700);
  dirtPath(192,636,348,636);
  dirtPath(764,412,928,412);
  dirtPath(928,316,928,764);
  dirtPath(928,620,992,620);
  dirtPath(896,764,928,764);
  dirtPath(636,476,636,560);

  // Desgaste de bordas, ervas e pequenas pedras para a segunda fase de detalhamento.
  [
   [170,348,76,26,12,-8],[336,348,94,28,12,10],[676,348,100,28,12,-6],[946,350,122,28,12,8],
   [524,470,34,146,10,90],[522,688,36,184,10,90],[350,638,168,30,11,0],[926,412,34,180,10,90],
   [540,410,126,92,10,0],[540,430,78,52,10,0],[640,558,88,34,10,0]
  ].forEach(p=>wear(p[0],p[1],p[2],p[3],p[4]/100,p[5]));
  [
   [478,374],[610,374],[498,446],[584,450],[540,364],[542,474],
   [220,350],[900,348],[520,566],[514,742],[930,716],[332,638]
  ].forEach(p=>pebbleCluster(p[0],p[1],4,14));
  [
   [112,302],[146,398],[214,596],[280,682],[394,738],[660,728],[822,690],[1018,690],
   [108,176],[238,170],[834,174],[1038,202],[1046,534],[864,792]
  ].forEach(p=>herb(p[0],p[1],1));
 }

 drawPlazaDecorLegacyRound55(){
  const addSolid=(go)=>{this.physics.add.existing(go,true);this.cityWalls.push(go);this.physics.add.collider(this.player,go)};
  // Praça refinada com obstáculos físicos compactos: o visual permanece rico,
  // mas o corredor principal e o acesso ao Marco de Senda ficam sempre livres.
  this.add.ellipse(540,414,256,174,0x000000,.08).setDepth(1.55);
  this.add.ellipse(540,410,240,156,0xb9c4d0,.16).setDepth(1.58).setStrokeStyle(2,0xe6eef8,.24);
  this.add.ellipse(540,410,168,112,0xd5dde6,.14).setDepth(1.6).setStrokeStyle(2,0xf2f5f8,.18);
  this.add.ellipse(540,422,134,86,0xdde5ee,.12).setDepth(1.66).setStrokeStyle(2,0xf2f6fa,.18);
  this.add.ellipse(540,422,92,58,0xcdd7e0,.11).setDepth(1.67).setStrokeStyle(2,0xe9eef4,.14);
  const looseStones=[[500,386],[580,388],[492,452],[586,454],[540,372],[540,470],[517,402],[563,402],[516,442],[565,442]];
  for(const s of looseStones)this.add.circle(s[0],s[1],3,0xb9b7b1,.88).setDepth(1.68);
  if(this.textures.exists('city_well')){
   this.cityWell=this.add.image(540,424,'city_well').setOrigin(.5,.82).setScale(1.05).setDepth(3.36);
   addSolid(this.add.rectangle(540,418,72,48,0x000000,0).setDepth(0));
  }else{
   this.add.circle(540,410,30,0x6f7378,.95).setDepth(3.35).setStrokeStyle(3,0xcbd4de,.85);
   addSolid(this.add.rectangle(540,410,54,54,0x000000,0).setDepth(0));
  }
  const planter=(x,y,w=38,h=18)=>{
   this.add.rectangle(x,y,w,h,0x6c5137,.95).setDepth(3.22).setStrokeStyle(2,0x9b7a56,.7);
   this.add.ellipse(x,y-4,w-8,h-4,0x4f7f41,.96).setDepth(3.23);
   this.add.circle(x-9,y-5,4,0x7cb564,.95).setDepth(3.24);
   this.add.circle(x+8,y-3,5,0x6aa45a,.94).setDepth(3.24);
   // Collider menor que o desenho: impede atravessar o miolo do canteiro sem criar gargalos.
   addSolid(this.add.rectangle(x,y+1,20,10,0x000000,0).setDepth(0));
  };
  planter(400,280);planter(680,360);planter(400,540);planter(640,440);
  const bench=(x,y)=>{
   this.add.rectangle(x,y,30,8,0x6d4d2b,.95).setDepth(3.21);
   this.add.rectangle(x,y-5,30,3,0x9b7347,.9).setDepth(3.22);
   addSolid(this.add.rectangle(x,y,16,6,0x000000,0).setDepth(0));
  };
  bench(380,300);bench(380,500);bench(700,340);bench(700,500);
  const post=(x,y)=>{
   this.add.rectangle(x,y,4,24,0x6e6f73,.95).setDepth(3.2);
   this.add.circle(x,y-14,5,0xe8c66a,.9).setDepth(3.21);
   addSolid(this.add.rectangle(x,y+2,10,18,0x000000,0).setDepth(0));
  };
  post(590,540);post(686,540);
 }

 drawStreetDetailsLegacyRound55(){
  const addBlock=(x,y,w,h)=>{
   const b=this.add.rectangle(x,y,w,h,0x000000,0).setDepth(0);
   this.physics.add.existing(b,true);this.cityWalls.push(b);this.physics.add.collider(this.player,b);return b;
  };
  const addProp=(key,x,y,scale=1,depth=3.18,block=null)=>{
   if(!this.textures.exists(key))return null;
   const prop=this.add.image(x,y,key).setOrigin(.5,1).setScale(scale).setDepth(depth);
   if(block)addBlock(x,y-block.offsetY,block.w,block.h);
   return prop;
  };
  const sign=(x,y,label,tint=0x6d4d2b)=>{
   this.add.rectangle(x,y,26,13,tint,.96).setDepth(3.3).setStrokeStyle(2,0xb89361,.7);
   this.add.rectangle(x-9,y+10,3,16,0x5e4630,.95).setDepth(3.29);
   this.add.rectangle(x+9,y+10,3,16,0x5e4630,.95).setDepth(3.29);
   this.add.text(x,y,label,{fontFamily:'Arial',fontSize:8,color:'#f7f3df',fontStyle:'bold'}).setOrigin(.5).setDepth(3.31);
  };
  const tree=(x,y,scale=1,solid=true)=>{
   this.add.rectangle(x,y-8*scale,8*scale,18*scale,0x6d4b2f,.96).setDepth(3.08);
   this.add.circle(x,y-26*scale,16*scale,0x5a8a45,.95).setDepth(3.09);
   this.add.circle(x-10*scale,y-20*scale,12*scale,0x6ea35a,.94).setDepth(3.1);
   this.add.circle(x+10*scale,y-20*scale,12*scale,0x487238,.94).setDepth(3.1);
   if(solid)addBlock(x,y-6*scale,16*scale,12*scale);
  };
  const shrub=(x,y,scale=1)=>{
   this.add.circle(x,y,8*scale,0x618d4b,.92).setDepth(3.06);
   this.add.circle(x-7*scale,y+2*scale,6*scale,0x729f59,.92).setDepth(3.06);
   this.add.circle(x+7*scale,y+1*scale,6*scale,0x4e793b,.92).setDepth(3.06);
  };
  const cart=(x,y,scale=1)=>{
   this.add.rectangle(x,y-14*scale,46*scale,18*scale,0x7a5433,.96).setDepth(3.19).setStrokeStyle(2,0x9f7850,.6);
   this.add.rectangle(x,y-26*scale,30*scale,8*scale,0x916845,.94).setDepth(3.2);
   this.add.rectangle(x-24*scale,y-19*scale,10*scale,4*scale,0x7b5d3a,.95).setDepth(3.2);
   this.add.rectangle(x+24*scale,y-19*scale,10*scale,4*scale,0x7b5d3a,.95).setDepth(3.2);
   this.add.circle(x-14*scale,y-2*scale,6*scale,0x393331,.96).setDepth(3.18).setStrokeStyle(2,0xb19a76,.75);
   this.add.circle(x+14*scale,y-2*scale,6*scale,0x393331,.96).setDepth(3.18).setStrokeStyle(2,0xb19a76,.75);
   addBlock(x,y-10*scale,34*scale,16*scale);
  };
  const noticeBoard=(x,y)=>{
   this.add.rectangle(x,y-14,34,22,0x6c5137,.96).setDepth(3.24).setStrokeStyle(2,0xa37c58,.7);
   this.add.rectangle(x-9,y+2,4,22,0x60452e,.96).setDepth(3.23);
   this.add.rectangle(x+9,y+2,4,22,0x60452e,.96).setDepth(3.23);
   this.add.rectangle(x-8,y-18,10,6,0xf3e2b6,.92).setDepth(3.25);
   this.add.rectangle(x+5,y-11,12,7,0xe8d2a2,.92).setDepth(3.25);
   this.add.rectangle(x+2,y-20,11,5,0xcbd8ef,.92).setDepth(3.25);
   addBlock(x,y-2,22,14);
  };
  const chickenYardAccent=(x,y)=>{
   // Round 44: pequena cerca rústica temática ao redor do galinheiro.
   // O desenho é deliberadamente simples para combinar com o kit visual do jogo.
   const fencePost=(px,py,h=10)=>{
    this.add.rectangle(px,py,3,h,0x7d5a39,.98).setDepth(3.18).setStrokeStyle(1,0xb28a60,.38);
   };
   const fenceRail=(x1,y1,x2,y2)=>{
    const mx=(x1+x2)/2,my=(y1+y2)/2;
    const len=Phaser.Math.Distance.Between(x1,y1,x2,y2);
    const ang=Phaser.Math.Angle.Between(x1,y1,x2,y2);
    this.add.rectangle(mx,my,len,2.2,0xa67a4b,.94).setRotation(ang).setDepth(3.17).setStrokeStyle(1,0x745230,.25);
   };
   const fenceSpan=(points)=>{
    for(let i=0;i<points.length;i++)fencePost(points[i][0],points[i][1],points[i][2]??10);
    for(let i=0;i<points.length-1;i++){
      fenceRail(points[i][0],points[i][1]-2,points[i+1][0],points[i+1][1]-2);
      fenceRail(points[i][0],points[i][1]+2,points[i+1][0],points[i+1][1]+2);
    }
   };

   // Cerca em U com pequena abertura frontal.
   fenceSpan([[x-54,y-18,11],[x-54,y-3,11],[x-54,y+12,11]]);
   fenceSpan([[x-54,y-18,11],[x-28,y-28,10],[x+2,y-30,10],[x+30,y-28,10],[x+54,y-18,11]]);
   fenceSpan([[x+54,y-18,11],[x+54,y-2,11],[x+54,y+12,11]]);
   fenceSpan([[x-18,y+16,10],[x-4,y+18,10]]);
   fenceSpan([[x+16,y+18,10],[x+30,y+16,10]]);

   // Pequeno portão indicado por dois postes um pouco mais altos.
   fencePost(x+4,y+18,12);
   fencePost(x+10,y+18,12);

   // Comedouro simples de madeira.
   this.add.rectangle(x-26,y-42,20,7,0x7e5a38,.96).setDepth(3.21).setStrokeStyle(1,0xb58b61,.55);
   this.add.rectangle(x-26,y-46,16,3,0xc7a15d,.92).setDepth(3.22);

   // Pequeno bebedouro raso, ajudando a reforçar a leitura de quintal.
   this.add.ellipse(x+18,y-40,13,7,0x6b90a6,.94).setDepth(3.2).setStrokeStyle(1,0xc9dbe7,.45);

   // Marcas sutis de terra e palha para polir a leitura do chão do terreiro.
   this.add.ellipse(x-10,y-6,56,22,0x8b6a44,.17).setDepth(3.12);
   this.add.ellipse(x+20,y-12,44,18,0x7c5a38,.12).setDepth(3.12);
   const strawBits=[
    [x-34,y-18,-0.45],[x-26,y-12,0.15],[x-12,y-20,0.35],[x+2,y-16,-0.2],
    [x+18,y-10,0.42],[x+28,y-18,-0.35],[x+8,y+2,0.18],[x-18,y+1,-0.12]
   ];
   for(const bit of strawBits){
    this.add.rectangle(bit[0],bit[1],8,1.8,0xd6bd74,.82).setRotation(bit[2]).setDepth(3.2);
   }

   // Saco de ração pequeno, visualmente discreto e coerente com a escala local.
   this.add.rectangle(x+42,y-48,12,16,0xc9b28a,.96).setDepth(3.2).setStrokeStyle(1,0x8d6e49,.4);
   this.add.rectangle(x+42,y-56,9,3,0xb5966e,.94).setDepth(3.21);
   this.add.rectangle(x+42,y-48,6,1.2,0x8d6e49,.35).setDepth(3.22);

   // Pequeno poleiro/caixote rústico junto ao galinheiro.
   this.add.rectangle(x-44,y-8,18,10,0x9b7246,.96).setDepth(3.18).setStrokeStyle(1,0x714e2e,.45);
   this.add.rectangle(x-44,y-14,20,2.4,0xbd9160,.94).setDepth(3.19);
   this.add.rectangle(x-38,y-18,12,2.2,0x8d673f,.92).setDepth(3.19);

   // Dois pequenos fardos/caixas baixas para dar leitura de terreiro.
   this.add.rectangle(x+34,y-30,14,10,0xb88d4f,.94).setDepth(3.19).setStrokeStyle(1,0x8a663a,.5);
   this.add.rectangle(x+48,y-28,12,9,0xc79b5b,.94).setDepth(3.19).setStrokeStyle(1,0x8a663a,.5);

   // Grãos espalhados próximos ao comedouro.
   const seeds=[[x-36,y-36],[x-31,y-34],[x-24,y-37],[x-19,y-33],[x-30,y-29],[x-23,y-30],[x+6,y-34],[x+11,y-31],[x+35,y-41],[x+39,y-38]];
   for(const s of seeds)this.add.circle(s[0],s[1],1.1,0xe3c56f,.88).setDepth(3.23);
  };

  // Placas permanecem decorativas para não interferir na aproximação aos NPCs.
  sign(196,224,'LOJA');sign(424,224,'FORJA');sign(646,224,'BOTICA',0x4f6f3e);
  sign(274,516,'TAVERNA');sign(692,518,'ARCANA',0x4a537f);sign(150,778,'OFICINA',0x6a4a6f);

  // Postes reposicionados para fora das rotas e dos footprints dos prédios.
  const lamps=[
   {x:184,y:250},{x:350,y:250},{x:562,y:250},{x:782,y:250},{x:1028,y:286},
   {x:404,y:566},{x:806,y:588},{x:420,y:704},{x:742,y:662},{x:1042,y:454},
   {x:286,y:610},{x:942,y:548}
  ];
  for(const p of lamps)addProp('street_lamppost',p.x,p.y,.62,3.28,{w:14,h:16,offsetY:8});

  // Carroças afastadas das residências e dos gargalos laterais.
  cart(372,268,.88);cart(1040,500,.82);

  // Carga urbana: apenas grupos fora de corredores recebem collider.
  addProp('street_crates',148,262,.48,3.17,{w:32,h:18,offsetY:9});
  addProp('street_barrels',214,266,.44,3.17,{w:26,h:18,offsetY:8});
  addProp('street_logs',612,258,.50,3.17,{w:32,h:18,offsetY:9});
  // Estes dois grupos junto à taverna ficam decorativos para preservar a passagem oeste/sul.
  addProp('street_crates',280,536,.46,3.17,null);
  addProp('street_barrels',232,534,.50,3.17,null);
  addProp('street_crates',1018,730,.44,3.17,{w:30,h:18,offsetY:8});
  addProp('street_barrels',756,704,.46,3.17,{w:30,h:18,offsetY:8});
  addProp('street_logs',690,746,.46,3.17,{w:32,h:18,offsetY:8});
  addProp('street_barrels',1028,678,.40,3.17,{w:24,h:18,offsetY:7});

  addProp('street_flower_fence',394,610,.50,3.16,{w:26,h:12,offsetY:6});
  addProp('street_flower_fence',710,610,.50,3.16,{w:26,h:12,offsetY:6});
  addProp('street_flower_fence',110,706,.52,3.16,{w:28,h:12,offsetY:6});
  addProp('street_flower_fence',1000,786,.52,3.16,{w:28,h:12,offsetY:6});
  addProp('street_flower_fence',1042,646,.48,3.16,{w:26,h:12,offsetY:6});

  // Round 43: reposicionamento fino do galinheiro para formar um pequeno
  // terreiro visual com as galinhas. A colisão continua compacta na base.
  addProp('chicken_coop',432,804,.40,3.19,{w:62,h:26,offsetY:11});
  chickenYardAccent(432,804);

  noticeBoard(450,560);

  tree(126,184,.9,true);tree(1018,188,.9,true);tree(118,742,.95,true);tree(1040,744,.9,true);tree(760,780,.82,true);
  shrub(170,182,1);shrub(968,188,.9);shrub(150,734,.9);shrub(1010,700,.95);shrub(790,720,.9);shrub(720,206,.8);
 }

 applyCityVisualPolishLegacyRound55(){
  const hangingBanner=(x,y,w=16,h=18,color=0x8b5a3c)=>{
   this.add.rectangle(x,y-10,2,14,0x60452e,.96).setDepth(3.24);
   this.add.rectangle(x+w*.5,y-10,2,14,0x60452e,.96).setDepth(3.24);
   this.add.rectangle(x+w*.25,y-16,w+4,2.5,0xa88557,.9).setDepth(3.25);
   this.add.rectangle(x+w*.25,y-7,w,h,color,.94).setOrigin(.5,0).setDepth(3.26).setStrokeStyle(1,0xe7d6ad,.18);
   this.add.triangle(x+w*.25,y+h+10,0,0,6,0,3,4,color,.94).setDepth(3.26);
  };
  const doormat=(x,y,w=24,h=8,color=0x7d5636)=>{
   this.add.ellipse(x,y,w+8,h+4,0x000000,.08).setDepth(3.09);
   this.add.rectangle(x,y,w,h,color,.94).setDepth(3.14).setStrokeStyle(1,0xb89062,.3);
   this.add.rectangle(x,y,w-4,1.6,0xc8a06d,.35).setDepth(3.15);
  };
  const flowerBox=(x,y,w=18)=>{
   this.add.rectangle(x,y,w,6,0x775437,.95).setDepth(3.18).setStrokeStyle(1,0xa67b55,.35);
   this.add.circle(x-4,y-3,3,0x6ea653,.95).setDepth(3.19);
   this.add.circle(x+3,y-4,3,0x7cb564,.95).setDepth(3.19);
   this.add.circle(x,y-6,2.1,0xdab4d8,.92).setDepth(3.2);
  };
  const stoneApron=(x,y,w=34,h=12)=>{
   this.add.ellipse(x,y+2,w+8,h+6,0x000000,.05).setDepth(3.04);
   this.add.rectangle(x,y,w,h,0xbab5ac,.9).setDepth(3.1).setStrokeStyle(1,0xe4dfd6,.18);
   this.add.rectangle(x-w*.25,y,w*.18,h-2,0xcfcac2,.28).setDepth(3.11);
   this.add.rectangle(x+w*.12,y,w*.22,h-2,0xa9a49b,.18).setDepth(3.11);
  };
  const herbPatch=(x,y,scale=1)=>{
   this.add.ellipse(x-3*scale,y,5*scale,9*scale,0x5f8b45,.92).setAngle(-20).setDepth(3.06);
   this.add.ellipse(x+2*scale,y,5*scale,9*scale,0x6ea653,.92).setAngle(22).setDepth(3.06);
   this.add.ellipse(x,y-2*scale,4*scale,10*scale,0x467536,.9).setDepth(3.06);
  };
  const dustPatch=(x,y,w=28,h=10,alpha=.08,rot=0)=>{
   this.add.ellipse(x,y,w,h,0x8c6948,alpha).setAngle(rot).setDepth(3.05);
  };
  const microCrate=(x,y)=>{
   this.add.rectangle(x,y,10,8,0x9a7246,.95).setDepth(3.17).setStrokeStyle(1,0x6f4e30,.3);
   this.add.rectangle(x,y-3,8,1.6,0xc39a62,.25).setDepth(3.18);
  };

  // Linguagem visual compartilhada nas fachadas principais.
  // Distrito comercial
  hangingBanner(214,168,12,16,0x9e5a3a); hangingBanner(278,168,12,16,0x6a7b44);
  stoneApron(252,210,38,10); doormat(252,204,24,7,0x734d34); flowerBox(224,202,14); flowerBox(280,202,14);
  dustPatch(252,220,54,12,.08,0);

  hangingBanner(438,168,12,16,0x7a5333); hangingBanner(502,168,12,16,0xb07d45);
  stoneApron(476,210,36,10); doormat(476,204,22,7,0x69442d); microCrate(444,202); microCrate(508,202);
  dustPatch(476,220,50,12,.08,0);

  hangingBanner(662,168,12,16,0x58754a); hangingBanner(726,168,12,16,0x6e91a7);
  stoneApron(700,210,40,10); doormat(700,204,24,7,0x5c4c3b); flowerBox(670,202,14); flowerBox(730,202,14);
  dustPatch(700,220,52,12,.08,0);

  // Núcleo sul / praças secundárias
  hangingBanner(286,458,14,18,0x8f5a3e); hangingBanner(360,458,14,18,0xb07d45);
  stoneApron(330,500,42,10); doormat(330,494,28,8,0x6f4730); flowerBox(298,492,16); flowerBox(362,492,16);
  dustPatch(330,510,60,13,.09,0);

  hangingBanner(718,458,14,18,0x4c5f88); hangingBanner(792,458,14,18,0x7c5c97);
  stoneApron(760,500,44,10); doormat(760,494,26,8,0x4b4858); flowerBox(724,492,16); flowerBox(796,492,16);
  dustPatch(760,510,62,13,.09,0);

  // Bairro artesanal e residências.
  hangingBanner(186,728,12,16,0x87516e); hangingBanner(248,728,12,16,0xb07d45);
  stoneApron(220,770,38,10); doormat(220,764,24,8,0x704136); flowerBox(190,762,14); flowerBox(250,762,14);
  dustPatch(220,778,54,12,.08,0);

  stoneApron(184,654,34,10); doormat(184,648,20,7,0x714b34); flowerBox(158,646,12); herbPatch(212,648,.9);
  stoneApron(930,318,34,10); doormat(930,312,20,7,0x705241); herbPatch(906,312,.8); flowerBox(954,310,12);
  stoneApron(996,622,36,10); doormat(996,616,20,7,0x5e4d39); flowerBox(970,614,12); herbPatch(1022,618,.85);
  stoneApron(886,764,38,10); doormat(886,758,22,7,0x5a5670); herbPatch(858,760,.85); flowerBox(912,756,12);

  // Ajustes urbanos leves para unificar ruas e transições sem atrapalhar circulação.
  [
   [132,286],[320,286],[562,286],[810,286],[1018,286],
   [164,590],[604,590],[918,590],[154,738],[642,738],[944,738]
  ].forEach(p=>herbPatch(p[0],p[1],.78));

  [
   [222,242,42,10,-6],[476,242,44,10,4],[700,242,44,10,-3],
   [330,534,56,12,0],[760,534,58,12,0],[220,800,46,10,5],
   [930,346,38,10,0],[996,650,40,10,0],[886,792,44,10,0]
  ].forEach(p=>dustPatch(p[0],p[1],p[2],p[3],.07,p[4]));

  // Entradas da cidade com leitura mais nobre e consistente.
  doormat(520,804,34,8,0x6c5137); stoneApron(520,810,48,10);
  doormat(1084,350,10,42,0x60452e); this.add.rectangle(1084,350,10,32,0x73553a,.25).setDepth(3.12);
 }

 drawCityStructuresLegacyRound55(){
  if(!this.textures.exists('city_wall_h'))return;
  const wallH=(x,y)=>this.add.image(x,y,'city_wall_h').setDepth(4);
  const wallV=(x,y)=>this.add.image(x,y,'city_wall_v').setDepth(4);
  const tower=(x,y)=>this.add.image(x,y,'city_tower').setDepth(6);
  // Muro norte: não existe portão norte.
  for(let x=124;x<=1036;x+=128)wallH(x,60);
  // Muro oeste.
  for(let y=124;y<=756;y+=128)wallV(60,y);
  // Muro leste com abertura apenas para o Portão Leste.
  for(let y=124;y<=756;y+=128){if(y<252||y>444)wallV(1100,y)}
  // Muro sul com abertura apenas para o Portão Sul.
  for(let x=124;x<=1036;x+=128){if(x<380||x>660)wallH(x,820)}
  // Torres principais da muralha.
  tower(60,60);tower(1100,60);tower(60,820);tower(1100,820);
  // Portões oficiais da Cidade de Aether.
  this.add.image(1100,350,'gate_east').setDepth(7);
  this.add.image(520,820,'gate_south').setDepth(7);
  // Loja do Mercador no distrito comercial.
  if(this.textures.exists('merchant_shop')){
   this.merchantShop=this.add.image(252,210,'merchant_shop').setOrigin(.5,1).setDepth(3.2);
   const shopBlock=this.add.rectangle(252,150,190,108,0x000000,0).setDepth(0);
   this.physics.add.existing(shopBlock,true);
   this.cityWalls.push(shopBlock);
   this.physics.add.collider(this.player,shopBlock);
  }
  if(this.textures.exists('blacksmith_shop')){
   this.blacksmithShop=this.add.image(476,210,'blacksmith_shop').setOrigin(.5,1).setDepth(3.2);
   const forgeBlock=this.add.rectangle(476,150,160,100,0x000000,0).setDepth(0);
   this.physics.add.existing(forgeBlock,true);
   this.cityWalls.push(forgeBlock);
   this.physics.add.collider(this.player,forgeBlock);
  }
  if(this.textures.exists('healer_house')){
   this.healerHouse=this.add.image(700,210,'healer_house').setOrigin(.5,1).setDepth(3.2);
   const healerBlock=this.add.rectangle(700,150,170,102,0x000000,0).setDepth(0);
   this.physics.add.existing(healerBlock,true);
   this.cityWalls.push(healerBlock);
   this.physics.add.collider(this.player,healerBlock);
  }
  if(this.textures.exists('tavern_house')){
   this.tavernHouse=this.add.image(330,500,'tavern_house').setOrigin(.5,1).setDepth(3.2);
   const tavernBlock=this.add.rectangle(330,430,190,112,0x000000,0).setDepth(0);
   this.physics.add.existing(tavernBlock,true);
   this.cityWalls.push(tavernBlock);
   this.physics.add.collider(this.player,tavernBlock);
  }
  if(this.textures.exists('scholar_house')){
   this.scholarHouse=this.add.image(760,500,'scholar_house').setOrigin(.5,1).setDepth(3.2);
   const scholarBlock=this.add.rectangle(760,426,200,118,0x000000,0).setDepth(0);
   this.physics.add.existing(scholarBlock,true);
   this.cityWalls.push(scholarBlock);
   this.physics.add.collider(this.player,scholarBlock);
  }
  if(this.textures.exists('artisan_house')){
   this.artisanHouse=this.add.image(220,770,'artisan_house').setOrigin(.5,1).setDepth(3.2);
   const artisanBlock=this.add.rectangle(220,696,176,116,0x000000,0).setDepth(0);
   this.physics.add.existing(artisanBlock,true);
   this.cityWalls.push(artisanBlock);
   this.physics.add.collider(this.player,artisanBlock);
  }
  // Casas residenciais modulares distribuídas pela cidade.
  const addResidentialHouse=(key,x,y,scale,blockW,blockH,blockOffsetY)=>{
   if(!this.textures.exists(key))return;
   const house=this.add.image(x,y,key).setOrigin(.5,1).setScale(scale).setDepth(3.15);
   const block=this.add.rectangle(x,y-blockOffsetY,blockW,blockH,0x000000,0).setDepth(0);
   this.physics.add.existing(block,true);
   this.cityWalls.push(block);
   this.physics.add.collider(this.player,block);
   return house;
  };
  // Urbanismo refinado: núcleo residencial oeste e quarteirão residencial leste/sudeste.
  this.residentialHouseRed=addResidentialHouse('residential_house_red',184,654,0.72,116,60,56);
  this.residentialHouseOrange=addResidentialHouse('residential_house_orange',930,318,0.56,136,86,48);
  this.residentialHouseGreen=addResidentialHouse('residential_house_green',996,622,0.72,92,92,48);
  this.residentialHouseBlue=addResidentialHouse('residential_house_blue',886,764,0.72,148,98,50);
 }
 createNpcsRound58(){
  this.merchant=new Npc(this,220,398,'Aldren Voss',['Tenho suprimentos para quem pretende atravessar os arredores.'],{shop:true,role:'Mercador',portrait:'portrait_aldren',idleProfile:'merchant',idleFacing:'down',visualScale:.47});this.merchant.setRealSprite?.('merchant');
  this.blacksmith=new Npc(this,500,398,'Borin Ferramão',['Minha ferraria ainda está sendo reconstruída. Minhas ferramentas desapareceram durante a invasão.','Quando eu recuperar minhas ferramentas, poderei trabalhar novamente.'],{role:'Ferreiro',portrait:'portrait_borin',idleProfile:'blacksmith',idleFacing:'down',visualScale:.46});this.blacksmith.setRealSprite?.('blacksmith');
  this.healer=new Npc(this,1060,398,'Elara Veyn',['Perdi minha fé depois dos acontecimentos sombrios. Não consigo invocar minha bênção agora.','Talvez, quando minha fé retornar, eu possa ajudar os feridos novamente.'],{role:'Curandeira',portrait:'portrait_elara',idleProfile:'healer',idleFacing:'down',visualScale:.46});this.healer.setRealSprite?.('healer');
  this.tavernKeeper=new Npc(this,1330,398,'Garrick Brenn',['A taverna ainda não abriu. Faltam alimentos e insumos para as bebidas.','Quando conseguirmos os suprimentos, espero abrir as portas novamente.'],{role:'Taverneiro',portrait:'portrait_garrick',idleProfile:'tavernkeeper',idleFacing:'down',visualScale:.46});this.tavernKeeper.setRealSprite?.('tavernkeeper');
  this.scholar=new Npc(this,250,812,'Lysandra Vael',['O mundo perdeu o sentido depois dos acontecimentos sombrios...','Talvez um dia eu volte a estudar os antigos encantamentos.'],{role:'Erudita',portrait:'portrait_lysandra',idleProfile:'scholar',idleFacing:'down',visualScale:.47});this.scholar.setRealSprite?.('scholar');
  this.artisan=new Npc(this,1310,812,'Maelis Tessara',['Minha oficina ainda é simples, mas já consigo consertar panos e costuras.','Quando os caminhos estiverem seguros, vou transformá-la em uma verdadeira oficina encantada.'],{role:'Artesã',portrait:'portrait_maelis',idleProfile:'artisan',idleFacing:'down',visualScale:.46});this.artisan.setRealSprite?.('artisan');
  // Todos os NPCs fixos olham para a câmera, inclusive Mira e os guardas.
  this.questNpc=new Npc(this,1080,680,'Mira Edevane',['A floresta ficou perigosa. Se trouxer provas dos monstros, conversaremos sobre o assunto.'],{role:'Anciã de Aether',portrait:'portrait_mira',idleProfile:'elder',idleFacing:'down',visualScale:.47});this.questNpc.setRealSprite?.('elder_mira');
  this.rightGuard=new Npc(this,1360,570,'Kael Dorn',['Estamos protegendo a saída leste. Tenha cuidado ao deixar os muros.'],{role:'Guarda do Portão Leste',portrait:'portrait_kael',idleProfile:'east_guard',idleFacing:'down',visualScale:.48});this.rightGuard.setRealSprite?.('guard');
  this.bottomGuard=new Npc(this,885,1060,'Bren Harrow',['Mantemos esta passagem protegida. Lá fora, os monstros não respeitam ninguém.'],{role:'Guarda do Sul',portrait:'portrait_bren',idleProfile:'south_guard',idleFacing:'down',visualScale:.50});this.bottomGuard.setRealSprite?.('south_guard');

  // Rotas fechadas exclusivamente sobre ruas. Nenhuma ação idle interrompe o tween.
  const residentRoute=[
   {x:390,y:900,pause:900},{x:560,y:900,pause:720},{x:670,y:860,pause:820},
   {x:670,y:760,pause:760},{x:560,y:710,pause:880},{x:470,y:630,pause:920},
   {x:520,y:540,pause:720},{x:390,y:500,pause:800},{x:390,y:650,pause:760},{x:390,y:800,pause:850}
  ];
  const travelerRoute=[
   {x:1200,y:450,pause:650},{x:1050,y:500,pause:720},{x:1080,y:580,pause:820},
   {x:1100,y:680,pause:760},{x:1080,y:790,pause:800},{x:970,y:840,pause:700},
   {x:900,y:900,pause:820},{x:1080,y:900,pause:720},{x:1200,y:830,pause:760},
   {x:1200,y:650,pause:720},{x:1200,y:520,pause:680}
  ];
  this.walkers=[
   new WanderingNpc(this,390,900,'Tomas Belmon',['A praça ainda é o lugar mais seguro de Aether.'],residentRoute,{speed:43,startDelay:650,role:'Morador de Aether',portrait:'portrait_tomas',idleProfile:'resident',visualScale:.46}),
   new WanderingNpc(this,1200,450,'Darian Kestrel',['Ouvi rumores sobre o castelo.'],travelerRoute,{speed:50,startDelay:1050,role:'Viajante',portrait:'portrait_darian',idleProfile:'traveler',visualScale:.46})
  ];
  this.walkers[0].setRealSprite?.('resident');this.walkers[1].setRealSprite?.('traveler');

  this.fixedNpcColliders=[];
  const addFixedNpcCollider=(npc,w=18,h=12)=>{if(!npc)return;const block=this.add.rectangle(npc.x,npc.y,w,h,0x000000,0).setDepth(0);this.physics.add.existing(block,true);this.physics.add.collider(this.player,block);this.fixedNpcColliders.push(block)};
  for(const npc of [this.merchant,this.blacksmith,this.healer,this.tavernKeeper,this.scholar,this.artisan,this.questNpc,this.rightGuard,this.bottomGuard])addFixedNpcCollider(npc);
  this.auditCityActorsRound58();
 }

 auditCityActorsRound58(){
  const actors=[this.merchant,this.blacksmith,this.healer,this.tavernKeeper,this.scholar,this.artisan,this.questNpc,this.rightGuard,this.bottomGuard,...(this.walkers||[])].filter(Boolean),issues=[];
  for(const actor of actors){for(const building of this.cityBuildings||[]){const r=building.baseRect,expanded=new Phaser.Geom.Rectangle(r.x-10,r.y-10,r.width+20,r.height+20);if(expanded.contains(actor.x,actor.y))issues.push(`${actor.npcName} dentro de ${building.label}`)}}
  this.cityActorAudit={ok:issues.length===0,issues};if(issues.length)console.warn('[Cidade de Aether — atores Round 58]',issues);
 }

 createNpcsLegacyRound55(){
  this.merchant=new Npc(this,252,238,'Aldren Voss',['Tenho suprimentos para quem pretende atravessar os arredores.'],{shop:true,role:'Mercador',portrait:'portrait_aldren',idleProfile:'merchant',idleFacing:'down'});this.merchant.setRealSprite?.('merchant');
  this.blacksmith=new Npc(this,476,238,'Borin Ferramão',['Minha ferraria ainda está sendo reconstruída. Minhas ferramentas desapareceram durante a invasão.','Quando eu recuperar minhas ferramentas, poderei trabalhar novamente.'],{role:'Ferreiro',portrait:'portrait_borin',idleProfile:'blacksmith',idleFacing:'down'});this.blacksmith.setRealSprite?.('blacksmith');
  this.healer=new Npc(this,700,238,'Elara Veyn',['Perdi minha fé depois dos acontecimentos sombrios. Não consigo invocar minha bênção agora.','Talvez, quando minha fé retornar, eu possa ajudar os feridos novamente.'],{role:'Curandeira',portrait:'portrait_elara',idleProfile:'healer',idleFacing:'down'});this.healer.setRealSprite?.('healer');
  this.tavernKeeper=new Npc(this,330,548,'Garrick Brenn',['A taverna ainda não abriu. Faltam alimentos e insumos para as bebidas.','Quando conseguirmos os suprimentos, espero abrir as portas novamente.'],{role:'Taverneiro',portrait:'portrait_garrick',idleProfile:'tavernkeeper',idleFacing:'down'});this.tavernKeeper.setRealSprite?.('tavernkeeper');
  this.scholar=new Npc(this,760,548,'Lysandra Vael',['O mundo perdeu o sentido depois dos acontecimentos sombrios...','Talvez um dia eu volte a estudar os antigos encantamentos.'],{role:'Erudita',portrait:'portrait_lysandra',idleProfile:'scholar',idleFacing:'down'});this.scholar.setRealSprite?.('scholar');
  this.artisan=new Npc(this,220,790,'Maelis Tessara',['Minha oficina ainda é simples, mas já consigo consertar panos e costuras.','Quando os caminhos estiverem seguros, vou transformá-la em uma verdadeira oficina encantada.'],{role:'Artesã',portrait:'portrait_maelis',idleProfile:'artisan',idleFacing:'down'});this.artisan.setRealSprite?.('artisan');

  // Mira Edevane fica próxima ao eixo do Portão Leste, mas fora das colisões
  // dos prédios e das rotas dos NPCs ambulantes.
  this.questNpc=new Npc(this,820,292,'Mira Edevane',['A floresta ficou perigosa. Se trouxer provas dos monstros, conversaremos sobre o assunto.'],{role:'Anciã de Aether',portrait:'portrait_mira',idleProfile:'elder',idleFacing:'left'});this.questNpc.setRealSprite?.('elder_mira');

  this.rightGuard=new Npc(this,968,344,'Kael Dorn',['Estamos protegendo a saída leste. Tenha cuidado ao deixar os muros.'],{role:'Guarda do Portão Leste',portrait:'portrait_kael',idleProfile:'east_guard',idleFacing:'right'});this.rightGuard.setRealSprite?.('guard');
  this.bottomGuard=new Npc(this,586,720,'Bren Harrow',['Mantemos esta passagem protegida. Lá fora, os monstros não respeitam ninguém.'],{role:'Guarda do Sul',portrait:'portrait_bren',idleProfile:'south_guard',idleFacing:'down'});this.bottomGuard.setRealSprite?.('south_guard');

  // Rotas manuais mantêm os NPCs nas ruas, sem atravessar prédios, poço ou props.
  const residentRoute=[
   {x:454,y:290,pause:1100},{x:540,y:290,pause:850},{x:620,y:290,pause:750},
   {x:720,y:290,pause:1050},{x:760,y:310,pause:900},{x:720,y:290,pause:850},
   {x:620,y:290,pause:800},{x:540,y:290,pause:950}
  ];
  const travelerRoute=[
   {x:1018,y:390,pause:700},{x:920,y:390,pause:600},{x:900,y:450,pause:800},
   {x:900,y:500,pause:650},{x:940,y:500,pause:850},{x:900,y:500,pause:650},
   {x:900,y:450,pause:700},{x:920,y:390,pause:750}
  ];
  this.walkers=[
   new WanderingNpc(this,454,290,'Tomas Belmon',['A praça ainda é o lugar mais seguro de Aether.'],residentRoute,{speed:43,startDelay:650,role:'Morador de Aether',portrait:'portrait_tomas',idleProfile:'resident'}),
   new WanderingNpc(this,1018,390,'Darian Kestrel',['Ouvi rumores sobre o castelo.'],travelerRoute,{speed:50,startDelay:1050,role:'Viajante',portrait:'portrait_darian',idleProfile:'traveler'})
  ];
  this.walkers[0].setRealSprite?.('resident');
  this.walkers[1].setRealSprite?.('traveler');

  // NPCs fixos são obstáculos físicos pequenos: o jogador não atravessa os personagens,
  // mas continua conseguindo chegar perto o bastante para conversar. NPCs ambulantes
  // permanecem sem collider para não causarem travamentos ou empurrões nas rotas.
  this.fixedNpcColliders=[];
  const addFixedNpcCollider=(npc,w=22,h=18,offsetY=0)=>{
   if(!npc)return;
   const block=this.add.rectangle(npc.x,npc.y+offsetY,w,h,0x000000,0).setDepth(0);
   this.physics.add.existing(block,true);
   this.physics.add.collider(this.player,block);
   this.fixedNpcColliders.push(block);
  };
  for(const npc of [this.merchant,this.blacksmith,this.healer,this.tavernKeeper,this.scholar,this.artisan,this.questNpc,this.rightGuard,this.bottomGuard]){
   addFixedNpcCollider(npc);
  }
 }
 spawnEnemies(){this.spawnPoints=[{x:1810,y:690,name:'Goblin',stats:{hp:34,xpReward:14,attackDamage:8}},{x:1950,y:860,name:'Lobo',stats:{hp:42,xpReward:18,attackDamage:10}},{x:2480,y:470,name:'Goblin',stats:{hp:38,xpReward:16,attackDamage:9}},{x:2860,y:1320,name:'Lobo',stats:{hp:45,xpReward:20,attackDamage:11}},{x:3330,y:1570,name:'Goblin',stats:{hp:42,xpReward:18,attackDamage:10}},{x:3650,y:860,name:'Lobo',stats:{hp:48,xpReward:22,attackDamage:11}}];this.enemies=this.spawnPoints.map(p=>new Enemy(this,p.x,p.y,p.name,p.stats))}
 setupInput(){this.cursors=this.input.keyboard.createCursorKeys();this.keys=this.input.keyboard.addKeys('W,A,S,D');this.attackKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);this.q=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);this.one=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);this.two=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);this.eKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);this.fKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);this.tKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);this.escKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);this.shopOne=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);this.shopTwo=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);this.shopThree=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);this.shopClose=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T)}
 setupHud(){this.hud=new MapHud(this,{player:this.player,inventory:this.inv,equipment:this.equip,abilities:this.abilities,skills:this.skillManager,save:()=>this.saveGame(),onMenu:()=>this.goMenu(),worldWidth:this.worldWidth,worldHeight:this.worldHeight,localName:'ARREDORES DA CIDADE',markers:[{x:1600,y:1370,color:0xf4d06f,label:'Fazenda'},{x:2290,y:1460,color:0x8ad2e6,label:'Lago'},{x:3400,y:1724,color:0xd7dbe6,label:'Caverna'},{x:3920,y:650,color:0x73e6a8,label:'Floresta'}]});this.shop=new ShopPanel(this,this.player,this.inv,this.equip,()=>this.saveGame());this.dialogue=new ChoiceDialogueBox(this);this.npcDialogue=new NpcDialoguePanel(this);this.dialogueOpen=false;this.shop.visible=false;this.death=new DeathOverlay(this);if(!this.cityConverted){this.waystone=new Waystone(this,this.cityLayout.plazaX,this.cityLayout.plazaY,'CIDADE DE AETHER');this.waystone.setDepth(this.cityDepth(this.cityLayout.plazaY,.04))}}

 updateCityDepthsRound58(){
  const cityActors=[this.merchant,this.blacksmith,this.healer,this.tavernKeeper,this.scholar,this.artisan,this.questNpc,this.rightGuard,this.bottomGuard,...(this.walkers||[])].filter(Boolean);
  for(const actor of cityActors)actor.setDepth(this.cityDepth(actor.y,.04));
  if(this.isSafeZone())this.player.setDepth(this.cityDepth(this.player.y,.05));else this.player.setDepth(20);
 }
 update(){
  this.updateNpcPrompts();
  this.updateCityDepthsRound58();
  if(this.dialogueOpen){
   this.player.move(0,0);
   if(this.npcDialogue?.isOpen?.()){
    if(Phaser.Input.Keyboard.JustDown(this.escKey)){this.closeDialogue();return}
    if(Phaser.Input.Keyboard.JustDown(this.tKey)&&this.npcDialogue.hasSecondaryAction?.()){this.npcDialogue.triggerSecondary();return}
    if(Phaser.Input.Keyboard.JustDown(this.fKey)){
     if(!this.npcDialogue.advance())this.closeDialogue();
     return;
    }
   }else if(Phaser.Input.Keyboard.JustDown(this.fKey)||Phaser.Input.Keyboard.JustDown(this.escKey)){this.closeDialogue();return}
   return;
  }
  if(this.shop.visible){this.player.move(0,0);this.handleShop();return}
  if(this.hud.handle({collect:()=>this.collectLoot(),talk:()=>this.tryTalkOrOutskirts(),shop:()=>this.tryShop(),afterAction:()=>this.saveGame()})){this.hud.update();return}
  if(this.player.isDead()){this.handleDeath();return}
  const px=this.player.x,py=this.player.y;this.move();this.enforceCityBoundary(px,py);this.updateCityDepthsRound58();const safe=this.isSafeZone();
  for(let i=0;i<this.enemies.length;i++){const e=this.enemies[i];if(e.dead){if(!e.respawnTimer)e.respawnTimer=this.time.delayedCall(9000,()=>this.respawnOne(i));continue}if(safe){e.body.setVelocity(0,0);continue}e.updateAI(this.player);this.combat.enemyAttack(e,this.player)}
  this.loot.update(this.player.x,this.player.y);if(Phaser.Input.Keyboard.JustDown(this.attackKey))this.combat.playerAttack(this.player,this.enemies);if(Phaser.Input.Keyboard.JustDown(this.q))this.abilities.use('primary',this.enemies);if(Phaser.Input.Keyboard.JustDown(this.one))this.abilities.use('secondary',this.enemies);if(Phaser.Input.Keyboard.JustDown(this.two))this.abilities.use('mobility',this.enemies);this.waystone?.updatePrompt(this.player.x,this.player.y);this.updateOutskirtsPrompt?.();this.hud.setLocalName(this.getLocal());this.hud.update();if(this.forestPortal.getBounds().contains(this.player.x,this.player.y)&&this.player.x>3840&&!this.switching){this.switching=true;this.saveGame();this.registry.set('transitionSpawn',{scene:'GreenWoodsScene',x:220,y:780});this.scene.start('GreenWoodsScene')}
 }
 enforceCityBoundary(px,py){
  const x=this.player.x,y=this.player.y,c=this.cityLayout,safe={left:c.left,right:c.right,top:c.top,bottom:c.bottom};

  // Retorno robusto do Round 61: a zona fica dos dois lados da fachada do
  // portão e não depende do único quadro em que a coordenada cruza a borda.
  if(this.cityConverted&&!this.switching){
   const nearEast=x>=c.right-30&&x<=c.right+58&&Math.abs(y-c.eastGateY)<=76;
   const nearSouth=y>=c.bottom-30&&y<=c.bottom+58&&Math.abs(x-c.southGateX)<=82;
   if(nearEast){this.enterConvertedCity('east');return}
   if(nearSouth){this.enterConvertedCity('south');return}
  }

  const eastGate=this.rightGate.getBounds(),southGate=this.bottomGate.getBounds();
  const wasInside=px>=safe.left&&px<=safe.right&&py>=safe.top&&py<=safe.bottom;
  const isInside=x>=safe.left&&x<=safe.right&&y>=safe.top&&y<=safe.bottom;
  if(wasInside!==isInside){
   const crossedEast=(px<safe.right&&x>=safe.right)||(px>safe.right&&x<=safe.right);
   const crossedSouth=(py<safe.bottom&&y>=safe.bottom)||(py>safe.bottom&&y<=safe.bottom);
   const allowed=(crossedEast&&(eastGate.contains(px,py)||eastGate.contains(x,y)))||(crossedSouth&&(southGate.contains(px,py)||southGate.contains(x,y)));
   if(!allowed)this.player.setPosition(px,py);
  }
  if(this.player.x<safe.left&&wasInside)this.player.x=safe.left;
  if(this.player.y<safe.top&&wasInside)this.player.y=safe.top;
  this.player.y=Math.min(this.player.y,this.worldHeight-120);
 }
 enterConvertedCity(gate){if(this.switching)return;this.switching=true;this.player.setPosition(gate==='east'?1588:780,gate==='east'?500:1228);this.saveGame();this.registry.set('aetherCityEntrance',gate);this.cameras.main.fadeOut(180,7,13,16,(_camera,progress)=>{if(progress===1)this.scene.start('AetherCityScene')})}
 isSafeZone(){const c=this.cityLayout;return this.player.x>=c.left&&this.player.x<=c.right&&this.player.y>=c.top&&this.player.y<=c.bottom}
 getLocal(){if(this.isSafeZone())return'CIDADE DE AETHER';const p={x:this.player.x,y:this.player.y};if(Phaser.Geom.Rectangle.ContainsPoint(this.outskirtsRegions?.farm,p))return'FAZENDA DOS ARREDORES';if(Phaser.Geom.Rectangle.ContainsPoint(this.outskirtsRegions?.totems,p))return'TOTENS MUSGOSOS';if(Phaser.Geom.Rectangle.ContainsPoint(this.outskirtsRegions?.ruins,p))return'RUÍNAS ANTIGAS';if(Phaser.Geom.Rectangle.ContainsPoint(this.outskirtsRegions?.lake,p))return'LAGO DO SALGUEIRO';if(this.caveEntrance?.getBounds?.().contains(this.player.x,this.player.y))return'BOCA DA CAVERNA';if(this.forestPortal?.getBounds?.().contains(this.player.x,this.player.y))return'PORTAL DA FLORESTA';return'ARREDORES DA CIDADE'}

 updateOutskirtsPrompt(){
  if(!this.caveEntrance||!this.cavePromptText)return;
  const near=this.caveEntrance.getBounds().contains(this.player.x,this.player.y);
  this.cavePromptText.setVisible(near&&!this.dialogueOpen&&!this.shop?.visible);
 }
 tryTalkOrOutskirts(){
  if(this.caveEntrance?.getBounds?.().contains(this.player.x,this.player.y)){
   this.showActionMessage('A entrada da caverna ainda não pode ser explorada. Esta será uma missão inicial mais adiante.');
   return;
  }
  if(this.isNearWaystone()){this.readWaystone();return}
  this.tryTalk();
 }
 move(){const dx=(this.cursors.right.isDown||this.keys.D.isDown?1:0)-(this.cursors.left.isDown||this.keys.A.isDown?1:0);const dy=(this.cursors.down.isDown||this.keys.S.isDown?1:0)-(this.cursors.up.isDown||this.keys.W.isDown?1:0);this.player.playMove(this.player.move(dx,dy))}
 updateNpcPrompts(){const list=[this.merchant,this.blacksmith,this.healer,this.tavernKeeper,this.scholar,this.artisan,this.questNpc,this.rightGuard,this.bottomGuard,...(this.walkers||[])].filter(Boolean);for(const n of list){const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,n.x,n.y);n.setPrompt(n===this.merchant&&d<80?'F • Conversar   T • Loja':'F • Conversar');n.setNearby(d<80)}}
 tryShop(){if(!this.merchant){this.showActionMessage('A loja fica dentro da Cidade de Aether.');return}const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,this.merchant.x,this.merchant.y);if(d>80){this.showActionMessage('Aproxime-se de Aldren Voss para abrir a loja.');return}this.shop.open();this.hud.openExternalModal()}
 handleShop(){if(Phaser.Input.Keyboard.JustDown(this.shopClose)||Phaser.Input.Keyboard.JustDown(this.escKey)){this.shop.close();this.hud.closeExternalModal();return}this.shop.refresh()}
 tryTalk(){
 const npcs=[this.merchant,this.blacksmith,this.healer,this.tavernKeeper,this.scholar,this.artisan,this.questNpc,this.rightGuard,this.bottomGuard,...(this.walkers||[])].filter(Boolean);
 let near=null,b=Infinity;for(const n of npcs){const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,n.x,n.y);if(d<b){b=d;near=n}}
 if(!near||b>80){this.showActionMessage('Aproxime-se de um NPC para conversar.');return}
 this.dialogueOpen=true;this.hud.openExternalModal();this.activeDialogueNpc=near;
 // NPCs ambulantes continuam suas rotas normalmente ao simples aproximar.
 // A rota só é pausada quando o diálogo realmente é aberto.
 near.pauseRoute?.();
 const secondaryAction=near===this.merchant?{key:'T',label:'Loja',type:'shop'}:null;
 this.npcDialogue.open({
  name:near.npcName,role:near.npcRole||'',pages:near.text,portraitKey:near.npcPortrait,spriteKey:near.textureKey,
  secondaryAction,
  onSecondary:()=>{if(near===this.merchant){this.closeDialogue();this.shop.open();this.hud.openExternalModal()}},
  onPrimary:()=>{if(!this.npcDialogue.advance())this.closeDialogue()},
  onClose:()=>this.closeDialogue()
 });
}
 closeDialogue(){const npc=this.activeDialogueNpc;this.dialogue.close();this.npcDialogue?.close?.();this.dialogueOpen=false;this.activeDialogueNpc=null;this.hud.closeExternalModal();this.dialogueF?.destroy();this.dialogueF=null;npc?.resumeRoute?.()}
 collectLoot(){const d=this.loot.collectNear(this.player.x,this.player.y);if(d){this.sfx.pickup();this.saveGame();this.hud.bottom.update()}}
 respawnOne(i){const p=this.spawnPoints[i];if(p)this.enemies[i]=new Enemy(this,p.x,p.y,p.name,p.stats)}
 handleDeath(){if(this.respawnTimer)return;this.hud.openExternalModal();this.death.show('Respawn em 2 segundos');this.respawnTimer=this.time.delayedCall(2000,()=>{this.player.respawn(780,1228);this.hud.closeExternalModal();this.death.hide();this.respawnTimer=null;this.saveGame();this.registry.set('aetherCityEntrance','south');this.scene.start('AetherCityScene')})}
 saveGame(){const old=this.sm.load();this.sm.save({version:1,savedAt:Date.now(),lastScene:this.scene.key,player:this.player.serialize(),characterClass:this.player.characterClass,skills:this.skillManager.serialize(),inventory:this.inv.serialize(),equipment:this.equip.serialize(),quests:this.questManager.serialize?.()||[],worldFlags:{...(old?.worldFlags||{}),cityRound56Migrated:true,cityRound57Migrated:true,cityRound58Migrated:true,cityRound60Migrated:true,cityRound61Migrated:true},scenePositions:{...(old?.scenePositions||{}),[this.scene.key]:{x:this.player.x,y:this.player.y}}})}
 goMenu(){this.saveGame();this.scene.start('MenuScene')}
 installUnload(){this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.saveGame());window.addEventListener('beforeunload',this._unload=()=>this.saveGame())}
 isNearWaystone(){return this.waystone&&Phaser.Math.Distance.Between(this.player.x,this.player.y,this.waystone.x,this.waystone.y)<=85}
readWaystone(){this.hud.openExternalModal();this.dialogueOpen=true;this.dialogueF=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);this.dialogue.open('Marco de Senda',this.waystone.readMessage(),[{label:'Fechar',onSelect:()=>this.closeDialogue()}])}
showActionMessage(m){this.msg??=this.add.text(this.scale.width/2,this.scale.height-145,'',{fontFamily:'Arial',fontSize:12,color:'#ecf0ff',backgroundColor:'#182033',padding:7}).setOrigin(.5).setScrollFactor(0).setDepth(1200);this.msg.setText(m);this.msg.setAlpha(1);this.tweens.killTweensOf(this.msg);this.tweens.add({targets:this.msg,alpha:0,delay:1000,duration:500})}
}
