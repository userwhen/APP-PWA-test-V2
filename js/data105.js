/* js/data105.js - V300.70 Login Streak */

const DefaultData = {
    gold: 100,
    freeGem: 0,
    paidGem: 0,
    lv: 1,
    exp: 0,
    
    // ★ 簽到系統變數 ★
    loginStreak: 0, // 連續登入天數
    lastLoginDate: "", // 最後登入日期 YYYY-MM-DD

    attrs: {
        str: { name: '體能', v: 1, exp: 0, icon: '💪' }, 
        int: { name: '智慧', v: 1, exp: 0, icon: '🧠' },
        vit: { name: '毅力', v: 1, exp: 0, icon: '🔥' },
        chr: { name: '魅力', v: 1, exp: 0, icon: '✨' },
        dex: { name: '靈巧', v: 1, exp: 0, icon: '👐' },
        luc: { name: '幸運', v: 1, exp: 0, icon: '🍀' }
    },

    skills: [], 
    tasks: [],
    achievements: [],
    history: [],
    bag: [],
    
    shop: {
        npc: [
            { id: 'def_1', name: '🥤 手搖飲', price: 60, category: '熱量', desc: '快樂泉源', val: 500, qty: 99, perm: 'daily' },
            { id: 'def_2', name: '🎮 耍廢一小時', price: 150, category: '時間', desc: '休息', val: '01:00', qty: 99, perm: 'daily' },
            { id: 'def_3', name: '🍿 看場電影', price: 350, category: '其他', desc: '享受視覺饗宴', val: 0, qty: 99, perm: 'daily' },
            { id: 'def_4', name: '💤 賴床券', price: 500, category: '時間', desc: '再睡五分鐘...', val: '00:05', qty: 10, perm: 'once' }
        ],
        user: []
    },

    settings: {
        mode: 'adventurer', 
        calMode: false,
        calMax: 2000,
        strictMode: false 
    },
    
    cal: { today: 0, logs: [], date: "" },
    
    cats: ['每日', '工作', '待辦', '願望'] 
};

// 難度定義
const DIFFICULTY_DEFS = {
    1: { label: '簡單', baseGold: 15, baseExp: 10,  color: '#81c784' },
    2: { label: '中等', baseGold: 35, baseExp: 25,  color: '#4db6ac' },
    3: { label: '困難', baseGold: 80, baseExp: 60,  color: '#ffb74d' },
    4: { label: '史詩', baseGold: 200, baseExp: 150, color: '#e57373' }
};

let GlobalState = JSON.parse(JSON.stringify(DefaultData));
let TempState = { filterCategory: '全部', shopCategory: '全部', taskTab: 'task' };