import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'aether-player-select-'));
const output=path.join(root,'PLAYER_SELECTION_IN_GAME_QA.png');
const canvas=path.join(temp,'canvas.png');
const run=(name,args)=>execFileSync(name,args,{stdio:'ignore'});
const font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

const draw=[
 '-size','960x540','xc:#0d1422',
 '-font',bold,'-fill','#ecf0ff','-pointsize','28','-gravity','north','-annotate','+0+20','ESCOLHA SEU HERÓI',
 '-font',font,'-fill','#9aa8c7','-pointsize','11','-annotate','+0+58','Três classes • duas aparências por classe • caminhada em oito direções',
 '-gravity','northwest'
];
const classes=[['GUERREIRO',180],['MAGO',480],['CAÇADOR',780]];
for(const [label,x]of classes)draw.push('-font',bold,'-fill','#ffd166','-pointsize','17','-annotate',`+${x-55}+82`,label);
const cards=[
 ['warrior_m',113,'MASCULINO','Negro',true],['warrior_f',247,'FEMININO','Asiática',false],
 ['mage_m',413,'MASCULINO','Asiático',false],['mage_f',547,'FEMININO','Negra',false],
 ['ranger_m',713,'MASCULINO','Caucasiano',false],['ranger_f',847,'FEMININO','Asiática',false]
];
for(const [,x,gender,heritage,selected]of cards){
 const left=x-61,top=99,right=x+61,bottom=329;
 draw.push('-fill',selected?'#24314d':'#182033','-stroke',selected?'#d0604e':'#32405f','-strokewidth',selected?'4':'2','-draw',`roundrectangle ${left},${top} ${right},${bottom} 8,8`);
 draw.push('-stroke','none','-font',bold,'-fill','#ecf0ff','-pointsize','11','-annotate',`+${x-38}+287`,gender);
 draw.push('-font',font,'-fill','#9aa8c7','-pointsize','10','-annotate',`+${x-25}+309`,heritage);
}
draw.push('-gravity','north','-font',font,'-fill','#c8d1ea','-pointsize','13','-annotate','+0+366','Guerreiro • Masculino • Negro');
draw.push('-annotate','+0+388','Alta resistência e dano físico.   HP +40   Mana +0   ATQ +6   DEF +4   SPD +0');
draw.push('-fill','#9aa8c7','-pointsize','11','-annotate','+0+428','O herói começa com roupas simples, sem arma e sem armadura. O visual muda ao equipar itens compatíveis.');
draw.push('-gravity','northwest','-fill','#24314d','-stroke','#36507c','-strokewidth','2','-draw','roundrectangle 355,465 605,515 8,8');
draw.push('-gravity','north','-stroke','none','-font',bold,'-fill','#73e6a8','-pointsize','18','-annotate','+0+478','COMEÇAR NOVO JOGO',canvas);
run('convert',draw);

for(const [id,x]of cards){
 const frame=path.join(temp,`${id}.png`);
 run('convert',[path.join(root,`assets/images/characters/player/${id}_base.png`),'-crop','96x96+96+0','+repage','-filter','point','-resize','136x136',frame]);
 const next=path.join(temp,`${id}-layer.png`);
 run('composite',['-geometry',`+${x-68}+126`,frame,canvas,next]);
 fs.renameSync(next,canvas);
}
fs.copyFileSync(canvas,output);
fs.rmSync(temp,{recursive:true,force:true});
console.log(output);
