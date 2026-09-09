/**
 * Limpa somente RGB de pixels 100% transparentes de um PNG RGBA.
 * Não transforma branco legítimo em transparência e não altera alpha/pixels
 * visíveis; evita halos por interpolação em assets recortados.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const [input,output]=process.argv.slice(2);
if(!input||!output)throw new Error('Uso: node clear-transparent-rgb.mjs entrada.png saida.png');

const source=fs.readFileSync(input);
if(source.subarray(1,4).toString('ascii')!=='PNG')throw new Error('Arquivo não é PNG.');
const width=source.readUInt32BE(16),height=source.readUInt32BE(20);
if(source[24]!==8||source[25]!==6||source[28]!==0)throw new Error('PNG precisa ser RGBA 8-bit não entrelaçado.');
const idat=[];
for(let offset=8;offset<source.length;){
  const length=source.readUInt32BE(offset),type=source.toString('ascii',offset+4,offset+8);
  if(type==='IDAT')idat.push(source.subarray(offset+8,offset+8+length));
  offset+=length+12;
}
const compressed=zlib.inflateSync(Buffer.concat(idat));
const stride=width*4,pixels=Buffer.alloc(height*stride);
const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c};
let sourceOffset=0;
for(let y=0;y<height;y++){
  const filter=compressed[sourceOffset++],row=y*stride,previous=(y-1)*stride;
  for(let x=0;x<stride;x++){
    const left=x>=4?pixels[row+x-4]:0,up=y?pixels[previous+x]:0,upperLeft=y&&x>=4?pixels[previous+x-4]:0;
    const predictor=filter===0?0:filter===1?left:filter===2?up:filter===3?Math.floor((left+up)/2):paeth(left,up,upperLeft);
    pixels[row+x]=(compressed[sourceOffset++]+predictor)&255;
  }
}
let cleared=0;
for(let pixel=0;pixel<width*height;pixel++){
  const index=pixel*4;
  if(pixels[index+3]===0&&(pixels[index]||pixels[index+1]||pixels[index+2])){
    pixels[index]=pixels[index+1]=pixels[index+2]=0;cleared++;
  }
}
const raw=Buffer.alloc(height*(stride+1));
for(let y=0;y<height;y++){raw[y*(stride+1)]=0;pixels.copy(raw,y*(stride+1)+1,y*stride,(y+1)*stride);}
const crcTable=(()=>{
  const table=new Uint32Array(256);
  for(let n=0;n<256;n++){let value=n;for(let bit=0;bit<8;bit++)value=value&1?0xedb88320^(value>>>1):value>>>1;table[n]=value>>>0;}
  return table;
})();
const crc32=data=>{let value=0xffffffff;for(const byte of data)value=crcTable[(value^byte)&255]^(value>>>8);return(value^0xffffffff)>>>0;};
const chunk=(type,data=Buffer.alloc(0))=>{
  const name=Buffer.from(type),out=Buffer.alloc(data.length+12);
  out.writeUInt32BE(data.length,0);name.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([name,data])),data.length+8);
  return out;
};
const ihdr=Buffer.alloc(13);
ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND')]));
console.log(`ALPHA_SANITIZED cleared=${cleared} output=${output}`);
