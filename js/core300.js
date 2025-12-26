/* js/core300.js - V300.Final Core */
const act = {
    showSysModal: (type, msg, val, callback) => { const m = document.getElementById('m-system'); const txt = document.getElementById('sys-msg'); const inp = document.getElementById('sys-input'); const btnOk = document.getElementById('sys-ok'); const btnCancel = document.getElementById('sys-cancel'); m.style.display = 'flex'; m.classList.add('active'); txt.innerText = msg; const newOk = btnOk.cloneNode(true); btnOk.parentNode.replaceChild(newOk, btnOk); const newCancel = btnCancel.cloneNode(true); btnCancel.parentNode.replaceChild(newCancel, btnCancel); if (type === 'prompt') { inp.style.display = 'block'; inp.value = val || ''; inp.focus(); } else { inp.style.display = 'none'; } if (type === 'alert') { newCancel.style.display = 'none'; newOk.onclick = () => { m.style.display = 'none'; if(callback) callback(); }; } else { newCancel.style.display = 'block'; newCancel.onclick = () => { m.style.display = 'none'; }; newOk.onclick = () => { const res = (type === 'prompt') ? inp.value : true; m.style.display = 'none'; if(callback) callback(res); }; } },
    alert: (msg) => act.showSysModal('alert', msg),
    confirm: (msg, cb) => act.showSysModal('confirm', msg, null, cb),
    prompt: (msg, def, cb) => act.showSysModal('prompt', msg, def, cb),
    generateId: (prefix='id') => prefix + '_' + Date.now() + Math.random().toString(36).substr(2, 9),
    clearInputs: (parentId) => { const parent = document.getElementById(parentId); if(!parent) return; parent.querySelectorAll('input, textarea, select').forEach(el => { if(el.type === 'checkbox' || el.type === 'radio') el.checked = false; else if(el.tagName === 'SELECT') el.selectedIndex = 0; else el.value = ''; }); const diffSlider = parent.querySelector('.slider'); if(diffSlider) { diffSlider.value = 2; act.updateDiffLabel(2); } },
    navigate: (p) => { document.querySelectorAll('.page, #page-story, #page-avatar').forEach(e => e.classList.remove('active')); document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active')); let targetPage = p; if (GlobalState.settings.mode === 'basic' && p === 'main') targetPage = 'stats'; const pg = document.getElementById('page-' + targetPage); if(pg) pg.classList.add('active'); const btnId = (targetPage === 'stats' && GlobalState.settings.mode === 'basic') ? 'nav-main' : 'nav-' + p; const btn = document.getElementById(btnId); if(btn) btn.classList.add('active'); if(targetPage === 'main' || targetPage === 'stats' || targetPage === 'task' || targetPage === 'shop') { if(window.view && view.renderHUD) view.renderHUD(); } const fab = document.getElementById('global-fab'); if(fab) { fab.style.display = (targetPage === 'task') ? 'flex' : 'none'; } if(targetPage === 'stats' && window.view && view.renderStats) { setTimeout(() => view.renderStats(), 50); } },
    
    // 設定暫存與生效邏輯
    initSettings: () => {
        TempState.settings = JSON.parse(JSON.stringify(GlobalState.settings)); // 複製一份
        document.getElementById('set-mode').value = TempState.settings.mode;
        act.updateSetBtn('btn-set-cal', TempState.settings.calMode);
        act.updateSetBtn('btn-set-strict', TempState.settings.strictMode);
    },
    toggleSetBtn: (id) => {
        const key = id === 'btn-set-cal' ? 'calMode' : 'strictMode';
        if (key === 'calMode' && !TempState.settings[key]) {
            // 開啟卡路里前先輸入上限
            act.prompt("請輸入每日目標卡路里 (Max: 9999)", "2000", (val) => {
                const limit = parseInt(val);
                if (limit && limit > 0) {
                    TempState.settings.calMax = limit;
                    TempState.settings[key] = true;
                    act.updateSetBtn(id, true);
                } else { act.alert("數值無效"); }
            });
        } else {
            TempState.settings[key] = !TempState.settings[key];
            act.updateSetBtn(id, TempState.settings[key]);
        }
    },
    updateSetBtn: (id, active) => { const el = document.getElementById(id); if(active) el.classList.add('active'); else el.classList.remove('active'); },
    saveSettings: () => {
        TempState.settings.mode = document.getElementById('set-mode').value;
        GlobalState.settings = JSON.parse(JSON.stringify(TempState.settings));
        act.save();
        act.closeModal('settings');
        act.alert("設定已生效");
        if(GlobalState.settings.mode === 'basic') act.navigate('stats'); else act.navigate('main');
        if(window.view) { view.renderHUD(); view.renderStats(); }
    },

    openModal: (id) => { 
        if(id === 'settings') act.initSettings();
        const m=document.getElementById('m-'+id); if(m) { m.style.display='flex'; m.classList.add('active'); } 
    },
    closeModal: (id) => { const m=document.getElementById('m-'+id); if(m) { m.style.display='none'; m.classList.remove('active'); } },

    checkDaily: () => {
        const today = new Date().toISOString().split('T')[0];
        if (GlobalState.lastLoginDate !== today) {
            if (GlobalState.lastLoginDate) { const last = new Date(GlobalState.lastLoginDate); const curr = new Date(today); const diffDays = Math.ceil(Math.abs(curr - last) / (1000 * 60 * 60 * 24)); if (diffDays === 1) GlobalState.loginStreak = (GlobalState.loginStreak || 0) + 1; else GlobalState.loginStreak = 1; } else { GlobalState.loginStreak = 1; }
            GlobalState.lastLoginDate = today;
            let msg = `📅 新的一天！連續登入: ${GlobalState.loginStreak} 天`;
            GlobalState.tasks.forEach(t => { const isDaily = t.cat === '每日'; if (t.pinned && !isDaily) return; if (isDaily) { t.done = false; t.curr = 0; t.lastReward = null; } });
            GlobalState.shop.npc.forEach(i => { if(i.perm === 'daily') i.qty = 99; });
            GlobalState.cal.today = 0; 
            if(GlobalState.story) GlobalState.story.exploreCount = 0;
            act.updateLoginAchievement(); act.alert(msg); act.save();
            if(window.view) { view.renderTasks(); view.renderShop(); }
        }
    },
    updateLoginAchievement: () => { const achId = 'sys_login_streak'; let ach = GlobalState.achievements.find(a => a.id === achId); if (!ach) { ach = { id: achId, title: '🔥 每日簽到', desc: '', type: 'manual', targetVal: 7, reward: { freeGem: 5 }, done: false, isSystem: true }; GlobalState.achievements.unshift(ach); } ach.desc = `目前連續: ${GlobalState.loginStreak} 天 (目標: 7天)`; },
    debugDay: () => { const d = new Date(); d.setDate(d.getDate() - 1); GlobalState.lastLoginDate = d.toISOString().split('T')[0]; act.save(); act.checkDaily(); },
    submitPayment: (amount) => { act.alert(`成功儲值 ${amount} 元！\n獲得 ${amount} 付費鑽石。`); GlobalState.paidGem = (GlobalState.paidGem || 0) + amount; act.closeModal('payment'); act.save(); if(window.view) view.renderHUD(); },
    handleFab: () => { if (TempState.taskTab === 'ach') { if(window.act.openCreateAch) window.act.openCreateAch(); else act.openModal('create-ach'); return; } TempState.editTaskId = null; act.clearInputs('m-create'); if (window.act.initCreateModal) window.act.initCreateModal(); act.openModal('create'); },
    refreshSkillSelect: () => {}, 
    updateDiffLabel: (val) => { const def = DIFFICULTY_DEFS[val]; const lbl = document.getElementById('nt-diff-label'); if(def && lbl) { lbl.innerText = `${def.label}`; lbl.style.color = def.color; } },
    toggleTaskType: (val) => { const tgt = document.getElementById('nt-target'); if(tgt) tgt.style.display = (val === 'count') ? 'block' : 'none'; },
    
    toggleTask: (id) => {
        const t = GlobalState.tasks.find(x => x.id === id);
        if (!t) return;
        if (!t.done) {
            if (t.type === 'count' && t.curr < t.target - 1) { t.curr++; act.save(); view.renderTasks(); return; } else if (t.type === 'count') { t.curr = t.target; }
            t.done = true;
            const reward = act.calculateReward(t.difficulty);
            t.lastReward = reward;
            GlobalState.gold += reward.gold; GlobalState.exp += reward.exp;
            // 技能經驗
            if(t.attrs && t.attrs.length > 0) {
                t.attrs.forEach(skillName => {
                    const skill = GlobalState.skills.find(s => s.name === skillName);
                    if(skill) {
                        skill.exp += reward.exp;
                        skill.lastUsed = new Date().toISOString();
                        // 升級檢查
                        if(skill.exp >= skill.lv * 100) {
                            skill.exp -= skill.lv * 100;
                            skill.lv++;
                            // ★ 技能大師檢查 ★
                            if(skill.lv >= 10 && window.act.checkSkillMastery) window.act.checkSkillMastery(skill);
                        }
                    }
                });
            }
            // 卡路里消耗
            if(GlobalState.settings.calMode && t.cal > 0) {
                GlobalState.cal.today = Math.max(0, GlobalState.cal.today - t.cal);
                GlobalState.cal.logs.unshift(`[任務] ${t.title} -${t.cal}`);
            }
            if (GlobalState.exp >= GlobalState.lv * 100) { GlobalState.exp -= GlobalState.lv * 100; GlobalState.lv++; act.alert(`🆙 升級！ Lv.${GlobalState.lv}`); }
            act.alert(`完成！獲得 金幣+${reward.gold}, 經驗+${reward.exp}`);
        } else {
            t.done = false; if(t.type === 'count') t.curr = 0;
            if (t.lastReward) {
                GlobalState.gold = Math.max(0, GlobalState.gold - t.lastReward.gold);
                GlobalState.exp = Math.max(0, GlobalState.exp - t.lastReward.exp);
                // 卡路里回補
                if(GlobalState.settings.calMode && t.cal > 0) { GlobalState.cal.today += t.cal; GlobalState.cal.logs.unshift(`[取消] ${t.title} +${t.cal}`); }
                t.lastReward = null;
            }
        }
        act.save(); view.renderTasks(); view.renderHUD();
    },
    
    calculateReward: (diffVal) => { const def = DIFFICULTY_DEFS[diffVal] || DIFFICULTY_DEFS[2]; let gold = Math.floor(def.baseGold * ((Math.random() * 0.4) + 0.8)); let exp = def.baseExp; const isCrit = Math.random() < 0.05; if (isCrit) { gold *= 2; exp = Math.floor(exp * 1.5); } return { gold, exp, isCrit }; },
    deleteTask: (id) => { act.confirm("確定刪除?", (yes) => { if(yes) { GlobalState.tasks = GlobalState.tasks.filter(t => t.id !== id); act.save(); act.closeModal('create'); if(window.view) view.renderTasks(); } }); }, 
    uploadCategoryChange: () => { if(window.act.shopUploadChange) window.act.shopUploadChange(); }, 
    validateNumber: (el, max) => { let v = parseInt(el.value); if(isNaN(v)) v = ''; else if(max && v > max) v = max; el.value = v; }, 
    save: () => { if(!window.isResetting) localStorage.setItem('SQ_V103', JSON.stringify(GlobalState)); }, 
    navToHistory: () => { TempState.historyMode = 'history'; act.navigate('history'); },
    navToMilestone: () => { TempState.historyMode = 'milestone'; act.navigate('history'); },
    editTask: (id) => act.editTask(id), 
    showQA: () => act.alert(`指南\n\n冒險者: 預設模式\n基礎: 無大廳\n后宮: 特殊對話`), 
    openStats: () => { act.navigate('stats'); }, closeStats: () => { act.navigate('main'); }, 
    switchTab: (t) => { document.querySelectorAll('.tab').forEach(e => e.classList.remove('active')); document.getElementById('tb-'+t).classList.add('active'); document.querySelectorAll('.stat-sec').forEach(e => e.classList.remove('active')); document.getElementById('sec-'+t).classList.add('active'); }, 
    addSubtask: () => { const div = document.getElementById('nt-subs'); if(!div) return; if(div.children.length >= 10) return; const row = document.createElement('div'); row.className = 'row'; row.innerHTML = `<input class="inp" placeholder="步驟..." style="flex:1;"><button class="btn-del" style="width:45px;" onclick="this.parentElement.remove()">✕</button>`; div.appendChild(row); }, 
    toggleSubtask: (tid, sIdx) => { const t = GlobalState.tasks.find(x => x.id === tid); if(t && t.subs[sIdx]) { t.subs[sIdx].done = !t.subs[sIdx].done; const allDone = t.subs.every(s => s.done); const anyDone = t.subs.some(s => s.done); if (!t.done) { if (t.subRule === 'all' && allDone) act.toggleTask(tid); else if (t.subRule === 'any' && anyDone) act.toggleTask(tid); } act.save(); view.renderTasks(); } },
    resetData: () => { act.confirm("確定重置所有資料?", (yes)=>{ if(yes) { window.isResetting=true; localStorage.clear(); location.reload(); } }); },
    exportData: () => { act.alert("複製以下代碼保存:\n" + JSON.stringify(GlobalState)); },
    importData: () => { act.prompt("貼上代碼", "", (val)=>{ if(val) { try { GlobalState = JSON.parse(val); act.save(); location.reload(); } catch(e){ act.alert("格式錯誤"); } } }); }
};
function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return d.toLocaleDateString(); }
window.act = act;