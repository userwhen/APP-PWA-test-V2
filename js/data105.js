/* js/data105.js - V300.41 Categories & Attributes */

const DefaultData = {
    gold: 100,
    freeGem: 0,
    paidGem: 0,
    lv: 1,
    exp: 0,
    
    // 6 大核心屬性 (ID 固定，名稱可改)
    attrs: {
        str: { name: '體能', v: 1, exp: 0, icon: '💪' }, 
        int: { name: '智慧', v: 1, exp: 0, icon: '🧠' },
        vit: { name: '毅力', v: 1, exp: 0, icon: '🔥' },
        chr: { name: '魅力', v: 1, exp: 0, icon: '✨' },
        dex: { name: '靈巧', v: 1, exp: 0, icon: '👐' },
        luc: { name: '幸運', v: 1, exp: 0, icon: '🍀' }
    },

    // 技能列表 (現在主要是記錄屬性等級的輔助，或者可視為"標籤"紀錄)
    skills: [], 

    tasks: [],
    achievements: [],
    history: [],
    bag: [],
    
    // 商店預設
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
        mode: 'adventurer', 
        calMode: false,
        calMax: 2000,
        strictMode: false 
    },
    
    cal: { today: 0, logs: [], date: "" },
    
    // ★ 核心修改：分類重命名與排序 ★
    cats: ['每日', '工作', '待辦', '願望'] 
};

// 難度定義 (對應拉桿 1-4)
const DIFFICULTY_DEFS = {
    1: { code: 'S',  label: '簡單', baseGold: 15, baseExp: 10,  color: '#81c784' },
    2: { code: 'M',  label: '中等', baseGold: 35, baseExp: 25,  color: '#4db6ac' },
    3: { code: 'L',  label: '困難', baseGold: 80, baseExp: 60,  color: '#ffb74d' },
    4: { code: 'XL', label: '史詩', baseGold: 200, baseExp: 150, color: '#e57373' }
};

let GlobalState = JSON.parse(JSON.stringify(DefaultData));
// 新增 shopFilter 用於商店分類
let TempState = { filterCategory: '全部', shopCategory: '全部', taskTab: 'task' };