(function(l,h){typeof exports=="object"&&typeof module<"u"?module.exports=h():typeof define=="function"&&define.amd?define(h):(l=typeof globalThis<"u"?globalThis:l||self,l.AxiosMultiDown=h())})(this,function(){"use strict";var l=(t=>(t.HEAD="head",t.SELF="self",t))(l||{}),h=(t=>(t[t.NODE=0]="NODE",t[t.Browser=1]="Browser",t))(h||{});const y={max:3,blockSize:"10M",testMethod:"head"},S=(()=>{if(typeof window=="object")return h.Browser;if(Object.prototype.toString.call(process)==="[object process]")return h.NODE})();function k(t,n){if(t<=0||n<=0)throw new Error("参数错误");const e=[],r=Math.ceil(t/n);for(let o=0;o<r;o++)o!==r-1?e.push({s:n*o,e:n*(o+1)-1,i:o}):e.push({s:n*o,e:t-1,i:o});return e}function A(t){const n=t.reduce((o,a)=>o+a.length,0);let e=new Uint8Array(n),r=0;return t.forEach(o=>{e.set(o,r),r+=o.length}),e}function M(t){if(typeof t.max!="number")throw new Error(`downConfig.max must be number, got ${t.max}`);if(t.blockSize=x(t.blockSize),![l.HEAD,l.SELF].includes(t.testMethod))throw new Error(`downConfig.testMethod must be head | self , got ${t.testMethod}`);return t}function x(t){if(typeof t=="number"){if(t<=0)throw new Error(`downConfig.blockSize number must be > 0 , got ${t}`);return t}if(/^\d+K$/.test(t))return Number(t.match(/\d+/)[0])*1024;if(/^\d+M$/.test(t))return Number(t.match(/\d+/)[0])*1024*1024;if(/^\d+G$/.test(t))return Number(t.match(/\d+/)[0])*1024*1024*1024;if(/^\d+T$/.test(t))return Number(t.match(/\d+/)[0])*1024*1024*1024*1024;throw new Error(`downConfig.blockSize string only supported K,M,G,T, got ${t}`)}class N{constructor(){this.events={}}on(n,e){this.events[n]||(this.events[n]=[]),this.events[n].push(e)}off(n,e){if(this.events[n]){const r=this.events[n].indexOf(e);r!==-1&&this.events[n].splice(r,1)}}emit(n,...e){if(this.events[n])for(const r of this.events[n])r(...e)}}function p(t,n=y){return t.down=async function(e,r,o){let a={},u={...y,...n};arguments.length===1&&(typeof e=="string"?a={url:e}:a=e),arguments.length===2&&(typeof e=="string"?a={...r,url:e}:(a=e,u={...u,...r})),arguments.length===3&&(a={...r,url:e},u={...u,...o});const s=M(u),i=await $(t,s,a);if(i){const d=k(i,s.blockSize);s.max=s.max<=d.length?s.max:d.length;let f;return s.max===1?f=await b(t,a,s):f=await T(t,a,s,d,i),f}else return await b(t,a,s)},t}async function $(t,n,e){const{testMethod:r}=n,o={...e.headers,Range:"bytes=0-0"},a={...e,headers:o};let u=null;return r===l.HEAD||S===h.Browser?u=await B(t,a):u=await j(t,a),u}function B(t,n){return new Promise(e=>{t({...n,method:l.HEAD}).then(r=>{const o=r.headers["content-range"];r.headers["content-length"]==1&&o?e(Number(o.split("/")[1])):e(null)}).catch(()=>{e(null)})})}function j(t,n){return new Promise(e=>{const r=new AbortController;t({...n,signal:r.signal,responseType:"stream"}).then(o=>{o.data.on("data",a=>{const u=o.headers["content-range"];o.headers["content-length"]==1&&u?e(Number(u.split("/")[1])):e(null),r.abort()})}).catch(()=>{e(null)})})}async function b(t,n,e){var s,i;const r=await t(n),o={s:0,e:r.headers["content-length"]-1,i:0,resp:r};return(s=e.emitter)==null||s.emit("data",o),(i=e.emitter)==null||i.emit("end"),{...r,isMulti:!1,downConfig:e,queue:[o]}}function T(t,n,e,r,o){return new Promise((a,u)=>{let s;const i=n.responseType||"json";let d=0,f=0;const w=r.map(m=>()=>new Promise((L,R)=>{d++,f++;const v={...(n==null?void 0:n.headers)||{},Range:`bytes=${m.s}-${m.e}`};t({...n,headers:v,responseType:"arraybuffer"}).then(c=>{var g,E;if(c.data=c.data instanceof ArrayBuffer?new Uint8Array(c.data):c.data,m.resp=c,(g=e.emitter)==null||g.emit("data",m),s||(s={...c,isMulti:!0,downConfig:e,queue:r}),d===w.length&&f===1){switch((E=e.emitter)==null||E.emit("end"),c.data=A(r.map(D=>D.resp.data)),i){case"json":try{c.data=new TextDecoder("utf-8").decode(c.data),c.data=JSON.parse(c.data),c.config.responseType=i}catch{}break;case"text":c.data=new TextDecoder("utf-8").decode(c.data),c.config.responseType=i}s={...c,isMulti:!0,downConfig:e,queue:r},s.status=200,s.statusText="OK",s.headers["content-type"]=o,a(s)}L(s)}).catch(c=>{u(c)}).finally(()=>{f--,d<w.length&&(f<e.max||e.max===1)&&w[d]()})}));for(let m=0;m<e.max;m++)w[m]()})}return p.EventEmitter=N,p});
