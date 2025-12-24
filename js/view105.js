/* js/view105.js - V300.40 Visual Update (Added renderStats) */

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
        
        const cats = ['全部', '每日', '雜事', '願望', '工作'];
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
            div.className = `t-card ${t.done ? 'done' : ''} diff-${t.difficulty}`;
            
            let progressBar = '';
            if (t.subs && t.subs.length > 0) {
                const doneCount = t.subs.filter(s => s.done).length;
                const total = t.subs.length;
                const pct = Math.round((doneCount / total) * 100);
                progressBar = `<div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><div style="font-size:0.75rem; text-align:right; color:#666;">進度: ${pct}%</div>`;
            }
            
            const diffDef = DIFFICULTY_DEFS[t.difficulty] || DIFFICULTY_DEFS['S'];
            const skillTag = t.skill ? `<span class="skill-pill">${t.skill}</span>` : '';
            const diffBadge = `<span class="diff-badge" style="background:${diffDef.color}">${diffDef.label}</span>`;
            
            const subList = (t.subs && t.subs.length) ? `<div class="t-subs">` + t.subs.map((s,i) => `<div class="sub-row ${s.done?'done':''}" onclick="event.stopPropagation();act.toggleSubtask('${t.id}',${i})"><div class="chk-sm ${s.done?'checked':''}"></div><span>${s.text}</span></div>`).join('') + `</div>` : '';

            div.innerHTML = `<div class="t-top"><div class="t-title-container" onclick="act.toggleTask('${t.id}')"><div class="chk ${t.done?'checked':''}"></div><div class="t-title">${t.pinned ? '📌 ' : ''}${t.title}<div style="margin-top:4px;">${diffBadge} ${skillTag}</div></div></div></div>${progressBar}${subList}`;
            list.appendChild(div);
        });
    },

    renderShop: () => {
        const list = document.getElementById('shop-list'); 
        if(!list) return;
        list.innerHTML = '';
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
    },

    // ★★★ 核心補強：屬性與技能渲染 ★★★
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

        // 渲染技能列表
        const skillList = document.getElementById('skill-list');
        if(skillList) {
            skillList.innerHTML = '<h3 style="font-size:1rem; margin-top:20px; border-bottom:1px solid #ccc; padding-bottom:5px;">技能熟練度</h3>';
            if(GlobalState.skills.length === 0) {
                skillList.innerHTML += '<div style="color:#888;font-size:0.9rem;">尚無技能，請去建立任務並綁定標籤。</div>';
            } else {
                GlobalState.skills.forEach(s => {
                    skillList.innerHTML += `<div class="tag-item" style="display:inline-block; margin:3px;">${s.name} <span style="font-size:0.8rem;color:#666;">(Lv.${s.lv})</span></div>`;
                });
            }
        }

        // 渲染雷達圖
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