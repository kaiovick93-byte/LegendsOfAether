// @ts-nocheck
export class SaveManager{
 constructor(key='legends-of-aether-save'){this.key=key}
 save(state){localStorage.setItem(this.key,JSON.stringify(state))}
 load(){const raw=localStorage.getItem(this.key);if(!raw)return null;try{const s=JSON.parse(raw);return s?.version===1?s:null}catch{return null}}
 clear(){localStorage.removeItem(this.key)}
 hasSave(){return !!localStorage.getItem(this.key)}
}
