/* js/view105.js - V300.30 Visual Update */

const view = {
    render: () => { 
        view.renderHUD(); 
        view.renderTasks(); 
        view.renderShop(); 
    },
    
    // --- HUD 渲染 (新增屬性顯示) ---
    renderHUD: () => {
        document.getElementById('ui-gold').innerText = GlobalState.gold; 
        document.getElementById('ui-lv').innerText = GlobalState.lv;
        
        // 渲染主要屬性概況 (這裡只顯示總合或代表性屬性，為了空間)
        // 你也可以在 HUD 加一排小圖示
        // 這裡暫時維持原樣，詳細屬性在 Stats 頁面看
    },

    // --- 任務列表渲染 ---
    renderTasks: () => {
        const list = document.getElementById('task-list'); 
        list.innerHTML = '';
        
        // 渲染分類 Tabs
        const cats = ['全部', '每日', '雜事', '願望', '工作'];
        const catsRow = document.getElementById('task-cats-row');
        if(catsRow) {
            catsRow.innerHTML = cats.map(c => 
                `<span class="tag-btn ${TempState.filterCategory===c?'active':''}" 
                  onclick="TempState.filterCategory='${c}';view.renderTasks()">${c}</span>`
            ).join('');
        }

        // 篩選
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
            // 加入難度 Class 以便做邊框顏色區分
            div.className = `t-card ${t.done ? 'done' : ''} diff-${t.difficulty}`;
            
            // --- 1. 進度條計算 ---
            let progressBar = '';
            if (t.subs && t.subs.length > 0) {
                const doneCount = t.subs.filter(s => s.done).length;
                const total = t.subs.length;
                const pct = Math.round((doneCount / total) * 100);
                // 綠色進度條 HTML
                progressBar = `
                    <div class="progress-track">
                        <div class="progress-fill" style="width:${pct}%"></div>
                    </div>
                    <div style="font-size:0.75rem; text-align:right; color:#666;">進度: ${pct}%</div>
                `;
            }
            
            // --- 2. 難度標籤與技能 ---
            const diffDef = DIFFICULTY_DEFS[t.difficulty] || DIFFICULTY_DEFS['S'];
            const skillTag = t.skill ? `<span class="skill-pill">${t.skill}</span>` : '';
            const diffBadge = `<span class="diff-badge" style="background:${diffDef.color}">${diffDef.label}</span>`;
            
            // --- 3. 子任務渲染 ---
            const subList = (t.subs && t.subs.length) ? 
                `<div class="t-subs">` + 
                t.subs.map((s,i) => 
                    `<div class="sub-row ${s.done?'done':''}" onclick="event.stopPropagation();act.toggleSubtask('${t.id}',${i})">
                        <div class="chk-sm ${s.done?'checked':''}"></div>
                        <span>${s.text}</span>
                    </div>`
                ).join('') + `</div>` : '';

            // 組合 HTML
            div.innerHTML = `
                <div class="t-top">
                    <div class="t-title-container" onclick="act.toggleTask('${t.id}')">
                        <div class="chk ${t.done?'checked':''}"></div>
                        <div class="t-title">
                            ${t.pinned ? '📌 ' : ''}${t.title}
                            <div style="margin-top:4px;">${diffBadge} ${skillTag}</div>
                        </div>
                    </div>
                </div>
                ${progressBar}
                ${subList}
            `;
            list.appendChild(div);
        });
    },

    // --- 商店渲染 (沿用) ---
    renderShop: () => {
        const list = document.getElementById('shop-list'); 
        if(!list) return;
        list.innerHTML = '';
        // 簡單合併 NPC 和 User 商品
        const items = [...GlobalState.shop.npc, ...GlobalState.shop.user];
        items.forEach(i => {
            const div = document.createElement('div'); 
            div.className = `s-item ${i.qty<=0?'sold-out':''}`;
            div.innerHTML = `<div>${i.name}</div><div style="color:gold">$${i.price}</div>`;
            div.onclick = () => {
                if(GlobalState.gold >= i.price) {
                    GlobalState.gold -= i.price;
                    alert(`購買成功：${i.name}`);
                    view.renderHUD();
                } else {
                    alert('金幣不足！');
                }
            };
            list.appendChild(div);
        });
    }
};
window.view = view;