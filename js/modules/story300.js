/* js/modules/story300.js - V300.99 Fixed ID */
window.act = window.act || {};

Object.assign(window.act, {
    enterStoryMode: () => {
        act.navigate('story');
        act.initStoryUI(); // ★ 修正：進入時立即初始化 UI
    },

    initStoryUI: () => {
        // ★ 安全檢查：防止資料遺失導致崩潰
        if (!GlobalState.story) GlobalState.story = { hp: 100, maxHp: 100, exploreCount: 0, deadCount: 0, unlockedSkip: false };
        
        const s = GlobalState.story;
        const mode = GlobalState.settings.mode;
        const btn = document.getElementById('btn-explore');
        if(btn) btn.innerText = mode === 'harem' ? "繼續當差" : "繼續探險";
        
        const skipBtn = document.getElementById('story-skip');
        if(skipBtn) skipBtn.style.display = s.unlockedSkip ? 'block' : 'none';
    },

    storySkip: () => {
        document.getElementById('story-text').innerText = "你快速跳過了已知的劇情...";
    },

    exploreStory: () => {
        const s = GlobalState.story;
        const mode = GlobalState.settings.mode;
        
        s.exploreCount++;
        const chance = s.exploreCount <= 5 ? 0.2 : 0.02; // 初期高機率，後期低機率
        const isEvent = Math.random() < chance;
        
        const textBox = document.getElementById('story-text');
        // ★ 修正：這裡的 ID 必須對應 index.html 的 id="story-npc-char"
        const npc = document.getElementById('story-npc-char'); 
        
        if (isEvent) {
            if(npc) npc.style.display = 'block';
            if (mode === 'harem') {
                textBox.innerText = "你遇到了一位神秘的妃子，她似乎對你有話要說...";
            } else {
                textBox.innerText = "你在探索中遇到了一位流浪商人，他向你兜售神秘物品...";
            }
            GlobalState.gold += 10;
            // 移除 alert 讓體驗更流暢，改為 UI 顯示或 Log
            act.addLog("劇情觸發", "獲得 10 金幣");
            if(window.view) view.renderHUD();
        } else {
            if(npc) npc.style.display = 'none';
            textBox.innerText = mode === 'harem' ? "當差中... 平安無事。" : "冒險中... 四周一片寂靜。";
        }
        
        // 模擬受傷
        if (Math.random() < 0.1) { // 降低受傷機率
            s.hp -= 10;
            if (s.hp <= 0) act.storyDie();
        }
        
        act.initStoryUI();
        act.save();
    },

    storyDie: () => {
        act.alert("你死掉了！劇情模式數值重置。");
        GlobalState.story.hp = GlobalState.story.maxHp;
        GlobalState.story.exploreCount = 0;
        GlobalState.story.deadCount++;
        GlobalState.story.unlockedSkip = true; 
        act.initStoryUI();
        act.save();
    }
});