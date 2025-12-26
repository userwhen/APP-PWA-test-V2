/* js/modules/avatar300.js - V300.99 Fixed */
window.act = window.act || {};

Object.assign(window.act, {
    
    initWardrobe: () => {
        TempState.wardrobeTab = 'hair';
        if(!GlobalState.wardrobe) GlobalState.wardrobe = [];
        
        // 如果沒有資料，塞入預設 (防止空陣列)
        const defaults = [
            { id:'h1', type:'hair', name:'短髮', icon:'🧑', owned:true },
            { id:'h2', type:'hair', name:'長髮', icon:'🧝', owned:false, price:100 },
            { id:'t1', type:'top', name:'T恤', icon:'👕', owned:true },
            { id:'t2', type:'top', name:'西裝', icon:'👔', owned:false, price:200 },
            { id:'b1', type:'bottom', name:'牛仔褲', icon:'👖', owned:true },
            { id:'a1', type:'acc', name:'眼鏡', icon:'👓', owned:false, price:50 },
            { id:'a2', type:'acc', name:'帽子', icon:'🧢', owned:true }
        ];

        // 簡單合併：如果 GlobalState.wardrobe 是空的，就塞入預設
        if(GlobalState.wardrobe.length === 0) {
            GlobalState.wardrobe = defaults;
        }
    },

    renderWardrobe: () => {
        // 確保初始化
        if(!GlobalState.wardrobe || GlobalState.wardrobe.length === 0) act.initWardrobe();
        
        // 更新標籤樣式
        const tabs = { 'hair':0, 'top':1, 'bottom':2, 'acc':3 };
        document.querySelectorAll('.av-tab').forEach(t => t.classList.remove('active'));
        const activeIdx = tabs[TempState.wardrobeTab] || 0;
        const tabEls = document.querySelectorAll('.av-tab');
        if(tabEls[activeIdx]) tabEls[activeIdx].classList.add('active');
        
        const list = document.getElementById('wardrobe-list');
        if(!list) return;
        list.innerHTML = '';
        
        const items = GlobalState.wardrobe.filter(i => i.type === TempState.wardrobeTab);
        
        if(items.length === 0) {
            list.innerHTML = '<div style="width:100%;text-align:center;color:#888;margin-top:20px;">此分類尚無物品</div>';
            return;
        }

        items.forEach(i => {
            const card = document.createElement('div');
            card.className = 'av-card';
            const btnText = i.owned ? '穿上' : `$${i.price}`;
            const btnClass = i.owned ? '' : 'gold';
            
            card.innerHTML = `
                <div class="av-icon">${i.icon}</div>
                <div style="font-size:0.8rem; font-weight:bold;">${i.name}</div>
                <button class="av-btn ${btnClass}" onclick="act.clickWardrobeItem('${i.id}')">${btnText}</button>
            `;
            list.appendChild(card);
        });
    },

    switchWardrobeTab: (tab) => {
        TempState.wardrobeTab = tab;
        act.renderWardrobe();
    },

    clickWardrobeItem: (id) => {
        const item = GlobalState.wardrobe.find(i => i.id === id);
        if(!item) return;
        
        if(item.owned) {
            act.alert(`已換上: ${item.name}`);
            const preview = document.getElementById('avatar-preview-char');
            if(preview) preview.innerText = item.icon; // 更新預覽
        } else {
            if(GlobalState.gold >= item.price) {
                act.confirm(`確定花費 $${item.price} 購買 ${item.name}?`, (yes)=>{
                    if(yes) {
                        GlobalState.gold -= item.price;
                        item.owned = true;
                        act.alert('購買成功!');
                        act.save();
                        view.renderHUD(); // 更新金幣顯示
                        act.renderWardrobe(); // 更新按鈕狀態
                    }
                });
            } else {
                act.alert('金幣不足!');
            }
        }
    }
});