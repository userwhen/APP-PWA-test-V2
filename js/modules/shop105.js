/* js/modules/shop105.js - V300.50 Shop Fixed */
window.act = window.act || {};
const SHOP_CONFIG = { INFINITE_QTY: 999, MAX_INPUT: 9999, PERM_TYPE: { DAILY: 'daily', ONCE: 'once' }, CATEGORY: { CALORIE: '熱量', MONEY: '金錢', TIME: '時間', OTHER: '其他' } };

Object.assign(window.act, {
    findShopItem: (id) => GlobalState.shop.user.find(i => i.id === id) || GlobalState.shop.npc.find(i => i.id === id),
    
    // 開啟上架視窗
    openUpload: () => { 
        TempState.editShopId = null; 
        ['up-name', 'up-desc', 'up-price', 'up-qty'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = '';
        });
        document.getElementById('up-dyn-fields').innerHTML = ''; 
        const delBtn = document.getElementById('btn-del-shop');
        if(delBtn) delBtn.style.display = 'none'; 
        
        // 重置為熱量
        const catSel = document.getElementById('up-cat');
        if(catSel) { catSel.value = '熱量'; act.uploadCategoryChange(); }
        
        act.openModal('upload'); 
    },

    // 分類變更：顯示不同輸入框
    uploadCategoryChange: () => { 
        const c = document.getElementById('up-cat').value; 
        const dyn = document.getElementById('up-dyn-fields');
        if(!dyn) return;
        
        dyn.innerHTML = '';
        if (c === SHOP_CONFIG.CATEGORY.CALORIE) { 
            dyn.innerHTML = `<div class="row"><input id="up-cal" type="tel" class="inp flex-1" placeholder="卡路里 (例: 500)" maxlength="4" oninput="act.validateNumber(this, 9999)"></div>`; 
        } else if (c === SHOP_CONFIG.CATEGORY.TIME) { 
            dyn.innerHTML = `<div class="row"><input id="up-time-h" type="tel" class="inp flex-1" placeholder="時 (0-23)" maxlength="2" oninput="act.validateNumber(this, 23)"><input id="up-time-m" type="tel" class="inp flex-1" placeholder="分 (0-59)" maxlength="2" oninput="act.validateNumber(this, 59)"></div>`; 
        } else if (c === SHOP_CONFIG.CATEGORY.MONEY) { 
            dyn.innerHTML = `<div class="row"><input id="up-money" type="tel" class="inp flex-1" placeholder="獲得金額" oninput="act.validateNumber(this, 99999)"></div>`; 
        }
        // 其他分類無額外欄位
    },

    submitUpload: () => {
        const n = document.getElementById('up-name').value; 
        const p = document.getElementById('up-price').value;
        if (!n || !p) return act.alert("請輸入名稱與價格");
        
        let val = 0; 
        const cat = document.getElementById('up-cat').value;
        
        if (cat === SHOP_CONFIG.CATEGORY.CALORIE) val = document.getElementById('up-cal')?.value || 0;
        if (cat === SHOP_CONFIG.CATEGORY.MONEY) val = document.getElementById('up-money')?.value || 0;
        if (cat === SHOP_CONFIG.CATEGORY.TIME) { 
            const h = document.getElementById('up-time-h')?.value.padStart(2,'0') || '00'; 
            const m = document.getElementById('up-time-m')?.value.padStart(2,'0') || '00'; 
            val = `${h}:${m}`; 
        }
        
        const item = { 
            id: TempState.editShopId || Date.now().toString(), 
            name: n, 
            price: Number(p), 
            qty: Number(document.getElementById('up-qty').value)||1, 
            category: cat, 
            perm: document.getElementById('up-perm').value, 
            desc: document.getElementById('up-desc').value, 
            val: val 
        };
        
        if (TempState.editShopId) { 
            const idx = GlobalState.shop.user.findIndex(i => i.id === TempState.editShopId); 
            if (idx > -1) GlobalState.shop.user[idx] = item; 
        } else { 
            GlobalState.shop.user.push(item); 
        }
        
        act.closeModal('upload'); 
        act.save();
        if(window.view && view.renderShop) view.renderShop();
    },
    
    // ... 其他購買邏輯保持不變 ...
    deleteShopItem: () => { 
        act.confirm("下架?", (yes) => { 
            if(yes) { 
                GlobalState.shop.user = GlobalState.shop.user.filter(i => i.id !== TempState.editShopId); 
                act.closeModal('upload'); 
                act.save(); 
                if(window.view && view.renderShop) view.renderShop();
            } 
        }); 
    }
});