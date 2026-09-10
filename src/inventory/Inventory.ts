// @ts-nocheck
export class Inventory{
 constructor(capacity=24){this.capacity=capacity;this.items=[]}
 add(id,qty=1){const f=this.items.find(x=>x.id===id);if(f){f.qty+=qty;return true}if(this.items.length>=this.capacity)return false;this.items.push({id,qty});return true}
 remove(id,qty=1){const f=this.items.find(x=>x.id===id);if(!f||f.qty<qty)return false;f.qty-=qty;if(f.qty<=0)this.items=this.items.filter(x=>x!==f);return true}
 count(id){return this.items.find(x=>x.id===id)?.qty||0}
 has(id,qty=1){return this.count(id)>=qty}
 serialize(){return this.items.map(x=>({...x}))}
 load(data){this.items=Array.isArray(data)?data.map(x=>({...x})).filter(x=>x.id&&x.qty>0).slice(0,this.capacity):[]}
}
