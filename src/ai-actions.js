(function(root) {
  const copy = x => JSON.parse(JSON.stringify(x));
  const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
  function local(t) { return !t.googleTaskId && !t.googleCalendarEventId && !t.googleCalendarExternal && !t.icloudExternal && !Object.keys(t).some(k => /^icloud/i.test(k) && t[k]) && !['external-calendar'].includes(t.syncTarget) && !['google-calendar','apple-calendar'].includes(t.projectId); }
  function project(state,id) { if (!state.projects.some(p => p.id === id && !['google-calendar','apple-calendar'].includes(id))) throw Error('分类不存在或属于系统日历'); }
  function date(s) { if (s === '') return; if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(Date.parse(s)) || new Date(s).toISOString().slice(0,10)!==s) throw Error('日期无效'); }
  function validate(t,state) {
    if (typeof t.title !== 'string' || !t.title.trim() || t.title.length > 500) throw Error('事项标题无效');
    project(state,t.projectId); date(t.dueDate);
    if (t.endDate !== undefined) date(t.endDate);
    for (const k of ['time','endTime']) if (t[k] !== undefined && (typeof t[k] !== 'string' || (t[k] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(t[k])))) throw Error('时间无效');
    if (t.time && !t.dueDate) throw Error('有时间的事项需要具体日期');
    if (t.itemType === 'event') {
      date(t.endDate);
      if (!t.dueDate || !t.endDate || t.endDate < t.dueDate || (t.time && (!t.endTime || `${t.endDate} ${t.endTime}` <= `${t.dueDate} ${t.time}`))) throw Error('日程结束时间必须晚于开始时间');
    }
    if (typeof t.completed !== 'boolean') throw Error('完成状态无效');
  }
  function apply(input, actions, uid, now=Date.now()) {
    if (!Array.isArray(actions) || !actions.length || actions.length>20) throw Error('操作数量无效');
    const state=copy(input), changes=[], ids=new Set();
    for (const action of actions) {
      if (action.type==='createProject') {
        const name=String(action.name||'').trim();
        if(!name || name.length>60 || state.projects.some(p=>p.name===name)) throw Error('分类名称为空或已存在');
        const after={id:uid(),name,color:'#7289f5',order:state.projects.length,updatedAt:now};
        state.projects.push(after); changes.push({collection:'projects',before:null,after}); continue;
      }
      if(!['create','update','delete'].includes(action.type)) throw Error('不支持的操作');
      let before=null,after;
      if(action.type!=='create') {
        before=state.tasks.find(t=>t.id===action.id);
        if(!before || ids.has(action.id)) throw Error('事项不存在或被重复操作');
        if(!local(before)) throw Error('此事项已关联外部日历，请使用原有同步界面修改');
        ids.add(action.id);
      }
      if(action.type==='delete') { state.tasks=state.tasks.filter(t=>t.id!==before.id); changes.push({collection:'tasks',before:copy(before),after:null}); continue; }
      const allowed=action.type==='create'?['title','projectId','dueDate','time','itemType','endDate','endTime']:['title','projectId','dueDate','time','endDate','endTime','completed'];
      if(!action.fields || Object.keys(action.fields).some(k=>!allowed.includes(k))) throw Error('操作包含不支持的字段');
      after=before?{...before,...action.fields,updatedAt:now}:{id:uid(),title:'',projectId:'inbox',dueDate:'',time:'',itemType:'todo',completed:false,googleCalendarExternal:false,icloudExternal:false,createdAt:now,updatedAt:now,order:now,...action.fields};
      if(!['todo','event'].includes(after.itemType)) throw Error('事项类型无效');
      after.syncTarget=after.itemType==='event'?'calendar':'tasks';
      if(after.itemType==='event') {after.endDate ||= after.dueDate; after.endTime ||= ''; after.eventColor ||= '#91a9c7';}
      if(after.completed) after.completedDate ||= new Date(now).toISOString().slice(0,10); else delete after.completedDate;
      validate(after,state);
      if(before) state.tasks[state.tasks.findIndex(t=>t.id===before.id)]=after; else state.tasks.push(after);
      changes.push({collection:'tasks',before:before?copy(before):null,after:copy(after)});
    }
    state.aiJournal ||= [];
    const entry={id:uid(),at:now,changes};state.aiJournal.push(entry);
    return {state,entry};
  }
  function undo(input,id) {
    const state=copy(input), entry=state.aiJournal?.find(x=>x.id===id);
    if(!entry || entry.undone) throw Error('这次操作已撤销或不存在');
    for(const change of [...entry.changes].reverse()) {
      const list=state[change.collection], item=change.after||change.before, current=list.find(x=>x.id===item.id);
      if(change.after ? !same(current,change.after) : Boolean(current)) throw Error('事项后来已被修改，请先检查后手动恢复');
      if(change.collection==='projects' && state.tasks.some(t=>t.projectId===item.id)) throw Error('分类已有事项，不能撤销创建');
      state[change.collection]=list.filter(x=>x.id!==item.id);
      if(change.before) state[change.collection].push(copy(change.before));
    }
    entry.undone=true;
    return state;
  }
  const api={apply,undo,local};
  if(typeof module!=='undefined') module.exports=api; else root.LumaAiActions=api;
})(globalThis);
