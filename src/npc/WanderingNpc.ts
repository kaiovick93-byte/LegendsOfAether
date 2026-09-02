// @ts-nocheck
import {Npc} from './Npc';

/**
 * Wandering NPCs keep following their route regardless of player proximity.
 * They only pause when a dialogue is actually opened. During normal route
 * pauses they use the same natural idle system from Npc.
 */
export class WanderingNpc extends Npc{
 constructor(scene,x,y,name,text,route=[],options={}){
  super(scene,x,y,name,text,{role:options.role||'',portrait:options.portrait||'',idleProfile:options.idleProfile||'',idleFacing:options.idleFacing||null,visualScale:options.visualScale??.46});
  this.home={x,y};
  this.route=(route&&route.length?route:[{x,y}]).map(p=>{
   const iso=this.screenToIso(p.x,p.y);
   return{isoX:iso.x,isoY:iso.y,isoZ:this.isoZ,pause:p.pause};
  });
  this.routeState={isoX:this.isoX,isoY:this.isoY,isoZ:this.isoZ};
  this.routeIndex=0;
  this.routeTween=null;
  this.routePauseEvent=null;
  this.routeMoving=false;
  this.currentTarget=null;
  this.currentRouteDir='down';
  this.routeSpeed=options.speed||48;
  this.minPause=options.minPause||900;
  this.maxPause=options.maxPause||1900;
  this.startDelay=options.startDelay??Phaser.Math.Between(500,1200);
  this.dialoguePaused=false;

  // As rotas são iniciadas após o sprite real ser aplicado em WorldScene.
  this.routePauseEvent=scene.time.delayedCall(this.startDelay,()=>{
   this.routePauseEvent=null;
   this.moveToNextRoutePoint();
  });
 }

 setIsoRoute(route=[]){
  if(!route.length)return this;
  this.route=route.map(p=>({
   isoX:p.isoX??p.u??p.x,
   isoY:p.isoY??p.v??p.y,
   isoZ:p.isoZ??this.isoZ,
   pause:p.pause
  }));
  this.routeIndex=0;
  this.routeState={isoX:this.route[0].isoX,isoY:this.route[0].isoY,isoZ:this.route[0].isoZ};
  this.setIsoPosition(this.routeState.isoX,this.routeState.isoY,this.routeState.isoZ);
  return this;
 }

 handleNpcUpdate(time){
  if(!this.active||!this.visible||!this.sprite)return;
  // A respiração sutil continua ativa, mas nenhuma ação idle pode segurar o
  // agendamento da rota. Isso elimina as pausas que pareciam travamentos.
  if(this.routeMoving)return;
 }

 // Aproximar-se não interrompe mais a rotina do NPC. A pausa ocorre somente
 // quando o jogador realmente inicia a conversa.
 setNearby(v){super.setNearby(v)}

 getDirectionTo(tx,ty){
  const dx=tx-this.x,dy=ty-this.y;
  const angle=(Math.atan2(dy,dx)*180/Math.PI+360)%360;
  const directions=['east','southEast','south','southWest','west','northWest','north','northEast'];
  return directions[Math.round(angle/45)%8];
 }

 playWalk(dir){
  this.currentFacing=dir;
  this.currentRouteDir=dir;
  if(this.isIsometricWalker&&this.sprite&&this.isoWalkAnimations){
   const animation=this.isoWalkAnimations[dir]||this.isoWalkAnimations.south;
   this.sprite.setFlipX(false).play(animation,true);
   return;
  }
  if(this.sprite&&this.textureKey){
   try{this.sprite.play(`npc-${this.textureKey}-${dir}`,true)}catch(e){}
  }
 }

 scheduleNext(delay){
  if(!this.active||!this.scene)return;
  try{this.routePauseEvent?.remove(false)}catch(e){}
  this.routePauseEvent=this.scene.time.delayedCall(delay,()=>{
   this.routePauseEvent=null;
   this.moveToNextRoutePoint();
  });
 }

 moveToNextRoutePoint(){
  if(!this.active||!this.scene||this.route.length<2)return;
  if(this.dialoguePaused){
   this.scheduleNext(450);
   return;
  }

  const nextIndex=(this.routeIndex+1)%this.route.length;
  const target=this.route[nextIndex];
  const targetScreen=this.isoToScreen(target.isoX,target.isoY,target.isoZ);
  const distance=Phaser.Math.Distance.Between(this.x,this.y,targetScreen.x,targetScreen.y);
  if(distance<2){
   this.routeIndex=nextIndex;
   this.scheduleNext(target.pause??Phaser.Math.Between(this.minPause,this.maxPause));
   return;
  }

  const dir=this.getDirectionTo(targetScreen.x,targetScreen.y);
  this.currentTarget=target;
  this.routeMoving=true;
  this.playWalk(dir);

  const duration=Math.max(550,(distance/this.routeSpeed)*1000);
  this.routeState={isoX:this.isoX,isoY:this.isoY,isoZ:this.isoZ};
  this.routeTween=this.scene.tweens.add({
   targets:this.routeState,
   isoX:target.isoX,
   isoY:target.isoY,
   isoZ:target.isoZ,
   duration,
   ease:'Linear',
   onUpdate:()=>{
    this.isoX=this.routeState.isoX;
    this.isoY=this.routeState.isoY;
    this.isoZ=this.routeState.isoZ;
    this.updateIsoPosition();
   },
   onComplete:()=>{
    this.setIsoPosition(target.isoX,target.isoY,target.isoZ);
    this.routeTween=null;
    this.routeMoving=false;
    this.routeIndex=nextIndex;
    this.currentTarget=null;
    this.setFacing(dir);
    // Começa o período de pausa já apto a executar um idle natural.
    this.nextIdleAction=this.scene.time.now+Phaser.Math.Between(300,700);
    this.scheduleNext(target.pause??Phaser.Math.Between(this.minPause,this.maxPause));
   }
  });
 }

 pauseRoute(){
  this.dialoguePaused=true;
  try{
   if(this.routeTween&&this.routeTween.isPlaying()){
    this.routeTween.pause();
    this.setFacing(this.currentRouteDir||this.currentFacing||'down');
   }
  }catch(e){}
  if(this.routePauseEvent)this.routePauseEvent.paused=true;
 }

 resumeRoute(){
  if(!this.active||!this.scene)return;
  this.dialoguePaused=false;
  try{
   if(this.routeTween&&this.routeTween.isPaused()){
    if(this.currentTarget){
     const target=this.isoToScreen(this.currentTarget.isoX,this.currentTarget.isoY,this.currentTarget.isoZ);
     this.playWalk(this.getDirectionTo(target.x,target.y));
    }
    this.routeTween.resume();
    return;
   }
  }catch(e){}
  if(this.routePauseEvent){
   this.routePauseEvent.paused=false;
   return;
  }
  this.scheduleNext(350);
 }

 cleanupNpc(){
  try{this.routeTween?.stop()}catch(e){}
  try{this.routePauseEvent?.remove(false)}catch(e){}
  this.routeTween=null;
  this.routePauseEvent=null;
  this.routeMoving=false;
  this.dialoguePaused=false;
  super.cleanupNpc();
 }
}
