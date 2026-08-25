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
  this.route=(route&&route.length?route:[{x,y}]).map(p=>({x:p.x,y:p.y,pause:p.pause}));
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
  if(Math.abs(dx)>Math.abs(dy))return dx<0?'left':'right';
  return dy<0?'up':'down';
 }

 playWalk(dir){
  this.currentFacing=dir;
  this.currentRouteDir=dir;
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
  const distance=Phaser.Math.Distance.Between(this.x,this.y,target.x,target.y);
  if(distance<2){
   this.routeIndex=nextIndex;
   this.scheduleNext(target.pause??Phaser.Math.Between(this.minPause,this.maxPause));
   return;
  }

  const dir=this.getDirectionTo(target.x,target.y);
  this.currentTarget=target;
  this.routeMoving=true;
  this.playWalk(dir);

  const duration=Math.max(550,(distance/this.routeSpeed)*1000);
  this.routeTween=this.scene.tweens.add({
   targets:this,
   x:target.x,
   y:target.y,
   duration,
   ease:'Linear',
   onUpdate:()=>this.setDepth(this.scene.cityDepth?.(this.y,.04)??(5+this.y/1000+.04)),
   onComplete:()=>{
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
    if(this.currentTarget)this.playWalk(this.getDirectionTo(this.currentTarget.x,this.currentTarget.y));
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
