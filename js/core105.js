/* js/core105.js - V300.95 Final */

const act = {
    alert: (msg) => alert(msg), 
    confirm: (msg, cb) => { if(confirm(msg)) cb(true); },
    prompt: (msg, def, cb) => { const r = prompt(msg, def); if(r!==null) cb(r); },
    generateId: (prefix='id') => prefix + '_' + Date.now() + Math.random().toString(36).substr(2, 9),
    
    clearInputs: (parentId) => {
        const parent = document.getElementById(parentId);
        if(!parent) return;
        parent.querySelectorAll('input, textarea, select').forEach(el => {
            if(el.type === 'checkbox' || el.type === 'radio') el.checked = false;
            else if(el.tagName === 'SELECT') el.selectedIndex = 0;
            else el.value = '';
        });
        const diffSlider = parent.querySelector('.slider');
        if(diffSlider) { diffSlider.value = 2; act.updateDiffLabel(2); }
    },

    navigate: (p) => { 
        document.querySelectorAll('.page, #page-story, #page-avatar').forEach(e => e.classList.remove('active')); 
        document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active')); 
        
        let targetPage = p;
        if (GlobalState.settings.mode === 'basic' && p === 'main') targetPage = 'stats';
        
        const pg = document.getElementById('page-' + targetPage); 
        if(pg) pg.classList.add('active'); 
        
        const btnId = (targetPage === 'stats' && GlobalState.settings.mode === 'basic') ? 'nav-main' : 'nav-' + p;
        const btn = document.getElementById(btnId); 
        if(btn) btn.classList.add('active'); 
        
        if(targetPage === 'main' || targetPage === 'stats') view.renderHUD(); 
        
        const fab = document.getElementById('global-fab');
        if(fab) fab.style.display = (targetPage === 'task') ? 'flex' : 'none';
    },
    
    openModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='flex'; m.classList.add('active'); } },
    closeModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='none'; m.classList.remove('active'); } },

    checkDaily: () => {
        const today = new Date().toISOString().split('T')[0];
        
        if (GlobalState.lastLoginDate !== today) {
            if (GlobalState.lastLoginDate) {
                const last = new Date(GlobalState.lastLoginDate);
                const curr = new Date(today);
                const diffDays = Math.ceil(Math.abs(curr - last) / (1000 * 60 * 60 * 24)); 
                if (diffDays === 1) GlobalState.loginStreak = (GlobalState.loginStreak || 0) + 1;
                else GlobalState.loginStreak = 1; 
            } else {
                GlobalState.loginStreak = 1;
            }
            GlobalState.lastLoginDate = today;
            
            let msg = `📅 新的一天！連續登入: ${GlobalState.loginStreak} 天`;
            let rustedCount = 0;
            GlobalState.skills.forEach(s => {
                if(s.lastUsed) {
                    const diff = Math.ceil(Math.abs(new Date() - new Date(s.lastUsed)) / (1000 * 60 * 60 * 24));
                    if(diff > 3) { s.isRusted = true; rustedCount++; }
                }
            });
            if(rustedCount > 0) msg += `\n⚠️ ${rustedCount} 個技能生疏了！`;

            // 重置
            GlobalState.tasks.forEach(t => { if(t.cat === '每日') { t.done = false; t.curr = 0; } });
            GlobalState.shop.npc.forEach(i => { if(i.perm === 'daily') i.qty = 99; });
            GlobalState.cal.today = 0; 
            
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
    },

    debugDay: () => {
        const d = new Date();
        d.setDate(d.getDate() - 1); // 設為昨天
        GlobalState.lastLoginDate = d.toISOString().split('T')[0];
        act.alert("時光倒流... (請重新整理頁面觸發跨日)");
        act.save();
    },

    submitPayment: (amount) => {
        act.alert(`系統連線中...\n成功儲值 ${amount} 元！\n獲得 ${amount} 付費鑽石。`);
        GlobalState.paidGem = (GlobalState.paidGem || 0) + amount; // 修正：加到鑽石
        GlobalState.gold += amount * 10; // 贈送金幣
        act.closeModal('payment');
        act.save();
        view.renderHUD();
    },

    handleFab: () => {
        if (TempState.taskTab === 'ach') {
            if(window.act.openCreateAch) window.act.openCreateAch(); 
            else act.openModal('create-ach');
            return;
        }
        
        // 建立新任務 (重置 ID)
        TempState.editTaskId = null;
        act.clearInputs('m-create');
        document.getElementById('nt-cat-select').value = '每日';
        document.getElementById('btn-del-task').style.display = 'none'; // 隱藏刪除
        
        document.getElementById('nt-subs').innerHTML = '';
        act.refreshSkillSelect();
        act.openModal('create');
    },

    // ★ 編輯任務 (載入資料) ★
    editTask: (id) => {
        const t = GlobalState.tasks.find(x => x.id === id);
        if(!t) return;
        
        TempState.editTaskId = id;
        act.openModal('create');
        
        document.getElementById('nt-title').value = t.title;
        document.getElementById('nt-desc').value = t.desc;
        document.getElementById('nt-cat-select').value = t.cat;
        document.getElementById('nt-type').value = t.type;
        document.getElementById('nt-target').value = t.target;
        act.toggleTaskType(t.type);
        
        document.getElementById('nt-diff-range').value = t.difficulty;
        act.updateDiffLabel(t.difficulty);
        
        act.refreshSkillSelect();
        document.getElementById('nt-skill-select').value = t.skill || '';
        
        document.getElementById('nt-pinned').checked = t.pinned;
        document.getElementById('nt-deadline').value = t.deadline || '';
        
        // 子任務載入
        const subBox = document.getElementById('nt-subs');
        subBox.innerHTML = '';
        if(t.subs) {
            t.subs.forEach(s => {
                const row = document.createElement('div');
                row.className = 'row row-center mt-sm';
                row.innerHTML = `<input class="inp flex-1 mb-0 sub-task-input" value="${s.text}"><button class="btn-del btn-icon-flat" style="color:#d32f2f; margin-left:5px;" onclick="this.parentElement.remove()">✕</button>`;
                subBox.appendChild(row);
            });
        }
        
        // 顯示刪除按鈕
        document.getElementById('btn-del-task').style.display = 'block';
    },

    refreshSkillSelect: () => {
        const sel = document.getElementById('nt-skill-select');
        if(!sel) return;
        const currentVal = sel.value; // 保留當前值
        sel.innerHTML = '<option value="" disabled selected>選擇技能標籤...</option>';
        GlobalState.skills.forEach(s => {
            const attrName = GlobalState.attrs[s.parent] ? GlobalState.attrs[s.parent].name : '未知';
            sel.innerHTML += `<option value="${s.name}">${s.name} (${attrName})</option>`;
        });
        if(currentVal) sel.value = currentVal;
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
        const subRule = document.getElementById('nt-sub-rule').value; 
        const typeSelect = document.getElementById('nt-type').value;
        
        let targetVal = 1;
        if(typeSelect === 'count') {
            targetVal = parseInt(document.getElementById('nt-target').value) || 1;
            if(targetVal > 99) targetVal = 99;
        }
        
        const taskObj = {
            id: TempState.editTaskId || act.generateId('task'),
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
            subRule: subRule,
            deadline: document.getElementById('nt-deadline').value,
            done: false,
            created: new Date().toISOString(),
            isUser: true 
        };

        const subInputs = document.querySelectorAll('#nt-subs input');
        subInputs.forEach(inp => {
            if(inp.value.trim()) taskObj.subs.push({ text: inp.value.trim(), done: false });
        });

        // 如果是編輯模式，替換舊任務
        if (TempState.editTaskId) {
            const idx = GlobalState.tasks.findIndex(t => t.id === TempState.editTaskId);
            if (idx > -1) {
                // 保留完成狀態
                taskObj.done = GlobalState.tasks[idx].done;
                taskObj.curr = GlobalState.tasks[idx].curr;
                GlobalState.tasks[idx] = taskObj;
            }
        } else {
            GlobalState.tasks.unshift(taskObj);
        }

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
                    skill.isRusted = false;
                    const parentAttr = GlobalState.attrs[skill.parent];
                    
                    // 運動扣熱量
                    if (GlobalState.settings.calMode && parentAttr.name === '體能') {
                        const burn = t.difficulty * 50; 
                        GlobalState.cal.today = Math.max(0, GlobalState.cal.today - burn);
                        attrMsg += ` | 🔥 -${burn} cal`;
                    }

                    if(parentAttr) {
                        parentAttr.exp += reward.exp;
                        attrMsg += ` | ${parentAttr.icon} Exp+${reward.exp}`;
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
        row.innerHTML = `<input class="inp flex-1 mb-0 sub-task-input" placeholder="步驟..."><button class="btn-del btn-icon-flat" style="color:#d32f2f; margin-left:5px;" onclick="this.parentElement.remove()">✕</button>`;
        div.appendChild(row);
    },
    
    toggleSubtask: (tid, sIdx) => {
        const t = GlobalState.tasks.find(x => x.id === tid);
        if(t && t.subs[sIdx]) { 
            t.subs[sIdx].done = !t.subs[sIdx].done; 
            
            // 自動完成判斷
            const allDone = t.subs.every(s => s.done);
            const anyDone = t.subs.some(s => s.done);
            if (!t.done) {
                if (t.subRule === 'all' && allDone) act.toggleTask(tid);
                else if (t.subRule === 'any' && anyDone) act.toggleTask(tid);
            }
            
            act.save(); 
            view.renderTasks(); 
        }
    },

    saveSettings: () => {
        const mode = document.getElementById('set-mode').value;
        GlobalState.settings.mode = mode;
        GlobalState.settings.calMode = document.getElementById('set-cal-mode').checked;
        GlobalState.settings.strictMode = document.getElementById('set-strict-mode').checked;
        act.save();
        act.closeModal('settings');
        act.alert("設定已儲存");
        if(window.act.changeMode) window.act.changeMode(mode);
        view.render(); // 重新渲染以隱藏/顯示卡路里
    },
    
    deleteTask: (id) => {
        act.confirm("確定刪除此任務?", (yes) => {
            if(yes) {
                GlobalState.tasks = GlobalState.tasks.filter(t => t.id !== id);
                act.save();
                // 如果是在編輯視窗中刪除，關閉視窗
                act.closeModal('create');
                view.renderTasks();
            }
        });
    },

    uploadCategoryChange: () => { 
        if(window.act.shopUploadChange) window.act.shopUploadChange();
    },
    
    validateNumber: (el, max) => {
        let v = parseInt(el.value);
        if(isNaN(v)) v = ''; else if(max && v > max) v = max;
        el.value = v;
    },

    save: () => { if(!window.isResetting) localStorage.setItem('SQ_V103', JSON.stringify(GlobalState)); },
    navToHistory: () => act.navigate('history'),
    showQA: () => act.alert("Q&A 功能開發中"),
    
    openStats: () => { act.navigate('stats'); },
    closeStats: () => { act.navigate('main'); }, 
    switchTab: (t) => { 
        document.querySelectorAll('.tab').forEach(e => e.classList.remove('active')); document.getElementById('tb-'+t).classList.add('active'); 
        document.querySelectorAll('.stat-sec').forEach(e => e.classList.remove('active')); document.getElementById('sec-'+t).classList.add('active'); 
    }
};

window.act = act;