/* js/modules/story300.js - V300.Final */
window.act = window.act || {};

Object.assign(window.act, {
    enterStoryMode: () => { act.navigate('story'); act.initStoryUI(); },
    initStoryUI: () => {
        const s = GlobalState.story;
        document.getElementById('story-status-text').innerText = `探索: ${s.exploreCount}`;
        const skipBtn = document.getElementById('story-skip-btn');
        if(skipBtn) skipBtn.style.display = s.hasDied ? 'block' : 'none';
        document.getElementById('story-text').innerText = "你站在命運的十字路口...";
        document.getElementById('story-npc-char').style.display = 'none';
    },
    storySkip: () => { act.addStoryLog("你快速穿越了已知的區域..."); },
    addStoryLog: (text) => {
        const logBox = document.getElementById('story-text');
        logBox.style.opacity = 0; setTimeout(() => { logBox.innerText = text; logBox.style.opacity = 1; }, 200);
    },
    exploreStory: () => {
        const s = GlobalState.story;
        s.exploreCount++;
        act.initStoryUI();
        
        // 機率遞減
        let chance = 0.02;
        if (s.exploreCount <= 5) chance = 0.25; else if (s.exploreCount <= 20) chance = 0.10;
        
        if (Math.random() < chance) {
            document.getElementById('story-npc-char').style.display = 'block';
            act.addStoryLog("你遇到了一位神秘的旅人！");
        } else {
            document.getElementById('story-npc-char').style.display = 'none';
            const texts = ["四周一片寂靜...", "風吹過樹梢的聲音...", "什麼都沒有發現。", "持續探索中..."];
            act.addStoryLog(texts[Math.floor(Math.random() * texts.length)]);
        }
        act.save();
    }
});