/* js/main300.js - V300.Final Main */
window.isResetting = false; 
window.forceSaveNow = function() { if (window.isResetting) return; try { if (typeof GlobalState !== 'undefined') localStorage.setItem('SQ_V103', JSON.stringify(GlobalState)); } catch (err) { console.error(err); } };
try {
    let saved = localStorage.getItem('SQ_V103');
    if (saved) { let parsed = JSON.parse(saved); GlobalState = { ...DefaultData, ...parsed }; if(parsed.shop) GlobalState.shop = { ...DefaultData.shop, ...parsed.shop }; if(parsed.attrs) GlobalState.attrs = { ...DefaultData.attrs, ...parsed.attrs }; if(!GlobalState.history) GlobalState.history = []; if(!GlobalState.archivedSkills) GlobalState.archivedSkills = []; } else { GlobalState = JSON.parse(JSON.stringify(DefaultData)); }
} catch (e) { GlobalState = JSON.parse(JSON.stringify(DefaultData)); }
if (typeof act !== 'undefined') { if(act.checkDaily) act.checkDaily(); if(view.render) view.render(); if(act.navigate) act.navigate('main'); }
setInterval(window.forceSaveNow, 5000); 
document.addEventListener("visibilitychange", function() { if (document.visibilityState === 'hidden' && !window.isResetting) window.forceSaveNow(); });