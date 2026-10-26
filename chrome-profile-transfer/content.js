// Runs only after clicking the extension. No exfiltration, no external dependencies.
(() => {
 if (globalThis.__chromeProfileTransferListener) return;
 globalThis.__chromeProfileTransferListener = true;
 const sensitive = /(^|[_.:-])(auth|token|access.?token|refresh.?token|session|jwt|secret|password|credential|api.?key|bearer|csrf)([_.:-]|$)/i;
 const allow = () => location.protocol === 'https:' || location.protocol === 'http:';
 const req = r => new Promise((resolve,reject) => {r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error || new Error('IDB request failed'));});
 const txEnd = tx => new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error || new Error('Transaction error'));tx.onabort=()=>reject(tx.error || new Error('Transaction aborted'));});
 const b64 = bytes => {let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);};
 const unb64 = str=>Uint8Array.from(atob(str),c=>c.charCodeAt(0));
 async function pack(v){
   if(v===undefined)return {__cptType:'Undefined'};
   if(typeof v==='bigint')return {__cptType:'BigInt',v:v.toString()};
   if(v===null||typeof v==='string'||typeof v==='number'||typeof v==='boolean')return v;
   if(v instanceof Date)return {__cptType:'Date',v:v.toISOString()};
   if(v instanceof Blob)return {__cptType:'Blob',v:b64(new Uint8Array(await v.arrayBuffer())),type:v.type};
   if(v instanceof ArrayBuffer)return {__cptType:'ArrayBuffer',v:b64(new Uint8Array(v))};
   if(ArrayBuffer.isView(v))return {__cptType:'Typed',v:b64(new Uint8Array(v.buffer,v.byteOffset,v.byteLength)),type:v.constructor.name};
   if(v instanceof Map)return {__cptType:'Map',v:await Promise.all([...v].map(async ([k,x])=>[await pack(k),await pack(x)]))};
   if(v instanceof Set)return {__cptType:'Set',v:await Promise.all([...v].map(pack))};
   if(Array.isArray(v))return Promise.all(v.map(pack));
   const o={};for(const [k,x] of Object.entries(v))o[k]=await pack(x);return o;
 }
 function unpack(v){
   if(!v||typeof v!=='object')return v;
   if(Array.isArray(v))return v.map(unpack);
   if(v.__cptType||v.__farazT){switch(v.__cptType||v.__farazT){
      case 'Undefined':return undefined;case 'BigInt':return BigInt(v.v);
      case 'Date':return new Date(v.v);
      case 'Blob':return new Blob([unb64(v.v)],{type:v.type||''});
      case 'ArrayBuffer':return unb64(v.v).buffer;
      case 'Typed':{const bytes=unb64(v.v),buf=bytes.buffer;const constructors={Uint8Array,Int8Array,Uint8ClampedArray,Uint16Array,Int16Array,Uint32Array,Int32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array,DataView};const C=constructors[v.type];return C?(v.type==='DataView'?new DataView(buf):new C(buf)):bytes;}
      case 'Map':return new Map(v.v.map(([k,x])=>[unpack(k),unpack(x)]));
      case 'Set':return new Set(v.v.map(unpack));
   }}const o={};for(const [k,x] of Object.entries(v))o[k]=unpack(x);return o;
 }
 async function exportIDB(includeSensitive){
   const result=[], warnings=[];
   if(typeof indexedDB.databases!=='function'){warnings.push('مرورگر امکان فهرست کردن IndexedDB را ندارد');return {result,warnings};}
   const dbs=await indexedDB.databases();
   for(const info of dbs){const name=info.name;if(!name || (!includeSensitive&&sensitive.test(name)))continue;
     let db;try{
       db=await new Promise((resolve,reject)=>{const r=indexedDB.open(name);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onupgradeneeded=()=>{r.transaction.abort();reject(new Error('Database changed while opening'));};});
       const entry={name,version:db.version,stores:[]};
       for(const storeName of Array.from(db.objectStoreNames)){
         if(!includeSensitive&&sensitive.test(storeName))continue;
         const tx=db.transaction(storeName,'readonly'),store=tx.objectStore(storeName);
         const raw=await new Promise((resolve,reject)=>{const rows=[];const cur=store.openCursor();cur.onsuccess=()=>{const c=cur.result;if(c){rows.push({key:c.key,primaryKey:c.primaryKey,value:c.value});c.continue();}else resolve(rows);};cur.onerror=()=>reject(cur.error);});
         entry.stores.push({name:storeName,keyPath:store.keyPath,autoIncrement:store.autoIncrement,indexes:[...store.indexNames].map(x=>{const ix=store.index(x);return {name:x,keyPath:ix.keyPath,unique:ix.unique,multiEntry:ix.multiEntry};}),records:await Promise.all(raw.map(async x=>({key:await pack(x.key),value:await pack(x.value)})))});
       }
       result.push(entry);
     }catch(e){warnings.push(`IndexedDB ${name}: ${e.message}`);}finally{db?.close();}
   }return {result,warnings};
 }
 async function importIDB(dbs,includeSensitive){
   const warnings=[];let rows=0,stores=0;
   for(const item of dbs||[]){if(!item.name||(!includeSensitive&&sensitive.test(item.name)))continue;
     let db;try{
       // Do not upgrade an existing database's schema: that can break an application.
       const known=typeof indexedDB.databases==='function'?await indexedDB.databases():[];
       const existing=known.find(x=>x.name===item.name);
       if(!existing){warnings.push(`پایگاه داده ${item.name} در مقصد وجود ندارد؛ برای جلوگیری از تغییر ساختار ساخته نشد`);continue;}
       db=await new Promise((resolve,reject)=>{const r=indexedDB.open(item.name);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onupgradeneeded=()=>{r.transaction.abort();reject(new Error('Unexpected schema change'));};});
       for(const entry of item.stores||[]){
         if(!includeSensitive&&sensitive.test(entry.name))continue;
         if(!db.objectStoreNames.contains(entry.name)){warnings.push(`${item.name}/${entry.name}: در مقصد وجود ندارد`);continue;}
         const tx=db.transaction(entry.name,'readwrite'),store=tx.objectStore(entry.name);let count=0;
         try{
           for(const record of entry.records||[]){
             const value=unpack(record.value),key=unpack(record.key);
             if(store.keyPath===null)store.put(value,key);else store.put(value);
             count++;
           }
           await txEnd(tx);rows+=count;stores++;
         }catch(e){warnings.push(`${item.name}/${entry.name}: ${e.message}`);try{tx.abort();}catch{}}
       }
     }catch(e){warnings.push(`IndexedDB ${item.name}: ${e.message}`);}finally{db?.close();}
   }return {rows,stores,warnings};
 }
 chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
   if(!message||!['EXPORT','IMPORT'].includes(message.type))return;
   (async()=>{
     if(!allow())throw new Error('این ابزار فقط روی وب‌سایت‌های http یا https اجرا می‌شود');
     const includeSensitive=!!message.includeSensitive;
     if(message.type==='EXPORT'){
       const local={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(includeSensitive||!sensitive.test(key))local[key]=localStorage.getItem(key);}
       const idb=message.withIDB?await exportIDB(includeSensitive):{result:[],warnings:[]};
       return {ok:true,data:{format:'chrome-profile-transfer',version:1,origin:location.origin,exportedAt:new Date().toISOString(),localStorage:local,indexedDB:idb.result},summary:{keys:Object.keys(local).length,databases:idb.result.length,records:idb.result.reduce((n,d)=>n+d.stores.reduce((a,s)=>a+s.records.length,0),0)},warnings:idb.warnings};
     }
     const data=message.data;
     if(!data||!['chrome-profile-transfer','faraz-profile-transfer'].includes(data.format)||data.version!==1||data.origin!==location.origin)throw new Error('فایل متعلق به نسخه یا آدرس دیگری است. از همان زیردامنه در هر دو پروفایل استفاده کن.');
     let keys=0;for(const [k,v] of Object.entries(data.localStorage||{})){if(!includeSensitive&&sensitive.test(k))continue;if(typeof v!=='string')continue;localStorage.setItem(k,v);keys++;}
     const idb=message.withIDB?await importIDB(data.indexedDB,includeSensitive):{rows:0,stores:0,warnings:[]};
     return {ok:true,summary:{keys,records:idb.rows,stores:idb.stores},warnings:idb.warnings};
   })().then(sendResponse).catch(e=>sendResponse({ok:false,error:String(e.message||e)}));
   return true;
 });
})();
