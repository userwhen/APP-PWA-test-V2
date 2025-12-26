/* js/modules/task300.js - V300.Final */
window.act = window.act || {};

Object.assign(window.act, {
    switchTaskTab: (tab) => {
        TempState.taskTab = tab;
        document.querySelectorAll('.h-tab').forEach(el => el.classList.remove('active'));
        document.getElementById('tab-' + tab).classList.add('active');
        
        const page = document.getElementById('page-task');
        const fab = document.getElementById('global-fab');
        const ctrlRow = document.getElementById('task-cats-row');
        
        const btnHist = document.getElementById('btn-history');
        const btnMile = document.getElementById('btn-milestone');
        
        if (tab === 'ach') {
            if(page) page.classList.add('theme-yellow'); 
            document.body.classList.add('mode-ach');
            if(fab) fab.style.background = 'var(--gold)';
            if(ctrlRow) ctrlRow.parentElement.style.display = 'none';
            if(btnHist) btnHist.style.display = 'none';
            if(btnMile) btnMile.style.display = 'flex';
        } else {
            if(page) page.classList.remove('theme-yellow'); 
            document.body.classList.remove('mode-ach');
            if(fab) fab.style.background = 'var(--acc)';
            if(ctrlRow) ctrlRow.parentElement.style.display = 'block';
            if(btnHist) btnHist.style.display = 'flex';
            if(btnMile) btnMile.style.display = 'none';
        }
        if (window.view && view.renderTasks) view.renderTasks();
    },

    initCreateModal: () => {
        const catContainer = document.getElementById('nt-cats');
        if(catContainer) {
            catContainer.innerHTML = '';
            // 自訂分類功能
            const cats = [...GlobalState.cats, '+ 自訂'];
            cats.forEach(cat => {
                const sp = document.createElement('span'); sp.className = 'tag-btn'; sp.innerText = cat;
                sp.onclick = () => { 
                    if(cat === '+ 自訂') {
                        act.prompt("輸入新分類名稱", "", (val)=>{ 
                            if(val && !GlobalState.cats.includes(val)) { 
                                GlobalState.cats.push(val); act.initCreateModal(); 
                            }
                        });
                    } else {
                        catContainer.querySelectorAll('.tag-btn').forEach(b=>b.classList.remove('active')); 
                        sp.classList.add('active'); 
                    }
                };
                catContainer.appendChild(sp);
            });
            if(catContainer.children.length > 0) catContainer.children[0].classList.add('active');
        }

        const attrContainer = document.getElementById('nt-attrs');
        if(attrContainer) {
            attrContainer.innerHTML = '';
            const handleAttrClick = (el) => {
                if (el.classList.contains('active')) el.classList.remove('active');
                else if (attrContainer.querySelectorAll('.tag-item.active').length < 3) {
                    el.classList.add('active');
                    // 檢查是否選了體能技能
                    act.checkCalInput();
                }
            };
            
            // 只顯示技能
            if(GlobalState.skills) {
                GlobalState.skills.forEach(s => {
                    const pAttr = GlobalState.attrs[s.parent];
                    const sp = document.createElement('span'); 
                    sp.className = 'tag-item'; 
                    sp.innerText = `${s.name} ${pAttr.icon}`;
                    sp.dataset.skillName = s.name;
                    sp.dataset.attrType = s.parent;
                    sp.onclick = () => handleAttrClick(sp); 
                    attrContainer.appendChild(sp); 
                });
            }
        }
        
        document.getElementById('nt-title').value = '';
        document.getElementById('nt-desc').value = '';
        document.getElementById('nt-cal-row').style.display = 'none';
        document.getElementById('nt-subs').innerHTML = '';
        document.getElementById('btn-del-task').style.display = 'none';
    },
    
    checkCalInput: () => {
        if(!GlobalState.settings.calMode) return;
        const attrContainer = document.getElementById('nt-attrs');
        const selected = attrContainer.querySelectorAll('.tag-item.active');
        let hasStr = false;
        selected.forEach(el => { if(el.dataset.attrType === 'str') hasStr = true; });
        document.getElementById('nt-cal-row').style.display = hasStr ? 'block' : 'none';
    },

    submitTask: () => {
        const title = document.getElementById('nt-title').value; if (!title) return act.alert("請輸入標題");
        let cat = '每日';
        const activeCat = document.querySelector('#nt-cats .tag-btn.active'); if(activeCat) cat = activeCat.innerText;
        
        const attrs = []; 
        document.querySelectorAll('#nt-attrs .tag-item.active').forEach(b => attrs.push(b.dataset.skillName)); // 存技能名
        
        const cal = parseInt(document.getElementById('nt-cal').value) || 0;
        
        const task = { 
            id: TempState.editTaskId || act.generateId('task'), 
            title: title, desc: document.getElementById('nt-desc').value, 
            cat: cat, pinned: document.getElementById('nt-pinned').checked, 
            type: document.getElementById('nt-type').value, 
            target: Number(document.getElementById('nt-target').value) || 1, 
            curr: 0, attrs: attrs, cal: cal,
            difficulty: parseInt(document.getElementById('nt-diff-range').value) || 2, 
            deadline: document.getElementById('nt-deadline').value, 
            subs: [], done: false, created: new Date().toISOString(), isUser: true
        };
        document.querySelectorAll('#nt-subs input').forEach(i => { if(i.value) task.subs.push({text:i.value, done:false}); });
        
        if (TempState.editTaskId) { 
            const idx = GlobalState.tasks.findIndex(t => t.id === TempState.editTaskId); 
            if (idx > -1) { task.curr = GlobalState.tasks[idx].curr; task.done = GlobalState.tasks[idx].done; GlobalState.tasks[idx] = task; } 
        } else { GlobalState.tasks.unshift(task); }
        act.closeModal('create'); act.save(); view.renderTasks();
    }
});