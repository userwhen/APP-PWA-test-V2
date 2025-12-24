/* js/core105.js - V300.70 Streak & Navigation */

const act = {
    alert: (msg) => alert(msg), 
    confirm: (msg, cb) => { if(confirm(msg)) cb(true); },
    prompt: (msg, def, cb) => { const r = prompt(msg, def); if(r!==null) cb(r); },

    // ★ 每日登入 & 簽到系統 ★
    checkDaily: () => {
        const today = new Date().toISOString().split('T')[0];
        
        if (GlobalState.lastLoginDate !== today) {
            // 計算連續登入
            if (GlobalState.lastLoginDate) {
                const last = new Date(GlobalState.lastLoginDate);
                const curr = new Date(today);
                const diffTime = Math.abs(curr - last);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                if (diffDays === 1) {
                    GlobalState.loginStreak = (GlobalState.loginStreak || 0) + 1;
                } else {
                    GlobalState.loginStreak = 1; // 中斷，重置
                }
            } else {
                GlobalState.loginStreak = 1; // 第一次
            }
            
            GlobalState.lastLoginDate = today;
            
            // 每日基礎獎勵
            let bonusGold = 50;
            let bonusGem = 0;
            let streakMsg = `🔥 連續登入: ${GlobalState.loginStreak} 天`;
            
            // 里程碑獎勵
            if (GlobalState.loginStreak === 3) { bonusGold += 100; streakMsg += "\n🎁 3日獎勵: +100 金幣"; }
            if (GlobalState.loginStreak === 7) { bonusGem += 5; streakMsg += "\n🎁 7日獎勵: +5 鑽石"; }
            if (GlobalState.loginStreak === 30) { bonusGem += 20; streakMsg += "\n🎁 月度全勤: +20 鑽石"; }
            
            GlobalState.gold += bonusGold;
            GlobalState.freeGem = (GlobalState.freeGem || 0) + bonusGem;
            
            // 自動更新/創建簽到成就
            act.updateLoginAchievement();

            // 重置每日任務與庫存
            GlobalState.tasks.forEach(t => { if(t.cat === '每日') { t.done = false; t.curr = 0; } });
            GlobalState.shop.npc.forEach(i => { if(i.perm === 'daily') i.qty = 99; });
            GlobalState.cal.today = 0; GlobalState.cal.logs = [];
            
            act.alert(`📅 歡迎回來！\n${streakMsg}\n💰 +${bonusGold} 金幣${bonusGem?` 💎 +${bonusGem}`:''}`);
            act.save();
        }
    },
    
    // 更新簽到成就卡片
    updateLoginAchievement: () => {
        const achId = 'sys_login_streak';
        let ach = GlobalState.achievements.find(a => a.id === achId);
        if (!ach) {
            ach = { id: achId, title: '🔥 每日簽到', desc: '保持連續登入以獲得獎勵', type: 'manual', targetVal: 0, reward: { gold: 0 }, done: false, isSystem: true };
            GlobalState.achievements.unshift(ach); // 放最前面
        }
        ach.desc = `目前連續: ${GlobalState.loginStreak} 天 (中斷將重置)`;
    },

    // 導航 (基礎模式修正)
    navigate: (p) => { 
        document.querySelectorAll('.page').forEach(e=>e.classList.remove('active')); 
        document.querySelectorAll('.nav-item').forEach(e=>e.classList.remove('active')); 
        
        let targetPage = p;
        // 基礎模式下，Main 導向 Stats
        if (GlobalState.settings.mode === 'basic' && p === 'main') {
            targetPage = 'stats';
        }
        
        const pg = document.getElementById('page-'+targetPage); 
        if(pg) pg.classList.add('active'); 
        
        const btnId = (targetPage==='stats' && GlobalState.settings.mode==='basic') ? 'nav-main' : 'nav-'+p;
        const btn = document.getElementById(btnId); 
        if(btn) btn.classList.add('active'); 
        
        if(targetPage==='main' || targetPage==='stats') view.renderHUD(); 
        
        // FAB 顯示控制
        const fab = document.getElementById('global-fab');
        if(fab) fab.style.display = (targetPage === 'task') ? 'flex' : 'none';
    },
    
    openModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='flex'; m.classList.add('active'); } },
    closeModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='none'; m.classList.remove('active'); } },

    handleFab: () => {
        if (TempState.taskTab === 'ach') {
            if(window.act.openCreateAch) window.act.openCreateAch(); 
            else act.openModal('create-ach');
            return;
        }
        
        // 建立任務重置
        document.getElementById('nt-title').value = '';
        document.getElementById('nt-desc').value = '';
        const diffSlider = document.getElementById('nt-diff-range');
        if(diffSlider) { diffSlider.value = 2; act.updateDiffLabel(2); }
        document.getElementById('nt-skill-select').value = '';
        document.getElementById('nt-target').value = '';
        
        const catSel = document.getElementById('nt-cat-select');
        if(catSel) catSel.value = '待辦';
        
        document.getElementById('nt-subs').innerHTML = '';
        
        act.refreshSkillSelect();
        act.openModal('create');
    },

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

    submitTask: () => {
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
            created: new Date().toISOString(),
            isUser: true
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
            if (t.type === 'count' && t.curr < t.target - 1) {
                t.curr++; act.save(); view.renderTasks(); return;
            } else if (t.type === 'count') {
                t.curr = t.target;
            }

            t.done = true;
            const reward = act.calculateReward(t.difficulty);
            GlobalState.gold += reward.gold;
            GlobalState.exp += reward.exp;
            
            if (GlobalState.exp >= GlobalState.lv * 100) { 
                GlobalState.exp -= GlobalState.lv * 100; 
                GlobalState.lv++; 
                act.alert(`🆙 主角等級提升！ Lv.${GlobalState.lv}`); 
            }

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
            if(t.type === 'count') t.curr = 0;
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

    addSubtask: () => {
        const div = document.getElementById('nt-subs');
        if(!div) return;
        if(div.children.length >= 10) return;
        const row = document.createElement('div');
        row.className = 'row row-center mt-sm';
        row.innerHTML = `<input class="inp flex-1 mb-0 sub-task-input" placeholder="步驟..."><button class="btn-del btn-icon-flat" style="color:#d32f2f; font-weight:bold; font-size:1.2rem; margin-left:5px;" onclick="this.parentElement.remove()">✕</button>`;
        div.appendChild(row);
    },
    
    toggleSubtask: (tid, sIdx) => {
        const t = GlobalState.tasks.find(x => x.id === tid);
        if(t && t.subs[sIdx]) { t.subs[sIdx].done = !t.subs[sIdx].done; act.save(); view.renderTasks(); }
    },

    saveSettings: () => {
        const mode = document.getElementById('set-mode').value;
        GlobalState.settings.mode = mode;
        GlobalState.settings.calMode = document.getElementById('set-cal-mode').checked;
        GlobalState.settings.strictMode = document.getElementById('set-strict-mode').checked;
        act.save();
        act.closeModal('settings');
        act.alert("設定已儲存 (模式切換建議重整)");
        if(window.act.changeMode) window.act.changeMode(mode);
        view.render();
    },
    
    deleteTask: (id) => {
        act.confirm("確定刪除此任務?", (yes) => {
            if(yes) {
                GlobalState.tasks = GlobalState.tasks.filter(t => t.id !== id);
                act.save();
                view.renderTasks();
            }
        });
    },

    uploadCategoryChange: () => { 
        if(window.act.shopUploadChange) window.act.shopUploadChange();
        else if(window.act.shopLibUploadChange) window.act.shopLibUploadChange();
    },
    
    validateNumber: (el, max) => {
        let v = parseInt(el.value);
        if(isNaN(v)) v = ''; else if(max && v > max) v = max;
        el.value = v;
    },

    save: () => { if(!window.isResetting) localStorage.setItem('SQ_V103', JSON.stringify(GlobalState)); },
    navToHistory: () => act.navigate('history'),
    editTask: (id) => act.alert("請先刪除再重建"), 
    showQA: () => act.alert("Q&A 功能開發中"),
    
    openStats: () => { act.navigate('stats'); },
    closeStats: () => { act.navigate('main'); }, 
    switchTab: (t) => { 
        document.querySelectorAll('.tab').forEach(e => e.classList.remove('active')); document.getElementById('tb-'+t).classList.add('active'); 
        document.querySelectorAll('.stat-sec').forEach(e => e.classList.remove('active')); document.getElementById('sec-'+t).classList.add('active'); 
    }
};

window.act = act;