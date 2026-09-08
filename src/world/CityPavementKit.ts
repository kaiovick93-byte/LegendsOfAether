// @ts-nocheck

/**
 * Pavimentação urbana modular da Cidade de Aether.
 *
 * A cidade não recebe mais uma única imagem recortada de rua. Cada losango é
 * uma peça de 2×2 células derivada do mesmo calçamento aprovado no jardim do
 * Marco de Senda. As peças formam trechos retos, curvas, cruzamentos,
 * entradas, praça e o anel da fonte sem usar a antiga borda marrom.
 */
export class CityPavementKit {
  constructor(scene, {project, depth}) {
    this.scene = scene;
    this.project = project;
    this.depth = depth;
    this.cells = new Map();
    this.edgeGraphics = scene.add.graphics().setDepth(depth + .018);
    this.mossGraphics = scene.add.graphics().setDepth(depth + .021);
    this.keys = ['iso_pavement_tile_a','iso_pavement_tile_b','iso_pavement_tile_c','iso_pavement_tile_d'];
  }

  /** Cria toda a rede, deixando as regras de cada módulo explícitas. */
  build() {
    // Corredor dos estabelecimentos da muralha norte: rua + calçada contínua.
    this.street('corredor-norte', 3, 8, 25, 10);
    this.sidewalk('fachadas-norte', 3, 6, 25, 8);
    this.intersection('cruzamento-mercado', 6, 12, 10, 14);

    // Praça aberta em torno da fonte, com ramificações para comércio e portões.
    this.plaza('praca-da-fonte', 14, 14, 5.15, 4.15);
    this.fountainContour('contorno-da-fonte', 14, 14, 3.05, 2.55);
    this.plazaLink('ligacao-mercado-praca', 8, 12, 14, 14);
    this.plazaLink('ligacao-praca-leste', 18, 13, 26, 15);
    this.plazaLink('ligacao-praca-sul', 13, 17, 15, 26);
    this.entry('soleira-portao-leste', 24, 14, 26, 14);
    this.entry('soleira-portao-sul', 14, 24, 14, 26);
    this.curve('curva-praca-bairro', 10, 18, 'southWest');

    // Entradas individuais: cada estabelecimento chega à mesma rede, sem
    // calçada isolada nem um contorno pesado contornando a cidade.
    this.entry('arquivo-lysandra', 6, 8, 6, 10);
    this.entry('ferraria-borin', 10, 6, 10, 10);
    this.entry('botica-elara', 14, 6, 14, 10);
    this.entry('taverna-garrick', 20, 6, 20, 10);
    this.entry('atelie-maelis', 24, 6, 24, 10);
    this.entry('mercado-aldren', 6, 12, 10, 14);

    // Bairro residencial: espinha central, cruzamento e quatro calçadas de
    // lote. O Morador percorre exatamente essas faixas (ver a rota da cena).
    this.street('espinha-residencial', 5, 16, 7, 26);
    this.intersection('cruzamento-residencial', 3, 20, 11, 22);
    this.corner('canto-noroeste-residencial', 6, 18, 'northWest');
    this.corner('canto-sudeste-residencial', 8, 22, 'southEast');
    this.sidewalk('lote-casa-azul', 2, 16, 6, 20);
    this.sidewalk('lote-casa-verde', 8, 16, 12, 20);
    this.sidewalk('lote-casa-ocre', 2, 22, 6, 26);
    this.sidewalk('lote-casa-vinho', 8, 22, 12, 26);
    this.entry('entrada-casa-azul', 4, 18, 4, 22);
    this.entry('entrada-casa-verde', 10, 18, 10, 22);
    this.entry('entrada-casa-ocre', 4, 20, 4, 24);
    this.entry('entrada-casa-vinho', 10, 20, 10, 24);
    this.plazaLink('ligacao-bairro-praca', 6, 16, 12, 18);

    this.finishEdges();
  }

  tileKeyFor(kind, u, v) {
    const n = Math.abs(Math.round(u * 17 + v * 29 + kind.length * 13));
    return this.keys[n % this.keys.length];
  }

  styleFor(kind) {
    if (kind === 'street') return {tint:0xffffff, alpha:1};
    if (kind === 'plaza') return {tint:0xfff0cf, alpha:1};
    if (kind === 'contour') return {tint:0xf1d8a6, alpha:1};
    if (kind === 'entry') return {tint:0xf6e2ba, alpha:1};
    return {tint:0xf8e8c7, alpha:.98};
  }

  place(kind, u, v, tag) {
    // Cada losango cobre exatamente 2×2 células lógicas. A paridade pode
    // mudar entre uma rua horizontal e uma vertical (por exemplo, v=9), mas
    // nunca é forçada para uma grade global que criaria lacunas nos trechos
    // estreitos de calçada.
    const snappedU = Math.round(u);
    const snappedV = Math.round(v);
    const id = `${snappedU}:${snappedV}`;
    const old = this.cells.get(id);
    if (old) old.destroy();
    const point = this.project(snappedU, snappedV);
    const style = this.styleFor(kind);
    const tile = this.scene.add.image(point.x, point.y, this.tileKeyFor(tag ?? kind, snappedU, snappedV))
      .setOrigin(.5)
      .setDepth(this.depth + .004)
      .setTint(style.tint)
      .setAlpha(style.alpha);
    tile.setData('urbanPavement', kind);
    this.cells.set(id, tile);
    return tile;
  }

  placeRect(kind, tag, u1, v1, u2, v2) {
    const firstU = Math.ceil(Math.min(u1,u2) + 1);
    const lastU = Math.floor(Math.max(u1,u2) - 1);
    const firstV = Math.ceil(Math.min(v1,v2) + 1);
    const lastV = Math.floor(Math.max(v1,v2) - 1);
    for (let u=firstU; u<=lastU; u+=2) {
      for (let v=firstV; v<=lastV; v+=2) this.place(kind, u, v, tag);
    }
    this.addSoftCurb(u1,v1,u2,v2,kind);
  }

  street(tag,u1,v1,u2,v2) { this.placeRect('street',tag,u1,v1,u2,v2); }
  sidewalk(tag,u1,v1,u2,v2) { this.placeRect('sidewalk',tag,u1,v1,u2,v2); }
  intersection(tag,u1,v1,u2,v2) { this.placeRect('plaza',tag,u1,v1,u2,v2); }
  plazaLink(tag,u1,v1,u2,v2) { this.placeRect('street',tag,u1,v1,u2,v2); }
  entry(tag,u1,v1,u2,v2) {
    // Entradas recebem sempre dois tiles de largura. Assim uma soleira com
    // coordenada central (u constante ou v constante) continua visível.
    if (Math.abs(u2-u1) >= Math.abs(v2-v1)) {
      this.placeRect('entry',tag,Math.min(u1,u2)-1,v1-1,Math.max(u1,u2)+1,v1+1);
    } else {
      this.placeRect('entry',tag,u1-1,Math.min(v1,v2)-1,u1+1,Math.max(v1,v2)+1);
    }
  }

  plaza(tag, u, v, radiusU, radiusV) {
    // Garante pedra sob a fundação da fonte, mesmo quando a malha do losango
    // alterna a paridade das linhas externas.
    this.place('plaza',u,v,tag);
    for (let cellU=Math.ceil(u-radiusU+1); cellU<=Math.floor(u+radiusU-1); cellU+=2) {
      for (let cellV=Math.ceil(v-radiusV+1); cellV<=Math.floor(v+radiusV-1); cellV+=2) {
        const du=Math.abs((cellU-u)/radiusU), dv=Math.abs((cellV-v)/radiusV);
        if (du + dv <= 1.08) this.place('plaza', cellU, cellV, tag);
      }
    }
    this.addDiamondCurb(u,v,radiusU,radiusV,0xe5d0a7,.45);
  }

  fountainContour(tag, u, v, outerU, outerV) {
    for (let cellU=Math.ceil(u-outerU+1); cellU<=Math.floor(u+outerU-1); cellU+=2) {
      for (let cellV=Math.ceil(v-outerV+1); cellV<=Math.floor(v+outerV-1); cellV+=2) {
        const du=Math.abs((cellU-u)/outerU), dv=Math.abs((cellV-v)/outerV);
        if (du+dv>.30 && du+dv<=1.08) this.place('contour',cellU,cellV,tag);
      }
    }
    this.addDiamondCurb(u,v,outerU,outerV,0x989d89,.52);
  }

  corner(tag,u,v,direction) {
    this.place('sidewalk',u,v,tag);
    const point=this.project(Math.round(u),Math.round(v));
    const signX=direction.includes('East')?1:-1;
    const signY=direction.includes('south')?1:-1;
    this.edgeGraphics.lineStyle(1.2,0xdcc69b,.48);
    this.edgeGraphics.beginPath();
    this.edgeGraphics.arc(point.x+signX*13,point.y+signY*5,20,Math.PI*.08,Math.PI*.92,false);
    this.edgeGraphics.strokePath();
  }

  curve(tag,u,v,direction) {
    this.place('street',u,v,tag);
    this.place('sidewalk',u-2,v,direction);
    this.place('sidewalk',u,v+2,direction);
    const point=this.project(Math.round(u),Math.round(v));
    this.edgeGraphics.lineStyle(1.4,0xdcc69b,.46);
    this.edgeGraphics.beginPath();
    this.edgeGraphics.arc(point.x-14,point.y+8,28,Math.PI*1.12,Math.PI*1.73,false);
    this.edgeGraphics.strokePath();
  }

  addSoftCurb(u1,v1,u2,v2,kind) {
    const points=[this.project(u1,v1),this.project(u2,v1),this.project(u2,v2),this.project(u1,v2)];
    // São riscos de pedra fria/musgo, não as antigas faixas marrons que
    // fechavam a cidade como uma moldura.
    const color=kind==='street'?0x7d8574:0xe4cfaa;
    this.edgeGraphics.lineStyle(kind==='street'?1:1.35,color,kind==='street'?.30:.42);
    this.edgeGraphics.strokePoints(points,true);
    this.addMossAtEdges(u1,v1,u2,v2,kind);
  }

  addDiamondCurb(u,v,ru,rv,color,alpha) {
    const points=[this.project(u-ru,v),this.project(u,v-rv),this.project(u+ru,v),this.project(u,v+rv)];
    this.edgeGraphics.lineStyle(1.35,color,alpha).strokePoints(points,true);
  }

  addMossAtEdges(u1,v1,u2,v2,tag) {
    const seed=Math.abs(Math.round((u1+v1+u2+v2)*41+tag.length*19));
    for(let index=0;index<3;index++){
      const t=((seed+index*37)%97)/96;
      const side=(seed+index)%4;
      const u=side<2?Phaser.Math.Linear(u1,u2,t):(side===2?u1:u2);
      const v=side<2?(side===0?v1:v2):Phaser.Math.Linear(v1,v2,t);
      const point=this.project(u,v);
      this.mossGraphics.fillStyle(0x718552,.24+index*.05).fillCircle(point.x,point.y,1.3+(index%2)*.55);
    }
  }

  finishEdges() {
    // Pequenas imperfeições nos encontros quebram a repetição dos losangos,
    // mantendo a leitura de pedra/musgo do jardim do Marco de Senda.
    for (const [id] of this.cells) {
      const [u,v]=id.split(':').map(Number);
      if (((u*3+v*5)%5)!==0) continue;
      const point=this.project(u+.58,v-.34);
      this.mossGraphics.fillStyle(0x728953,.23).fillEllipse(point.x,point.y,5,2.4);
    }
  }

  destroy() {
    for(const tile of this.cells.values()) tile.destroy();
    this.cells.clear();
    this.edgeGraphics.destroy();
    this.mossGraphics.destroy();
  }
}
