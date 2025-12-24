/* js/main105.js - V10.1 Clean Version */

// ==========================================
// ★★★ 全域變數：重置鎖 (關鍵保護) ★★★
// ==========================================
// 當這個變成 true 時，嚴禁任何存檔動作，防止重置時覆蓋空檔
window.isResetting = false; 

// ==========================================
// 1. 核心存檔功能 (加上安全鎖)
// ==========================================
window.forceSaveNow = function() {
    // ★ 關鍵判斷：如果正在重置中，絕對禁止存檔！
    if (window.isResetting) {
        console.warn("系統重置中，已阻擋自動存檔");
        return; 
    }

    try {
        if (typeof GlobalState !== 'undefined') {
            localStorage.setItem('SQ_V103', JSON.stringify(GlobalState));
            // console.log("Data Saved"); // 平常註解掉，保持乾淨
        }
    } catch (err) {
        console.error("Save Failed:", err);
    }
};

// ==========================================
// 2. 初始讀取與啟動
// ==========================================
try {
    let saved = localStorage.getItem('SQ_V103');
    if (saved) {
        let parsed = JSON.parse(saved);
        // 合併預設資料，確保新欄位不會遺失
        GlobalState = { ...DefaultData, ...parsed };
        if(parsed.shop) GlobalState.shop = { ...DefaultData.shop, ...parsed.shop };
        if(parsed.attrs) GlobalState.attrs = { ...DefaultData.attrs, ...parsed.attrs };
        if(!GlobalState.history) GlobalState.history = [];
    } else {
        GlobalState = JSON.parse(JSON.stringify(DefaultData));
    }
} catch (e) {
    console.error("Load Error", e);
    GlobalState = JSON.parse(JSON.stringify(DefaultData));
}

// 啟動畫面渲染
if (typeof act !== 'undefined') {
    if(act.checkDaily) act.checkDaily();
    if(view.render) view.render();
    if(act.navigate) act.navigate('main');
}

// ==========================================
// 3. 歷史紀錄系統
// ==========================================
if (typeof act !== 'undefined') {
    act.addLog = function(title, note = "") {
        if (typeof GlobalState === 'undefined' || window.isResetting) return;
        if (!GlobalState.history) GlobalState.history = [];

        let newRecord = {
            title: title,
            rewards: note,
            date: new Date().toLocaleString(),
            status: "success"
        };
        GlobalState.history.push(newRecord);
        if (GlobalState.history.length > 50) GlobalState.history = GlobalState.history.slice(-50);
        
        window.forceSaveNow();
        
        // 即時更新介面
        const pHistory = document.getElementById('page-history');
        if (typeof view !== 'undefined' && pHistory && pHistory.style.display !== 'none') {
            view.renderHistory();
        }
    };

    // 任務攔截器 (紀錄任務變更)
    if (act.submitTask) {
        const orgSubmit = act.submitTask;
        act.submitTask = function() {
            let el = document.getElementById('nt-title');
            let t = el ? el.value : "任務";
            orgSubmit.apply(this, arguments);
            act.addLog("任務變更", `新增: ${t}`);
        };
    }
}

// ==========================================
// 4. 重置功能 (保留邏輯，移除按鈕)
// ==========================================
// 這是給設定頁面裡的「重置」按鈕用的
if (typeof act === 'undefined') window.act = {};
act.resetData = function() {
    if(confirm("【警告】\n確定要刪除所有進度並重置嗎？此動作無法復原！")) {
        window.isResetting = true; // 上鎖
        localStorage.clear();
        sessionStorage.clear();
        
        // 殺死 Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => {
                for(let reg of regs) reg.unregister();
            });
        }
        
        alert("資料已清除，將重新載入...");
        setTimeout(() => {
            window.location.href = window.location.pathname + "?t=" + new Date().getTime(); 
        }, 200);
    }
};

// ==========================================
// 5. 自動存檔觸發器
// ==========================================
// 每 5 秒存一次
setInterval(window.forceSaveNow, 5000);

// 切換視窗時存一次
document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === 'hidden' && !window.isResetting) {
        window.forceSaveNow();
    }
});