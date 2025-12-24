/* js/modules/ach105.js */
window.act = window.act || {};

Object.assign(window.act, {
    toggleAchSource: () => {
        const radios = document.getElementsByName('ach-src');
        let src = 'user';
        for(let r of radios) if(r.checked) src = r.value;
        TempState.achSource = src;
        const box = document.getElementById('ach-reward-box');
        if (src === 'system') {
            box.innerHTML = `<div class="row"><label>免費鑽石</label><input type="tel" id="na-free-gem" class="inp flex-1" placeholder="數量"></div><div class="row"><label>付費鑽石</label><input type="tel" id="na-paid-gem" class="inp flex-1" placeholder="數量"></div>`;
        } else {
            box.innerHTML = `<div class="row"><input type="tel" id="na-gold" class="inp flex-1" placeholder="金幣"><input type="tel" id="na-exp" class="inp flex-1" placeholder="經驗"></div><div class="row"><select id="na-item" class="inp flex-2"><option value="">物品: 無</option></select></div>`;
            const itemSel = document.getElementById('na-item');
            if(itemSel) { new Set([...GlobalState.shop.npc, ...GlobalState.shop.user].map(i=>i.name)).forEach(n => itemSel.innerHTML += `<option value="${n}">${n}</option>`); }
        }
    },
    openCreateAch: () => {
        TempState.editAchId = null; act.clearInputs('m-create-ach');
        const sel = document.getElementById('na-target-key'); if(sel) sel.innerHTML = '';
        act.checkAchTarget();
        document.getElementById('btn-del-ach').style.display = 'none';
        document.getElementsByName('ach-src')[0].checked = true;
        act.toggleAchSource();
        act.openModal('create-ach');
    },
    submitAchievement: () => {
        const title = document.getElementById('na-title').value; if (!title) return act.alert("請輸入標題");
        const type = document.getElementById('na-type').value;
        const isSystem = TempState.achSource === 'system';
        const reward = {};
        if (isSystem) {
            reward.freeGem = Number(document.getElementById('na-free-gem').value) || 0;
            reward.paidGem = Number(document.getElementById('na-paid-gem').value) || 0;
        } else {
            reward.gold = Number(document.getElementById('na-gold').value) || 0;
            reward.exp = Number(document.getElementById('na-exp').value) || 0;
            reward.item = document.getElementById('na-item').value;
        }
        const ach = { id: TempState.editAchId || act.generateId(), title: title, desc: document.getElementById('na-desc').value, type: type, isSystem: isSystem, targetKey: (type==='ach_count'||type==='manual') ? '' : document.getElementById('na-target-key').value, targetVal: (type==='manual') ? 0 : (Number(document.getElementById('na-target-val').value) || 1), reward: reward, done: false };
        if(TempState.editAchId) { const idx = GlobalState.achievements.findIndex(a => a.id === TempState.editAchId); if(idx > -1) { ach.done = GlobalState.achievements[idx].done; GlobalState.achievements[idx] = ach; } } else { GlobalState.achievements.push(ach); }
        act.closeModal('create-ach'); act.save();
    },
    manageAchievement: (id) => { const ach = GlobalState.achievements.find(a => a.id === id); if(!ach) return; TempState.editAchId = id; act.openModal('create-ach'); document.getElementById('na-title').value = ach.title; document.getElementById('na-desc').value = ach.desc; document.getElementById('btn-del-ach').style.display = 'block'; },
    deleteAchievement: () => { act.confirm("刪除?", (yes)=>{ if(yes) { GlobalState.achievements = GlobalState.achievements.filter(a => a.id !== TempState.editAchId); act.closeModal('create-ach'); act.save(); } }); },
    checkAchTarget: () => {
        const t = document.getElementById('na-type').value;
        const r = document.getElementById('na-target-row');
        const k = document.getElementById('na-target-key');
        r.style.display = (t === 'manual') ? 'none' : 'flex';
        k.style.display = (t === 'ach_count') ? 'none' : 'block';
        k.innerHTML = '';
        if(t === 'task_count') { ['每日', ...new Set(GlobalState.cats)].forEach(c => k.innerHTML += `<option value="${c}">${c}</option>`); } 
        else if (t === 'attr_lv') { Object.values(GlobalState.attrs).forEach(a => k.innerHTML += `<option value="${a.name}">${a.name}</option>`); }
    },
    toggleAchievement: (id) => {
        const ach = GlobalState.achievements.find(a => a.id === id);
        if (!ach) return;
        ach.done = !ach.done;
        if (ach.done) {
            if (ach.isSystem) {
                if(ach.reward.freeGem) GlobalState.freeGem = (GlobalState.freeGem || 0) + ach.reward.freeGem;
                if(ach.reward.paidGem) GlobalState.paidGem = (GlobalState.paidGem || 0) + ach.reward.paidGem;
                act.alert(`獲得 ${ach.reward.freeGem||0} 免費鑽, ${ach.reward.paidGem||0} 付費鑽`);
            } else {
                if(ach.reward.gold) GlobalState.gold += ach.reward.gold;
                if(ach.reward.exp) GlobalState.exp += ach.reward.exp;
                if(ach.reward.item) GlobalState.bag.push({ name: ach.reward.item, uid: Date.now() });
                act.alert("已領取資源獎勵");
            }
            act.checkLevelUp(); 
            if(window.view) view.renderHUD();
        } else {
            if(ach.reward.gold) GlobalState.gold = Math.max(0, GlobalState.gold - ach.reward.gold);
        }
        act.save();
    }
});