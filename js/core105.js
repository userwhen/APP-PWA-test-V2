/* js/core105.js - V300.50 Logic Refined */

const act = {
    // Helper
    alert: (msg) => alert(msg), 
    confirm: (msg, cb) => { if(confirm(msg)) cb(true); },
    prompt: (msg, def, cb) => { const r = prompt(msg, def); if(r!==null) cb(r); },

    // 導航
    navigate: (p) => { 
        document.querySelectorAll('.page').forEach(e=>e.classList.remove('active')); 
        document.querySelectorAll('.nav-item').forEach(e=>e.classList.remove('active')); 
        
        const pg = document.getElementById('page-'+p); 
        if(pg) pg.classList.add('active'); 
        
        // 導航列高亮處理 (Stats頁面視同Main按鈕)
        const btnId = (p==='stats' && GlobalState.settings.mode==='basic') ? 'nav-main' : 'nav-'+p;
        const btn = document.getElementById(btnId); 
        if(btn) btn.classList.add('active'); 
        
        if(p==='main' || p==='stats') view.renderHUD(); 
        
        // ★ FAB 控制：只在任務頁、成就頁顯示 ★
        const fab = document.getElementById('global-fab');
        if(fab) {
            const isTaskPage = (p === 'task');
            fab.style.display = isTaskPage ? 'flex' : 'none';
        }
    },
    
    openModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='flex'; m.classList.add('active'); } },
    closeModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='none'; m.classList.remove('active'); } },

    // ★ FAB 智慧判斷 ★
    handleFab: () => {
        // 如果在成就分頁
        if (TempState.taskTab === 'ach') {
            if(window.act.openCreateAch) window.act.openCreateAch(); // 呼叫 ach105.js
            else act.openModal('create-ach');
            return;
        }
        
        // 一般任務建立
        document.getElementById('nt-title').value = '';
        document.getElementById('nt-desc').value = '';
        const diffSlider = document.getElementById('nt-diff-range');
        if(diffSlider) { diffSlider.value = 2; act.updateDiffLabel(2); }
        document.getElementById('nt-skill-select').value = '';
        document.getElementById('nt-target').value = '';
        document.getElementById('nt-subs').innerHTML = '';
        
        // 更新技能下拉選單
        act.refreshSkillSelect();
        
        act.openModal('create');
    },

    // 刷新任務視窗的技能選單
    refreshSkillSelect: () => {
        const sel = document.getElementById('nt-skill-select');
        if(!sel) return;
        sel.innerHTML = '<option value="" disabled selected>選擇任務標籤(技能)...</option>';
        GlobalState.skills.forEach(s => {
            // 顯示: 跑酷 (體能)
            const attrName = GlobalState.attrs[s.parent] ? GlobalState.attrs[s.parent].name : '未知';
            sel.innerHTML += `<option value="${s.name}">${s.name} (${attrName})</option>`;
        });
    },

    updateDiffLabel: (val) => {
        const def = DIFFICULTY_DEFS[val];
        const lbl = document.getElementById('nt-diff-label');
        if(def && lbl) {
            lbl.innerText = `${def.label}`; // 去除代碼，只留中文
            lbl.style.color = def.color;
        }
    },
    
    toggleTaskType: (val) => {
        const tgt = document.getElementById('nt-target');
        if(tgt) tgt.style.display = (val === 'count') ? 'block' : 'none';
    },

    // 任務提交
    submitTask: () => {
        const title = document.getElementById('nt-title').value.trim();
        if (!title) return act.alert('請輸入標題');
        
        const diffVal = parseInt(document.getElementById('nt-diff-range').value) || 2; 
        const skillName = document.getElementById('nt-skill-select').value; 
        const catSelect = document.getElementById('nt-cat-select').value;
        const typeSelect = document.getElementById('nt-type').value;
        const targetVal = typeSelect === 'count' ? (parseInt(document.getElementById('nt-target').value) || 1) : 1;
        
        const newTask = {
            id: Date.now().toString(),
            title: title,
            desc: document.getElementById('nt-desc').value,
            type: typeSelect,
            target: targetVal,
            curr: 0,
            
            skill: skillName, 
            difficulty: diffVal,
            cat: catSelect,
            
            pinned: document.getElementById('nt-pinned').checked,
            subs: [], 
            deadline: document.getElementById('nt-deadline').value,
            done: false,
            created: new Date().toISOString()
        };

        const subInputs = document.querySelectorAll('#nt-subs input');
        subInputs.forEach(inp => {
            if(inp.value.trim()) newTask.subs.push({ text: inp.value.trim(), done: false });
        });

        GlobalState.tasks.unshift(newTask);
        act.save();
        act.closeModal('create');
        view.renderTasks();
    },

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

            // 技能與屬性提升
            let attrMsg = "";
            if (t.skill) {
                let skill = GlobalState.skills.find(s => s.name === t.skill);
                if (skill) {
                    skill.lastUsed = new Date().toISOString();
                    const parentAttr = GlobalState.attrs[skill.parent];
                    if(parentAttr) {
                        parentAttr.exp += reward.exp;
                        attrMsg = ` | ${parentAttr.icon} ${skill.name} Exp+${reward.exp}`;
                        if (parentAttr.exp >= parentAttr.v * 100) { 
                            parentAttr.exp -= parentAttr.v * 100; 
                            parentAttr.v++; 
                            act.alert(`🎉 [${parentAttr.name}] 提升到 Lv.${parentAttr.v}！`); 
                        }
                    }
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
        const luc = (GlobalState.attrs && GlobalState.attrs.luc) ? GlobalState.attrs.luc.v : 1;
        const isCrit = Math.random() < (0.05 + (luc * 0.01));
        if (isCrit) { gold *= 2; exp = Math.floor(exp * 1.5); }
        return { gold, exp, isCrit };
    },

    // ★ 新增子任務 (含刪除按鈕) ★
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

    // ★ 設定修復 ★
    saveSettings: () => {
        const mode = document.getElementById('set-mode').value;
        GlobalState.settings.mode = mode;
        GlobalState.settings.calMode = document.getElementById('set-cal-mode').checked;
        GlobalState.settings.strictMode = document.getElementById('set-strict-mode').checked;
        
        act.save();
        act.closeModal('settings');
        act.alert("設定已儲存 (部分變更需重整)");
        
        if(window.act.changeMode) window.act.changeMode(mode);
        view.renderHUD(); // 更新介面狀態
    },
    
    uploadCategoryChange: () => { 
        // 呼叫 shop105.js 的功能，若有載入
        if(window.act.shopUploadChange) window.act.shopUploadChange();
        else if(window.act.shopLibUploadChange) window.act.shopLibUploadChange();
        // Fallback in core
        const c = document.getElementById('up-cat').value; 
        const dyn = document.getElementById('up-dyn-fields');
        if(!dyn) return;
        dyn.innerHTML = '';
        if (c === '熱量') { dyn.innerHTML = `<div class="row"><input id="up-cal" type="tel" class="inp flex-1" placeholder="卡路里 (4位數)" maxlength="4" oninput="act.validateNumber(this, 9999)"></div>`; } 
        else if (c === '時間') { dyn.innerHTML = `<div class="row"><input id="up-time-h" type="tel" class="inp flex-1" placeholder="時 (0-23)" maxlength="2" oninput="act.validateNumber(this, 23)"><input id="up-time-m" type="tel" class="inp flex-1" placeholder="分 (0-59)" maxlength="2" oninput="act.validateNumber(this, 59)"></div>`; } 
        else if (c === '金錢') { dyn.innerHTML = `<div class="row"><input id="up-money" type="tel" class="inp flex-1" placeholder="獲得金額" oninput="act.validateNumber(this, 99999)"></div>`; }
    },
    
    validateNumber: (el, max) => {
        let v = parseInt(el.value);
        if(isNaN(v)) v = ''; else if(max && v > max) v = max;
        el.value = v;
    },

    save: () => { if(!window.isResetting) localStorage.setItem('SQ_V103', JSON.stringify(GlobalState)); },
    navToHistory: () => act.navigate('history'),
    editTask: (id) => act.alert("請長按或刪除重開"),
    deleteTask: () => { },
    showQA: () => act.alert("Q&A 功能開發中"),
    
    // Stats 
    openStats: () => { act.navigate('stats'); },
    closeStats: () => { act.navigate('main'); }, // 離開屬性頁回到大廳
    switchTab: (t) => { 
        document.querySelectorAll('.tab').forEach(e => e.classList.remove('active')); document.getElementById('tb-'+t).classList.add('active'); 
        document.querySelectorAll('.stat-sec').forEach(e => e.classList.remove('active')); document.getElementById('sec-'+t).classList.add('active'); 
    }
};

window.act = act;