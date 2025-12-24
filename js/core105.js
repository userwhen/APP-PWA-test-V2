/* js/core105.js - V300.80 Final Core Logic */

const act = {
    // --- 通用工具 (修復按鈕失效的主因) ---
    alert: (msg) => alert(msg), 
    confirm: (msg, cb) => { if(confirm(msg)) cb(true); },
    prompt: (msg, def, cb) => { const r = prompt(msg, def); if(r!==null) cb(r); },
    
    // 產生唯一 ID
    generateId: (prefix='id') => prefix + '_' + Date.now() + Math.random().toString(36).substr(2, 9),
    
    // 清空輸入框
    clearInputs: (parentId) => {
        const parent = document.getElementById(parentId);
        if(!parent) return;
        parent.querySelectorAll('input, textarea').forEach(el => {
            if(el.type === 'checkbox' || el.type === 'radio') el.checked = false;
            else el.value = '';
        });
        // 重置部分預設值
        const diffSlider = parent.querySelector('.slider');
        if(diffSlider) { diffSlider.value = 2; act.updateDiffLabel(2); }
    },

    // --- 導航系統 (修復返回鍵) ---
    navigate: (p) => { 
        // 1. 強制隱藏所有頁面 (包含 Overlay 類型的頁面)
        const allPages = document.querySelectorAll('.page, #page-story, #page-avatar');
        allPages.forEach(e => e.classList.remove('active')); 
        
        // 2. 處理導航按鈕樣式
        document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active')); 
        
        // 3. 基礎模式特殊導航 (大廳 -> 屬性)
        let targetPage = p;
        if (GlobalState.settings.mode === 'basic' && p === 'main') {
            targetPage = 'stats';
        }
        
        // 4. 顯示目標頁面
        const pg = document.getElementById('page-' + targetPage); 
        if(pg) pg.classList.add('active'); 
        
        // 5. 更新底部按鈕高亮
        const btnId = (targetPage === 'stats' && GlobalState.settings.mode === 'basic') ? 'nav-main' : 'nav-' + p;
        const btn = document.getElementById(btnId); 
        if(btn) btn.classList.add('active'); 
        
        // 6. 更新 HUD 與 FAB
        if(targetPage === 'main' || targetPage === 'stats') view.renderHUD(); 
        
        const fab = document.getElementById('global-fab');
        if(fab) {
            // FAB 只在任務頁面顯示 (成就頁面也算任務頁的一種狀態)
            fab.style.display = (targetPage === 'task') ? 'flex' : 'none';
        }
    },
    
    openModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='flex'; m.classList.add('active'); } },
    closeModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='none'; m.classList.remove('active'); } },

    // --- 每日結算系統 ---
    checkDaily: () => {
        const today = new Date().toISOString().split('T')[0];
        
        if (GlobalState.lastLoginDate !== today) {
            // 1. 連續登入計算
            if (GlobalState.lastLoginDate) {
                const last = new Date(GlobalState.lastLoginDate);
                const curr = new Date(today);
                const diffDays = Math.ceil(Math.abs(curr - last) / (1000 * 60 * 60 * 24)); 
                
                if (diffDays === 1) GlobalState.loginStreak = (GlobalState.loginStreak || 0) + 1;
                else GlobalState.loginStreak = 1; // 中斷重置
            } else {
                GlobalState.loginStreak = 1;
            }
            GlobalState.lastLoginDate = today;
            
            // 2. 每日獎勵 (可做成成就領取)
            let msg = `📅 新的一天！連續登入: ${GlobalState.loginStreak} 天`;
            
            // 3. 技能生疏判定 (Rust System)
            let rustedCount = 0;
            GlobalState.skills.forEach(s => {
                if(s.lastUsed) {
                    const lastUse = new Date(s.lastUsed);
                    const diff = Math.ceil(Math.abs(new Date() - lastUse) / (1000 * 60 * 60 * 24));
                    if(diff > 3) { // 超過3天沒練
                        s.isRusted = true;
                        rustedCount++;
                    }
                }
            });
            if(rustedCount > 0) msg += `\n⚠️ 有 ${rustedCount} 個技能生疏了，快去練習吧！`;

            // 4. 重置任務與庫存
            GlobalState.tasks.forEach(t => { if(t.cat === '每日') { t.done = false; t.curr = 0; } });
            GlobalState.shop.npc.forEach(i => { if(i.perm === 'daily') i.qty = 99; });
            GlobalState.cal.today = 0; 
            GlobalState.cal.logs = [];
            
            // 5. 更新簽到成就
            act.updateLoginAchievement();
            
            act.alert(msg);
            act.save();
        }
    },
    
    updateLoginAchievement: () => {
        const achId = 'sys_login_streak';
        let ach = GlobalState.achievements.find(a => a.id === achId);
        if (!ach) {
            ach = { id: achId, title: '🔥 每日簽到', desc: '', type: 'manual', targetVal: 7, reward: { freeGem: 5 }, done: false, isSystem: true };
            GlobalState.achievements.unshift(ach);
        }
        ach.desc = `目前連續: ${GlobalState.loginStreak} 天 (目標: 7天)`;
        if(GlobalState.loginStreak >= 7 && !ach.done) {
            ach.title = "🔥 每日簽到 (可領取)";
        }
    },

    // --- 儲值系統接口 ---
    openPayment: () => {
        act.openModal('payment');
    },
    
    submitPayment: (amount) => {
        // 模擬儲值 API
        act.alert(`系統連線中...\n成功儲值 ${amount} 元！\n獲得 ${amount} 付費鑽石。`);
        GlobalState.paidGem = (GlobalState.paidGem || 0) + amount;
        
        // 首儲獎勵邏輯可寫這
        GlobalState.gold += amount * 100; // 贈送金幣
        
        act.closeModal('payment');
        act.save();
        view.renderHUD();
    },

    // --- FAB 邏輯 ---
    handleFab: () => {
        // 如果在成就分頁 -> 開啟新增成就
        if (TempState.taskTab === 'ach') {
            if(window.act.openCreateAch) window.act.openCreateAch(); 
            return;
        }
        
        // 否則 -> 開啟新增任務
        act.clearInputs('m-create');
        // 預設分類
        const catSel = document.getElementById('nt-cat-select');
        if(catSel) catSel.value = '待辦';
        
        document.getElementById('nt-subs').innerHTML = '';
        act.refreshSkillSelect();
        act.openModal('create');
    },

    // --- 任務相關輔助 ---
    refreshSkillSelect: () => {
        const sel = document.getElementById('nt-skill-select');
        if(!sel) return;
        sel.innerHTML = '<option value="" disabled selected>選擇技能標籤...</option>';
        GlobalState.skills.forEach(s => {
            const attrName = GlobalState.attrs[s.parent] ? GlobalState.attrs[s.parent].name : '未知';
            sel.innerHTML += `<option value="${s.name}">${s.name} (${attrName})</option>`;
        });
    },

    updateDiffLabel: (val) => {
        const def = DIFFICULTY_DEFS[val];
        const lbl = document.getElementById('nt-diff-label');
        if(def && lbl) {
            lbl.innerText = `${def.label}`;
            lbl.style.color = def.color;
        }
    },
    
    toggleTaskType: (val) => {
        const tgt = document.getElementById('nt-target');
        if(tgt) tgt.style.display = (val === 'count') ? 'block' : 'none';
    },

    // 存檔與其他
    save: () => { if(!window.isResetting) localStorage.setItem('SQ_V103', JSON.stringify(GlobalState)); },
    navToHistory: () => act.navigate('history'),
    showQA: () => act.alert("Q&A 功能開發中"),
    
    // 橋接 Stats 模組功能
    openStats: () => act.navigate('stats'),
    closeStats: () => act.navigate('main'), 
    switchTab: (t) => { 
        document.querySelectorAll('.tab').forEach(e => e.classList.remove('active')); document.getElementById('tb-'+t).classList.add('active'); 
        document.querySelectorAll('.stat-sec').forEach(e => e.classList.remove('active')); document.getElementById('sec-'+t).classList.add('active'); 
    },
    
    // 橋接 Shop 功能 (防止 core 找不到 function)
    uploadCategoryChange: () => { if(window.act.shopUploadChange) window.act.shopUploadChange(); },
    
    validateNumber: (el, max) => {
        let v = parseInt(el.value);
        if(isNaN(v)) v = ''; else if(max && v > max) v = max;
        el.value = v;
    }
};

// 提交任務邏輯 (放在 act 內)
act.submitTask = () => {
    const title = document.getElementById('nt-title').value.trim();
    if (!title) return act.alert('請輸入標題');
    
    const diffVal = parseInt(document.getElementById('nt-diff-range').value) || 2; 
    const skillName = document.getElementById('nt-skill-select').value; 
    const catSelect = document.getElementById('nt-cat-select').value;
    const typeSelect = document.getElementById('nt-type').value;
    
    let targetVal = 1;
    if(typeSelect === 'count') {
        targetVal = parseInt(document.getElementById('nt-target').value) || 1;
        if(targetVal > 99) targetVal = 99;
    }
    
    const newTask = {
        id: act.generateId('task'),
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
        created: new Date().toISOString(),
        isUser: true // 標記為玩家自製
    };

    const subInputs = document.querySelectorAll('#nt-subs input');
    subInputs.forEach(inp => {
        if(inp.value.trim()) newTask.subs.push({ text: inp.value.trim(), done: false });
    });

    GlobalState.tasks.unshift(newTask);
    act.save();
    act.closeModal('create');
    view.renderTasks();
};

// 完成任務邏輯
act.toggleTask = (id) => {
    const t = GlobalState.tasks.find(x => x.id === id);
    if (!t) return;
    
    if (!t.done) {
        if (t.type === 'count' && t.curr < t.target - 1) {
            t.curr++; act.save(); view.renderTasks(); return;
        } else if (t.type === 'count') {
            t.curr = t.target;
        }

        t.done = true;
        const reward = act.calculateReward(t.difficulty);
        GlobalState.gold += reward.gold;
        GlobalState.exp += reward.exp;
        
        // 處理技能與屬性
        let attrMsg = "";
        if (t.skill) {
            let skill = GlobalState.skills.find(s => s.name === t.skill);
            if (skill) {
                skill.lastUsed = new Date().toISOString();
                skill.isRusted = false; // 解除生疏
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
        if(t.type === 'count') t.curr = 0;
    }
    
    act.save();
    view.renderTasks();
    view.renderHUD();
};

act.calculateReward = (diffVal) => {
    const def = DIFFICULTY_DEFS[diffVal] || DIFFICULTY_DEFS[2];
    let gold = Math.floor(def.baseGold * ((Math.random() * 0.4) + 0.8));
    let exp = def.baseExp;
    const luc = (GlobalState.attrs && GlobalState.attrs.luc) ? GlobalState.attrs.luc.v : 1;
    const isCrit = Math.random() < (0.05 + (luc * 0.01));
    if (isCrit) { gold *= 2; exp = Math.floor(exp * 1.5); }
    return { gold, exp, isCrit };
};

// 子任務新增 (含刪除按鈕)
act.addSubtask = () => {
    const div = document.getElementById('nt-subs');
    if(!div) return;
    if(div.children.length >= 10) return;
    const row = document.createElement('div');
    row.className = 'row row-center mt-sm';
    row.innerHTML = `<input class="inp flex-1 mb-0 sub-task-input" placeholder="步驟..."><button class="btn-del btn-icon-flat" style="color:#d32f2f;margin-left:5px;" onclick="this.parentElement.remove()">✕</button>`;
    div.appendChild(row);
};

act.toggleSubtask = (tid, sIdx) => {
    const t = GlobalState.tasks.find(x => x.id === tid);
    if(t && t.subs[sIdx]) { t.subs[sIdx].done = !t.subs[sIdx].done; act.save(); view.renderTasks(); }
};

act.deleteTask = (id) => {
    act.confirm("確定刪除?", (yes) => {
        if(yes) {
            GlobalState.tasks = GlobalState.tasks.filter(t => t.id !== id);
            act.save();
            view.renderTasks();
        }
    });
};

window.act = act;