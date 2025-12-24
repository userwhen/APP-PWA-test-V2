/* js/core105.js - V300.41 Fixed & Features */

const act = {
    // --- 基礎介面功能 ---
    // ★ 修復：補上這些 helper，讓上架、新增技能等按鈕能運作 ★
    alert: (msg) => alert(msg), 
    confirm: (msg, cb) => { if(confirm(msg)) cb(true); },
    prompt: (msg, def, cb) => { const r = prompt(msg, def); if(r!==null) cb(r); },

    // 導航
    navigate: (p) => { 
        document.querySelectorAll('.page').forEach(e=>e.classList.remove('active')); 
        document.querySelectorAll('.nav-item').forEach(e=>e.classList.remove('active')); 
        const pg=document.getElementById('page-'+p); 
        if(pg) pg.classList.add('active'); 
        const btn=document.getElementById('nav-'+p); 
        if(btn) btn.classList.add('active'); 
        if(p==='main') view.renderHUD(); 
        
        // ★ 核心修改：FAB 只在「任務頁」顯示 ★
        const fab = document.getElementById('global-fab');
        if(fab) fab.style.display = (p === 'task') ? 'flex' : 'none';
    },
    
    openModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='flex'; m.classList.add('active'); } },
    closeModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='none'; m.classList.remove('active'); } },

    // --- FAB 按鈕行為 ---
    handleFab: () => {
        // 重置輸入框
        document.getElementById('nt-title').value = '';
        document.getElementById('nt-desc').value = '';
        
        // 重置拉桿 (預設 2=中等)
        const diffSlider = document.getElementById('nt-diff-range');
        if(diffSlider) { diffSlider.value = 2; act.updateDiffLabel(2); }
        
        // 重置屬性選擇
        document.getElementById('nt-attr-select').value = '';
        
        const subBox = document.getElementById('nt-subs');
        if(subBox) subBox.innerHTML = '';
        
        act.openModal('create');
    },

    // --- 難度拉桿連動顯示 ---
    updateDiffLabel: (val) => {
        const def = DIFFICULTY_DEFS[val];
        const lbl = document.getElementById('nt-diff-label');
        if(def && lbl) {
            lbl.innerText = `${def.label} (${def.code})`;
            lbl.style.color = def.color;
        }
    },

    // --- 任務提交 (適應新介面) ---
    submitTask: () => {
        const title = document.getElementById('nt-title').value.trim();
        if (!title) return act.alert('請輸入標題');
        
        // ★ 讀取拉桿與屬性 ★
        const diffVal = parseInt(document.getElementById('nt-diff-range').value) || 2; 
        const attrKey = document.getElementById('nt-attr-select').value; // 'str', 'int' etc.
        const catSelect = document.getElementById('nt-cat-select').value;
        const typeSelect = document.getElementById('nt-type').value;
        
        const newTask = {
            id: Date.now().toString(),
            title: title,
            desc: document.getElementById('nt-desc').value,
            type: typeSelect,
            target: 1, // 計次預設 1，若有輸入框可再讀取
            curr: 0,
            
            attr: attrKey, // 綁定屬性 ID
            difficulty: diffVal, // 儲存數字 1-4
            cat: catSelect,
            
            pinned: document.getElementById('nt-pinned').checked,
            subs: [], 
            deadline: document.getElementById('nt-deadline').value,
            done: false,
            created: new Date().toISOString()
        };

        // 讀取子任務
        const subInputs = document.querySelectorAll('#nt-subs input');
        subInputs.forEach(inp => {
            if(inp.value.trim()) newTask.subs.push({ text: inp.value.trim(), done: false });
        });

        GlobalState.tasks.unshift(newTask);
        act.save();
        act.closeModal('create');
        view.renderTasks();
    },

    // --- 任務完成 ---
    toggleTask: (id) => {
        const t = GlobalState.tasks.find(x => x.id === id);
        if (!t) return;
        
        if (!t.done) {
            t.done = true;
            const reward = act.calculateReward(t.difficulty);
            
            GlobalState.gold += reward.gold;
            GlobalState.exp += reward.exp;
            
            // 主角升級
            if (GlobalState.exp >= GlobalState.lv * 100) { 
                GlobalState.exp -= GlobalState.lv * 100; 
                GlobalState.lv++; 
                act.alert(`🆙 主角等級提升！ Lv.${GlobalState.lv}`); 
            }

            // ★ 屬性提升 (直接對應 6 大屬性) ★
            let attrMsg = "";
            if (t.attr && GlobalState.attrs[t.attr]) {
                const attr = GlobalState.attrs[t.attr];
                attr.exp += reward.exp;
                attrMsg = ` | ${attr.icon} ${attr.name} Exp+${reward.exp}`;
                
                if (attr.exp >= attr.v * 100) { 
                    attr.exp -= attr.v * 100; 
                    attr.v++; 
                    act.alert(`🎉 [${attr.name}] 提升到 Lv.${attr.v}！`); 
                }
            }
            
            const critMsg = reward.isCrit ? " 🔥 大成功！" : "";
            act.addLog(`完成: ${t.title}`, `💰+${reward.gold}${attrMsg}${critMsg}`);
            
            if(reward.isCrit) act.alert(`🎲 運氣爆棚！${t.title} 大成功！`);

        } else {
            t.done = false;
        }
        
        act.save();
        view.renderTasks();
        view.renderHUD();
    },
    
    calculateReward: (diffVal) => {
        const def = DIFFICULTY_DEFS[diffVal] || DIFFICULTY_DEFS[2];
        let gold = Math.floor(def.baseGold * ((Math.random() * 0.4) + 0.8));
        let exp = def.baseExp;
        
        // 幸運加成
        const luc = (GlobalState.attrs && GlobalState.attrs.luc) ? GlobalState.attrs.luc.v : 1;
        const critChance = 0.05 + (luc * 0.01); 
        const isCrit = Math.random() < critChance;
        
        if (isCrit) { gold *= 2; exp = Math.floor(exp * 1.5); }
        return { gold, exp, isCrit };
    },

    addSubtask: () => {
        const div = document.getElementById('nt-subs');
        if(!div) return;
        if(div.children.length >= 10) return;
        const row = document.createElement('div');
        row.className = 'row row-center mt-sm';
        row.innerHTML = `<input class="inp flex-1 mb-0 sub-task-input" placeholder="步驟..."><button class="btn-del btn-icon-flat" onclick="this.parentElement.remove()">✕</button>`;
        div.appendChild(row);
    },
    
    toggleSubtask: (tid, sIdx) => {
        const t = GlobalState.tasks.find(x => x.id === tid);
        if(t && t.subs[sIdx]) { t.subs[sIdx].done = !t.subs[sIdx].done; act.save(); view.renderTasks(); }
    },

    // 設定與存檔
    saveSettings: () => {
        const mode = document.getElementById('set-mode').value;
        GlobalState.settings.mode = mode;
        GlobalState.settings.calMode = document.getElementById('set-cal-mode').checked;
        GlobalState.settings.strictMode = document.getElementById('set-strict-mode').checked;
        
        if(window.act.changeMode) window.act.changeMode(mode);
        act.save();
        act.closeModal('settings');
        act.alert("設定已儲存");
        location.reload(); 
    },
    
    // 商店上架分類切換
    uploadCategoryChange: () => { 
        const c = document.getElementById('up-cat').value; 
        const dyn = document.getElementById('up-dyn-fields');
        if(!dyn) return;
        dyn.innerHTML = '';
        if (c === '熱量') { dyn.innerHTML = `<div class="row"><input id="up-cal" type="tel" class="inp flex-1" placeholder="卡路里" oninput="act.validateNumber(this, 9999)"></div>`; } 
        else if (c === '時間') { dyn.innerHTML = `<div class="row"><input id="up-time-h" type="tel" class="inp flex-1" placeholder="時"><input id="up-time-m" type="tel" class="inp flex-1" placeholder="分"></div>`; } 
    },
    
    validateNumber: (el, max) => {
        let v = parseInt(el.value);
        if(isNaN(v)) v = '';
        else if(max && v > max) v = max;
        el.value = v;
    },

    save: () => { if(!window.isResetting) localStorage.setItem('SQ_V103', JSON.stringify(GlobalState)); },
    navToHistory: () => act.navigate('history'),
    editTask: (id) => act.alert("請長按或刪除重開"),
    deleteTask: () => { },
    showQA: () => act.alert("Q&A 功能開發中"),
    
    // Stats 
    openStats: () => { 
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