/* js/main300.js - V300.100 Safe Main */

// ★ V200 關鍵安全鎖 ★
window.isResetting = false; 

window.forceSaveNow = function() {
    if (window.isResetting) return; // 鎖定中不存檔
    try {
        if (typeof GlobalState !== 'undefined') {
            localStorage.setItem('SQ_V103', JSON.stringify(GlobalState));
        }
    } catch (err) { console.error(err); }
};

try {
    let saved = localStorage.getItem('SQ_V103');
    if (saved) {
        let parsed = JSON.parse(saved);
        GlobalState = { ...DefaultData, ...parsed };
        if(parsed.shop) GlobalState.shop = { ...DefaultData.shop, ...parsed.shop };
        if(parsed.attrs) GlobalState.attrs = { ...DefaultData.attrs, ...parsed.attrs };
        if(!GlobalState.story) GlobalState.story = { ...DefaultData.story }; // 補 Story
        if(!GlobalState.wardrobe) GlobalState.wardrobe = [];
        if(!GlobalState.history) GlobalState.history = [];
    } else {
        GlobalState = JSON.parse(JSON.stringify(DefaultData));
    }
} catch (e) {
    GlobalState = JSON.parse(JSON.stringify(DefaultData));
}

if (typeof act !== 'undefined') {
    if(act.checkDaily) act.checkDaily();
    if(view.render) view.render();
    if(act.navigate) act.navigate(GlobalState.settings.mode === 'basic' ? 'stats' : 'main');
}

// 歷史紀錄
if (typeof act !== 'undefined') {
    act.addLog = function(title, note = "") {
        if (typeof GlobalState === 'undefined' || window.isResetting) return;
        if (!GlobalState.history) GlobalState.history = [];
        let newRecord = { title: title, rewards: note, date: new Date().toLocaleString(), status: "success" };
        GlobalState.history.push(newRecord);
        if (GlobalState.history.length > 50) GlobalState.history = GlobalState.history.slice(-50);
        window.forceSaveNow();
        const pHistory = document.getElementById('page-history');
        if (typeof view !== 'undefined' && pHistory && pHistory.style.display !== 'none') view.renderHistory();
    };
}

if (typeof act === 'undefined') window.act = {};
act.resetData = function() {
    if(confirm("【警告】\n確定要刪除所有進度並重置嗎？")) {
        window.isResetting = true; // 上鎖
        localStorage.clear();
        sessionStorage.clear();
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => {
                for(let reg of regs) reg.unregister();
            });
        }
        alert("資料已清除，將重新載入...");
        setTimeout(() => { window.location.href = window.location.pathname + "?t=" + new Date().getTime(); }, 200);
    }
};

setInterval(window.forceSaveNow, 5000);
document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === 'hidden' && !window.isResetting) window.forceSaveNow();
});