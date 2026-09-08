const {test}=require('node:test');
const assert=require('node:assert/strict');
const {apply,undo}=require('../src/ai-actions.js');
const fs=require('fs'),os=require('os'),path=require('path');
const register=require('../main/ai.cjs');
let n=0;const uid=()=>`ai-${++n}`;
const base=()=>({tasks:[{id:'one',title:'写方案',projectId:'inbox',itemType:'todo',dueDate:'2026-09-06',time:'',completed:false}],projects:[{id:'inbox',name:'未分类'},{id:'work',name:'工作'}]});
test('timed todo remains todo; create/delete/undo round trip and unrelated edit survives',()=>{
 const r=apply(base(),[{type:'create',fields:{title:'打电话',time:'15:00',dueDate:'2026-09-07'}}],uid);
 assert.equal(r.state.tasks[1].itemType,'todo');
 r.state.tasks[0].title='后来的编辑';
 const restored=undo(r.state,r.entry.id);assert.equal(restored.tasks.length,1);assert.equal(restored.tasks[0].title,'后来的编辑');
 const deleted=apply(base(),[{type:'delete',id:'one'}],uid);assert.equal(deleted.state.tasks.length,0);assert.deepEqual(undo(deleted.state,deleted.entry.id).tasks,base().tasks);
});
test('batch validates atomically; rejects invalid dates, remote items, unsafe fields and missing ids',()=>{
 const s=base();
 assert.throws(()=>apply(s,[{type:'delete',id:'one'},{type:'create',fields:{title:'bad',dueDate:'2026-02-30'}}],uid));assert.equal(s.tasks.length,1);
 for(const action of [{type:'update',id:'unknown',fields:{title:'x'}},{type:'update',id:'one',fields:{googleTaskId:'evil'}},{type:'create',fields:{title:'x',projectId:'missing'}},{type:'create',fields:{title:'x',itemType:'event',dueDate:'2026-09-07',time:'16:00',endTime:'15:00'}}])assert.throws(()=>apply(s,[action],uid));
 s.tasks[0].googleTaskId='remote';assert.throws(()=>apply(s,[{type:'delete',id:'one'}],uid));
});
test('move category, complete, and refuse stale undo',()=>{
 const r=apply(base(),[{type:'update',id:'one',fields:{projectId:'work',completed:true}}],uid);
 assert.equal(r.state.tasks[0].projectId,'work');assert.equal(r.state.tasks[0].completed,true);
 r.state.tasks[0].title='后来改名';assert.throws(()=>undo(r.state,r.entry.id));
});
test('API transport, key redaction, host changes, errors, models and JSON plan',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'luma-ai-test-'));const handlers={};const calls=[];
 const fetchImpl=async(url,options)=>{calls.push({url,options});return {ok:true,text:async()=>JSON.stringify(url.endsWith('/models')?{data:[{id:'test-model'}]}:{choices:[{message:{content:JSON.stringify({reply:'已理解',actions:[]})}}]})};};
 register({app:{getPath:()=>dir},safeStorage:{isEncryptionAvailable:()=>true,encryptString:x=>Buffer.from(x),decryptString:x=>x.toString()},handle:(k,f)=>handlers[k]=f,Menu:{},fetchImpl});
 try {
  assert.throws(()=>register.validateConfig({baseUrl:'http://example.com',model:'x'}));
  const config={enabled:true,baseUrl:'https://api.deepseek.com',model:'test-model',key:'TEST-ONLY'};
  const saved=handlers['ai:save-settings'](null,config);assert.equal(saved.hasKey,true);assert.equal(saved.key,undefined);
  assert.deepEqual(await handlers['ai:models'](null,{...config,key:''}),['test-model']);
  assert.equal(await handlers['ai:test'](null,{...config,key:''}),true);
  assert.deepEqual(await handlers['ai:chat'](null,{text:'明天什么安排',context:{tasks:[]}}),{reply:'已理解',actions:[]});
  assert.equal(calls[0].options.headers.Authorization,'Bearer TEST-ONLY');assert.equal(calls[0].options.redirect,'error');
  await assert.rejects(()=>handlers['ai:test'](null,{...config,baseUrl:'https://other.example',key:''}),/Key/);
  assert.equal(handlers['ai:save-settings'](null,{...config,clearKey:true}).hasKey,false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
