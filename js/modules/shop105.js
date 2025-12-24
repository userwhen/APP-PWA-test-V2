/* js/modules/shop105.js - V300.90 Complete */
window.act = window.act || {};
const SHOP_CONFIG = { INFINITE_QTY: 99, MAX_INPUT: 99999, PERM_TYPE: { DAILY: 'daily', ONCE: 'once' }, CATEGORY: { CALORIE: '熱量', MONEY: '金錢', TIME: '時間', OTHER: '其他' } };

Object.assign(window.act, {
    // 供 core.js 呼叫的介面更新函式
    shopUploadChange: () => {
        const c = document.getElementById('up-cat').value; 
        const dyn = document.getElementById('up-dyn-fields');
        if(!dyn) return;
        dyn.innerHTML = '';
        if (c === '熱量') { dyn.innerHTML = `<div class="row"><input id="up-cal" type="tel" class="inp flex-1" placeholder="卡路里 (Max 9999)" maxlength="4" oninput="act.validateNumber(this, 9999)"></div>`; } 
        else if (c === '時間') { dyn.innerHTML = `<div class="row"><input id="up-time-h" type="tel" class="inp flex-1" placeholder="時" maxlength="2"><input id="up-time-m" type="tel" class="inp flex-1" placeholder="分" maxlength="2"></div>`; } 
        else if (c === '金錢') { dyn.innerHTML = `<div class="row"><input id="up-money" type="tel" class="inp flex-1" placeholder="獲得金額 (Max 99999)" maxlength="5" oninput="act.validateNumber(this, 99999)"></div>`; }
    },

    findShopItem: (id) => GlobalState.shop.user.find(i => i.id === id) || GlobalState.shop.npc.find(i => i.id === id),
    getItemDef: (name) => [...GlobalState.shop.npc, ...GlobalState.shop.user].find(i => i.name === name),
    countItem: (name) => GlobalState.bag.filter(i => i.name === name).length,
    getItemEffectText: (def, qty) => { 
        if (!def) return '使用此道具'; 
        const total = (Number(def.val) || 0) * qty; 
        switch (def.category) { 
            case SHOP_CONFIG.CATEGORY.CALORIE: return `將攝取 ${total} 卡路里`; 
            case SHOP_CONFIG.CATEGORY.MONEY: return `將獲得 ${total} 金幣`; 
            case SHOP_CONFIG.CATEGORY.TIME: return `將消耗/獲得時間 ${def.val}`; 
            default: return def.desc || '使用此道具'; 
        } 
    },
    
    addToBag: (itemTemplate, quantity) => { for (let i = 0; i < quantity; i++) GlobalState.bag.push({ ...itemTemplate, uid: Date.now() + Math.random() }); },
    removeFromBag: (itemName, quantity) => { let removed = 0; const newBag = []; let toRemove = quantity; for (let item of GlobalState.bag) { if (item.name === itemName && toRemove > 0) { toRemove--; removed++; } else { newBag.push(item); } } GlobalState.bag = newBag; return removed; },
    applyItemEffect: (itemDef, quantity) => { 
        if (!itemDef) return; 
        if (itemDef.category === SHOP_CONFIG.CATEGORY.CALORIE) { 
            if (!GlobalState.settings.calMode) return; 
            const val = Number(itemDef.val) * quantity; 
            GlobalState.cal.today += val; 
            GlobalState.cal.logs.push(`[攝取] ${itemDef.name} +${val}`); 
        } else if (itemDef.category === SHOP_CONFIG.CATEGORY.MONEY) { 
            const val = (Number(itemDef.val) || 0) * quantity; 
            GlobalState.gold += val; 
        } 
    },

    buy: (item) => {
        const shopItem = act.findShopItem(item.id);
        if (!shopItem || shopItem.qty <= 0) return act.alert("已售完");
        act.prompt(`購買 [${item.name}]\n單價: $${item.price}\n庫存: ${shopItem.qty}\n\n請輸入購買數量:`, "1", (input) => {
            const qty = parseInt(input);
            if (isNaN(qty) || qty <= 0) return act.alert("數量錯誤");
            if (qty > shopItem.qty) return act.alert("庫存不足");
            const totalCost = item.price * qty;
            if (GlobalState.gold < totalCost) return act.alert("金幣不足");
            act.confirm(`確定花費 $${totalCost} ?`, (yes) => {
                if(yes) {
                    GlobalState.gold -= totalCost;
                    act.addToBag(item, qty);
                    if(shopItem.perm !== 'daily') shopItem.qty -= qty;
                    act.save();
                    act.alert("購買成功");
                    if(window.view) { view.renderHUD(); view.renderShop(); }
                }
            });
        });
    },

    useItem: (discard) => {
        const name = document.getElementById('bd-name').value;
        const qty = parseInt(document.getElementById('bd-qty').value) || 1;
        if (qty > act.countItem(name)) return act.alert("數量不足");
        
        let def = act.getItemDef(name) || GlobalState.bag.find(i => i.name === name);
        let msg = !discard ? `使用 ${qty} 個「${name}」？\n${act.getItemEffectText(def, qty)}` : `確定丟棄？`;

        act.confirm(msg, (yes) => {
            if (yes) {
                const removed = act.removeFromBag(name, qty);
                if (removed > 0 && !discard) act.applyItemEffect(def, removed);
                act.save();
                if(window.view && view.renderHUD) view.renderHUD();
                act.closeModal('bag-detail');
                const grid = document.getElementById('bag-grid');
                if(grid && window.view && view.renderBag) view.renderBag(); 
            }
        });
    },

    openUpload: () => { 
        TempState.editShopId = null; 
        // 確保 core.js 的 clearInputs 存在，或手動清除
        document.querySelectorAll('#m-upload input, #m-upload textarea').forEach(e => e.value='');
        document.getElementById('up-dyn-fields').innerHTML = ''; 
        document.getElementById('btn-del-shop').style.display = 'none'; 
        
        const catSel = document.getElementById('up-cat');
        if(catSel) { catSel.value = '熱量'; act.shopUploadChange(); }
        
        act.openModal('upload'); 
    },

    submitUpload: () => {
        const n = document.getElementById('up-name').value; 
        const p = document.getElementById('up-price').value;
        if (!n || !p) return act.alert("請輸入名稱與價格");
        let val = 0; const cat = document.getElementById('up-cat').value;
        if (cat === '熱量') val = document.getElementById('up-cal')?.value || 0;
        if (cat === '金錢') val = document.getElementById('up-money')?.value || 0;
        if (cat === '時間') { const h = document.getElementById('up-time-h')?.value.padStart(2,'0')||'00'; const m = document.getElementById('up-time-m')?.value.padStart(2,'0')||'00'; val = `${h}:${m}`; }
        const item = { id: TempState.editShopId || act.generateId('user_shop'), name: n, price: Number(p), qty: Number(document.getElementById('up-qty').value)||1, category: cat, perm: document.getElementById('up-perm').value, desc: document.getElementById('up-desc').value, val: val };
        if (TempState.editShopId) { const idx = GlobalState.shop.user.findIndex(i => i.id === TempState.editShopId); if (idx > -1) GlobalState.shop.user[idx] = item; } else { GlobalState.shop.user.push(item); }
        act.closeModal('upload'); act.save();
        if(window.view && view.renderShop) view.renderShop();
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
            
            act.shopUploadChange(); 
            setTimeout(() => {
                if (item.category === '熱量' && document.getElementById('up-cal')) document.getElementById('up-cal').value = item.val;
                if (item.category === '金錢' && document.getElementById('up-money')) document.getElementById('up-money').value = item.val;
                if (item.category === '時間' && document.getElementById('up-time-h')) { const [h, m] = item.val.split(':'); document.getElementById('up-time-h').value = h; document.getElementById('up-time-m').value = m; }
            }, 50);
            act.openModal('upload');
        }
    },
    deleteShopItem: () => { 
        act.confirm("下架?", (yes) => { if(yes) { 
            GlobalState.shop.user = GlobalState.shop.user.filter(i => i.id !== TempState.editShopId); 
            act.closeModal('upload'); act.save(); 
            if(window.view && view.renderShop) view.renderShop(); 
        } }); 
    }
});