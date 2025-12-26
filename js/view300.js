/* js/view300.js - V300.Final View */
const view = {
    render: () => { 
        view.renderHUD(); 
        view.renderTasks(); 
        view.renderShop(); 
        if(view.renderBag) view.renderBag();
        // 如果在歷史頁，根據模式渲染
        if(document.getElementById('page-history').classList.contains('active')) view.renderHistoryPage();
    },
    
    renderHUD: () => {
        document.getElementById('ui-gold').innerText = GlobalState.gold; 
        document.getElementById('ui-lv').innerText = GlobalState.lv;
        document.getElementById('ui-gem').innerText = GlobalState.freeGem || 0;
        document.getElementById('ui-p-gem').innerText = GlobalState.paidGem || 0;
        document.body.className = 'mode-' + GlobalState.settings.mode;
        const max = GlobalState.lv * 100;
        const expPct = Math.min(100, (GlobalState.exp / max) * 100);
        const expBar = document.getElementById('ui-exp-bar'); if(expBar) expBar.style.width = expPct + '%';
        const expTxt = document.getElementById('ui-exp-text'); if(expTxt) expTxt.innerText = `${GlobalState.exp}/${max}`;
        
        const btnStatsBack = document.getElementById('btn-stats-back');
        if(btnStatsBack) btnStatsBack.style.display = (GlobalState.settings.mode === 'basic') ? 'none' : 'flex';
    },

    renderQuick: () => {
        const list = document.getElementById('quick-list'); if(!list) return; list.innerHTML = '';
        const todayStr = new Date().toISOString().split('T')[0];
        const tasks = GlobalState.tasks.filter(t => {
            const isToday = t.deadline && t.deadline.startsWith(todayStr);
            return (t.cat === '每日') || t.pinned || isToday;
        });
        if(tasks.length === 0) { list.innerHTML = '<div style="text-align:center;color:#888;margin-top:20px;">🎉 今日無待辦事項</div>'; return; }
        tasks.forEach(t => {
            const div = document.createElement('div');
            const diffDef = DIFFICULTY_DEFS[t.difficulty] || DIFFICULTY_DEFS[2];
            div.className = 't-card'; div.style.padding = '12px'; div.style.borderLeft = `5px solid ${diffDef.color}`;
            div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-weight:bold;font-size:1.1rem;">${t.pinned?'📌 ':''}${t.title}</span><button class="btn-xs" style="font-size:1.2rem;">→</button></div>`;
            div.onclick = () => { act.closeModal('quick'); act.navigate('task'); };
            list.appendChild(div);
        });
    },

    renderTasks: () => {
        const list = document.getElementById('task-list'); list.innerHTML = '';
        if (TempState.taskTab === 'ach') { view.renderAchievements(list); return; }
        const cats = ['全部', ...GlobalState.cats];
        const catsRow = document.getElementById('task-cats-row');
        if(catsRow) { catsRow.innerHTML = cats.map(c => `<span class="tag-btn ${TempState.filterCategory===c?'active':''}" onclick="TempState.filterCategory='${c}';view.renderTasks()">${c}</span>`).join(''); }
        let tasks = GlobalState.tasks;
        if (TempState.filterCategory !== '全部') { tasks = tasks.filter(t => t.cat === TempState.filterCategory); }
        if (tasks.length === 0) { list.innerHTML = '<div style="text-align:center;color:#666;margin-top:20px">暫無任務</div>'; return; }
        tasks.forEach(t => {
            const div = document.createElement('div');
            const diffDef = DIFFICULTY_DEFS[t.difficulty] || DIFFICULTY_DEFS[2];
            div.className = `t-card ${t.done ? 'done' : ''}`; div.style.borderLeft = `6px solid ${diffDef.color}`;
            let progressBar = '';
            if (t.subs && t.subs.length > 0) {
                const doneCount = t.subs.filter(s => s.done).length; const pct = Math.round((doneCount / t.subs.length) * 100);
                progressBar = `<div class="progress-track" style="position:relative; margin-top:8px; height:6px; background:#eee; border-radius:3px;"><div class="progress-fill" style="width:${pct}%; height:100%; background:${diffDef.color}; border-radius:3px;"></div></div>`;
            }
            let attrTags = '';
            if(t.attrs && t.attrs.length > 0) {
                // 顯示綁定的技能名稱 + 屬性圖示
                attrTags = t.attrs.map(sn => {
                    const sk = GlobalState.skills.find(s=>s.name===sn) || GlobalState.archivedSkills.find(s=>s.name===sn);
                    const icon = sk ? (GlobalState.attrs[sk.parent]?.icon || '') : '';
                    return `<span class="skill-pill" style="font-size:0.8rem; background:#eee; padding:2px 6px; border-radius:4px; margin-left:5px;">${sn} ${icon}</span>`;
                }).join('');
            }
            const subList = (t.subs && t.subs.length) ? `<div class="t-subs">` + t.subs.map((s,i) => `<div class="sub-row" onclick="event.stopPropagation();act.toggleSubtask('${t.id}',${i})"><div class="chk-sm ${s.done?'checked':''}"></div><span>${s.text}</span></div>`).join('') + `</div>` : '';
            const countDisplay = t.type === 'count' ? `<span style="font-size:0.9rem;color:#666;margin-left:5px;">(${t.curr}/${t.target})</span>` : '';
            div.innerHTML = `<div class="t-top"><div class="t-title-container" onclick="act.toggleTask('${t.id}')"><div class="chk ${t.done?'checked':''}"></div><div class="t-title">${t.pinned ? '📌 ' : ''}${t.title}${countDisplay}<div style="margin-top:4px; font-weight:normal; font-size:0.85rem; color:#666;">${diffDef.label} ${attrTags}</div></div></div>${t.isUser ? `<button class="btn-icon-flat" onclick="event.stopPropagation();act.editTask('${t.id}')">⚙️</button>` : ''}</div>${progressBar}${subList}`;
            list.appendChild(div);
        });
    },

    renderAchievements: (container) => {
        if (GlobalState.achievements.length === 0) { container.innerHTML = '<div style="text-align:center;color:#666;margin-top:20px">暫無成就</div>'; return; }
        GlobalState.achievements.forEach(a => {
            const div = document.createElement('div'); div.className = `t-card ${a.done?'done':''} ach`;
            const delBtn = a.isSystem ? '' : `<button class="btn-icon-flat" style="position:absolute; top:5px; right:5px;" onclick="event.stopPropagation();act.manageAchievement('${a.id}')">⚙️</button>`;
            div.innerHTML = `<div class="t-top"><div class="t-title-container" onclick="window.act.toggleAchievement('${a.id}')"><div class="chk ach-chk ${a.done?'checked':''}"></div><div class="t-title">${a.title}<div style="font-size:0.8rem;color:#666;font-weight:normal;">${a.desc}</div></div></div>${delBtn}</div>`;
            container.appendChild(div);
        });
    },

    renderHistoryPage: () => {
        const title = document.getElementById('history-title');
        const badgeArea = document.getElementById('milestone-badges');
        const list = document.getElementById('history-list');
        list.innerHTML = '';
        
        if (TempState.historyMode === 'milestone') {
            title.innerText = '榮譽殿堂';
            badgeArea.style.display = 'grid';
            badgeArea.innerHTML = '';
            
            // 徽章
            GlobalState.archivedSkills.forEach(s => {
                const icon = GlobalState.attrs[s.parent]?.icon || '🏆';
                badgeArea.innerHTML += `<div class="badge-item" title="${s.name}">${icon}</div>`;
            });
            
            // 列表
            if (GlobalState.archivedSkills.length === 0) list.innerHTML = '<div style="text-align:center;color:#888;">尚未有技能畢業</div>';
            GlobalState.archivedSkills.forEach(s => {
                const d = document.createElement('div'); d.className = 't-card';
                d.innerHTML = `<div style="font-weight:bold;">${s.name} 大師</div><div style="font-size:0.8rem;color:#666;">累積經驗: ${s.exp} | 畢業於: ${s.retireDate || '未知'}</div>`;
                list.appendChild(d);
            });
        } else {
            title.innerText = '歷史紀錄';
            badgeArea.style.display = 'none';
            if (GlobalState.history.length === 0) list.innerHTML = '<div style="text-align:center;color:#888;">暫無紀錄</div>';
            GlobalState.history.slice().reverse().forEach(h => {
                const d = document.createElement('div'); d.className = 't-card';
                d.innerHTML = `<div>${h.title}</div><div style="font-size:0.8rem;color:${h.status==='success'?'green':'red'};">${h.date} - ${h.rewards}</div>`;
                list.appendChild(d);
            });
        }
    },

    renderShop: () => {
        const list = document.getElementById('shop-list'); if(!list) return; list.innerHTML = '';
        const shopTabs = document.getElementById('shop-tabs');
        if(shopTabs) { const cats = ['全部', '熱量', '時間', '金錢', '其他']; shopTabs.innerHTML = cats.map(c => `<span class="tag-btn ${TempState.shopCategory===c?'active':''}" onclick="TempState.shopCategory='${c}';view.renderShop()">${c}</span>`).join(''); }
        let items = [...GlobalState.shop.npc, ...GlobalState.shop.user];
        if (TempState.shopCategory !== '全部') items = items.filter(i => i.category === TempState.shopCategory);
        items.forEach(i => {
            const div = document.createElement('div'); div.className = `s-item ${i.qty<=0?'sold-out':''}`;
            const isNpc = i.id.startsWith('def_');
            const manageBtn = isNpc ? '' : `<button class="s-manage-btn" onclick="event.stopPropagation();act.editShopItem('${i.id}')">⚙️</button>`;
            div.innerHTML = `${manageBtn}<div>${i.name}</div><div style="color:gold; font-weight:bold;">$${i.price}</div><span style="font-size:0.8rem;color:#888;">剩:${i.qty}</span>`;
            div.onclick = () => { if(window.act.buy) window.act.buy(i); };
            list.appendChild(div);
        });
    },

    renderBag: () => {
        const grid = document.getElementById('bag-grid'); if(!grid) return; grid.innerHTML = '';
        const counts = {}; GlobalState.bag.forEach(i => counts[i.name] = (counts[i.name]||0)+1);
        if(Object.keys(counts).length === 0) { grid.innerHTML = '<div style="width:200%;text-align:center;color:#888;">背包是空的</div>'; return; }
        Object.keys(counts).forEach(n => {
            const div = document.createElement('div'); div.className = 's-item';
            div.innerHTML = `<div>${n}</div><div style="font-weight:bold;">x${counts[n]}</div>`;
            div.onclick = () => { document.getElementById('bd-name').value = n; document.getElementById('bd-qty').value = 1; act.openModal('bag-detail'); };
            grid.appendChild(div);
        });
    },

    renderStats: () => {
        const list = document.getElementById('attr-list'); if (!list) return; list.innerHTML = '';
        
        // 屬性分頁與卡路里分頁顯示控制
        const tabs = document.getElementById('stats-tabs');
        if (GlobalState.settings.calMode) {
            tabs.style.display = 'flex';
            document.getElementById('sec-cal').style.display = 'none'; // 預設隱藏
        } else {
            tabs.style.display = 'none';
            document.getElementById('sec-cal').style.display = 'none';
            document.getElementById('sec-attr').style.display = 'block';
        }

        // 繪製六大屬性
        for (const [key, attr] of Object.entries(GlobalState.attrs)) {
            const max = attr.v * 100; const pct = Math.min(100, (attr.exp / max) * 100);
            list.innerHTML += `<div class="attr-item"><div class="attr-row-top"><span>${attr.icon} ${attr.name} <span style="font-size:0.8rem;color:#888;">Lv.${attr.v}</span></span></div><div class="bar-box"><div class="bar-fill" style="width:${pct}%"></div><div class="bar-text">${attr.exp}/${max}</div></div></div>`;
        }
        
        const skillList = document.getElementById('skill-list');
        if(skillList) {
            skillList.innerHTML = ''; 
            if (GlobalState.skills.length === 0) { skillList.innerHTML = '<div style="color:#888;font-size:0.9rem; text-align:center;">(暫無技能，請點擊新增)</div>'; } 
            else {
                GlobalState.skills.forEach(s => {
                    const pAttr = GlobalState.attrs[s.parent]; 
                    const max = s.lv * 100;
                    const pct = Math.min(100, (s.exp / max) * 100);
                    skillList.innerHTML += `
                        <div class="skill-row">
                            <div class="skill-top">
                                <span>${pAttr?pAttr.icon:''} ${s.name} <span style="font-size:0.8rem;color:#666;">Lv.${s.lv}</span></span>
                                <div><span class="skill-edit-btn" onclick="act.deleteSkillByName('${s.name}')">⚙️</span></div>
                            </div>
                            <div class="bar-box" style="height:12px;"><div class="bar-fill" style="width:${pct}%; background:#4db6ac;"></div><div class="bar-text" style="line-height:12px; font-size:0.7rem;">${s.exp}/${max}</div></div>
                        </div>
                    `;
                });
            }
        }
        
        setTimeout(() => {
            const cv = document.getElementById('radar');
            if(cv && window.Chart) {
                if(window.myChart) window.myChart.destroy();
                window.myChart = new Chart(cv, { 
                    type: 'radar', 
                    data: { labels: Object.values(GlobalState.attrs).map(a=>a.name), datasets:[{ label:'能力值', data:Object.values(GlobalState.attrs).map(a=>a.v), backgroundColor:'rgba(0,137,123,0.2)', borderColor:'#00897b', borderWidth: 2, pointRadius: 3 }] }, 
                    options: { animation: { duration: 0 }, maintainAspectRatio:false, scales:{ r:{ grid:{color:'#ccc'}, ticks:{display:false, maxTicksLimit: 5}, pointLabels:{font:{size:14}, color:'#3e2723'} } }, plugins:{legend:{display:false}} } 
                });
            }
        }, 50); 
    }
};window.view = view;