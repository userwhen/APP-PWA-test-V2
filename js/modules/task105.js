/* js/modules/task105.js */
window.act = window.act || {};

Object.assign(window.act, {
    switchTaskTab: (tab) => {
        TempState.taskTab = tab;
        document.querySelectorAll('.h-tab').forEach(el => el.classList.remove('active'));
        document.getElementById('tab-' + tab).classList.add('active');
        const page = document.getElementById('page-task');
        const fab = document.getElementById('global-fab');
        const ctrlRow = document.getElementById('task-ctrl-row');
        if (tab === 'ach') {
            page.classList.add('theme-yellow'); document.body.classList.add('mode-ach');
            if(fab) fab.style.background = 'var(--gold)';
            if(ctrlRow) ctrlRow.style.display = 'none';
        } else {
            page.classList.remove('theme-yellow'); document.body.classList.remove('mode-ach');
            if(fab) fab.style.background = 'var(--acc)';
            if(ctrlRow) ctrlRow.style.display = 'flex';
        }
        if (window.view && view.renderTasks) view.renderTasks();
    },
    
    initCreateModal: () => {
        act.renderTaskCats('nt-cats'); act.renderAttrs('nt-attrs'); act.checkTaskType();
        document.getElementById('btn-del-task').style.display = 'none';
        const s = document.getElementById('nt-item'); s.innerHTML = '<option value="">無</option>';
        [...GlobalState.shop.npc, ...GlobalState.shop.user].forEach(i => { s.innerHTML += `<option value="${i.name}">${i.name}</option>`; });
        document.getElementById('nt-subs').innerHTML = '';
        document.getElementById('nt-rand').checked = false;
        act.toggleRandom(); 
    },

    submitTask: () => {
        const title = document.getElementById('nt-title').value; if (!title) return act.alert("請輸入標題");
        const cats = []; document.querySelectorAll('#nt-cats .tag-btn.active').forEach(b => cats.push(b.innerText));
        const attrs = []; document.querySelectorAll('#nt-attrs .tag-item.active').forEach(b => attrs.push(b.innerText));
        const type = document.getElementById('nt-type').value;
        const target = Number(document.getElementById('nt-target').value) || 1;
        const task = { 
            id: TempState.editTaskId || act.generateId(), 
            title: title, desc: document.getElementById('nt-desc').value, 
            cat: cats.length ? cats[0] : '每日', 
            pinned: document.getElementById('nt-pinned').checked, 
            type: type, target: target, curr: 0, 
            attrs: attrs, 
            gold: Number(document.getElementById('nt-gold').value)||0, 
            exp: Number(document.getElementById('nt-exp').value)||0, 
            item: document.getElementById('nt-item').value, 
            itemQty: Number(document.getElementById('nt-item-qty').value)||1, 
            rand: document.getElementById('nt-rand').checked, 
            pType: document.getElementById('nt-p-type').value, 
            pVal: Number(document.getElementById('nt-p-val').value)||0, 
            deadline: document.getElementById('nt-deadline').value, 
            dur: Number(document.getElementById('nt-dur').value)||0, 
            cal: Number(document.getElementById('nt-cal').value)||0, 
            subs: [], done: false 
        };
        document.querySelectorAll('#nt-subs input').forEach(i => { if(i.value) task.subs.push({text:i.value, done:false}); });
        
        if (TempState.editTaskId) { 
            const idx = GlobalState.tasks.findIndex(t => t.id === TempState.editTaskId); 
            if (idx > -1) { 
                task.curr = GlobalState.tasks[idx].curr; 
                task.done = GlobalState.tasks[idx].done; 
                GlobalState.tasks[idx] = task; 
            } 
        } else { GlobalState.tasks.push(task); }
        act.closeModal('create'); act.save();
    },

    editTask: (id) => {
        const t = GlobalState.tasks.find(x => x.id === id);
        if(t) {
            TempState.editTaskId = t.id; act.openModal('create');
            document.getElementById('nt-title').value = t.title;
            document.getElementById('nt-desc').value = t.desc;
            document.getElementById('nt-pinned').checked = t.pinned;
            document.getElementById('btn-pin-toggle').classList.toggle('active', t.pinned);
            
            document.querySelectorAll('#nt-cats .tag-btn').forEach(btn => { if(btn.innerText === t.cat) btn.classList.add('active'); else btn.classList.remove('active'); });
            document.querySelectorAll('#nt-attrs .tag-item').forEach(btn => { if(t.attrs && t.attrs.includes(btn.innerText)) btn.classList.add('active'); else btn.classList.remove('active'); });
            
            document.getElementById('nt-type').value = t.type;
            document.getElementById('nt-target').value = t.target;
            act.checkTaskType();
            
            document.getElementById('nt-gold').value = t.gold;
            document.getElementById('nt-exp').value = t.exp;
            document.getElementById('nt-rand').checked = t.rand;
            act.toggleRandom();
            
            document.getElementById('nt-item').value = t.item;
            document.getElementById('nt-item-qty').value = t.itemQty;
            act.checkItemQty();
            
            document.getElementById('nt-p-type').value = t.pType || 'none';
            document.getElementById('nt-p-val').value = t.pVal || 0;
            act.checkPunishInput();
            document.getElementById('nt-deadline').value = t.deadline;
            document.getElementById('nt-dur').value = t.dur;
            document.getElementById('nt-cal').value = t.cal;
            
            const subBox = document.getElementById('nt-subs'); subBox.innerHTML = '';
            if(t.subs) { t.subs.forEach(s => { const div = document.createElement('div'); div.className = 'row'; div.innerHTML = `<input class="inp flex-1" placeholder="子任務" value="${s.text}"><button class="btn-del" style="padding:5px 10px;" onclick="this.parentNode.remove()">✕</button>`; subBox.appendChild(div); }); }

            document.getElementById('btn-del-task').style.display = 'block';
        }
    },
    
    deleteTask: () => { act.confirm("確定刪除?", (yes) => { if(yes) { GlobalState.tasks = GlobalState.tasks.filter(t => t.id !== TempState.editTaskId); act.closeModal('create'); act.save(); } }); },
    
    renderTaskCats: (elId) => {
        const c = document.getElementById(elId); if(!c) return; c.innerHTML = '';
        GlobalState.cats.forEach(cat => {
            const sp = document.createElement('span'); sp.className = 'tag-btn'; sp.innerText = cat;
            sp.onclick = () => { c.querySelectorAll('.tag-btn').forEach(b=>b.classList.remove('active')); sp.classList.add('active'); };
            c.appendChild(sp);
        });
        const addBtn = document.createElement('span'); addBtn.className = 'add-tag-btn'; addBtn.innerText = '+';
        addBtn.onclick = () => {
            act.prompt('新標籤', '', (val) => {
                if (val && !GlobalState.cats.includes(val)) {
                    GlobalState.cats.push(val); act.save();
                    if (elId === 'nt-cats') act.renderTaskCats('nt-cats');
                    if (window.view && view.renderTasks) view.renderTasks();
                }
            });
        };
        c.appendChild(addBtn);
        if(GlobalState.cats.length>0 && c.children[0] !== addBtn) c.children[0].classList.add('active');
    },
    
    renderAttrs: (elId) => { 
        const c = document.getElementById(elId); if(!c) return; c.innerHTML = ''; 
        const toggle = (el) => {
            if (el.classList.contains('active')) {
                el.classList.remove('active');
            } else {
                if (c.querySelectorAll('.tag-item.active').length < 3) el.classList.add('active');
            }
        };
        Object.values(GlobalState.attrs).forEach(a => { const sp = document.createElement('span'); sp.className = 'tag-item'; sp.innerText = a.name; sp.onclick = () => toggle(sp); c.appendChild(sp); }); 
        if(GlobalState.skills) {
            GlobalState.skills.forEach(s => { const sp = document.createElement('span'); sp.className = 'tag-item'; sp.innerText = s.name; sp.onclick = () => toggle(sp); c.appendChild(sp); });
        }
    },
    
    checkTaskType: () => { const t = document.getElementById('nt-type').value; document.getElementById('nt-target').style.display = (t === 'count') ? 'block' : 'none'; },
    togglePinCreate: () => { const cb = document.getElementById('nt-pinned'); cb.checked = !cb.checked; document.getElementById('btn-pin-toggle').classList.toggle('active', cb.checked); },
    checkItemQty: () => { const show = document.getElementById('nt-item').value !== ""; document.getElementById('nt-item-qty').style.display = show ? 'block' : 'none'; },
    toggleRandom: () => { 
        const r = document.getElementById('nt-rand').checked; 
        const g = document.getElementById('nt-gold');
        const e = document.getElementById('nt-exp');
        const i = document.getElementById('nt-item');
        if(r) {
            g.classList.add('disabled'); g.placeholder = "隨機";
            e.classList.add('disabled'); e.placeholder = "隨機";
            i.classList.add('disabled');
        } else {
            g.classList.remove('disabled'); g.placeholder = "金幣";
            e.classList.remove('disabled'); e.placeholder = "經驗";
            i.classList.remove('disabled');
        }
    },
    checkPunishInput: () => { const t = document.getElementById('nt-p-type').value; document.getElementById('nt-p-val').style.display = (t !== 'none') ? 'block' : 'none'; },
    addSubtask: () => { const div = document.createElement('div'); div.className = 'row'; div.innerHTML = `<input class="inp flex-1" placeholder="子任務"><button class="btn-del" style="padding:5px 10px;" onclick="this.parentNode.remove()">✕</button>`; document.getElementById('nt-subs').appendChild(div); },
    toggleTask: (id) => { const t = GlobalState.tasks.find(x => x.id === id); if(!t) return; if (t.type === 'count') { t.curr++; if (t.curr >= t.target) { t.curr = t.target; t.done = true; act.applyReward(t); } } else { t.done = !t.done; if (t.done) act.applyReward(t); else act.revertReward(t); } act.save(); },
    toggleSubtask: (tid, sidx) => { const t = GlobalState.tasks.find(x => x.id === tid); if (t && t.subs[sidx]) { t.subs[sidx].done = !t.subs[sidx].done; const all = t.subs.every(s=>s.done); if (all && !t.done) { t.done = true; act.applyReward(t); } act.save(); } },
    
    applyReward: (t) => { 
        let g = t.gold, e = t.exp; 
        let itemMsg = "";
        
        if (t.rand) { 
            g = Math.floor(Math.random()*(100)); 
            e = Math.floor(Math.random()*(100)); 
            const pool = [...GlobalState.shop.npc, ...GlobalState.shop.user];
            if (pool.length > 0) {
                const rndItem = pool[Math.floor(Math.random() * pool.length)];
                GlobalState.bag.push({ ...rndItem, uid: Date.now() }); 
                itemMsg = `, 物品: ${rndItem.name}`;
            }
        } else {
            if (t.item) {
                const baseItem = [...GlobalState.shop.npc, ...GlobalState.shop.user].find(i=>i.name === t.item) || { name: t.item, desc: "任務獎勵", category: "其他", val: 0 };
                for(let i=0; i<t.itemQty; i++) GlobalState.bag.push({ ...baseItem, uid: Date.now() + Math.random() });
                itemMsg = `, 物品: ${t.item} x${t.itemQty}`;
            }
        }
        
        GlobalState.gold += g; GlobalState.exp += e; 
        
        if (t.attrs) {
            t.attrs.forEach(name => { 
                const attr = Object.values(GlobalState.attrs).find(a => a.name === name);
                if(attr) attr.e += 1;
                const skill = GlobalState.skills.find(s => s.name === name);
                if(skill) skill.exp += 1;
            }); 
        }
        if (t.cal > 0 && GlobalState.settings.calMode) GlobalState.cal.today += t.cal; 
        
        act.checkLevelUp(); act.checkAttrLevelUp(); 
        act.alert(`完成！獲得 金幣:${g}, 經驗:${e}${itemMsg}`);
        if(window.view) view.renderHUD();
    },
    
    // [修正] 循環降級只在嚴格模式
    revertReward: (t) => { 
        GlobalState.gold = Math.max(0, GlobalState.gold - t.gold); 
        GlobalState.exp -= t.exp;
        
        while (GlobalState.exp < 0) {
            if (GlobalState.settings.strictMode && GlobalState.lv > 1) { 
                GlobalState.lv--;
                GlobalState.exp += GlobalState.lv * 100;
            } else {
                GlobalState.exp = 0; break;
            }
        }
        if(window.view) view.renderHUD();
        act.alert(`取消完成。\n扣除 金幣:${t.gold}, 經驗:${t.exp}`);
    },
    
    checkLevelUp: () => { 
        while (true) {
            const max = GlobalState.lv * 100; 
            if (GlobalState.exp >= max) { 
                GlobalState.exp -= max; 
                GlobalState.lv++; 
                act.alert("升級！ Lv." + GlobalState.lv); 
            } else { break; }
        }
    },
    checkAttrLevelUp: () => { for(let k in GlobalState.attrs) { const a = GlobalState.attrs[k]; if (a.e >= a.v * 10) { a.e -= a.v * 10; a.v++; } } GlobalState.skills.forEach(s => { if (s.exp >= s.lv * 10) { s.exp -= s.lv * 10; s.lv++; } }); },
    
    // [修正] 懲罰連動技能 + 嚴格降級
    applyPenalty: (t, report) => { 
        if (!t.pType || t.pType === 'none') return; 
        const val = t.pVal; 
        let msg = "";
        
        if (t.pType === 'gold') { GlobalState.gold = Math.max(0, GlobalState.gold - val); msg = `金幣 -${val}`; }
        
        if (t.pType === 'exp') { 
            GlobalState.exp -= val;
            while (GlobalState.exp < 0) {
                if (GlobalState.settings.strictMode && GlobalState.lv > 1) {
                    GlobalState.lv--;
                    GlobalState.exp += GlobalState.lv * 100;
                } else {
                    GlobalState.exp = 0; break;
                }
            }
            msg = `經驗 -${val}`; 
        }
        
        if (t.pType === 'attr' && t.attrs.length) { 
            t.attrs.forEach(name => { 
                // 扣屬性
                const attr = Object.values(GlobalState.attrs).find(a => a.name === name);
                if(attr) attr.e = Math.max(0, attr.e - val);
                
                // 扣技能
                const skill = GlobalState.skills.find(s => s.name === name);
                if(skill) skill.exp = Math.max(0, skill.exp - val);
            }); 
            msg = `屬性/技能經驗 -${val}`;
        }
        
        if(msg) act.alert(`任務失敗懲罰：${msg}`);
    }
});