/* js/view105.js - V300.60 Manage Buttons & Basic Mode */

const view = {
    render: () => { 
        view.renderHUD(); 
        view.renderTasks(); 
        view.renderShop(); 
    },
    
    renderHUD: () => {
        document.getElementById('ui-gold').innerText = GlobalState.gold; 
        document.getElementById('ui-lv').innerText = GlobalState.lv;
        
        // 更新模式 Class (確保 CSS 生效)
        const mode = GlobalState.settings.mode;
        document.body.classList.remove('mode-adventurer', 'mode-harem', 'mode-basic');
        document.body.classList.add('mode-' + mode);
    },

    // ★ 每日快覽 (Daily Quick View) ★
    renderQuick: () => {
        const list = document.getElementById('quick-list');
        if(!list) return;
        list.innerHTML = '';
        
        const todayStr = new Date().toISOString().split('T')[0];
        
        // 篩選條件：每日任務 OR 被釘選 OR 到期日是今天
        const tasks = GlobalState.tasks.filter(t => {
            const isToday = t.deadline && t.deadline.startsWith(todayStr);
            return (t.cat === '每日') || t.pinned || isToday;
        });
        
        if(tasks.length === 0) { list.innerHTML = '<div style="text-align:center;color:#888;">今日無待辦事項</div>'; return; }
        
        tasks.forEach(t => {
            const div = document.createElement('div');
            div.className = `t-card diff-${t.difficulty}`;
            div.style.padding = '10px';
            div.innerHTML = `<div style="display:flex;justify-content:space-between;">
                <span>${t.pinned?'📌 ':''}${t.title}</span>
                <span style="font-size:0.8rem;color:#666;">${t.done?'(已完成)':'(未完成)'}</span>
            </div>`;
            list.appendChild(div);
        });
    },

    renderTasks: () => {
        const list = document.getElementById('task-list'); 
        list.innerHTML = '';
        
        const cats = ['全部', ...GlobalState.cats];
        const catsRow = document.getElementById('task-cats-row');
        if(catsRow) {
            catsRow.innerHTML = cats.map(c => 
                `<span class="tag-btn ${TempState.filterCategory===c?'active':''}" 
                  onclick="TempState.filterCategory='${c}';view.renderTasks()">${c}</span>`
            ).join('');
        }

        let tasks = GlobalState.tasks;
        if (TempState.filterCategory !== '全部') {
            tasks = tasks.filter(t => t.cat === TempState.filterCategory);
        }
        
        if (tasks.length === 0) { 
            list.innerHTML = '<div style="text-align:center;color:#666;margin-top:20px">暫無任務</div>'; 
            return; 
        }

        tasks.forEach(t => {
            const div = document.createElement('div');
            const diffDef = DIFFICULTY_DEFS[t.difficulty] || DIFFICULTY_DEFS[2];
            div.className = `t-card ${t.done ? 'done' : ''} diff-${t.difficulty}`;
            
            let progressBar = '';
            if (t.subs && t.subs.length > 0) {
                const doneCount = t.subs.filter(s => s.done).length;
                const total = t.subs.length;
                const pct = Math.round((doneCount / total) * 100);
                progressBar = `<div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>`;
            }
            
            const skillTag = t.skill ? `<span class="skill-pill">${t.skill}</span>` : '';
            const diffBadge = `<span class="diff-badge" style="background:${diffDef.color}">${diffDef.label}</span>`;
            
            const subList = (t.subs && t.subs.length) ? `<div class="t-subs">` + t.subs.map((s,i) => `<div class="sub-row ${s.done?'done':''}" onclick="event.stopPropagation();act.toggleSubtask('${t.id}',${i})"><div class="chk-sm ${s.done?'checked':''}"></div><span>${s.text}</span></div>`).join('') + `</div>` : '';

            const countDisplay = t.type === 'count' ? `<span style="font-size:0.8rem;color:#666;margin-left:5px;">(${t.curr}/${t.target})</span>` : '';
            
            // ★ 管理按鈕 (垃圾桶) ★
            const manageBtn = `<span style="position:absolute; top:10px; right:10px; cursor:pointer; color:#aaa;" onclick="event.stopPropagation();act.deleteTask('${t.id}')">🗑️</span>`;

            div.innerHTML = `<div class="t-top"><div class="t-title-container" onclick="act.toggleTask('${t.id}')"><div class="chk ${t.done?'checked':''}"></div><div class="t-title">${t.pinned ? '📌 ' : ''}${t.title}${countDisplay}<div style="margin-top:4px;">${diffBadge} ${skillTag}</div></div></div>${manageBtn}</div>${progressBar}${subList}`;
            list.appendChild(div);
        });
    },

    renderShop: () => {
        const list = document.getElementById('shop-list'); 
        if(!list) return;
        list.innerHTML = '';
        
        const shopTabs = document.getElementById('shop-tabs');
        if(shopTabs) {
            const cats = ['全部', '熱量', '時間', '金錢', '其他'];
            shopTabs.innerHTML = cats.map(c => 
                `<span class="tag-btn ${TempState.shopCategory===c?'active':''}" 
                  onclick="TempState.shopCategory='${c}';view.renderShop()">${c}</span>`
            ).join('');
        }

        let items = [...GlobalState.shop.npc, ...GlobalState.shop.user];
        if (TempState.shopCategory !== '全部') {
            items = items.filter(i => i.category === TempState.shopCategory);
        }
        
        // ★ 卡路里模式隱藏 ★
        if (!GlobalState.settings.calMode) {
            items = items.filter(i => i.category !== '熱量');
        }

        items.forEach(i => {
            const div = document.createElement('div'); 
            div.className = `s-item ${i.qty<=0?'sold-out':''}`;
            
            // 自製商品管理鈕
            const manageBtn = i.id.startsWith('user_') || !i.id.startsWith('def_') ? `<span class="s-manage-btn" onclick="event.stopPropagation();act.editShopItem('${i.id}')">✏️</span>` : '';
            
            // 庫存顯示 (去除 99=無限 的邏輯，直接顯示)
            const qtyDisplay = `<span style="font-size:0.7rem;color:#888;">剩:${i.qty}</span>`;

            div.innerHTML = `${manageBtn}<div>${i.name}</div><div style="color:gold">$${i.price}</div>${qtyDisplay}`;
            div.onclick = () => {
                if(window.act.buy) window.act.buy(i);
            };
            list.appendChild(div);
        });
    },

    renderStats: () => {
        const list = document.getElementById('attr-list');
        if (!list) return;
        list.innerHTML = '';
        
        // 如果沒有技能，也要能顯示屬性雷達圖
        for (const [key, attr] of Object.entries(GlobalState.attrs)) {
            const max = attr.v * 100;
            const pct = Math.min(100, (attr.exp / max) * 100);
            list.innerHTML += `
                <div class="attr-item">
                    <div class="attr-row-top">
                        <span>${attr.icon} ${attr.name} <span style="font-size:0.8rem;color:#888;">Lv.${attr.v}</span></span>
                        <span style="font-size:0.8rem;">${attr.exp}/${max}</span>
                    </div>
                    <div class="bar-box"><div class="bar-fill" style="width:${pct}%"></div></div>
                </div>
            `;
        }

        const skillList = document.getElementById('skill-list');
        if(skillList) {
            skillList.innerHTML = ''; 
            if(GlobalState.skills.length === 0) {
                skillList.innerHTML += '<div style="color:#888;font-size:0.9rem;">尚無技能，請點擊上方按鈕新增。</div>';
            } else {
                GlobalState.skills.forEach(s => {
                    const pAttr = GlobalState.attrs[s.parent];
                    const icon = pAttr ? pAttr.icon : '';
                    skillList.innerHTML += `
                    <div class="tag-item" style="display:inline-flex; align-items:center; margin:3px; padding-right:5px;">
                        ${icon} ${s.name} <span style="font-size:0.8rem;color:#666;margin-left:4px;">Lv.${s.lv}</span>
                        <span style="margin-left:5px; color:#d32f2f; cursor:pointer;" onclick="act.deleteSkillByName('${s.name}')">✕</span>
                    </div>`;
                });
            }
        }

        const cv = document.getElementById('radar');
        if(cv && window.Chart) {
            if(window.myChart) window.myChart.destroy();
            window.myChart = new Chart(cv, { 
                type: 'radar', 
                data: { 
                    labels: Object.values(GlobalState.attrs).map(a=>a.name), 
                    datasets:[{ 
                        label:'能力', 
                        data:Object.values(GlobalState.attrs).map(a=>a.v), 
                        backgroundColor:'rgba(0,137,123,0.2)', 
                        borderColor:'#00897b',
                        borderWidth: 2,
                        pointRadius: 0
                    }] 
                }, 
                options: { 
                    maintainAspectRatio:false, 
                    scales:{ r:{ grid:{color:'#ccc'}, ticks:{display:false, maxTicksLimit: 5}, pointLabels:{font:{size:14}} } }, 
                    plugins:{legend:{display:false}} 
                } 
            });
        }
    }
};
window.view = view;