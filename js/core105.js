/* js/core105.js - V300.30 Logic Update */

const act = {
    // ... 保留 navigate, openModal 等基礎 UI 函數 ...
    navigate: (p) => { document.querySelectorAll('.page').forEach(e=>e.classList.remove('active')); document.querySelectorAll('.nav-item').forEach(e=>e.classList.remove('active')); const pg=document.getElementById('page-'+p); if(pg) pg.classList.add('active'); const btn=document.getElementById('nav-'+p); if(btn) btn.classList.add('active'); if(p==='main') view.renderHUD(); },
    openModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='flex'; m.classList.add('active'); } },
    closeModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='none'; m.classList.remove('active'); } },

    // --- 任務提交 (修改版) ---
    submitTask: () => {
        const title = document.getElementById('nt-title').value.trim();
        if (!title) return alert('請輸入標題');
        
        // 抓取難度與標籤
        const diff = document.getElementById('nt-difficulty').value; // S, M, L, XL
        const tagSelect = document.getElementById('nt-tag-select').value; // 這是 Skill Name
        
        // 建立新任務物件
        const newTask = {
            id: Date.now().toString(),
            title: title,
            desc: document.getElementById('nt-desc').value,
            type: document.getElementById('nt-type').value, // normal / count
            target: parseInt(document.getElementById('nt-target').value) || 1,
            curr: 0,
            
            // ★ 新核心：綁定技能與難度
            skill: tagSelect, // 綁定的技能名稱 (例如 "縫紉")
            difficulty: diff, // 難度 (S/M/L/XL)
            
            // 傳統分類 (僅作顯示用)
            cat: document.getElementById('nt-cat-select').value || '雜事',
            
            pinned: document.getElementById('nt-pinned').checked,
            subs: [], // 子任務由 addSubtask 處理 (這裡簡化，假設 view 會讀取 DOM)
            deadline: document.getElementById('nt-deadline').value,
            done: false,
            created: new Date().toISOString()
        };

        // 處理子任務 DOM 讀取 (簡化版)
        document.querySelectorAll('.sub-task-input').forEach(inp => {
            if(inp.value.trim()) newTask.subs.push({ text: inp.value.trim(), done: false });
        });

        GlobalState.tasks.unshift(newTask);
        act.save();
        act.closeModal('create');
        view.renderTasks();
        
        // 如果是新技能，自動註冊 (簡單防呆)
        if (newTask.skill && !GlobalState.skills.find(s=>s.name===newTask.skill)) {
            // 預設歸類到「雜事(靈巧)」或讓玩家選，這裡先預設靈巧，後續可改
            GlobalState.skills.push({ name: newTask.skill, parent: 'dex', lv: 1, exp: 0, lastUsed: new Date().toISOString() });
        }
    },

    // --- ★ 任務完成與結算 (核心重寫) ★ ---
    toggleTask: (id) => {
        const t = GlobalState.tasks.find(x => x.id === id);
        if (!t) return;
        
        if (!t.done) {
            // --- 完成任務 ---
            t.done = true;
            
            // 1. 計算獎勵
            const reward = act.calculateReward(t.difficulty);
            GlobalState.gold += reward.gold;
            
            // 2. 增加屬性經驗 (如果有綁定技能)
            let attrMsg = "";
            if (t.skill) {
                // 找技能
                let skill = GlobalState.skills.find(s => s.name === t.skill);
                if (!skill) {
                    // 防呆：如果找不到，自動補一個
                    skill = { name: t.skill, parent: 'dex', lv: 1, exp: 0 };
                    GlobalState.skills.push(skill);
                }
                
                // 更新技能最後使用時間 (消除生疏狀態)
                skill.lastUsed = new Date().toISOString();
                
                // 找對應的主屬性
                const parentAttr = GlobalState.attrs[skill.parent] || GlobalState.attrs['vit']; // 預設毅力
                
                // 增加屬性經驗
                parentAttr.exp += reward.exp;
                attrMsg = ` | ${parentAttr.icon} ${parentAttr.name} Exp+${reward.exp}`;
                
                // 屬性升級檢查 (簡單公式：等級*100)
                if (parentAttr.exp >= parentAttr.v * 100) {
                    parentAttr.exp -= parentAttr.v * 100;
                    parentAttr.v++;
                    alert(`🎉 恭喜！你的 [${parentAttr.name}] 提升到了 Lv.${parentAttr.v}！`);
                }
            }
            
            // 3. 顯示結果 (爆擊特效)
            const critMsg = reward.isCrit ? " 🔥 大成功！獎勵加倍！" : "";
            act.addLog(`完成: ${t.title}`, `💰+${reward.gold}${attrMsg}${critMsg}`);
            
            // 4. 播放特效 (可選)
            if(reward.isCrit) alert(`🎲 運氣爆棚！${t.title} 獲得了大成功！\n金幣 x2 (${reward.gold})`);

        } else {
            // --- 取消完成 (反悔) ---
            t.done = false;
            // 簡單處理：倒扣基礎金幣，屬性就不扣了避免複雜
            // 實務上 RPG 通常不鼓勵反覆刷，所以取消不退還屬性是合理的
        }
        
        act.save();
        view.renderTasks();
        view.renderHUD();
    },
    
    // --- 獎勵計算機 ---
    calculateReward: (diffCode) => {
        const def = DIFFICULTY_DEFS[diffCode] || DIFFICULTY_DEFS['S'];
        let gold = def.baseGold;
        let exp = def.baseExp;
        
        // 浮動值 (+/- 20%)
        const variance = (Math.random() * 0.4) + 0.8; 
        gold = Math.floor(gold * variance);
        
        // 爆擊判定 (幸運屬性越高，機率越高)
        // 基礎 5% + (幸運等級 * 1)%
        const luc = GlobalState.attrs.luc.v;
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
        const count = div.children.length;
        if(count >= 10) return;
        const row = document.createElement('div');
        row.className = 'row row-center mt-sm';
        row.innerHTML = `<input class="inp flex-1 mb-0 sub-task-input" placeholder="子步驟 ${count+1}"><button class="btn-del btn-icon-flat" onclick="this.parentElement.remove()">✕</button>`;
        div.appendChild(row);
    },
    
    toggleSubtask: (tid, sIdx) => {
        const t = GlobalState.tasks.find(x => x.id === tid);
        if(t && t.subs[sIdx]) {
            t.subs[sIdx].done = !t.subs[sIdx].done;
            act.save();
            view.renderTasks(); // 重新渲染以更新進度條
        }
    },

    // 系統存檔與其他輔助
    save: () => { if(!window.isResetting) localStorage.setItem('SQ_V103', JSON.stringify(GlobalState)); },
    navToHistory: () => act.navigate('history'),
    editTask: (id) => alert("編輯功能暫未開放 (建議刪除重開)"),
    deleteTask: () => { /* 略，沿用舊版或自行實作 */ },
    
    // 初始化技能 (如果空的話)
    initSkills: () => {
        if(GlobalState.skills.length === 0) {
            GlobalState.skills = [
                { name: '運動', parent: 'str', lv:1, exp:0 },
                { name: '閱讀', parent: 'int', lv:1, exp:0 },
                { name: '早起', parent: 'vit', lv:1, exp:0 }
            ];
        }
    }
};

// 確保 act 被掛載
window.act = act;