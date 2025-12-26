/* js/modules/task300.js - V300.107 Fixed */
window.act = window.act || {};

Object.assign(window.act, {
    switchTaskTab: (tab) => {
        TempState.taskTab = tab;
        document.querySelectorAll('.h-tab').forEach(el => el.classList.remove('active'));
        document.getElementById('tab-' + tab).classList.add('active');
        
        const page = document.getElementById('page-task');
        const fab = document.getElementById('global-fab');
        const ctrlRow = document.getElementById('task-cats-row');
        
        if (tab === 'ach') {
            if(page) page.classList.add('theme-yellow'); 
            document.body.classList.add('mode-ach');
            if(fab) fab.style.background = 'var(--gold)';
            if(ctrlRow) ctrlRow.parentElement.style.display = 'none';
        } else {
            if(page) page.classList.remove('theme-yellow'); 
            document.body.classList.remove('mode-ach');
            if(fab) fab.style.background = 'var(--acc)';
            if(ctrlRow) ctrlRow.parentElement.style.display = 'block';
        }
        if (window.view && view.renderTasks) view.renderTasks();
    },

    // ★ Fix #4: 初始化新增視窗 (確保屬性標籤可點擊) ★
    initCreateModal: () => {
        // 載入分類
        const catContainer = document.getElementById('nt-cats');
        if(catContainer) {
            catContainer.innerHTML = '';
            GlobalState.cats.forEach(cat => {
                const sp = document.createElement('span'); 
                sp.className = 'tag-btn'; 
                sp.innerText = cat;
                sp.onclick = () => { 
                    catContainer.querySelectorAll('.tag-btn').forEach(b=>b.classList.remove('active')); 
                    sp.classList.add('active'); 
                };
                catContainer.appendChild(sp);
            });
            if(GlobalState.cats.length > 0) catContainer.children[0].classList.add('active');
        }

        // 載入屬性 (這是修復重點)
        const attrContainer = document.getElementById('nt-attrs');
        if(attrContainer) {
            attrContainer.innerHTML = '';
            // 建立閉包處理點擊
            const handleAttrClick = (el) => {
                if (el.classList.contains('active')) {
                    el.classList.remove('active');
                } else if (attrContainer.querySelectorAll('.tag-item.active').length < 3) {
                    el.classList.add('active');
                }
            };
            
            Object.values(GlobalState.attrs).forEach(a => { 
                const sp = document.createElement('span'); 
                sp.className = 'tag-item'; 
                sp.innerText = a.name; 
                sp.onclick = () => handleAttrClick(sp); 
                attrContainer.appendChild(sp); 
            });
            // 載入自訂技能
            if(GlobalState.skills) {
                GlobalState.skills.forEach(s => {
                    const sp = document.createElement('span'); 
                    sp.className = 'tag-item'; 
                    sp.innerText = s.name; 
                    sp.onclick = () => handleAttrClick(sp); 
                    attrContainer.appendChild(sp); 
                });
            }
        }
        
        document.getElementById('nt-title').value = '';
        document.getElementById('nt-desc').value = '';
        document.getElementById('nt-type').value = 'normal';
        document.getElementById('nt-target').style.display = 'none';
        document.getElementById('nt-subs').innerHTML = '';
        document.getElementById('btn-del-task').style.display = 'none';
    },

    // ★ Fix #7: 提交任務 (只讀取必要的欄位) ★
    submitTask: () => {
        const title = document.getElementById('nt-title').value; 
        if (!title) return act.alert("請輸入標題");
        
        // 讀取分類
        let cat = '每日';
        const activeCat = document.querySelector('#nt-cats .tag-btn.active');
        if(activeCat) cat = activeCat.innerText;

        // 讀取屬性
        const attrs = []; 
        document.querySelectorAll('#nt-attrs .tag-item.active').forEach(b => attrs.push(b.innerText));
        
        const type = document.getElementById('nt-type').value;
        const target = Number(document.getElementById('nt-target').value) || 1;
        const diff = parseInt(document.getElementById('nt-diff-range').value) || 2;

        const task = { 
            id: TempState.editTaskId || act.generateId('task'), 
            title: title, 
            desc: document.getElementById('nt-desc').value, 
            cat: cat, 
            pinned: document.getElementById('nt-pinned').checked, 
            type: type, 
            target: target, 
            curr: 0, 
            attrs: attrs, 
            difficulty: diff, 
            deadline: document.getElementById('nt-deadline').value, 
            subs: [], 
            done: false,
            created: new Date().toISOString(),
            isUser: true
        };
        
        document.querySelectorAll('#nt-subs input').forEach(i => { 
            if(i.value) task.subs.push({text:i.value, done:false}); 
        });
        
        if (TempState.editTaskId) { 
            const idx = GlobalState.tasks.findIndex(t => t.id === TempState.editTaskId); 
            if (idx > -1) { 
                task.curr = GlobalState.tasks[idx].curr; 
                task.done = GlobalState.tasks[idx].done; 
                GlobalState.tasks[idx] = task; 
            } 
        } else { 
            GlobalState.tasks.unshift(task); 
        }
        
        act.closeModal('create'); 
        act.save();
        view.renderTasks();
    }
});