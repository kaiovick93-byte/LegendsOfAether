// @ts-nocheck
import {Player} from '../entities/Player';
import {Enemy} from '../entities/Enemy';
import {Inventory} from '../inventory/Inventory';
import {EquipmentManager} from '../equipment/EquipmentManager';
import {AbilitySystem} from '../abilities/AbilitySystem';
import {CombatSystem} from '../combat/CombatSystem';
import {LootManager} from '../loot/LootManager';
import {SaveManager} from '../save/SaveManager';
import {ClassManager} from '../character/ClassManager';
import {SkillManager} from '../skills/SkillManager';
import {MapHud} from '../ui/MapHud';
import {DeathOverlay} from '../ui/DeathOverlay';
import {Npc} from '../npc/Npc';
import {WanderingNpc} from '../npc/WanderingNpc';
import {ShopPanel} from '../shop/ShopPanel';
import {ChoiceDialogueBox} from '../ui/ChoiceDialogueBox';
import {SfxManager} from '../audio/SfxManager';
import {QuestManager} from '../quests/QuestManager';

export class WorldScene extends Phaser.Scene{
 constructor(){super('WorldScene')}
 create(){
  this.switching=false;this.sm=new SaveManager();this.inv=new Inventory();this.player=new Player(this,150,330);
  this.classManager=new ClassManager();this.skillManager=new SkillManager(this.player);this.player.scene.skillManager=this.skillManager;
  this.equip=new EquipmentManager(this.player);this.sfx=new SfxManager(this);this.player.scene.sfx=this.sfx;
  this.loot=new LootManager(this,this.inv);this.combat=new CombatSystem(this,this.loot);this.abilities=new AbilitySystem(this,this.player);this.questManager=new QuestManager();
  this.loadGame();
  this.physics.world.setBounds(0,0,1920,1000);this.cameras.main.setBounds(0,0,1920,1152);
  this.cameras.main.setDeadzone(220,90);this.cameras.main.startFollow(this.player,true,0.12,0.12,0,-110);this.cameras.main.setRoundPixels(true);
  this.createWorld();this.createNpcs();this.spawnEnemies();this.setupInput();this.setupHud();this.installUnload();this.saveGame();
 }
 loadGame(){
  const save=this.sm.load(),pos=save?.scenePositions?.WorldScene,t=this.registry.get('transitionSpawn');
  if(save){this.player.loadState(save.player);this.inv.load(save.inventory);this.equip.load(save.equipment,this.inv);this.skillManager.load(save.skills);this.questManager.load(save.quests);this.classManager.load(this.player,save.characterClass||this.player.characterClass)}
  else{this.player.applyClass(this.registry.get('selectedClass')||'warrior');this.registry.remove('selectedClass');this.inv.add('healing_potion',2);this.inv.add('mana_potion',2);this.player.gold=25}
  if(t?.scene==='WorldScene'){this.player.setPosition(t.x,t.y);this.registry.remove('transitionSpawn')}else if(pos)this.player.setPosition(pos.x,pos.y);this.equip.sync();
 }
 createWorld(){
  this.add.tileSprite(0,0,1920,1152,'grass').setOrigin(0);
  this.add.rectangle(0,0,1920,1152,0x16301f,.06).setOrigin(0);
  // large safe city
  this.safeRect={x:70,y:70,width:820,height:620};
  this.add.rectangle(this.safeRect.x,this.safeRect.y,this.safeRect.width,this.safeRect.height,0x24314d,.14).setOrigin(0).setDepth(1);
  this.add.text(105,95,'CIDADE DE AETHER',{fontFamily:'Arial',fontSize:15,color:'#ecf0ff',fontStyle:'bold'}).setDepth(2);
  this.add.text(125,125,'ÁREA SEGURA — SEM MONSTROS',{fontFamily:'Arial',fontSize:13,color:'#73e6a8',fontStyle:'bold'}).setDepth(2);
  // dangerous outskirts, larger
  this.add.rectangle(890,60,970,930,0x7b3d2a,.07).setOrigin(0).setDepth(0.5);
  this.add.text(1180,88,'ARREDORES DA CIDADE — ÁREA DE PERIGO',{fontFamily:'Arial',fontSize:14,color:'#ffb36b',fontStyle:'bold'}).setOrigin(.5).setDepth(2);
  // exits
  this.rightExit=this.add.zone(900,350,50,120);this.add.rectangle(900,350,50,120,0xffd166,.12).setDepth(3);
  this.bottomExit=this.add.zone(450,700,120,50);this.add.rectangle(450,700,120,50,0xffd166,.10).setDepth(3);
  this.forestPortal=this.add.zone(1780,350,100,150);this.add.rectangle(1780,350,100,150,0x73e6a8,.12).setDepth(3);
  this.add.text(1780,285,'PORTAL • FLORESTA',{fontFamily:'Arial',fontSize:12,color:'#73e6a8'}).setOrigin(.5).setDepth(3);
  // guard posts
  this.add.rectangle(850,330,70,160,0x2c3648,.34).setDepth(2);
  this.add.rectangle(390,665,120,70,0x2c3648,.34).setDepth(2);
 }
 createNpcs(){
  this.merchant=new Npc(this,220,230,'Mercador',['Tenho suprimentos para quem pretende atravessar os arredores.'],{shop:true});
  this.blacksmith=new Npc(this,370,230,'Ferreiro',['Minha ferraria ainda está sendo reconstruída. Minhas ferramentas desapareceram durante a invasão.','Quando eu recuperar minhas ferramentas, poderei trabalhar novamente.']);
  this.healer=new Npc(this,520,230,'Curandeiro',['Perdi minha fé depois dos acontecimentos sombrios. Não consigo invocar minha bênção agora.','Talvez, quando minha fé retornar, eu possa ajudar os feridos novamente.']);
  this.tavernKeeper=new Npc(this,360,470,'Taverneiro',['A taverna ainda não abriu. Faltam alimentos e insumos para as bebidas.','Quando conseguirmos os suprimentos, espero abrir as portas novamente.']);
  this.scholar=new Npc(this,560,470,'Erudito',['O mundo perdeu o sentido depois dos acontecimentos sombrios...','Talvez um dia eu volte a estudar os antigos encantamentos.']);
  this.questNpc=new Npc(this,240,420,'Elder Mira',['A floresta ficou perigosa. Se trouxer provas dos monstros, conversaremos sobre o assunto.']);
  this.rightGuard=new Npc(this,845,520,'Guarda do Portão',['Estamos protegendo a saída leste. Tenha cuidado ao deixar os muros.']);
  this.bottomGuard=new Npc(this,570,675,'Guarda do Sul',['Mantemos esta passagem protegida. Lá fora, os monstros não respeitam ninguém.']);
  this.walkers=[new WanderingNpc(this,650,330,'Morador',['A praça ainda é o lugar mais seguro de Aether.']),new WanderingNpc(this,720,430,'Viajante',['Ouvi rumores sobre o castelo.'])];
 }
 spawnEnemies(){
  this.spawnPoints=[
   {x:980,y:250,name:'Goblin',stats:{hp:34,xpReward:14,attackDamage:8}},
   {x:1220,y:440,name:'Lobo',stats:{hp:42,xpReward:18,attackDamage:10}},
   {x:1480,y:300,name:'Goblin',stats:{hp:38,xpReward:16,attackDamage:9}},
   {x:1100,y:760,name:'Lobo',stats:{hp:45,xpReward:20,attackDamage:11}},
   {x:1510,y:780,name:'Goblin',stats:{hp:42,xpReward:18,attackDamage:10}}
  ];
  this.enemies=this.spawnPoints.map(p=>new Enemy(this,p.x,p.y,p.name,p.stats));
 }
 setupInput(){
  this.cursors=this.input.keyboard.createCursorKeys();this.keys=this.input.keyboard.addKeys('W,A,S,D');
  this.attackKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);this.q=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
  this.one=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);this.two=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
  this.eKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);this.fKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
  this.tKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);this.escKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  this.shopOne=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);this.shopTwo=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
  this.shopThree=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);this.shopClose=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
 }
 setupHud(){
  this.hud=new MapHud(this,{player:this.player,inventory:this.inv,equipment:this.equip,abilities:this.abilities,skills:this.skillManager,save:()=>this.saveGame(),onMenu:()=>this.goMenu(),worldWidth:1920,worldHeight:1152,localName:'CIDADE DE AETHER',markers:[{x:1780,y:350,color:0x73e6a8,label:'Floresta'}]});
  this.shop=new ShopPanel(this,this.player,this.inv);this.dialogue=new ChoiceDialogueBox(this);this.dialogueOpen=false;this.shop.visible=false;this.death=new DeathOverlay(this);
 }
 update(){
  this.updateNpcPrompts();
  if(this.dialogueOpen){this.player.move(0,0);if(Phaser.Input.Keyboard.JustDown(this.fKey)||Phaser.Input.Keyboard.JustDown(this.escKey))this.closeDialogue();return}
  if(this.shop.visible){this.player.move(0,0);this.handleShop();return}
  if(this.hud.handle({collect:()=>this.collectLoot(),talk:()=>this.tryTalk(),shop:()=>this.tryShop(),afterAction:()=>this.saveGame()})){this.hud.update();return}
  if(this.player.isDead()){this.handleDeath();return}

  this.move();
  this.enforceCityGates();
  const safe=this.isSafeZone();
  for(let i=0;i<this.enemies.length;i++){
   const e=this.enemies[i];
   if(e.dead){if(!e.respawnTimer)e.respawnTimer=this.time.delayedCall(9000,()=>{const p=this.spawnPoints[i];this.enemies[i]=new Enemy(this,p.x,p.y,p.name,p.stats)});continue}
   if(safe){e.body.setVelocity(0,0);continue}
   e.updateAI(this.player);this.combat.enemyAttack(e,this.player);
  }

  this.loot.update(this.player.x,this.player.y);
  if(Phaser.Input.Keyboard.JustDown(this.attackKey))this.combat.playerAttack(this.player,this.enemies);
  if(Phaser.Input.Keyboard.JustDown(this.q))this.abilities.use('primary',this.enemies);
  if(Phaser.Input.Keyboard.JustDown(this.one))this.abilities.use('secondary',this.enemies);
  if(Phaser.Input.Keyboard.JustDown(this.two))this.abilities.use('mobility',this.enemies);

  const local=this.getLocal();
  this.hud.setLocalName(local);this.hud.update();

  const nearForestPortal=this.forestPortal?.getBounds().contains(this.player.x,this.player.y)??false;if(nearForestPortal&&!this.switching){this.switching=true;this.saveGame();this.registry.set('transitionSpawn',{scene:'GreenWoodsScene',x:220,y:560});this.scene.start('GreenWoodsScene')}
 }
 enforceCityGates(){
  const inSafe=this.player.x>=70&&this.player.x<=890&&this.player.y>=70&&this.player.y<=690;
  if(!inSafe)return;
  const atEastGate=this.player.x>=835&&this.player.x<=905&&this.player.y>=300&&this.player.y<=500;
  const atSouthGate=this.player.x>=390&&this.player.x<=510&&this.player.y>=650&&this.player.y<=725;
  if(this.player.x>890&&!atEastGate)this.player.x=889;
  if(this.player.y>690&&!atSouthGate)this.player.y=689;
  if(this.player.x<70)this.player.x=71;
  if(this.player.y<70)this.player.y=71;
 }
 isSafeZone(){return this.player.x>=70&&this.player.x<=890&&this.player.y>=70&&this.player.y<=690}
 getLocal(){const nearPortal=this.forestPortal?.getBounds().contains(this.player.x,this.player.y)??false;return this.isSafeZone()?'CIDADE DE AETHER':nearPortal?'PORTAL DA FLORESTA':'ARREDORES DA CIDADE'}
 move(){const dx=(this.cursors.right.isDown||this.keys.D.isDown?1:0)-(this.cursors.left.isDown||this.keys.A.isDown?1:0);const dy=(this.cursors.down.isDown||this.keys.S.isDown||this.cursors.down.isDown?1:0)-(this.cursors.up.isDown||this.keys.W.isDown?1:0);this.player.playMove(this.player.move(dx,dy))}
 updateNpcPrompts(){const list=[this.merchant,this.blacksmith,this.healer,this.tavernKeeper,this.scholar,this.questNpc,this.rightGuard,this.bottomGuard,...(this.walkers||[])].filter(Boolean);for(const n of list){const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,n.x,n.y);n.setPrompt(n===this.merchant&&d<80?'F • Conversar   T • Loja':'F • Conversar');n.setNearby(d<80)}}
 tryShop(){const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,this.merchant.x,this.merchant.y);if(d>80){this.showActionMessage('Aproxime-se do Mercador para abrir a loja.');return}this.shop.toggle();this.shop.refresh();this.hud.openExternalModal()}
 handleShop(){if(Phaser.Input.Keyboard.JustDown(this.shopClose)||Phaser.Input.Keyboard.JustDown(this.escKey)){this.shop.toggle();this.hud.closeExternalModal();return}if(Phaser.Input.Keyboard.JustDown(this.shopOne))this.shop.buy(0);if(Phaser.Input.Keyboard.JustDown(this.shopTwo))this.shop.buy(1);if(Phaser.Input.Keyboard.JustDown(this.shopThree))this.shop.buy(2);this.shop.refresh()}
 tryTalk(){const npcs=[this.merchant,this.blacksmith,this.healer,this.tavernKeeper,this.scholar,this.questNpc,this.rightGuard,this.bottomGuard,...(this.walkers||[])];let near=null,b=Infinity;for(const n of npcs){const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,n.x,n.y);if(d<b){b=d;near=n}}if(!near||b>80){this.showActionMessage('Aproxime-se de um NPC para conversar.');return}this.dialogueOpen=true;this.hud.openExternalModal();this.dialogueF=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);const choices=[];if(near===this.merchant)choices.push({label:'Abrir loja',onSelect:()=>{this.closeDialogue();this.shop.toggle();this.shop.refresh();this.hud.openExternalModal()}});choices.push({label:'Fechar',onSelect:()=>this.closeDialogue()});this.dialogue.open(near.npcName,near.text.join('\n\n')+'\n\nF / Esc • fechar',choices)}
 closeDialogue(){this.dialogue.close();this.dialogueOpen=false;this.hud.closeExternalModal();this.dialogueF?.destroy()}
 collectLoot(){const d=this.loot.collectNear(this.player.x,this.player.y);if(d){this.sfx.pickup();this.saveGame();this.hud.bottom.update()}}
 handleDeath(){if(this.respawnTimer)return;this.hud.openExternalModal();this.death.show('Respawn em 2 segundos');this.respawnTimer=this.time.delayedCall(2000,()=>{this.player.respawn(150,330);this.hud.closeExternalModal();this.death.hide();this.respawnTimer=null;this.saveGame()})}
 saveGame(){const old=this.sm.load();this.sm.save({version:1,savedAt:Date.now(),lastScene:this.scene.key,player:this.player.serialize(),characterClass:this.player.characterClass,skills:this.skillManager.serialize(),inventory:this.inv.serialize(),equipment:this.equip.serialize(),quests:this.questManager.serialize?.()||[],scenePositions:{...(old?.scenePositions||{}),[this.scene.key]:{x:this.player.x,y:this.player.y}}})}
 goMenu(){this.saveGame();this.scene.start('MenuScene')}
 installUnload(){this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.saveGame());window.addEventListener('beforeunload',this._unload=()=>this.saveGame())}
 showActionMessage(m){this.msg??=this.add.text(this.scale.width/2,this.scale.height-145,'',{fontFamily:'Arial',fontSize:12,color:'#ecf0ff',backgroundColor:'#182033',padding:7}).setOrigin(.5).setScrollFactor(0).setDepth(1200);this.msg.setText(m);this.msg.setAlpha(1);this.tweens.killTweensOf(this.msg);this.tweens.add({targets:this.msg,alpha:0,delay:1000,duration:500})}
}
