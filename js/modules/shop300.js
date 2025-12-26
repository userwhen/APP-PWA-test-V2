/* js/modules/shop300.js - V300.Final */
window.act = window.act || {};
const SHOP_CONFIG = { CATEGORY: { CALORIE: '熱量', MONEY: '金錢', TIME: '時間', OTHER: '其他' } };

Object.assign(window.act, {
    shopUploadChange: () => { 
        const c = document.getElementById('up-cat').value; 
        const dyn = document.getElementById('up-dyn-fields'); if(!dyn) return; dyn.innerHTML = ''; 
        if (c === '熱量') { dyn.innerHTML = `<div class="row"><input id="up-cal" type="tel" class="inp" placeholder="🔥 卡路里數值"></div>`; } 
        else if (c === '時間') { dyn.innerHTML = `<div class="row"><input id="up-time-h" type="tel" class="inp" placeholder="時"><input id="up-time-m" type="tel" class="inp" placeholder="分"></div>`; } 
    },
    buy: (item) => { 
        const shopItem = GlobalState.shop.user.find(i => i.id === item.id) || GlobalState.shop.npc.find(i => i.id === item.id);
        if (!shopItem || shopItem.qty <= 0) return act.alert("已售完"); 
        act.prompt(`購買 [${item.name}] ($${item.price}) ?\n請輸入數量:`, "1", (val) => { 
            const qty = parseInt(val); 
            if (qty > 0 && qty <= shopItem.qty) {
                if (GlobalState.gold >= item.price * qty) {
                    GlobalState.gold -= item.price * qty;
                    for(let i=0; i<qty; i++) GlobalState.bag.push({...item, uid: Date.now()+Math.random()});
                    if(item.perm !== 'daily') shopItem.qty -= qty;
                    // 卡路里立即增加
                    if(item.category === '熱量' && GlobalState.settings.calMode) {
                        GlobalState.cal.today += (Number(item.val)||0) * qty;
                        GlobalState.cal.logs.unshift(`[購買] ${item.name} +${item.val*qty}`);
                    }
                    act.save(); act.alert("購買成功"); if(window.view) { view.renderHUD(); view.renderShop(); }
                } else { act.alert("金幣不足"); }
            } else { act.alert("數量錯誤"); }
        }); 
    },
    openUpload: () => { TempState.editShopId = null; act.clearInputs('m-upload'); document.getElementById('btn-del-shop').style.display = 'none'; act.shopUploadChange(); act.openModal('upload'); },
    submitUpload: () => {
        const n = document.getElementById('up-name').value; const p = document.getElementById('up-price').value;
        if (!n || !p) return act.alert("請輸入資料");
        let val = 0; const cat = document.getElementById('up-cat').value;
        if (cat === '熱量') val = document.getElementById('up-cal')?.value || 0;
        const item = { id: TempState.editShopId || act.generateId('shop'), name: n, price: Number(p), qty: Number(document.getElementById('up-qty').value)||1, category: cat, perm: document.getElementById('up-perm').value, desc: document.getElementById('up-desc').value, val: val };
        if (TempState.editShopId) { const idx = GlobalState.shop.user.findIndex(i => i.id === TempState.editShopId); if (idx > -1) GlobalState.shop.user[idx] = item; } else { GlobalState.shop.user.push(item); }
        act.closeModal('upload'); act.save(); view.renderShop();
    },
    editShopItem: (id) => {
        const item = GlobalState.shop.user.find(i => i.id === id); if(item) { TempState.editShopId = id; document.getElementById('up-name').value = item.name; document.getElementById('up-price').value = item.price; document.getElementById('up-qty').value = item.qty; document.getElementById('up-desc').value = item.desc; document.getElementById('up-cat').value = item.category; document.getElementById('up-perm').value = item.perm; document.getElementById('btn-del-shop').style.display = 'flex'; act.shopUploadChange(); act.openModal('upload'); }
    },
    deleteShopItem: () => { act.confirm("下架?", (yes) => { if(yes) { GlobalState.shop.user = GlobalState.shop.user.filter(i => i.id !== TempState.editShopId); act.closeModal('upload'); act.save(); view.renderShop(); } }); },
    useItem: (discard) => {
        const name = document.getElementById('bd-name').value;
        const qty = parseInt(document.getElementById('bd-qty').value) || 1;
        // 簡易刪除邏輯，實際應用可擴充效果
        let removed = 0; const newBag = []; let toRemove = qty;
        GlobalState.bag.forEach(i => { if(i.name===name && toRemove>0) { toRemove--; removed++; } else newBag.push(i); });
        GlobalState.bag = newBag;
        act.save(); act.closeModal('bag-detail'); view.renderBag();
    }
});