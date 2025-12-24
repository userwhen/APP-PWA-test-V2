/* js/modules/stats105.js */
window.act = window.act || {};

Object.assign(window.act, {
    openStats: () => { const el = document.getElementById('stats-overlay'); if(!el) return; if (el.style.display === 'flex' && el.classList.contains('active-overlay')) { act.closeStats(); } else { el.style.display = 'flex'; if (GlobalState.settings.mode !== 'basic') el.classList.add('active-overlay'); if(window.view && view.renderStats) view.renderStats(); } },
    closeStats: () => { const el = document.getElementById('stats-overlay'); if (GlobalState.settings.mode === 'basic') return; if(el) { el.style.display = 'none'; el.classList.remove('active-overlay'); } },
    switchTab: (t) => { document.querySelectorAll('.tab').forEach(e => e.classList.remove('active')); document.getElementById('tb-'+t).classList.add('active'); document.querySelectorAll('.stat-sec').forEach(e => e.classList.remove('active')); document.getElementById('sec-'+t).classList.add('active'); },
    renameAttr: (key) => { act.prompt("新名稱", GlobalState.attrs[key].name, (n) => { if(n) { GlobalState.attrs[key].name = n; act.save(); } }); },
    
    addNewSkill: () => {
        if (GlobalState.skills.length >= 10) return act.alert("技能已達上限 (10)");
        act.prompt("技能名稱", "", (n) => { if(n) { GlobalState.skills.push({name:n, lv:1, exp:0}); act.save(); if(window.view && view.renderStats) view.renderStats(); } });
    },
    
    manageSkill: (idx) => {
        TempState.editSkillIdx = idx;
        const skill = GlobalState.skills[idx];
        document.getElementById('sk-name').value = skill.name;
        act.openModal('skill-edit');
    },
    
    saveSkill: () => {
        const name = document.getElementById('sk-name').value;
        if(name && TempState.editSkillIdx !== undefined) {
            GlobalState.skills[TempState.editSkillIdx].name = name;
            act.closeModal('skill-edit');
            act.save();
            if(window.view) view.renderStats();
        }
    },
    
    deleteSkill: () => {
        if(TempState.editSkillIdx !== undefined) {
            act.confirm("確定刪除技能?", (yes) => {
                if(yes) {
                    GlobalState.skills.splice(TempState.editSkillIdx, 1);
                    act.closeModal('skill-edit');
                    act.save();
                    if(window.view) view.renderStats();
                }
            });
        }
    }
});