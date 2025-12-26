/* js/modules/avatar300.js */
window.act = window.act || {};
const WARDROBE_DATA = { hair: ['🧑', '👩', '👨‍🦱', '👩‍🦰'], top: ['👕', '👔', '🧥', '👚'], bottom: ['👖', '🩳', '👗', '👙'], acc: ['👓', '🧢', '👑', '🎒'] };
Object.assign(window.act, {
    switchWardrobeTab: (tab) => {
        TempState.wardrobeTab = tab;
        document.querySelectorAll('.av-tab').forEach(e => e.classList.remove('active'));
        // 簡易查找
        const btns = document.querySelectorAll('.av-tab');
        if(tab==='hair') btns[0].classList.add('active');
        if(tab==='top') btns[1].classList.add('active');
        if(tab==='bottom') btns[2].classList.add('active');
        if(tab==='acc') btns[3].classList.add('active');
        act.renderWardrobe();
    },
    renderWardrobe: () => {
        const list = document.getElementById('wardrobe-list'); if(!list) return; list.innerHTML = '';
        const items = WARDROBE_DATA[TempState.wardrobeTab] || [];
        items.forEach(icon => {
            const div = document.createElement('div'); div.className = 'av-card';
            div.innerHTML = `<div style="font-size:2rem;">${icon}</div>`;
            div.onclick = () => { 
                const char = document.getElementById('avatar-preview-char');
                if(char) char.innerText = icon; // 簡易預覽
                // 實際應用需更新 GlobalState.avatar
            };
            list.appendChild(div);
        });
    }
});