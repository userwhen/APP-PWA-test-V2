/* js/modules/ach300.js - V300.Final */
window.act = window.act || {};

Object.assign(window.act, {
    toggleAchSource: () => {
        const radios = document.getElementsByName('ach-src');
        let src = 'user';
        for(let r of radios) if(r.checked) src = r.value;
        TempState.achSource = src;
        const box = document.getElementById('ach-reward-box');
        if (src === 'system') {
            box.innerHTML = `<div class="row"><input type="tel" id="na-free-gem" class="inp" placeholder="💎 免費鑽"><input type="tel" id="na-paid-gem" class="inp" placeholder="💠 付費鑽"></div>`;
        } else {
            box.innerHTML = `<div class="row"><input type="tel" id="na-gold" class="inp" placeholder="💰 金幣"><input type="tel" id="na-exp" class="inp" placeholder="🆙 經驗"></div>`;
        }
    },
    openCreateAch: () => { TempState.editAchId = null; act.clearInputs('m-create-ach'); const rb = document.getElementsByName('ach-src'); if(rb[0]) rb[0].checked = true; act.toggleAchSource(); document.getElementById('btn-del-ach').style.display = 'none'; act.openModal('create-ach'); },
    submitAchievement: () => {
        const title = document.getElementById('na-title').value; if (!title) return act.alert("請輸入標題");
        const isSystem = TempState.achSource === 'system';
        const reward = {};
        if (isSystem) { reward.freeGem = Number(document.getElementById('na-free-gem').value)||0; reward.paidGem = Number(document.getElementById('na-paid-gem').value)||0; } 
        else { reward.gold = Number(document.getElementById('na-gold').value)||0; reward.exp = Number(document.getElementById('na-exp').value)||0; }
        const ach = { id: TempState.editAchId || act.generateId('ach'), title: title, desc: document.getElementById('na-desc').value, type: 'manual', isSystem: isSystem, reward: reward, done: false };
        if(TempState.editAchId) { const idx = GlobalState.achievements.findIndex(a => a.id === TempState.editAchId); if(idx > -1) { ach.done = GlobalState.achievements[idx].done; GlobalState.achievements[idx] = ach; } } 
        else { GlobalState.achievements.push(ach); }
        act.closeModal('create-ach'); act.save(); if(window.view) view.renderTasks();
    },
    manageAchievement: (id) => { const ach = GlobalState.achievements.find(a => a.id === id); if(!ach) return; TempState.editAchId = id; act.openModal('create-ach'); document.getElementById('na-title').value = ach.title; document.getElementById('na-desc').value = ach.desc; document.getElementById('btn-del-ach').style.display = 'block'; },
    deleteAchievement: () => { act.confirm("刪除?", (yes)=>{ if(yes) { GlobalState.achievements = GlobalState.achievements.filter(a => a.id !== TempState.editAchId); act.closeModal('create-ach'); act.save(); if(window.view) view.renderTasks(); } }); },
    toggleAchievement: (id) => {
        const ach = GlobalState.achievements.find(a => a.id === id); if (!ach) return;
        ach.done = !ach.done;
        if (ach.done) {
            let msg = "成就解鎖！";
            if(ach.reward.freeGem) { GlobalState.freeGem = (GlobalState.freeGem||0) + ach.reward.freeGem; msg += ` 💎+${ach.reward.freeGem}`; }
            if(ach.reward.paidGem) { GlobalState.paidGem = (GlobalState.paidGem||0) + ach.reward.paidGem; msg += ` 💠+${ach.reward.paidGem}`; }
            if(ach.reward.gold) { GlobalState.gold += ach.reward.gold; msg += ` 💰+${ach.reward.gold}`; }
            act.alert(msg);
        } else {
            if(ach.reward.freeGem) GlobalState.freeGem = Math.max(0, (GlobalState.freeGem||0) - ach.reward.freeGem);
            if(ach.reward.paidGem) GlobalState.paidGem = Math.max(0, (GlobalState.paidGem||0) - ach.reward.paidGem);
            if(ach.reward.gold) GlobalState.gold = Math.max(0, GlobalState.gold - ach.reward.gold);
        }
        act.save(); if(window.view) { view.renderHUD(); view.renderTasks(); }
    }
});