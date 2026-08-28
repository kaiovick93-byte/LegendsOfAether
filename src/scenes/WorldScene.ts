// @ts-nocheck
import {Player} from '../entities/Player';import {Enemy} from '../entities/Enemy';import {Inventory} from '../inventory/Inventory';import {EquipmentManager} from '../equipment/EquipmentManager';import {AbilitySystem} from '../abilities/AbilitySystem';import {CombatSystem} from '../combat/CombatSystem';import {LootManager} from '../loot/LootManager';import {SaveManager} from '../save/SaveManager';import {ClassManager} from '../character/ClassManager';import {SkillManager} from '../skills/SkillManager';import {MapHud} from '../ui/MapHud';import {DeathOverlay} from '../ui/DeathOverlay';import {Npc} from '../npc/Npc';import {ShopPanel} from '../shop/ShopPanel';import {ChoiceDialogueBox} from '../ui/ChoiceDialogueBox';import {NpcDialoguePanel} from '../ui/NpcDialoguePanel';import {SfxManager} from '../audio/SfxManager';import {QuestManager} from '../quests/QuestManager';
export class WorldScene extends Phaser.Scene{
 constructor(){super('WorldScene')}
 create(){this.switching=false;this.cityConverted=true;this.worldWidth=4200;this.worldHeight=2400;this.cityLayout={left:80,top:80,right:1480,bottom:1120,width:1400,height:1040,plazaX:780,plazaY:600,fountainX:780,fountainY:770,eastGateX:1480,eastGateY:500,southGateX:780,southGateY:1120,spawnX:780,spawnY:1010};this.sm=new SaveManager();this.inv=new Inventory();this.player=new Player(this,this.cityLayout.spawnX,this.cityLayout.spawnY);this.classManager=new ClassManager();this.skillManager=new SkillManager(this.player);this.player.scene.skillManager=this.skillManager;this.equip=new EquipmentManager(this.player);this.sfx=new SfxManager(this);this.player.scene.sfx=this.sfx;this.loot=new LootManager(this,this.inv);this.combat=new CombatSystem(this,this.loot);this.abilities=new AbilitySystem(this,this.player);this.questManager=new QuestManager();this.loadGame();this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);this.cameras.main.setDeadzone(220,90);this.cameras.main.startFollow(this.player,true,.12,.12,0,-135);this.cameras.main.setRoundPixels(true);this.createOutskirtsGeneratedTextures();this.createWorld();this.createConvertedCityApproaches();this.createOutskirtsAmbientLife();this.spawnEnemies();this.setupInput();this.setupHud();this.installUnload();this.saveGame()}
 loadGame(){const save=this.sm.load(),pos=save?.scenePositions?.WorldScene,t=this.registry.get('transitionSpawn');if(save){this.player.loadState(save.player);this.inv.load(save.inventory);this.equip.load(save.equipment,this.inv);this.skillManager.load(save.skills);this.questManager.load(save.quests);this.classManager.load(this.player,save.characterClass||this.player.characterClass)}else{this.player.applyClass(this.registry.get('selectedClass')||'warrior');this.registry.remove('selectedClass');this.inv.add('healing_potion',2);this.inv.add('mana_potion',2);this.player.gold=25}if(t?.scene==='WorldScene'){this.player.setPosition(t.x,t.y);this.registry.remove('transitionSpawn')}else if(pos){const inCity=pos.x>=this.cityLayout.left&&pos.x<=this.cityLayout.right&&pos.y>=this.cityLayout.top&&pos.y<=this.cityLayout.bottom;const migrate=inCity&&!save?.worldFlags?.cityRound58Migrated;this.player.setPosition(migrate?this.cityLayout.spawnX:pos.x,migrate?this.cityLayout.spawnY:pos.y)}this.equip.sync()}
 createWorld(){
  // O primeiro quadro do atlas urbano é grama pixel art; ele substitui o
  // quadrado verde provisório que destoava dos demais assets.
  this.add.tileSprite(0,0,this.worldWidth,this.worldHeight,'city_ground',0).setOrigin(0);
  this.add.rectangle(0,0,this.worldWidth,this.worldHeight,0x16301f,.06).setOrigin(0);
  const c=this.cityLayout;this.safeRect={x:c.left,y:c.top,width:c.width,height:c.height};this.cityWalls=[];const makeWall=(x,y,w,h)=>{if(w<=0||h<=0)return null;const wall=this.add.rectangle(x,y,w,h,0x000000,0).setOrigin(.5);this.physics.add.existing(wall,true);this.cityWalls.push(wall);this.physics.add.collider(this.player,wall);return wall};const eastGap=128,southGap=128,wallInset=18,wallThickness=36;makeWall((c.left+c.right)/2,c.top+wallInset,c.width,wallThickness);makeWall(c.left+wallInset,(c.top+c.bottom)/2,wallThickness,c.height);makeWall(c.right-wallInset,(c.top+c.eastGateY-eastGap)/2,wallThickness,c.eastGateY-eastGap-c.top);makeWall(c.right-wallInset,(c.eastGateY+eastGap+c.bottom)/2,wallThickness,c.bottom-c.eastGateY-eastGap);makeWall((c.left+c.southGateX-southGap)/2,c.bottom-wallInset,c.southGateX-southGap-c.left,wallThickness);makeWall((c.southGateX+southGap+c.right)/2,c.bottom-wallInset,c.right-c.southGateX-southGap,wallThickness);
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

 spawnEnemies(){this.spawnPoints=[{x:1810,y:690,name:'Goblin',stats:{hp:34,xpReward:14,attackDamage:8}},{x:1950,y:860,name:'Lobo',stats:{hp:42,xpReward:18,attackDamage:10}},{x:2480,y:470,name:'Goblin',stats:{hp:38,xpReward:16,attackDamage:9}},{x:2860,y:1320,name:'Lobo',stats:{hp:45,xpReward:20,attackDamage:11}},{x:3330,y:1570,name:'Goblin',stats:{hp:42,xpReward:18,attackDamage:10}},{x:3650,y:860,name:'Lobo',stats:{hp:48,xpReward:22,attackDamage:11}}];this.enemies=this.spawnPoints.map(p=>new Enemy(this,p.x,p.y,p.name,p.stats))}
 setupInput(){this.cursors=this.input.keyboard.createCursorKeys();this.keys=this.input.keyboard.addKeys('W,A,S,D');this.attackKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);this.q=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);this.one=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);this.two=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);this.eKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);this.fKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);this.tKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);this.escKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);this.shopOne=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);this.shopTwo=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);this.shopThree=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);this.shopClose=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T)}
 setupHud(){this.hud=new MapHud(this,{player:this.player,inventory:this.inv,equipment:this.equip,abilities:this.abilities,skills:this.skillManager,save:()=>this.saveGame(),onMenu:()=>this.goMenu(),worldWidth:this.worldWidth,worldHeight:this.worldHeight,localName:'ARREDORES DA CIDADE',markers:[{x:1600,y:1370,color:0xf4d06f,label:'Fazenda'},{x:2290,y:1460,color:0x8ad2e6,label:'Lago'},{x:3400,y:1724,color:0xd7dbe6,label:'Caverna'},{x:3920,y:650,color:0x73e6a8,label:'Floresta'}]});this.shop=new ShopPanel(this,this.player,this.inv,this.equip,()=>this.saveGame());this.dialogue=new ChoiceDialogueBox(this);this.npcDialogue=new NpcDialoguePanel(this);this.dialogueOpen=false;this.shop.visible=false;this.death=new DeathOverlay(this)}
  update(){
  this.updateNpcPrompts();
  this.player.setDepth(20);
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
  const px=this.player.x,py=this.player.y;this.move();this.enforceCityBoundary(px,py);const safe=this.isSafeZone();
  for(let i=0;i<this.enemies.length;i++){const e=this.enemies[i];if(e.dead){if(!e.respawnTimer)e.respawnTimer=this.time.delayedCall(9000,()=>this.respawnOne(i));continue}if(safe){e.body.setVelocity(0,0);continue}e.updateAI(this.player);this.combat.enemyAttack(e,this.player)}
  this.loot.update(this.player.x,this.player.y);if(Phaser.Input.Keyboard.JustDown(this.attackKey))this.combat.playerAttack(this.player,this.enemies);if(Phaser.Input.Keyboard.JustDown(this.q))this.abilities.use('primary',this.enemies);if(Phaser.Input.Keyboard.JustDown(this.one))this.abilities.use('secondary',this.enemies);if(Phaser.Input.Keyboard.JustDown(this.two))this.abilities.use('mobility',this.enemies);this.updateOutskirtsPrompt?.();this.hud.setLocalName(this.getLocal());this.hud.update();if(this.forestPortal.getBounds().contains(this.player.x,this.player.y)&&this.player.x>3840&&!this.switching){this.switching=true;this.saveGame();this.registry.set('transitionSpawn',{scene:'GreenWoodsScene',x:220,y:780});this.scene.start('GreenWoodsScene')}
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
 near.showConversationIcon?.();
 const secondaryAction=near===this.merchant?{key:'T',label:'Loja',type:'shop'}:null;
 this.npcDialogue.open({
  name:near.npcName,role:near.npcRole||'',pages:near.text,portraitKey:near.npcPortrait,spriteKey:near.textureKey,
  secondaryAction,
  onSecondary:()=>{if(near===this.merchant){this.closeDialogue();this.shop.open();this.hud.openExternalModal()}},
  onPrimary:()=>{if(!this.npcDialogue.advance())this.closeDialogue()},
  onClose:()=>this.closeDialogue()
 });
}
 closeDialogue(){const npc=this.activeDialogueNpc;this.dialogue.close();this.npcDialogue?.close?.();this.dialogueOpen=false;this.activeDialogueNpc=null;this.hud.closeExternalModal();this.dialogueF?.destroy();this.dialogueF=null;npc?.hideConversationIcon?.();npc?.resumeRoute?.()}
 collectLoot(){const d=this.loot.collectNear(this.player.x,this.player.y);if(d){this.sfx.pickup();this.saveGame();this.hud.bottom.update()}}
 respawnOne(i){const p=this.spawnPoints[i];if(p)this.enemies[i]=new Enemy(this,p.x,p.y,p.name,p.stats)}
 handleDeath(){if(this.respawnTimer)return;this.hud.openExternalModal();this.death.show('Respawn em 2 segundos');this.respawnTimer=this.time.delayedCall(2000,()=>{this.player.respawn(780,1228);this.hud.closeExternalModal();this.death.hide();this.respawnTimer=null;this.saveGame();this.registry.set('aetherCityEntrance','south');this.scene.start('AetherCityScene')})}
 saveGame(){const old=this.sm.load();this.sm.save({version:1,savedAt:Date.now(),lastScene:this.scene.key,player:this.player.serialize(),characterClass:this.player.characterClass,skills:this.skillManager.serialize(),inventory:this.inv.serialize(),equipment:this.equip.serialize(),quests:this.questManager.serialize?.()||[],worldFlags:{...(old?.worldFlags||{}),cityRound56Migrated:true,cityRound57Migrated:true,cityRound58Migrated:true,cityRound60Migrated:true,cityRound61Migrated:true,cityRound62Migrated:true,cityRound63Migrated:true,cityRound64Migrated:true,cityRound66Migrated:true,cityRound67Migrated:true},scenePositions:{...(old?.scenePositions||{}),[this.scene.key]:{x:this.player.x,y:this.player.y}}})}
 goMenu(){this.saveGame();this.scene.start('MenuScene')}
 installUnload(){this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.saveGame());window.addEventListener('beforeunload',this._unload=()=>this.saveGame())}
showActionMessage(m){this.msg??=this.add.text(this.scale.width/2,this.scale.height-145,'',{fontFamily:'Arial',fontSize:12,color:'#ecf0ff',backgroundColor:'#182033',padding:7}).setOrigin(.5).setScrollFactor(0).setDepth(1200);this.msg.setText(m);this.msg.setAlpha(1);this.tweens.killTweensOf(this.msg);this.tweens.add({targets:this.msg,alpha:0,delay:1000,duration:500})}
}
