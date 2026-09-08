(() => {
  const el=id=>document.getElementById(id);
  const history=[];
  let busy=false, opened=false, selectedId=null;
  const errorText=error=>String(error.message||error).replace(/^Error invoking remote method '[^']+': Error: /,'');
  function message(text,kind='assistant') {
    const node=document.createElement('div');node.className=`ai-message ${kind}`;node.textContent=text;
    el('aiMessages').append(node);el('aiMessages').scrollTop=el('aiMessages').scrollHeight;return node;
  }
  function button(node,label,action) {
    const b=document.createElement('button');b.type='button';b.textContent=label;
    b.onclick=async()=>{b.disabled=true;try{await action();}catch(e){message(errorText(e));b.disabled=false;}};node.append(b);return b;
  }
  async function toggle(force) {
    opened=await window.luma.aiPanel(typeof force==='boolean'?force:!opened);
    el('app').classList.toggle('ai-open',opened);el('aiPanel').setAttribute('aria-hidden',String(!opened));
    el('aiToggle').setAttribute('aria-expanded',String(opened));if(opened)el('aiInput').focus();
  }
  function config() {return {enabled:el('aiEnabled').checked,baseUrl:el('aiBaseUrl').value.trim(),model:el('aiModel').value.trim(),key:el('aiKey').value.trim()};}
  async function showSettings() {
    try {
      const c=await window.luma.aiSettings();
      el('aiEnabled').checked=c.enabled;el('aiBaseUrl').value=c.baseUrl;el('aiModel').value=c.model;el('aiKey').value='';
      el('aiKey').placeholder=c.hasKey?'已安全保存；留空保持':'填写 API Key';
      el('aiProvider').value=c.baseUrl==='https://api.deepseek.com'?'deepseek':'custom';
      el('aiSettingsStatus').textContent=c.hasKey?'密钥已保存':'尚未设置密钥';
      el('settingsDialog').close();el('aiSettings').showModal();
    }catch(e){message(errorText(e));}
  }
  async function settingsAction(action,success) {
    const buttons=el('aiSettings').querySelectorAll('footer button');buttons.forEach(b=>b.disabled=true);
    el('aiSettingsStatus').textContent='正在处理…';
    try{await action();el('aiSettingsStatus').textContent=success;}catch(e){el('aiSettingsStatus').textContent=errorText(e);}finally{buttons.forEach(b=>b.disabled=false);}
  }
  function context() {
    const tasks=state.tasks.map(t=>({id:t.id,title:t.title,projectId:t.projectId,dueDate:t.dueDate,time:t.time,itemType:t.itemType,endDate:t.endDate,endTime:t.endTime,completed:t.completed,readOnly:!LumaAiActions.local(t)}));
    return {today:toDateKey(new Date()),time:new Date().toLocaleTimeString('zh-CN'),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,selectedId,calendarDate:calendarDetailDate,visibleMonth:toDateKey(calendarCursor),projects:state.projects.map(p=>({id:p.id,name:p.name})),tasks};
  }
  function actionLabel(a) {
    const task=state.tasks.find(t=>t.id===a.id),f=a.fields||{};
    if(a.type==='createProject')return `创建分类：${a.name}`;
    const names={create:'新增',update:'修改',delete:'移入回收记录'};
    let label=`${names[a.type]||a.type}：${f.title||task?.title||''}`;
    for(const key of ['dueDate','time','endDate','endTime'])if(Object.hasOwn(f,key))label+=` · ${f[key]||'清空'}`;
    if(f.projectId)label+=` · ${projectById(f.projectId).name}`;
    if(Object.hasOwn(f,'completed'))label+=f.completed?' · 标记完成':' · 恢复未完成';
    return label;
  }
  async function commit(next) {
    const previous=state;
    el('app').inert=true;
    try {await window.luma.save(next);state=next;render();}
    catch(e){state=previous;throw e;}
    finally{el('app').inert=false;}
  }
  async function undo(id) {await commit(LumaAiActions.undo(state,id));message('已撤销；其他事项保持不变。');}
  function unchanged(snapshot,actions) {
    for(const a of actions)if(a.id && JSON.stringify(snapshot.tasks.find(t=>t.id===a.id))!==JSON.stringify(state.tasks.find(t=>t.id===a.id)))throw Error('等待期间目标事项已变化，请重新发送指令');
  }
  async function execute(plan,snapshot) {
    unchanged(snapshot,plan.actions);
    if(plan.actions.some(a=>a.id&&isTaskPendingCompletion(a.id)))throw Error('该事项正在完成倒计时，请稍后再试');
    const labels=plan.actions.map(actionLabel);
    const result=LumaAiActions.apply(state,plan.actions,uid);
    await commit(result.state);
    const node=message(`已保存到本地\n${labels.join('\n')}`);
    button(node,'撤销这次操作',()=>undo(result.entry.id));
    const id=result.entry.changes.find(c=>c.collection==='tasks'&&c.after)?.after.id;
    if(id) {
      selectedId=id;
      const target=[...document.querySelectorAll('[data-task-id]')].find(n=>n.dataset.taskId===id);
      target?.classList.add('ai-highlight');setTimeout(()=>target?.classList.remove('ai-highlight'),2500);
    }
    history.push({role:'assistant',content:`应用实际执行成功：${labels.join('; ')}。新事项 id：${id||''}`});
  }
  async function send() {
    if(busy)return;
    const text=el('aiInput').value.trim();if(!text)return;
    busy=true;el('aiSend').disabled=true;el('aiInput').value='';message(text,'user');
    const pending=message('正在理解…');
    const snapshot=structuredClone(state);
    try {
      const plan=await window.luma.aiChat({text,history,context:context()});
      history.push({role:'user',content:text});
      pending.textContent=plan.reply || '已理解。';
      if(!plan.actions.length){history.push({role:'assistant',content:plan.reply});return;}
      unchanged(snapshot,plan.actions);
      LumaAiActions.apply(state,plan.actions,uid); // Validate all operations before showing or executing any.
      if(plan.actions.length>1) {
        pending.textContent=`待确认，共 ${plan.actions.length} 项\n${plan.actions.map(actionLabel).join('\n')}`;
        let settled=false;
        const confirm=button(pending,'确认执行',async()=>{if(settled)return;await execute(plan,snapshot);settled=true;cancel.disabled=true;});
        const cancel=button(pending,'取消',async()=>{settled=true;confirm.disabled=true;message('已取消，没有修改事项。');});
      }else await execute(plan,snapshot);
    }catch(e){pending.textContent=`未执行：${errorText(e)}`;el('aiInput').value ||= text;}
    finally{busy=false;el('aiSend').disabled=false;}
  }
  el('aiToggle').onclick=()=>toggle().catch(e=>message(errorText(e)));
  el('aiClose').onclick=()=>toggle(false).catch(e=>message(errorText(e)));
  el('aiSettingsOpen').onclick=showSettings;el('aiSettingsFromMain').onclick=showSettings;
  el('aiSettingsClose').onclick=()=>el('aiSettings').close();
  el('aiProvider').onchange=()=>{if(el('aiProvider').value==='deepseek'){el('aiBaseUrl').value='https://api.deepseek.com';el('aiModel').value='deepseek-v4-flash';}};
  el('aiSave').onclick=()=>settingsAction(async()=>{const c=await window.luma.aiSaveSettings(config());el('aiKey').value='';el('aiKey').placeholder=c.hasKey?'已安全保存；留空保持':'填写 API Key';},'设置已保存');
  el('aiClearKey').onclick=()=>settingsAction(async()=>{await window.luma.aiSaveSettings({...config(),clearKey:true,enabled:false});el('aiKey').value='';el('aiEnabled').checked=false;el('aiKey').placeholder='填写 API Key';},'密钥已清除，助手已停用');
  el('aiTest').onclick=()=>settingsAction(()=>window.luma.aiTest(config()),'连接成功，当前模型可响应；请保存设置');
  el('aiModels').onclick=()=>settingsAction(async()=>{const models=await window.luma.aiModels(config());el('aiModelList').replaceChildren(...models.map(id=>{const o=document.createElement('option');o.value=id;return o;}));},'已更新模型候选，可在模型输入框选择或手动填写');
  el('aiSend').onclick=send;
  el('aiInput').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send();}};
  el('aiVoice').onclick=async()=>{el('aiInput').focus();try{await window.luma.aiDictation();el('aiHint').textContent='请在系统听写浮层中说话并结束；检查文字后点击发送。若未出现，请先在系统设置 → 键盘中启用听写。';}catch(e){message(errorText(e));}};
  document.addEventListener('click',e=>{const n=e.target.closest('[data-task-id]');if(n)selectedId=n.dataset.taskId;});
  el('aiHistory').onclick=()=>{
    const entries=[...(state.aiJournal||[])].reverse().filter(e=>!e.undone);
    if(!entries.length){message('暂无可撤销操作。');return;}
    for(const entry of entries){const node=message(`${new Date(entry.at).toLocaleString('zh-CN')}\n${entry.changes.map(c=>(!c.after?'已删除：':!c.before?'已创建：':'已修改：')+((c.after||c.before).title || (c.after||c.before).name)).join('\n')}`);button(node,'撤销 / 恢复',()=>undo(entry.id));}
  };
  const matchSurface=()=>{const surface=getComputedStyle(document.querySelector('.todo-panel'));el('aiPanel').style.background=surface.background;el('aiPanel').style.borderColor=surface.borderColor;};
  new MutationObserver(matchSurface).observe(document.documentElement,{attributes:true,attributeFilter:['class','style','data-theme','data-palette']});
  matchSurface();
  message('告诉我想安排什么。\n我可以查询、新增和修改本地待办与日程，转移分类，或把事项移入可恢复的操作记录。批量修改会先请你确认。\n先在设置中填入 API Key 并启用助手。');
})();
