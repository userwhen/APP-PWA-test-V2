/* js/modules/task300.js - V300.80 Clean */
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
    }
});