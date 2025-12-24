/* js/modules/task105.js - V300.33 Cleaned (Fix Conflict) */
window.act = window.act || {};

Object.assign(window.act, {
    // 只保留分頁切換功能，防止邏輯衝突
    switchTaskTab: (tab) => {
        TempState.taskTab = tab;
        
        // 1. 更新按鈕樣式
        document.querySelectorAll('.h-tab').forEach(el => el.classList.remove('active'));
        const activeBtn = document.getElementById('tab-' + tab);
        if(activeBtn) activeBtn.classList.add('active');
        
        // 2. 更新頁面主題 (成就頁變金色)
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
        
        // 3. 重新渲染
        if (window.view && view.renderTasks) view.renderTasks();
    }
});