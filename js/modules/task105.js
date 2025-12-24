/* js/modules/task105.js - V300.32 Cleaned (UI Only) */
window.act = window.act || {};

Object.assign(window.act, {
    // 只保留「切換分頁」與「介面輔助」功能
    switchTaskTab: (tab) => {
        TempState.taskTab = tab;
        // 更新 Tab 樣式
        document.querySelectorAll('.h-tab').forEach(el => el.classList.remove('active'));
        const tabBtn = document.getElementById('tab-' + tab);
        if(tabBtn) tabBtn.classList.add('active');
        
        // 更新頁面樣式 (黃色主題/一般主題)
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
        
        // 重新渲染列表
        if (window.view && view.renderTasks) view.renderTasks();
    },
    
    // 輔助：渲染任務分類標籤 (給 view.renderTasks 用)
    renderTaskCats: (elId) => {
        /* 此功能已整合至 view105.js，保留此空殼防止報錯，或可完全移除 */
    }
});