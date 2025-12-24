/* js/core105.js - V300.40 Logic Fixed (Settings & FAB) */

const act = {
    navigate: (p) => { 
        document.querySelectorAll('.page').forEach(e=>e.classList.remove('active')); 
        document.querySelectorAll('.nav-item').forEach(e=>e.classList.remove('active')); 
        const pg=document.getElementById('page-'+p); 
        if(pg) pg.classList.add('active'); 
        const btn=document.getElementById('nav-'+p); 
        if(btn) btn.classList.add('active'); 
        if(p==='main') view.renderHUD(); 
        
        // ★ 控制 FAB 顯示：只在任務頁和大廳顯示 ★
        const fab = document.getElementById('global-fab');
        if(fab) fab.style.display = (p === 'task' || p === 'main') ? 'flex' : 'none';
    },
    
    openModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='flex'; m.classList.add('active'); } },
    closeModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='none'; m.classList.remove('active'); } },

    handleFab: () => {
        document.getElementById('nt-title').value = '';
        document.getElementById('nt-desc').value = '';
        const subBox = document.getElementById('nt-subs');
        if(subBox) subBox.innerHTML = '';
        act.openModal('create');
    },

    submitTask: () => {
        const title = document.getElementById('nt-title').value.trim();
        if (!title) return alert('請輸入標題');
        
        const diff = document.getElementById('nt-difficulty').value; 
        const tagSelect = document.getElementById('nt-tag-select').value; 
        const catSelect = document.getElementById('nt-cat-select').value;
        
        const newTask = {
            id: Date.now().toString(), title: title, desc: document.getElementById('nt-desc').value,
            type: 'normal', target: 1, curr: 0,
            skill: tagSelect, difficulty: diff, cat: catSelect || '雜事',
            pinned: document.getElementById('nt-pinned').checked,
            subs: [], deadline: document.getElementById('nt-deadline').value,
            done: false, created: new Date().toISOString()
        };

        const subInputs = document.querySelectorAll('#nt-subs input');
        subInputs.forEach(inp => { if(inp.value.trim()) newTask.subs.push({ text: inp.value.trim(), done: false }); });

        GlobalState.tasks.unshift(newTask);
        act.save(); act.closeModal('create'); view.renderTasks();
        
        if (newTask.skill && !GlobalState.skills.find(s=>s.name===newTask.skill)) {
            GlobalState.skills.push({ name: newTask.skill, parent: 'dex', lv: 1, exp: 0, lastUsed: new Date().toISOString() });
        }
    },

    toggleTask: (id) => {
        const t = GlobalState.tasks.find(x => x.id === id);
        if (!t) return;
        
        if (!t.done) {
            t.done = true;
            const reward = act.calculateReward(t.difficulty);
            GlobalState.gold += reward.gold; GlobalState.exp += reward.exp;
            
            if (GlobalState.exp >= GlobalState.lv * 100) { GlobalState.exp -= GlobalState.lv * 100; GlobalState.lv++; alert(`🆙 主角等級提升！ Lv.${GlobalState.lv}`); }

            if (t.skill) {
                let skill = GlobalState.skills.find(s => s.name === t.skill);
                if (!skill) { skill = { name: t.skill, parent: 'dex', lv: 1, exp: 0 }; GlobalState.skills.push(skill); }
                skill.lastUsed = new Date().toISOString();
                const parentAttr = GlobalState.attrs[skill.parent] || GlobalState.attrs['vit'];
                parentAttr.exp += reward.exp;
                if (parentAttr.exp >= parentAttr.v * 100) { parentAttr.exp -= parentAttr.v * 100; parentAttr.v++; alert(`🎉 ${parentAttr.name} 提升到 Lv.${parentAttr.v}！`); }
            }
            act.addLog(`完成: ${t.title}`, `💰+${reward.gold}`);
            if(reward.isCrit) alert(`🎲 運氣爆棚！${t.title} 大成功！`);
        } else {
            t.done = false;
        }
        act.save(); view.renderTasks(); view.renderHUD();
    },
    
    calculateReward: (diffCode) => {
        const defs = (typeof DIFFICULTY_DEFS !== 'undefined') ? DIFFICULTY_DEFS : { 'S': { baseGold:10, baseExp:10 } };
        const def = defs[diffCode] || defs['S'];
        let gold = Math.floor(def.baseGold * ((Math.random() * 0.4) + 0.8));
        let exp = def.baseExp;
        const isCrit = Math.random() < (0.05 + (GlobalState.attrs?.luc?.v || 1) * 0.01);
        if (isCrit) { gold *= 2; exp = Math.floor(exp * 1.5); }
        return { gold, exp, isCrit };
    },

    addSubtask: () => {
        const div = document.getElementById('nt-subs');
        const count = div.children.length;
        if(count >= 10) return;
        const row = document.createElement('div');
        row.className = 'row row-center mt-sm';
        row.innerHTML = `<input class="inp flex-1 mb-0 sub-task-input" placeholder="子步驟 ${count+1}"><button class="btn-del btn-icon-flat" onclick="this.parentElement.remove()">✕</button>`;
        div.appendChild(row);
    },
    
    toggleSubtask: (tid, sIdx) => {
        const t = GlobalState.tasks.find(x => x.id === tid);
        if(t && t.subs[sIdx]) { t.subs[sIdx].done = !t.subs[sIdx].done; act.save(); view.renderTasks(); }
    },

    // ★ 補齊設定功能 ★
    saveSettings: () => {
        const mode = document.getElementById('set-mode').value;
        const cal = document.getElementById('set-cal-mode').checked;
        const strict = document.getElementById('set-strict-mode').checked;
        GlobalState.settings = { mode, calMode: cal, strictMode: strict };
        if(window.act.changeMode) window.act.changeMode(mode);
        act.save();
        act.closeModal('settings');
        alert("設定已儲存");
        location.reload(); // 簡單重整以套用變更
    },
    exportData: () => {
        const data = JSON.stringify(GlobalState);
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'selfquest_backup.json';
        a.click();
    },
    importData: () => {
        const input = document.createElement('input'); input.type = 'file';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    GlobalState = JSON.parse(event.target.result);
                    act.save();
                    alert("匯入成功！");
                    location.reload();
                } catch(err) { alert("檔案格式錯誤"); }
            };
            reader.readAsText(file);
        };
        input.click();
    },
    debugDay: () => {
        // 模擬跨日邏輯
        GlobalState.cal.today = 0;
        alert("已模擬跨日：卡路里歸零");
        view.renderHUD();
    },

    save: () => { if(!window.isResetting) localStorage.setItem('SQ_V103', JSON.stringify(GlobalState)); },
    navToHistory: () => act.navigate('history'),
    editTask: (id) => alert("編輯功能暫未開放"),
    deleteTask: () => { },
    showQA: () => alert("Q&A 功能開發中"),
    
    // Stats 相關 (橋接)
    openStats: () => { 
        if(window.act && window.act.openStatsModule) window.act.openStatsModule(); // 如果有用模組
        // 簡單版直接實作
        const el = document.getElementById('stats-overlay'); 
        if(el) { el.style.display = 'flex'; if(window.view && view.renderStats) view.renderStats(); }
    },
    closeStats: () => { document.getElementById('stats-overlay').style.display = 'none'; },
    switchTab: (t) => { 
        document.querySelectorAll('.tab').forEach(e => e.classList.remove('active')); document.getElementById('tb-'+t).classList.add('active'); 
        document.querySelectorAll('.stat-sec').forEach(e => e.classList.remove('active')); document.getElementById('sec-'+t).classList.add('active'); 
    }
};

window.act = act;