/* js/modules/stats300.js - V300.Final */
window.act = window.act || {};

Object.assign(window.act, {
    openAddSkill: () => {
        if (GlobalState.skills.length >= 10) return act.alert("技能已達上限 (10)");
        document.getElementById('new-skill-name').value = '';
        act.openModal('add-skill');
    },
    
    submitNewSkill: () => {
        const name = document.getElementById('new-skill-name').value.trim();
        const attr = document.getElementById('new-skill-attr').value;
        if(!name) return act.alert("請輸入名稱");
        if(GlobalState.skills.find(s=>s.name===name)) return act.alert("名稱重複");
        
        GlobalState.skills.push({ name: name, parent: attr, lv: 1, exp: 0, lastUsed: new Date().toISOString() });
        
        // ★ 生成學徒成就 ★
        const achId = `mst_${name}_10`;
        GlobalState.achievements.push({
            id: achId,
            title: `成為${name}大師!`,
            desc: `將 ${name} 升至 Lv.10`,
            type: 'manual', // 系統自動判定，但類型設為手動以免混淆
            targetVal: 10,
            reward: { freeGem: 50, exp: 500 },
            done: false,
            isSystem: true
        });
        
        act.save();
        act.closeModal('add-skill');
        act.alert(`技能「${name}」已建立！\n目標：升至 Lv.10`);
        if(window.view) view.renderStats();
    },
    
    deleteSkillByName: (name) => {
        // 這裡暫時只做刪除，編輯功能需更多代碼
        act.confirm(`刪除技能 [${name}]?`, (yes) => {
            if(yes) {
                GlobalState.skills = GlobalState.skills.filter(s => s.name !== name);
                act.save();
                if(window.view) view.renderStats();
            }
        });
    },
    
    checkSkillMastery: (skill) => {
        act.alert(`🎉 恭喜！你已成為【${skill.name}】大師！\n該技能將光榮退休，並獲得徽章。`);
        
        // 完成成就
        const ach = GlobalState.achievements.find(a => a.title === `成為${skill.name}大師!`);
        if(ach) { ach.done = true; GlobalState.freeGem += ach.reward.freeGem; GlobalState.exp += ach.reward.exp; }
        
        // 移入里程碑
        skill.retireDate = new Date().toLocaleDateString();
        GlobalState.archivedSkills.push(skill);
        GlobalState.skills = GlobalState.skills.filter(s => s.name !== skill.name);
        
        act.save();
        if(window.view) view.renderStats();
    }
});