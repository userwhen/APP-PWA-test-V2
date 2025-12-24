/* js/modules/avatar105.js */
window.act = window.act || {};

Object.assign(window.act, {
    
    // 初始化衣櫥資料
    initWardrobe: () => {
        TempState.wardrobeTab = 'hair'; // 預設標籤
        // 模擬商品資料 (之後可移至 data.js)
        if(!GlobalState.wardrobe) GlobalState.wardrobe = [];
        // 如果沒有資料，塞入預設
        if(GlobalState.wardrobe.length === 0) {
            // 格式: { id, type, name, icon, owned }
            GlobalState.wardrobe = [
                { id:'h1', type:'hair', name:'短髮', icon:'🧑', owned:true },
                { id:'h2', type:'hair', name:'長髮', icon:'🧝', owned:false, price:100 },
                { id:'t1', type:'top', name:'T恤', icon:'👕', owned:true },
                { id:'t2', type:'top', name:'西裝', icon:'👔', owned:false, price:200 },
                { id:'b1', type:'bottom', name:'牛仔褲', icon:'👖', owned:true },
                { id:'a1', type:'acc', name:'眼鏡', icon:'👓', owned:false, price:50 },
                { id:'a2', type:'acc', name:'帽子', icon:'🧢', owned:true }
            ];
        }
    },

    renderWardrobe: () => {
        if(!GlobalState.wardrobe) act.initWardrobe();
        
        // 更新標籤樣式
        document.querySelectorAll('.av-tab').forEach(t => t.classList.remove('active'));
        // 簡單對應：索引 0=hair, 1=top... 這裡直接根據 onclick 傳入的值判斷比較準
        // 暫時略過標籤 active 樣式更新，專注渲染內容
        
        const list = document.getElementById('wardrobe-list');
        list.innerHTML = '';
        
        const items = GlobalState.wardrobe.filter(i => i.type === TempState.wardrobeTab);
        
        items.forEach(i => {
            const card = document.createElement('div');
            card.className = 'av-card';
            // 判斷是否裝備中 (這裡暫時省略裝備邏輯，僅顯示)
            const btnText = i.owned ? '穿上' : `$${i.price}`;
            const btnClass = i.owned ? '' : 'gold'; // 可加樣式
            
            card.innerHTML = `
                <div class="av-icon">${i.icon}</div>
                <div style="font-size:0.8rem">${i.name}</div>
                <button class="av-btn" onclick="act.clickWardrobeItem('${i.id}')">${btnText}</button>
            `;
            list.appendChild(card);
        });
    },

    switchWardrobeTab: (tab) => {
        TempState.wardrobeTab = tab;
        // 更新 UI 標籤
        const tabs = { 'hair':0, 'top':1, 'bottom':2, 'acc':3 };
        document.querySelectorAll('.av-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.av-tab')[tabs[tab]].classList.add('active');
        
        act.renderWardrobe();
    },

    clickWardrobeItem: (id) => {
        const item = GlobalState.wardrobe.find(i => i.id === id);
        if(!item) return;
        
        if(item.owned) {
            // 換裝邏輯 (暫時只更新預覽字元)
            alert(`已換上: ${item.name}`);
            // 更新預覽
            // document.getElementById('avatar-preview-char').innerText = ...
        } else {
            // 購買邏輯
            if(GlobalState.gold >= item.price) {
                GlobalState.gold -= item.price;
                item.owned = true;
                alert('購買成功!');
                act.save();
                act.renderWardrobe();
            } else {
                alert('金幣不足!');
            }
        }
    }
});