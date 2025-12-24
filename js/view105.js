/* js/view105.js - V300.41 Shop Filter & Task UI */

const view = {
    render: () => { 
        view.renderHUD(); 
        view.renderTasks(); 
        view.renderShop(); 
    },
    
    renderHUD: () => {
        document.getElementById('ui-gold').innerText = GlobalState.gold; 
        document.getElementById('ui-lv').innerText = GlobalState.lv;
    },

    renderTasks: () => {
        const list = document.getElementById('task-list'); 
        list.innerHTML = '';
        
        // ★ 渲染分類按鈕 (依據新的分類) ★
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
            // 使用難度數字 (1-4) 對應樣式
            const diffDef = DIFFICULTY_DEFS[t.difficulty] || DIFFICULTY_DEFS[2];
            div.className = `t-card ${t.done ? 'done' : ''} diff-${diffDef.code}`;
            
            let progressBar = '';
            if (t.subs && t.subs.length > 0) {
                const doneCount = t.subs.filter(s => s.done).length;
                const total = t.subs.length;
                const pct = Math.round((doneCount / total) * 100);
                progressBar = `<div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><div style="font-size:0.75rem; text-align:right; color:#666;">進度: ${pct}%</div>`;
            }
            
            // 顯示屬性名稱
            const attrName = (t.attr && GlobalState.attrs[t.attr]) ? GlobalState.attrs[t.attr].name : '';
            const skillTag = attrName ? `<span class="skill-pill">${attrName}</span>` : '';
            const diffBadge = `<span class="diff-badge" style="background:${diffDef.color}">${diffDef.label}</span>`;
            
            const subList = (t.subs && t.subs.length) ? `<div class="t-subs">` + t.subs.map((s,i) => `<div class="sub-row ${s.done?'done':''}" onclick="event.stopPropagation();act.toggleSubtask('${t.id}',${i})"><div class="chk-sm ${s.done?'checked':''}"></div><span>${s.text}</span></div>`).join('') + `</div>` : '';

            div.innerHTML = `<div class="t-top"><div class="t-title-container" onclick="act.toggleTask('${t.id}')"><div class="chk ${t.done?'checked':''}"></div><div class="t-title">${t.pinned ? '📌 ' : ''}${t.title}<div style="margin-top:4px;">${diffBadge} ${skillTag}</div></div></div></div>${progressBar}${subList}`;
            list.appendChild(div);
        });
    },

    // ★ 商店渲染 (新增分類篩選) ★
    renderShop: () => {
        const list = document.getElementById('shop-list'); 
        if(!list) return;
        list.innerHTML = '';
        
        // 1. 渲染商店分類按鈕
        const shopTabs = document.getElementById('shop-tabs');
        if(shopTabs) {
            // 自動收集所有分類
            const allItems = [...GlobalState.shop.npc, ...GlobalState.shop.user];
            const cats = ['全部', ...new Set(allItems.map(i => i.category || '其他'))];
            
            shopTabs.innerHTML = cats.map(c => 
                `<span class="tag-btn ${TempState.shopCategory===c?'active':''}" 
                  onclick="TempState.shopCategory='${c}';view.renderShop()">${c}</span>`
            ).join('');
        }

        // 2. 篩選商品
        let items = [...GlobalState.shop.npc, ...GlobalState.shop.user];
        if (TempState.shopCategory !== '全部') {
            items = items.filter(i => i.category === TempState.shopCategory);
        }

        items.forEach(i => {
            const div = document.createElement('div'); 
            div.className = `s-item ${i.qty<=0?'sold-out':''}`;
            div.innerHTML = `<div>${i.name}</div><div style="color:gold">$${i.price}</div>`;
            div.onclick = () => {
                // 使用 core105.js 裡的新 helper
                act.confirm(`確定購買 ${i.name} ($${i.price}) ?`, (yes) => {
                    if(yes) {
                        if(GlobalState.gold >= i.price) {
                            GlobalState.gold -= i.price;
                            if(i.perm !== 'daily') i.qty--; // 簡單庫存扣除
                            act.alert(`購買成功：${i.name}`);
                            act.save();
                            view.renderHUD();
                            view.renderShop();
                        } else {
                            act.alert('金幣不足！');
                        }
                    }
                });
            };
            list.appendChild(div);
        });
    },

    renderStats: () => {
        const list = document.getElementById('attr-list');
        if (!list) return;
        list.innerHTML = '';
        
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
        
        // 隱藏技能列表 (因為現在主要看屬性)
        const skillList = document.getElementById('skill-list');
        if(skillList) skillList.innerHTML = ''; 

        // 雷達圖
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
                        borderWidth: 2
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