/* js/data105.js - V300.30 Attributes & Difficulty */

const DefaultData = {
    gold: 100,
    freeGem: 0,
    paidGem: 0,
    lv: 1,
    exp: 0,
    
    // 6 大核心屬性 (固定 ID)
    // 格式: { id: 'str', name: '力量', v: 1, exp: 0 }
    attrs: {
        str: { name: '體能', v: 1, exp: 0, icon: '💪' }, // 對應運動
        int: { name: '智慧', v: 1, exp: 0, icon: '🧠' }, // 對應讀書、學習
        vit: { name: '毅力', v: 1, exp: 0, icon: '🔥' }, // 對應每日、習慣
        chr: { name: '魅力', v: 1, exp: 0, icon: '✨' }, // 對應保養、社交
        dex: { name: '靈巧', v: 1, exp: 0, icon: '👐' }, // 對應手作、家事
        luc: { name: '幸運', v: 1, exp: 0, icon: '🍀' }  // 對應隨機、願望
    },

    // 技能 (標籤) 列表
    // 格式: { name: '縫紉', parent: 'dex', lv: 1, exp: 0, lastUsed: '2025-01-01' }
    skills: [], 

    tasks: [],
    achievements: [],
    history: [],
    bag: [],
    
    // 商店預設資料 (防止空空如也)
    shop: {
        npc: [
            { id: 'def_1', name: '🥤 手搖飲', price: 60, category: '熱量', desc: '快樂泉源', qty: 99, perm: 'daily' },
            { id: 'def_2', name: '🎮 耍廢一小時', price: 150, category: '時間', desc: '休息是為了走更長遠的路', qty: 99, perm: 'daily' },
            { id: 'def_3', name: '🍿 看場電影', price: 350, category: '娛樂', desc: '享受視覺饗宴', qty: 99, perm: 'daily' },
            { id: 'def_4', name: '💤 賴床券', price: 500, category: '時間', desc: '再睡五分鐘...', qty: 10, perm: 'once' }
        ],
        user: []
    },

    settings: {
        mode: 'adventurer', // adventurer, harem, basic
        calMode: false,
        calMax: 2000,
        strictMode: false // 嚴格模式 (開啟後會倒扣經驗)
    },
    
    cal: { today: 0, logs: [], date: "" },
    cats: ['每日', '雜事', '願望'] // 預設分類
};

// 難度定義 (係數表)
const DIFFICULTY_DEFS = {
    'S':  { label: '簡單', baseGold: 15, baseExp: 10,  color: '#81c784' },
    'M':  { label: '中等', baseGold: 35, baseExp: 25,  color: '#4db6ac' },
    'L':  { label: '困難', baseGold: 80, baseExp: 60,  color: '#ffb74d' },
    'XL': { label: '史詩', baseGold: 200, baseExp: 150, color: '#e57373' }
};

let GlobalState = JSON.parse(JSON.stringify(DefaultData));
let TempState = { filterCategory: '全部', shopCategory: '熱量', taskTab: 'task' };