/* js/modules/stats105.js - V300.90 Final */
window.act = window.act || {};

Object.assign(window.act, {
    openAddSkill: () => {
        if (GlobalState.skills.length >= 10) return act.alert("技能已達上限 (10)，請刪除舊技能。");
        document.getElementById('new-skill-name').value = '';
        act.openModal('add-skill');
    },

    submitNewSkill: () => {
        const name = document.getElementById('new-skill-name').value.trim();
        const attr = document.getElementById('new-skill-attr').value;
        
        if(!name) return act.alert("請輸入技能名稱");
        if(GlobalState.skills.find(s => s.name === name)) return act.alert("技能名稱重複");
        
        GlobalState.skills.push({
            name: name,
            parent: attr,
            lv: 1,
            exp: 0,
            lastUsed: new Date().toISOString()
        });
        
        act.save();
        act.closeModal('add-skill');
        if(window.view && view.renderStats) view.renderStats();
    },
    
    deleteSkillByName: (name) => {
        act.confirm(`刪除技能 [${name}]?`, (yes) => {
            if(yes) {
                GlobalState.skills = GlobalState.skills.filter(s => s.name !== name);
                act.save();
                if(window.view && view.renderStats) view.renderStats();
            }
        });
    }
});