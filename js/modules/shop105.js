/* js/modules/shop105.js */
window.act = window.act || {};
const SHOP_CONFIG = { INFINITE_QTY: 999, MAX_INPUT: 9999, PERM_TYPE: { DAILY: 'daily', ONCE: 'once' }, CATEGORY: { CALORIE: '熱量', MONEY: '金錢', TIME: '時間', OTHER: '其他' } };

Object.assign(window.act, {
    findShopItem: (id) => GlobalState.shop.user.find(i => i.id === id) || GlobalState.shop.npc.find(i => i.id === id),
    getItemDef: (name) => [...GlobalState.shop.npc, ...GlobalState.shop.user].find(i => i.name === name),
    countItem: (name) => GlobalState.bag.filter(i => i.name === name).length,
    getItemEffectText: (def, qty) => { if (!def) return '使用此道具'; const total = (Number(def.val) || 0) * qty; switch (def.category) { case SHOP_CONFIG.CATEGORY.CALORIE: return `將攝取 ${total} 卡路里`; case SHOP_CONFIG.CATEGORY.MONEY: return `將獲得 ${total} 金幣`; case SHOP_CONFIG.CATEGORY.TIME: return `將消耗/獲得時間 ${def.val}`; default: return def.desc || '使用此道具'; } },
    
    // [修正] 快照資料
    addToBag: (itemTemplate, quantity) => { 
        for (let i = 0; i < quantity; i++) { 
            GlobalState.bag.push({ 
                ...itemTemplate, // 複製所有屬性
                uid: Date.now() + Math.random() 
            }); 
        } 
    },
    
    removeFromBag: (itemName, quantity) => { let removed = 0; const newBag = []; let toRemove = quantity; for (let item of GlobalState.bag) { if (item.name === itemName && toRemove > 0) { toRemove--; removed++; } else { newBag.push(item); } } GlobalState.bag = newBag; return removed; },
    applyItemEffect: (itemDef, quantity) => { if (!itemDef) return; if (itemDef.category === SHOP_CONFIG.CATEGORY.CALORIE) { if (!GlobalState.settings.calMode) return; const val = Number(itemDef.val) * quantity; GlobalState.cal.today += val; GlobalState.cal.logs.push(`[攝取] ${itemDef.name} +${val}`); } else if (itemDef.category === SHOP_CONFIG.CATEGORY.MONEY) { const val = (Number(itemDef.val) || 0) * quantity; GlobalState.gold += val; } },

    buy: (item) => {
        const shopItem = act.findShopItem(item.id);
        if (!shopItem || shopItem.qty <= 0) return act.alert("已售完");
        act.prompt(`購買 [${item.name}]\n單價: $${item.price}\n庫存: ${shopItem.qty}\n\n請輸入購買數量:`, "", (input) => {
            if (!input || input.trim() === "") return;
            const qty = parseInt(input);
            if (isNaN(qty) || qty <= 0) return act.alert("數量錯誤");
            if (qty > shopItem.qty) return act.alert("庫存不足");
            const totalCost = item.price * qty;
            if (GlobalState.gold < totalCost) return act.alert(`金幣不足 (需要 $${totalCost})`);
            act.confirm(`確定花費 $${totalCost} 購買 ${qty} 個 [${item.name}] ?`, (yes) => {
                if (yes) {
                    GlobalState.gold -= totalCost;
                    act.addToBag(item, qty);
                    if (shopItem.perm !== SHOP_CONFIG.PERM_TYPE.DAILY || shopItem.qty < SHOP_CONFIG.INFINITE_QTY) { shopItem.qty -= qty; }
                    act.save(); act.alert("購買成功！");
                }
            });
        });
    },

    useItem: (discard) => {
        const name = TempState.selectedItemName; 
        const inputQty = document.getElementById('bd-qty');
        const qty = parseInt(inputQty.value) || 1;
        const currentOwned = act.countItem(name);
        if (qty > currentOwned) return act.alert("數量不足");
        
        // 優先從背包快照取資料
        let def = act.getItemDef(name);
        if(!def) {
             const bagItem = GlobalState.bag.find(i => i.name === name);
             if(bagItem) def = bagItem;
        }

        let msg = "";
        if (!discard) { const effectText = act.getItemEffectText(def, qty); msg = `確定要使用 ${qty} 個「${name}」？\n\n${effectText}`; } 
        else { msg = `確定要丟棄 ${qty} 個「${name}」？(無法復原)`; }

        act.confirm(msg, (yes) => {
            if (yes) {
                const removedCount = act.removeFromBag(name, qty);
                if (removedCount > 0 && !discard) { act.applyItemEffect(def, removedCount); }
                act.save();
                if(window.view && view.renderBag) view.renderBag();
                const newOwned = act.countItem(name);
                const ownSpan = document.getElementById('bd-own');
                if(ownSpan) ownSpan.innerText = newOwned;
                if (newOwned <= 0) { act.closeModal('bag-detail'); }
            }
        });
    },

    openUpload: () => { TempState.editShopId = null; act.clearInputs('m-upload'); document.getElementById('up-dyn-fields').innerHTML = ''; document.getElementById('btn-del-shop').style.display = 'none'; act.uploadCategoryChange(); act.openModal('upload'); },
    uploadCategoryChange: () => { 
        const c = document.getElementById('up-cat').value; 
        const dyn = document.getElementById('up-dyn-fields');
        dyn.innerHTML = '';
        if (c === SHOP_CONFIG.CATEGORY.CALORIE) { dyn.innerHTML = `<div class="row"><input id="up-cal" type="tel" class="inp flex-1" placeholder="卡路里 (4位數)" maxlength="4" oninput="act.validateNumber(this, 9999)"></div>`; } 
        else if (c === SHOP_CONFIG.CATEGORY.TIME) { dyn.innerHTML = `<div class="row"><input id="up-time-h" type="tel" class="inp flex-1" placeholder="時 (0-23)" maxlength="2" oninput="act.validateNumber(this, 23)"><input id="up-time-m" type="tel" class="inp flex-1" placeholder="分 (0-59)" maxlength="2" oninput="act.validateNumber(this, 59)"></div>`; } 
        else if (c === SHOP_CONFIG.CATEGORY.MONEY) { dyn.innerHTML = `<div class="row"><input id="up-money" type="tel" class="inp flex-1" placeholder="獲得金額" oninput="act.validateNumber(this, 99999)"></div>`; }
    },
    submitUpload: () => {
        const n = document.getElementById('up-name').value; const p = document.getElementById('up-price').value;
        if (!n || !p) return act.alert("請輸入名稱與價格");
        let val = 0; const cat = document.getElementById('up-cat').value;
        if (cat === SHOP_CONFIG.CATEGORY.CALORIE) val = document.getElementById('up-cal').value;
        if (cat === SHOP_CONFIG.CATEGORY.MONEY) val = document.getElementById('up-money').value;
        if (cat === SHOP_CONFIG.CATEGORY.TIME) { const h = document.getElementById('up-time-h').value.padStart(2,'0'); const m = document.getElementById('up-time-m').value.padStart(2,'0'); val = `${h}:${m}`; }
        const item = { id: TempState.editShopId || act.generateId(), name: n, price: Number(p), qty: Number(document.getElementById('up-qty').value)||1, category: cat, perm: document.getElementById('up-perm').value, desc: document.getElementById('up-desc').value, val: val };
        if (TempState.editShopId) { const idx = GlobalState.shop.user.findIndex(i => i.id === TempState.editShopId); if (idx > -1) GlobalState.shop.user[idx] = item; } else { GlobalState.shop.user.push(item); }
        act.closeModal('upload'); act.save();
    },
    editShopItem: (id) => {
        const item = GlobalState.shop.user.find(i => i.id === id);
        if (item) {
            TempState.editShopId = id;
            document.getElementById('up-name').value = item.name; 
            document.getElementById('up-price').value = item.price; 
            document.getElementById('up-qty').value = item.qty; 
            document.getElementById('up-desc').value = item.desc;
            document.getElementById('up-cat').value = item.category;
            document.getElementById('up-perm').value = item.perm;
            document.getElementById('btn-del-shop').style.display = 'block';
            act.uploadCategoryChange(); 
            setTimeout(() => {
                if (item.category === SHOP_CONFIG.CATEGORY.CALORIE && document.getElementById('up-cal')) document.getElementById('up-cal').value = item.val;
                if (item.category === SHOP_CONFIG.CATEGORY.MONEY && document.getElementById('up-money')) document.getElementById('up-money').value = item.val;
                if (item.category === SHOP_CONFIG.CATEGORY.TIME && document.getElementById('up-time-h')) { const [h, m] = item.val.split(':'); document.getElementById('up-time-h').value = h; document.getElementById('up-time-m').value = m; }
            }, 50);
            act.openModal('upload');
        }
    },
    deleteShopItem: () => { act.confirm("下架?", (yes) => { if(yes) { GlobalState.shop.user = GlobalState.shop.user.filter(i => i.id !== TempState.editShopId); act.closeModal('upload'); act.save(); } }); }
});