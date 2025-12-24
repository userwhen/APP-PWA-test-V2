/* js/core105.js - V300.32 Logic Fixed */

const act = {
    // 導航與彈窗基礎功能
    navigate: (p) => { document.querySelectorAll('.page').forEach(e=>e.classList.remove('active')); document.querySelectorAll('.nav-item').forEach(e=>e.classList.remove('active')); const pg=document.getElementById('page-'+p); if(pg) pg.classList.add('active'); const btn=document.getElementById('nav-'+p); if(btn) btn.classList.add('active'); if(p==='main') view.renderHUD(); },
    openModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='flex'; m.classList.add('active'); } },
    closeModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='none'; m.classList.remove('active'); } },

    // --- 任務提交 (建立新任務) ---
    submitTask: () => {
        const title = document.getElementById('nt-title').value.trim();
        if (!title) return alert('請輸入標題');
        
        // 抓取難度與標籤
        const diff = document.getElementById('nt-difficulty').value; 
        const tagSelect = document.getElementById('nt-tag-select').value; 
        
        const newTask = {
            id: Date.now().toString(),
            title: title,
            desc: document.getElementById('nt-desc').value,
            type: 'normal', // 簡化：暫時統一為一般任務
            target: 1,
            curr: 0,
            
            // ★ 新核心：綁定技能與難度
            skill: tagSelect, 
            difficulty: diff, 
            
            // 分類 (顯示用)
            cat: document.getElementById('nt-cat-select').value || '雜事',
            pinned: document.getElementById('nt-pinned').checked,
            subs: [], 
            deadline: document.getElementById('nt-deadline').value,
            done: false,
            created: new Date().toISOString()
        };

        // 讀取子任務輸入框 (這部分依賴 CSS selector)
        // 注意：index.html 必須確保子任務輸入框有 class="sub-task-input"
        const subInputs = document.querySelectorAll('#nt-subs input');
        subInputs.forEach(inp => {
            if(inp.value.trim()) newTask.subs.push({ text: inp.value.trim(), done: false });
        });

        GlobalState.tasks.unshift(newTask);
        act.save();
        act.closeModal('create');
        view.renderTasks();
        
        // 自動註冊新技能
        if (newTask.skill && !GlobalState.skills.find(s=>s.name===newTask.skill)) {
            // 預設將新技能歸類為 'dex'(靈巧) 或其他，這裡先設為 'gen'(通用) 或既有屬性
            GlobalState.skills.push({ name: newTask.skill, parent: 'dex', lv: 1, exp: 0, lastUsed: new Date().toISOString() });
        }
    },

    // --- ★ 任務完成與結算 ★ ---
    toggleTask: (id) => {
        const t = GlobalState.tasks.find(x => x.id === id);
        if (!t) return;
        
        if (!t.done) {
            // --- 完成任務 ---
            t.done = true;
            
            // 1. 計算並發放獎勵
            const reward = act.calculateReward(t.difficulty);
            GlobalState.gold += reward.gold;
            GlobalState.exp += reward.exp; // ★ 修正：增加主角經驗值
            
            // 主角升級檢查
            const maxExp = GlobalState.lv * 100;
            if (GlobalState.exp >= maxExp) {
                GlobalState.exp -= maxExp;
                GlobalState.lv++;
                alert(`🆙 主角等級提升！ Lv.${GlobalState.lv}`);
            }

            // 2. 增加屬性/技能經驗
            let attrMsg = "";
            if (t.skill) {
                let skill = GlobalState.skills.find(s => s.name === t.skill);
                if (!skill) {
                    skill = { name: t.skill, parent: 'dex', lv: 1, exp: 0 };
                    GlobalState.skills.push(skill);
                }
                skill.lastUsed = new Date().toISOString();
                
                // 技能對應的屬性
                const parentAttr = GlobalState.attrs[skill.parent] || GlobalState.attrs['vit'];
                parentAttr.exp += reward.exp;
                attrMsg = ` | ${parentAttr.icon} ${parentAttr.name} Exp+${reward.exp}`;
                
                // 屬性升級檢查
                if (parentAttr.exp >= parentAttr.v * 100) {
                    parentAttr.exp -= parentAttr.v * 100;
                    parentAttr.v++;
                    alert(`🎉 恭喜！屬性 [${parentAttr.name}] 提升到了 Lv.${parentAttr.v}！`);
                }
            }
            
            const critMsg = reward.isCrit ? " 🔥 大成功！" : "";
            act.addLog(`完成: ${t.title}`, `💰+${reward.gold}${attrMsg}${critMsg}`);
            
            if(reward.isCrit) alert(`🎲 運氣爆棚！${t.title} 獲得了大成功 (金幣加倍)！`);

        } else {
            // --- 取消完成 ---
            t.done = false;
            // 這裡不倒扣屬性，避免邏輯過於複雜
        }
        
        act.save();
        view.renderTasks();
        view.renderHUD();
    },
    
    // --- 獎勵計算機 ---
    calculateReward: (diffCode) => {
        // 確保 DIFFICULTY_DEFS 存在 (在 data105.js)
        const defs = (typeof DIFFICULTY_DEFS !== 'undefined') ? DIFFICULTY_DEFS : { 'S': { baseGold:10, baseExp:10 } };
        const def = defs[diffCode] || defs['S'];
        
        let gold = def.baseGold;
        let exp = def.baseExp;
        
        // 浮動值 (+/- 20%)
        const variance = (Math.random() * 0.4) + 0.8; 
        gold = Math.floor(gold * variance);
        
        // 爆擊判定
        const luc = (GlobalState.attrs && GlobalState.attrs.luc) ? GlobalState.attrs.luc.v : 1;
        const critChance = 0.05 + (luc * 0.01); 
        const isCrit = Math.random() < critChance;
        
        if (isCrit) {
            gold *= 2;
            exp = Math.floor(exp * 1.5);
        }
        return { gold, exp, isCrit };
    },

    // --- 子任務操作 ---
    addSubtask: () => {
        const div = document.getElementById('nt-subs');
        if(!div) return;
        const count = div.children.length;
        if(count >= 10) return;
        const row = document.createElement('div');
        row.className = 'row row-center mt-sm';
        // 注意：這裡加入了 sub-task-input class，讓 submitTask 可以抓到
        row.innerHTML = `<input class="inp flex-1 mb-0 sub-task-input" placeholder="子步驟 ${count+1}"><button class="btn-del btn-icon-flat" onclick="this.parentElement.remove()">✕</button>`;
        div.appendChild(row);
    },
    
    toggleSubtask: (tid, sIdx) => {
        const t = GlobalState.tasks.find(x => x.id === tid);
        if(t && t.subs[sIdx]) {
            t.subs[sIdx].done = !t.subs[sIdx].done;
            act.save();
            view.renderTasks(); 
        }
    },

    save: () => { if(!window.isResetting) localStorage.setItem('SQ_V103', JSON.stringify(GlobalState)); },
    navToHistory: () => act.navigate('history'),
    editTask: (id) => alert("編輯功能暫未開放 (建議刪除重開)"),
    deleteTask: () => { /* 保留給未來實作 */ },
    
    initSkills: () => {
        if(GlobalState.skills.length === 0) {
            GlobalState.skills = [
                { name: '運動', parent: 'str', lv:1, exp:0 },
                { name: '閱讀', parent: 'int', lv:1, exp:0 }
            ];
        }
    }
};

window.act = act;