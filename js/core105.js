/* js/core105.js - V300.33 Logic Fixed & FAB Added */

const act = {
    // 基礎導航
    navigate: (p) => { document.querySelectorAll('.page').forEach(e=>e.classList.remove('active')); document.querySelectorAll('.nav-item').forEach(e=>e.classList.remove('active')); const pg=document.getElementById('page-'+p); if(pg) pg.classList.add('active'); const btn=document.getElementById('nav-'+p); if(btn) btn.classList.add('active'); if(p==='main') view.renderHUD(); },
    openModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='flex'; m.classList.add('active'); } },
    closeModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='none'; m.classList.remove('active'); } },

    // --- ★ 關鍵修復：懸浮按鈕功能 ★ ---
    handleFab: () => {
        // 判斷當前頁面，如果是大廳或任務頁，則開啟建立任務
        // 你也可以加入判斷：如果在商店頁，則開啟上架商品
        
        // 重置輸入框內容
        document.getElementById('nt-title').value = '';
        document.getElementById('nt-desc').value = '';
        const subBox = document.getElementById('nt-subs');
        if(subBox) subBox.innerHTML = '';
        
        // 開啟視窗
        act.openModal('create');
    },

    // --- 任務提交 (新版邏輯) ---
    submitTask: () => {
        const titleInput = document.getElementById('nt-title');
        const title = titleInput.value.trim();
        if (!title) return alert('請輸入標題');
        
        // 讀取難度與標籤
        const diff = document.getElementById('nt-difficulty').value; 
        const tagSelect = document.getElementById('nt-tag-select').value; 
        const catSelect = document.getElementById('nt-cat-select').value;
        
        const newTask = {
            id: Date.now().toString(),
            title: title,
            desc: document.getElementById('nt-desc').value,
            type: 'normal',
            target: 1,
            curr: 0,
            
            skill: tagSelect, 
            difficulty: diff, 
            cat: catSelect || '雜事',
            
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
        
        // 自動註冊新技能
        if (newTask.skill && !GlobalState.skills.find(s=>s.name===newTask.skill)) {
            GlobalState.skills.push({ name: newTask.skill, parent: 'dex', lv: 1, exp: 0, lastUsed: new Date().toISOString() });
        }
    },

    // --- 任務完成與結算 ---
    toggleTask: (id) => {
        const t = GlobalState.tasks.find(x => x.id === id);
        if (!t) return;
        
        if (!t.done) {
            // 完成
            t.done = true;
            const reward = act.calculateReward(t.difficulty);
            
            GlobalState.gold += reward.gold;
            GlobalState.exp += reward.exp;
            
            // 主角升級
            const maxExp = GlobalState.lv * 100;
            if (GlobalState.exp >= maxExp) {
                GlobalState.exp -= maxExp;
                GlobalState.lv++;
                alert(`🆙 主角等級提升！ Lv.${GlobalState.lv}`);
            }

            // 技能與屬性提升
            let attrMsg = "";
            if (t.skill) {
                let skill = GlobalState.skills.find(s => s.name === t.skill);
                if (!skill) {
                    skill = { name: t.skill, parent: 'dex', lv: 1, exp: 0 };
                    GlobalState.skills.push(skill);
                }
                skill.lastUsed = new Date().toISOString();
                
                const parentAttr = GlobalState.attrs[skill.parent] || GlobalState.attrs['vit'];
                parentAttr.exp += reward.exp;
                attrMsg = ` | ${parentAttr.icon} ${parentAttr.name} Exp+${reward.exp}`;
                
                if (parentAttr.exp >= parentAttr.v * 100) {
                    parentAttr.exp -= parentAttr.v * 100;
                    parentAttr.v++;
                    alert(`🎉 恭喜！屬性 [${parentAttr.name}] 提升到了 Lv.${parentAttr.v}！`);
                }
            }
            
            const critMsg = reward.isCrit ? " 🔥 大成功！" : "";
            act.addLog(`完成: ${t.title}`, `💰+${reward.gold}${attrMsg}${critMsg}`);
            
            if(reward.isCrit) alert(`🎲 運氣爆棚！${t.title} 獲得了大成功！`);

        } else {
            // 取消完成
            t.done = false;
        }
        
        act.save();
        view.renderTasks();
        view.renderHUD();
    },
    
    calculateReward: (diffCode) => {
        const defs = (typeof DIFFICULTY_DEFS !== 'undefined') ? DIFFICULTY_DEFS : { 'S': { baseGold:10, baseExp:10 } };
        const def = defs[diffCode] || defs['S'];
        
        let gold = def.baseGold;
        let exp = def.baseExp;
        
        const variance = (Math.random() * 0.4) + 0.8; 
        gold = Math.floor(gold * variance);
        
        const luc = (GlobalState.attrs && GlobalState.attrs.luc) ? GlobalState.attrs.luc.v : 1;
        const critChance = 0.05 + (luc * 0.01); 
        const isCrit = Math.random() < critChance;
        
        if (isCrit) {
            gold *= 2;
            exp = Math.floor(exp * 1.5);
        }
        return { gold, exp, isCrit };
    },

    addSubtask: () => {
        const div = document.getElementById('nt-subs');
        if(!div) return;
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
            view.renderTasks(); 
        }
    },

    save: () => { if(!window.isResetting) localStorage.setItem('SQ_V103', JSON.stringify(GlobalState)); },
    navToHistory: () => act.navigate('history'),
    editTask: (id) => alert("編輯功能暫未開放 (建議刪除重開)"),
    deleteTask: () => { },
    
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