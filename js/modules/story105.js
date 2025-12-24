/* js/modules/story.js */
window.act = window.act || {};

Object.assign(window.act, {
    enterStoryMode: () => {
        // 切換頁面
        act.navigate('story');
    },

    initStoryUI: () => {
        const s = GlobalState.story;
        const mode = GlobalState.settings.mode;
        const btn = document.getElementById('btn-explore');
        btn.innerText = mode === 'harem' ? "繼續當差" : "繼續探險";
        
        // 重生過才顯示 SKIP
        document.getElementById('story-skip').style.display = s.unlockedSkip ? 'block' : 'none';
    },

    storySkip: () => {
        document.getElementById('story-text').innerText = "你快速跳過了已知的劇情...";
    },

    exploreStory: () => {
        const s = GlobalState.story;
        const mode = GlobalState.settings.mode;
        
        // 每日機率邏輯
        s.exploreCount++;
        const chance = s.exploreCount <= 5 ? 0.2 : 0.02;
        const isEvent = Math.random() < chance;
        
        const textBox = document.getElementById('story-text');
        const npc = document.getElementById('story-npc');
        
        if (isEvent) {
            npc.style.display = 'block';
            if (mode === 'harem') {
                textBox.innerText = "你遇到了一位神秘的妃子，她似乎對你有話要說...";
            } else {
                textBox.innerText = "你在探索中遇到了一位流浪商人，他向你兜售神秘物品...";
            }
            // 模擬獲得獎勵回傳主程式
            GlobalState.gold += 10;
            alert("觸發劇情！獲得 10 金幣 (已存入主程式)");
        } else {
            npc.style.display = 'none';
            textBox.innerText = mode === 'harem' ? "當差中... 平安無事。" : "冒險中... 四周一片寂靜。";
        }
        
        // 模擬受傷
        if (Math.random() < 0.3) {
            s.hp -= 10;
            if (s.hp <= 0) act.storyDie();
        }
        
        act.initStoryUI();
        act.save();
    },

    storyDie: () => {
        alert("你死掉了！劇情模式數值重置。");
        GlobalState.story.hp = GlobalState.story.maxHp;
        GlobalState.story.lv = 1;
        GlobalState.story.deadCount++;
        GlobalState.story.unlockedSkip = true; // 解鎖 SKIP
        act.initStoryUI();
        act.save();
    }
});