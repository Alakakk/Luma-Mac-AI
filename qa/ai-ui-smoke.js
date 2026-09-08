(async()=>{
 const assert=(x,m)=>{if(!x)throw Error(m);};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 document.getElementById('aiToggle').click();await wait(400);
 const panel=document.getElementById('aiPanel');
 const todo=document.querySelector('.todo-panel');
 assert(Math.abs(panel.getBoundingClientRect().height-todo.getBoundingClientRect().height)<2,'AI and Todo height differ');
 assert(panel.getBoundingClientRect().width>250,'AI panel too narrow');
 assert(getComputedStyle(panel).backgroundColor===getComputedStyle(todo).backgroundColor,'AI background does not match');
 document.getElementById('aiSettingsOpen').click();await wait(200);
 assert(document.getElementById('aiSettings').open,'AI settings failed to open');
 assert(document.getElementById('aiBaseUrl').value==='https://api.deepseek.com','DeepSeek default missing');
 assert(document.getElementById('aiKey').type==='password','Key is not masked');
 document.getElementById('aiSettingsClose').click();
 const input=document.getElementById('aiInput');input.value='明天开会';document.getElementById('aiSend').click();await wait(300);
 assert(document.getElementById('aiMessages').textContent.includes('未执行'),'Unconfigured API must not report success');
 const before=structuredClone(state);
 const result=LumaAiActions.apply(state,[{type:'create',fields:{title:'AI验证事项',dueDate:'2026-09-08',time:'15:00'}}],uid);
 state=result.state;await persist();render();
 assert((await window.luma.load()).tasks.some(t=>t.title==='AI验证事项'),'AI operation not saved');
 state=normalizeState(await window.luma.load());
 state=LumaAiActions.undo(state,result.entry.id);await persist();render();
 assert(!state.tasks.some(t=>t.title==='AI验证事项'),'AI undo failed');
 state=before;await persist();render();
 await toggleExpanded(true);await wait(400);
 assert(Math.abs(panel.getBoundingClientRect().height-todo.getBoundingClientRect().height)<2,'Expanded AI height differs');
 input.value='';
 return ['shared height','matching theme','settings and masked key','missing key blocks execution','local action persistence and undo','calendar plus assistant'];
})()
