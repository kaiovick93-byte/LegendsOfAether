const city={left:80,top:80,right:1480,bottom:1120};
const specs=[
 ['Loja de Aldren',270,330,320,320,.58,166,84],
 ['Ferraria de Borin',550,330,280,280,.64,162,86],
 ['Botica de Elara',850,330,300,300,.62,166,86],
 ['Casa laranja',1170,340,400,448,.43,148,92],
 ['Taverna de Garrick',260,760,320,320,.64,182,98],
 ['Casa de Lysandra',1280,760,320,320,.64,184,100],
 ['Oficina de Maelis',260,1010,320,320,.56,164,92],
 ['Casa vermelha',575,1010,288,361,.46,118,86],
 ['Casa verde',1080,1000,212,373,.44,86,90],
 ['Casa azul',1320,1020,342,386,.40,132,92]
];

const rect=(x,y,w,h)=>({x,y,w,h,right:x+w,bottom:y+h});
const buildings=specs.map(([name,x,y,sourceW,sourceH,scale,baseW,baseH])=>({
 name,
 visual:rect(x-sourceW*scale*.86/2,y-sourceH*scale*.86,sourceW*scale*.86,sourceH*scale*.86),
 base:rect(x-baseW/2,y-baseH,baseW,baseH)
}));
const overlaps=(a,b)=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
const contains=(r,x,y,pad=0)=>x>=r.x-pad&&x<=r.right+pad&&y>=r.y-pad&&y<=r.bottom+pad;
const issues=[];

for(const b of buildings){
 if(b.base.x<city.left+24||b.base.right>city.right-24||b.base.y<city.top+24||b.base.bottom>city.bottom-24)issues.push(`${b.name}: footprint fora das muralhas`);
}
for(let i=0;i<buildings.length;i++)for(let j=i+1;j<buildings.length;j++){
 if(overlaps(buildings[i].visual,buildings[j].visual))issues.push(`${buildings[i].name} sobrepõe ${buildings[j].name}`);
}

const gateApproaches=[rect(1360,388,120,224),rect(648,930,264,190)];
for(const b of buildings)for(const gate of gateApproaches)if(overlaps(b.base,gate))issues.push(`${b.name}: footprint invade corredor de portão`);

const actors=[
 ['Aldren',270,382],['Borin',550,382],['Elara',850,382],['Garrick',260,812],['Lysandra',1280,812],['Maelis',260,1060],['Mira',1090,700],['Kael',1410,350],['Bren',540,1060],
 ['Tomas',400,405],['Tomas',540,405],['Tomas',680,405],['Tomas',820,405],['Tomas',960,405],['Tomas',1080,405],
 ['Darian',1180,500],['Darian',1120,610],['Darian',1130,790],['Darian',980,865],['Darian',880,865],['Darian',940,790],['Darian',1010,700],['Darian',1080,570]
];
for(const [name,x,y] of actors)for(const b of buildings)if(contains(b.base,x,y,14))issues.push(`${name} dentro do footprint de ${b.name}`);

const fauna=[
 ['cão',760,808],['cão',820,820],['cão',890,826],['cão',950,818],['cão',900,798],
 ['gato',125,500],['gato',155,535],['gato',150,610],['gato',130,680],
 ['galinha',365,898],['galinha',420,882],['galinha',505,878],['galinha',495,856],['galinha',480,946],['galinha',502,930],
 ['rato',155,820],['rato',244,838],['rato',345,800],['rato',308,842],['rato',150,792],['rato',190,842],
 ['ancião ambiental',980,735]
];
for(const [name,x,y] of fauna)for(const b of buildings)if(contains(b.visual,x,y,8))issues.push(`${name} atravessa a arte de ${b.name}`);

if(issues.length){console.error('CITY_ROUND56_AUDIT_FAILED');for(const issue of issues)console.error(`- ${issue}`);process.exit(1)}
console.log(`CITY_ROUND56_AUDIT_OK buildings=${buildings.length} actors=${actors.length} fauna_points=${fauna.length} gates=2`);
