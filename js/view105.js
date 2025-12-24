/* js/view105.js - V300.50 Visual Update */

const view = {
    render: () => { 
        view.renderHUD(); 
        view.renderTasks(); 
        view.renderShop(); 
    },
    
    renderHUD: () => {
        document.getElementById('ui-gold').innerText = GlobalState.gold; 
        document.getElementById('ui-lv').innerText = GlobalState.lv;
        // 根據設定更新模式 class
        if(document.body.className.indexOf(GlobalState.settings.mode) === -1) {
             if(window.act.changeMode) window.act.changeMode(GlobalState.settings.mode);
        }
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
            div.className = `t-card ${t.done ? 'done' : ''} diff-${t.difficulty}`; // 使用 1-4
            
            // 進度條
            let progressBar = '';
            if (t.subs && t.subs.length > 0) {
                const doneCount = t.subs.filter(s => s.done).length;
                const total = t.subs.length;
                const pct = Math.round((doneCount / total) * 100);
                progressBar = `<div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>`;
            }
            
            // 技能標籤
            const skillTag = t.skill ? `<span class="skill-pill">${t.skill}</span>` : '';
            const diffBadge = `<span class="diff-badge" style="background:${diffDef.color}">${diffDef.label}</span>`;
            
            // 子任務
            const subList = (t.subs && t.subs.length) ? `<div class="t-subs">` + t.subs.map((s,i) => `<div class="sub-row ${s.done?'done':''}" onclick="event.stopPropagation();act.toggleSubtask('${t.id}',${i})"><div class="chk-sm ${s.done?'checked':''}"></div><span>${s.text}</span></div>`).join('') + `</div>` : '';

            // 計次顯示
            const countDisplay = t.type === 'count' ? `<span style="font-size:0.8rem;color:#666;margin-left:5px;">(${t.curr}/${t.target})</span>` : '';

            div.innerHTML = `<div class="t-top"><div class="t-title-container" onclick="act.toggleTask('${t.id}')"><div class="chk ${t.done?'checked':''}"></div><div class="t-title">${t.pinned ? '📌 ' : ''}${t.title}${countDisplay}<div style="margin-top:4px;">${diffBadge} ${skillTag}</div></div></div></div>${progressBar}${subList}`;
            list.appendChild(div);
        });
    },

    renderShop: () => {
        const list = document.getElementById('shop-list'); 
        if(!list) return;
        list.innerHTML = '';
        
        // 分類
        const shopTabs = document.getElementById('shop-tabs');
        if(shopTabs) {
            const allItems = [...GlobalState.shop.npc, ...GlobalState.shop.user];
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

        items.forEach(i => {
            const div = document.createElement('div'); 
            div.className = `s-item ${i.qty<=0?'sold-out':''}`;
            div.innerHTML = `<div>${i.name}</div><div style="color:gold">$${i.price}</div>`;
            div.onclick = () => {
                // 使用 window.act 確保呼叫到 shop105.js
                if(window.act.buy) window.act.buy(i);
                else act.alert("購買功能載入中...");
            };
            list.appendChild(div);
        });
    },

    renderStats: () => {
        const list = document.getElementById('attr-list');
        if (!list) return;
        list.innerHTML = '';
        
        // 渲染六大屬性
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

        // 渲染技能列表 (含刪除鍵)
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

        // 雷達圖 (略，保持原樣)
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