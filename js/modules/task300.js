/* js/modules/task300.js - V300.106 Fix FAB */
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
            if(page) page.classList.add('theme-yellow'); 
            document.body.classList.add('mode-ach');
            if(fab) fab.style.background = 'var(--gold)';
            if(ctrlRow) ctrlRow.style.display = 'none';
        } else {
            if(page) page.classList.remove('theme-yellow'); 
            document.body.classList.remove('mode-ach');
            if(fab) fab.style.background = 'var(--acc)';
            if(ctrlRow) ctrlRow.style.display = 'flex';
        }
        if (window.view && view.renderTasks) view.renderTasks();
    },

    // ★ Fix #4: 必須要有此函式，FAB 才能運作 ★
    initCreateModal: () => {
        // 載入標籤
        const catContainer = document.getElementById('nt-cats');
        if(catContainer) {
            catContainer.innerHTML = '';
            GlobalState.cats.forEach(cat => {
                const sp = document.createElement('span'); sp.className = 'tag-btn'; sp.innerText = cat;
                sp.onclick = () => { catContainer.querySelectorAll('.tag-btn').forEach(b=>b.classList.remove('active')); sp.classList.add('active'); };
                catContainer.appendChild(sp);
            });
            if(GlobalState.cats.length > 0) catContainer.children[0].classList.add('active');
        }

        // 載入屬性
        const attrContainer = document.getElementById('nt-attrs');
        if(attrContainer) {
            attrContainer.innerHTML = '';
            const toggle = (el) => {
                if (el.classList.contains('active')) el.classList.remove('active');
                else if (attrContainer.querySelectorAll('.tag-item.active').length < 3) el.classList.add('active');
            };
            Object.values(GlobalState.attrs).forEach(a => { 
                const sp = document.createElement('span'); sp.className = 'tag-item'; sp.innerText = a.name; 
                sp.onclick = () => toggle(sp); attrContainer.appendChild(sp); 
            });
        }
        
        // 載入物品
        const s = document.getElementById('nt-item'); 
        if(s) {
            s.innerHTML = '<option value="">無</option>';
            [...GlobalState.shop.npc, ...GlobalState.shop.user].forEach(i => { 
                s.innerHTML += `<option value="${i.name}">${i.name}</option>`; 
            });
        }
        
        document.getElementById('nt-type').value = 'normal';
        document.getElementById('nt-target').style.display = 'none';
        document.getElementById('nt-subs').innerHTML = '';
        document.getElementById('btn-del-task').style.display = 'none';
    },

    submitTask: (orgSubmit) => {
        // (Submit logic is mostly handled in core300.js backup for stability, 
        // but ideally should be here. If core300.js has it, this can be minimal or override)
        // 為了確保穩定，我們使用 core300.js 裡的 submitTask，這裡保留擴充接口
        if(window.act.submitTaskCore) window.act.submitTaskCore(); 
    }
});