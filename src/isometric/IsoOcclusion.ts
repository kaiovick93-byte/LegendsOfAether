// @ts-nocheck

export interface IsoConfig {
  scene: Phaser.Scene;
  isoX: number;
  isoY: number;
  isoZ?: number;
  texture: string;
  frame?: string | number;
  tileWidth: number;
  tileHeight: number;
  screenOriginX?: number;
  screenOriginY?: number;
  depthBase?: number;
  depthOffset?: number;
}

export interface IsoProjectionConfig {
  tileWidth: number;
  tileHeight: number;
  screenOriginX?: number;
  screenOriginY?: number;
  depthBase?: number;
  depthOffset?: number;
}

export interface IsoContainerConfig extends IsoProjectionConfig {
  scene: Phaser.Scene;
  isoX: number;
  isoY: number;
  isoZ?: number;
}

function projectIso(
  isoX:number,
  isoY:number,
  isoZ:number,
  tileWidth:number,
  tileHeight:number,
  screenOriginX:number,
  screenOriginY:number
){
  return{
    x:screenOriginX+(isoX-isoY)*(tileWidth/2),
    y:screenOriginY+(isoX+isoY)*(tileHeight/2)-isoZ
  };
}

/**
 * Fonte única de posição para objetos isométricos. As propriedades nativas
 * x/y são atualizadas exclusivamente por updateIsoPosition().
 */
export class IsoSprite extends Phaser.GameObjects.Sprite {
  public isoX: number;
  public isoY: number;
  public isoZ: number;

  protected isoTileWidth: number;
  protected isoTileHeight: number;
  protected isoScreenOriginX: number;
  protected isoScreenOriginY: number;
  protected isoDepthBase: number;
  protected isoDepthOffset: number;

  constructor(config: IsoConfig) {
    const screen=projectIso(
      config.isoX,config.isoY,config.isoZ??0,config.tileWidth,config.tileHeight,
      config.screenOriginX??0,config.screenOriginY??0
    );
    super(config.scene,screen.x,screen.y,config.texture,config.frame);

    this.isoX=config.isoX;
    this.isoY=config.isoY;
    this.isoZ=config.isoZ??0;
    this.isoTileWidth=config.tileWidth;
    this.isoTileHeight=config.tileHeight;
    this.isoScreenOriginX=config.screenOriginX??0;
    this.isoScreenOriginY=config.screenOriginY??0;
    this.isoDepthBase=config.depthBase??0;
    this.isoDepthOffset=config.depthOffset??0;

    this.setOrigin(.5,1);
    config.scene.add.existing(this);
    this.updateIsoPosition();
  }

  public configureIsoProjection(config: IsoProjectionConfig): this {
    this.isoTileWidth=config.tileWidth;
    this.isoTileHeight=config.tileHeight;
    this.isoScreenOriginX=config.screenOriginX??0;
    this.isoScreenOriginY=config.screenOriginY??0;
    this.isoDepthBase=config.depthBase??0;
    this.isoDepthOffset=config.depthOffset??0;
    return this.updateIsoPosition();
  }

  public updateIsoPosition(): this {
    const screen=this.isoToScreen();
    super.setPosition(screen.x,screen.y);

    // Fórmula-base fornecida para o Y-sorting: objetos com maior isoX+isoY
    // ficam à frente. depthBase apenas reserva o mundo abaixo da interface.
    const baseDepth=(this.isoX+this.isoY)*100;
    const zAdjustment=this.isoZ*.01;
    this.setDepth(this.isoDepthBase+baseDepth+zAdjustment+this.isoDepthOffset);
    const body=this.body as Phaser.Physics.Arcade.Body|undefined;
    body?.updateFromGameObject?.();
    return this;
  }

  public setIsoPosition(x:number,y:number,z:number=this.isoZ): this {
    this.isoX=x;
    this.isoY=y;
    this.isoZ=z;
    return this.updateIsoPosition();
  }

  public moveIso(deltaX:number,deltaY:number,deltaZ:number=0): this {
    this.isoX+=deltaX;
    this.isoY+=deltaY;
    this.isoZ+=deltaZ;
    return this.updateIsoPosition();
  }

  public screenToIso(screenX:number,screenY:number){
    const localX=screenX-this.isoScreenOriginX;
    const localY=screenY-this.isoScreenOriginY+this.isoZ;
    return{
      x:localX/this.isoTileWidth+localY/this.isoTileHeight,
      y:localY/this.isoTileHeight-localX/this.isoTileWidth
    };
  }

  public isoToScreen(isoX:number=this.isoX,isoY:number=this.isoY,isoZ:number=this.isoZ){
    return projectIso(
      isoX,isoY,isoZ,this.isoTileWidth,this.isoTileHeight,
      this.isoScreenOriginX,this.isoScreenOriginY
    );
  }
}

/**
 * Variante composta para NPCs: o contêiner usa a mesma fonte de verdade e a
 * arte interna permanece ancorada nos pés com setOrigin(.5, 1).
 */
export class IsoContainer extends Phaser.GameObjects.Container {
  public isoX: number;
  public isoY: number;
  public isoZ: number;

  protected isoTileWidth: number;
  protected isoTileHeight: number;
  protected isoScreenOriginX: number;
  protected isoScreenOriginY: number;
  protected isoDepthBase: number;
  protected isoDepthOffset: number;

  constructor(config: IsoContainerConfig) {
    const screen=projectIso(
      config.isoX,config.isoY,config.isoZ??0,config.tileWidth,config.tileHeight,
      config.screenOriginX??0,config.screenOriginY??0
    );
    super(config.scene,screen.x,screen.y);
    this.isoX=config.isoX;
    this.isoY=config.isoY;
    this.isoZ=config.isoZ??0;
    this.isoTileWidth=config.tileWidth;
    this.isoTileHeight=config.tileHeight;
    this.isoScreenOriginX=config.screenOriginX??0;
    this.isoScreenOriginY=config.screenOriginY??0;
    this.isoDepthBase=config.depthBase??0;
    this.isoDepthOffset=config.depthOffset??0;
    config.scene.add.existing(this);
    this.updateIsoPosition();
  }

  public configureIsoProjection(config: IsoProjectionConfig): this {
    this.isoTileWidth=config.tileWidth;
    this.isoTileHeight=config.tileHeight;
    this.isoScreenOriginX=config.screenOriginX??0;
    this.isoScreenOriginY=config.screenOriginY??0;
    this.isoDepthBase=config.depthBase??0;
    this.isoDepthOffset=config.depthOffset??0;
    return this.updateIsoPosition();
  }

  public updateIsoPosition(): this {
    const screen=this.isoToScreen();
    super.setPosition(screen.x,screen.y);
    const baseDepth=(this.isoX+this.isoY)*100;
    const zAdjustment=this.isoZ*.01;
    this.setDepth(this.isoDepthBase+baseDepth+zAdjustment+this.isoDepthOffset);
    return this;
  }

  public setIsoPosition(x:number,y:number,z:number=this.isoZ): this {
    this.isoX=x;
    this.isoY=y;
    this.isoZ=z;
    return this.updateIsoPosition();
  }

  public moveIso(deltaX:number,deltaY:number,deltaZ:number=0): this {
    return this.setIsoPosition(this.isoX+deltaX,this.isoY+deltaY,this.isoZ+deltaZ);
  }

  public screenToIso(screenX:number,screenY:number){
    const localX=screenX-this.isoScreenOriginX;
    const localY=screenY-this.isoScreenOriginY+this.isoZ;
    return{
      x:localX/this.isoTileWidth+localY/this.isoTileHeight,
      y:localY/this.isoTileHeight-localX/this.isoTileWidth
    };
  }

  public isoToScreen(isoX:number=this.isoX,isoY:number=this.isoY,isoZ:number=this.isoZ){
    return projectIso(
      isoX,isoY,isoZ,this.isoTileWidth,this.isoTileHeight,
      this.isoScreenOriginX,this.isoScreenOriginY
    );
  }
}

/** IsoSprite com corpo Arcade opcional, mantendo a mesma fonte isométrica. */
export class IsoPhysicsSprite extends IsoSprite {
  constructor(config: IsoConfig) {
    super(config);
    config.scene.physics.add.existing(this);
    this.updateIsoPosition();
  }
}

/**
 * Gerencia as paredes altas. O fade só ocorre quando há sobreposição visual e
 * o jogador está atrás da base da parede na ordenação isométrica.
 */
export class IsoOcclusionManager {
  private scene: Phaser.Scene;
  private targetsToFade: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene) {
    this.scene=scene;
    this.targetsToFade=scene.add.group();
  }

  public registerWall(wall: IsoSprite): void {
    if(!wall||this.targetsToFade.contains(wall))return;
    this.targetsToFade.add(wall);
  }

  public checkPlayerOcclusion(player: IsoSprite): void {
    if(!player?.active)return;
    const playerBounds=player.getBounds();
    const playerFootY=player.y;
    for(const wall of this.targetsToFade.getChildren() as IsoSprite[]){
      if(!wall?.active)continue;
      const wallBounds=wall.getBounds();
      const visuallyOverlapping=Phaser.Geom.Intersects.RectangleToRectangle(playerBounds,wallBounds);
      const isPlayerBehind=player.depth<wall.depth&&playerFootY<=wall.y+12;
      this.fadeTo(wall,visuallyOverlapping&&isPlayerBehind ? .35 : 1);
    }
  }

  private fadeTo(target: IsoSprite,alphaTarget:number): void {
    if(target.alpha===alphaTarget||(target.data&&target.data.get('tweeningTo')===alphaTarget))return;
    if(!target.data)target.setDataEnabled();
    target.data.set('tweeningTo',alphaTarget);
    this.scene.tweens.add({
      targets:target,
      alpha:alphaTarget,
      duration:150,
      onComplete:()=>target.data?.set('tweeningTo',null)
    });
  }
}
