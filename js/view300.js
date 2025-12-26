/* js/view300.js - V300.101 Safe View */

// ★ 改用 var 宣告 ★
var view = {
    render: () => { 
        view.renderHUD(); 
        view.renderTasks(); 
        view.renderShop(); 
        // 確保更新模式 UI
        if(view.updateModeUI) view.updateModeUI();
    },
    
    renderHUD: () => {
        document.getElementById('ui-gold').innerText = GlobalState.gold; 
        document.getElementById('ui-lv').innerText = GlobalState.lv;
        document.getElementById('ui-gem').innerText = GlobalState.freeGem || 0;
        document.getElementById('ui-p-gem').innerText = GlobalState.paidGem || 0;
        
        const max = GlobalState.lv * 100;
        const expPct = Math.min(100, (GlobalState.exp / max) * 100);
        
        const expBar = document.getElementById('ui-exp-bar');
        if(expBar) expBar.style.width = expPct + '%';
        const expTxt = document.getElementById('ui-exp-text');
        if(expTxt) expTxt.innerText = `${GlobalState.exp}/${max}`;
        
        const showCal = GlobalState.settings.calMode;
        document.querySelectorAll('.cal-show').forEach(e => e.style.display = showCal ? 'block' : 'none');
        
        if (showCal) {
            const cv = document.getElementById('ui-cal-val');
            if(cv) cv.innerText = GlobalState.cal.today;
            const cm = document.getElementById('ui-cal-max');
            if(cm) cm.innerText = GlobalState.settings.calMax;
            const cl = document.getElementById('cal-logs');
            if(cl) cl.innerHTML = GlobalState.cal.logs.map(l => `<div style="font-size:0.8rem;color:#888;">${l}</div>`).join('');
        }
        document.body.className = 'mode-' + (GlobalState.settings.mode || 'adventurer');
    },

    updateModeUI: () => {
        const mode = GlobalState.settings.mode || 'adventurer';
        const icons = { 
            adventurer: { task: '📝', bag: '🎒', avatar: '🛡️', qa: '❓' }, 
            harem: { task: '💋', bag: '👜', avatar: '👙', qa: '💕' }, 
            basic: { task: '📝', bag: '🎒', avatar: '👗', qa: '❓' } 
        };
        
        const cur = icons[mode] || icons.adventurer;
        const btnTask = document.getElementById('btn-q-task'); if(btnTask) btnTask.innerText = cur.task;
        const btnBag = document.getElementById('btn-q-bag'); if(btnBag) btnBag.innerText = cur.bag;
        const btnAv = document.getElementById('btn-q-avatar'); if(btnAv) btnAv.innerText = cur.avatar;

        const stage = document.getElementById('lobby-stage');
        const storyBtn = document.getElementById('btn-story-mode');
        const quickIcons = document.getElementById('main-icons');
        const statsBody = document.querySelector('#page-stats .stats-body');
        const mainScene = document.querySelector('.main-scene'); 

        if (mode === 'basic') {
            if(stage) stage.style.display = 'none';
            if(storyBtn) storyBtn.style.display = 'none';
            if(quickIcons && statsBody && quickIcons.parentNode !== statsBody) {
                statsBody.insertBefore(quickIcons, statsBody.firstChild);
                quickIcons.style.position = 'relative'; quickIcons.style.top = '0'; quickIcons.style.flexDirection = 'row'; quickIcons.style.justifyContent = 'center'; quickIcons.style.marginBottom = '15px';
            }
        } else {
            if(stage) stage.style.display = 'flex';
            if(storyBtn) storyBtn.style.display = 'block';
            if(quickIcons && mainScene && quickIcons.parentNode !== mainScene) {
                mainScene.insertBefore(quickIcons, mainScene.firstChild);
                quickIcons.style.position = 'absolute'; quickIcons.style.top = '110px'; quickIcons.style.flexDirection = 'column';
            }
        }
        
        const npcText = document.getElementById('shop-npc-text');
        if (npcText) {
            if (mode === 'harem') npcText.innerText = "主人，今晚想喝點什麼？";
            else if (mode === 'basic') npcText.innerText = "物資補給處";
            else npcText.innerText = "歡迎光臨，冒險者...";
        }
    },

    renderTasks: () => {
        const list = document.getElementById('task-list'); 
        list.innerHTML = '';
        if (TempState.taskTab === 'ach') { view.renderAchievements(list); return; }

        const catsRow = document.getElementById('task-cats-row');
        if(catsRow) {
            catsRow.style.display = 'flex';
            catsRow.innerHTML = ['全部', ...GlobalState.cats].map(c => `<span class="tag-btn ${TempState.filterCategory===c?'active':''}" onclick="TempState.filterCategory='${c}';view.renderTasks()">${c}</span>`).join('');
        }

        let tasks = GlobalState.tasks;
        if (TempState.filterCategory !== '全部') tasks = tasks.filter(t => t.cat === TempState.filterCategory);
        if (tasks.length === 0) { list.innerHTML = '<div style="text-align:center;color:#666;margin-top:20px">暫無任務</div>'; return; }

        tasks.forEach(t => {
            const div = document.createElement('div');
            const diffDef = DIFFICULTY_DEFS[t.difficulty] || DIFFICULTY_DEFS[2];
            div.className = `t-card ${t.done ? 'done' : ''}`;
            div.style.borderLeft = `5px solid ${diffDef.color}`;
            const subList = (t.subs && t.subs.length) ? `<div class="t-subs">` + t.subs.map((s,i) => `<div class="sub-row ${s.done?'done':''}" onclick="event.stopPropagation();act.toggleSubtask('${t.id}',${i})"><div class="chk-sm ${s.done?'checked':''}"></div><span>${s.text}</span></div>`).join('') + `</div>` : '';
            const countDisplay = t.type === 'count' ? `<span style="font-size:0.8rem;color:#666;">(${t.curr}/${t.target})</span>` : '';
            div.innerHTML = `<div class="t-top"><div class="t-title-container" onclick="act.toggleTask('${t.id}')"><div class="chk ${t.done?'checked':''}"></div><div class="t-title">${t.pinned ? '📌 ' : ''}${t.title}${countDisplay}</div></div><button class="btn-icon-flat" onclick="act.editTask('${t.id}')">⚙️</button></div>${subList}`;
            list.appendChild(div);
        });
    },

    renderAchievements: (container) => {
        document.getElementById('task-cats-row').style.display = 'none';
        if (GlobalState.achievements.length === 0) { container.innerHTML = '<div style="text-align:center;color:#666;margin-top:20px">暫無成就</div>'; return; }
        GlobalState.achievements.forEach(a => {
            const div = document.createElement('div');
            div.className = `t-card ${a.done?'done':''} ach`;
            div.innerHTML = `<div class="t-top"><div class="t-title-container" onclick="window.act.toggleAchievement('${a.id}')"><div class="chk ach-chk ${a.done?'checked':''}"></div><div class="t-title">${a.title}<div style="font-size:0.8rem;color:#666;">${a.desc}</div></div></div><button class="btn-icon-flat" onclick="act.manageAchievement('${a.id}')">⚙️</button></div>`;
            container.appendChild(div);
        });
    },

    renderShop: () => {
        const list = document.getElementById('shop-list'); if(!list) return; list.innerHTML = '';
        const shopTabs = document.getElementById('shop-tabs');
        if(shopTabs) shopTabs.innerHTML = ['全部', '熱量', '時間', '金錢', '其他'].map(c => `<span class="tag-btn ${TempState.shopCategory===c?'active':''}" onclick="TempState.shopCategory='${c}';view.renderShop()">${c}</span>`).join('');

        let items = [...GlobalState.shop.npc, ...GlobalState.shop.user];
        if (TempState.shopCategory !== '全部') items = items.filter(i => i.category === TempState.shopCategory);
        items.forEach(i => {
            const div = document.createElement('div'); 
            div.className = `s-item ${i.qty<=0?'sold-out':''}`;
            const manageBtn = i.id.startsWith('def_') ? '' : `<button class="s-manage-btn" onclick="event.stopPropagation();act.editShopItem('${i.id}')">⚙️</button>`;
            div.innerHTML = `${manageBtn}<div>${i.name}</div><div style="color:gold">$${i.price}</div><span style="font-size:0.7rem;color:#888;">剩:${i.qty}</span>`;
            div.onclick = () => { if(window.act.buy) window.act.buy(i); };
            list.appendChild(div);
        });
    },

    renderStats: () => {
        const list = document.getElementById('attr-list'); if (!list) return; list.innerHTML = '';
        for (const [key, attr] of Object.entries(GlobalState.attrs)) {
            const max = attr.v * 100;
            const pct = Math.min(100, (attr.exp / max) * 100);
            list.innerHTML += `<div class="attr-item"><div class="attr-row-top"><span>${attr.icon || ''} ${attr.name} <span style="font-size:0.8rem;color:#888;">Lv.${attr.v}</span></span><span style="font-size:0.8rem;">${attr.exp}/${max}</span></div><div class="bar-box"><div class="bar-fill" style="width:${pct}%"></div></div></div>`;
        }
        const skillList = document.getElementById('skill-list');
        if(skillList) {
            skillList.innerHTML = '';
            GlobalState.skills.forEach(s => {
                const pAttr = GlobalState.attrs[s.parent];
                skillList.innerHTML += `<div class="tag-item" style="display:inline-flex; align-items:center; margin:3px;">${pAttr?pAttr.icon:''} ${s.name} <span style="font-size:0.8rem;color:#666;margin-left:4px;">Lv.${s.lv}</span><span style="margin-left:5px; color:#d32f2f; cursor:pointer;" onclick="act.deleteSkillByName('${s.name}')">✕</span></div>`;
            });
        }
        const cv = document.getElementById('radar');
        if(cv && window.Chart) {
            if(window.myChart) window.myChart.destroy();
            window.myChart = new Chart(cv, { type: 'radar', data: { labels: Object.values(GlobalState.attrs).map(a=>a.name), datasets:[{ label:'能力', data:Object.values(GlobalState.attrs).map(a=>a.v), backgroundColor:'rgba(0,137,123,0.2)', borderColor:'#00897b', borderWidth: 2, pointRadius: 0 }] }, options: { maintainAspectRatio:false, scales:{ r:{ grid:{color:'#ccc'}, ticks:{display:false, maxTicksLimit: 5}, pointLabels:{font:{size:14}} } }, plugins:{legend:{display:false}} } });
        }
    },
    
    renderBag: () => {
        const grid = document.getElementById('bag-grid'); if(!grid) return; grid.innerHTML = '';
        const counts = {}; GlobalState.bag.forEach(i => counts[i.name] = (counts[i.name]||0)+1);
        if(Object.keys(counts).length === 0) { grid.innerHTML = '<div style="width:200%;text-align:center;color:#888;">背包是空的</div>'; return; }
        Object.keys(counts).forEach(n => {
            const d = document.createElement('div'); d.className = 's-item';
            d.innerHTML = `<div>${n}</div><div style="font-size:0.8rem">x${counts[n]}</div>`;
            d.onclick = () => { document.getElementById('bd-name').value = n; document.getElementById('bd-qty').value = 1; act.openModal('bag-detail'); };
            grid.appendChild(d);
        });
    }
};
window.view = view;