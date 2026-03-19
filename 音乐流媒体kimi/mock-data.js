// ===== Mock Data for Music Streaming App =====

const mockSongs = [
    {
        id: 1,
        title: "夜曲",
        artist: "周杰伦",
        album: "十一月的萧邦",
        year: "2005",
        duration: "3:46",
        durationSeconds: 226,
        cover: "https://picsum.photos/seed/music1/300/300",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        genre: "流行",
        lyrics: [
            { time: 0, text: "（乐器前奏）" },
            { time: 15, text: "一群嗜血的蚂蚁 被腐肉所吸引" },
            { time: 19, text: "我面无表情 看孤独的风景" },
            { time: 23, text: "失去你 爱恨开始分明" },
            { time: 27, text: "失去你 还有什么事好关心" },
            { time: 31, text: "当鸽子不再象征和平" },
            { time: 35, text: "我终于被提醒" },
            { time: 38, text: "广场上喂食的是秃鹰" },
            { time: 42, text: "我用漂亮的押韵" },
            { time: 45, text: "形容被掠夺一空的爱情" },
            { time: 50, text: "啊 乌云开始遮蔽 夜色不干净" },
            { time: 55, text: "公园里 葬礼的回音 在漫天飞行" },
            { time: 60, text: "送你的白色玫瑰" },
            { time: 63, text: "在纯黑的环境凋零" },
            { time: 66, text: "乌鸦在树枝上诡异的很安静" },
            { time: 70, text: "静静听 我黑色的大衣" },
            { time: 74, text: "想温暖你日渐冰冷的回忆" },
            { time: 78, text: "走过的 走过的 生命" },
            { time: 82, text: "啊 四周弥漫雾气" },
            { time: 85, text: "我在空旷的墓地" },
            { time: 88, text: "老去后还爱你" }
        ]
    },
    {
        id: 2,
        title: "晴天",
        artist: "周杰伦",
        album: "叶惠美",
        year: "2003",
        duration: "4:29",
        durationSeconds: 269,
        cover: "https://picsum.photos/seed/music2/300/300",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        genre: "流行",
        lyrics: [
            { time: 0, text: "（吉他前奏）" },
            { time: 18, text: "故事的小黄花" },
            { time: 21, text: "从出生那年就飘着" },
            { time: 25, text: "童年的荡秋千" },
            { time: 28, text: "随记忆一直晃到现在" },
            { time: 32, text: "吹着前奏 望着天空" },
            { time: 36, text: "我想起花瓣试着掉落" },
            { time: 40, text: "为你翘课的那一天" },
            { time: 43, text: "花落的那一天" },
            { time: 46, text: "教室的那一间" },
            { time: 49, text: "我怎么看不见" },
            { time: 52, text: "消失的下雨天" },
            { time: 55, text: "我好想再淋一遍" },
            { time: 60, text: "没想到 失去的勇气我还留着" },
            { time: 67, text: "好想再问一遍" },
            { time: 70, text: "你会等待还是离开" },
            { time: 77, text: "刮风这天 我试过握着你手" },
            { time: 82, text: "但偏偏 雨渐渐" },
            { time: 86, text: "大到我看你不见" },
            { time: 91, text: "还要多久 我才能在你身边" },
            { time: 98, text: "等到放晴的那天" },
            { time: 102, text: "也许我会比较好一点" }
        ]
    },
    {
        id: 3,
        title: "七里香",
        artist: "周杰伦",
        album: "七里香",
        year: "2004",
        duration: "4:59",
        durationSeconds: 299,
        cover: "https://picsum.photos/seed/music3/300/300",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        genre: "流行",
        lyrics: [
            { time: 0, text: "（小提琴前奏）" },
            { time: 20, text: "窗外的麻雀 在电线杆上多嘴" },
            { time: 25, text: "你说这一句 很有夏天的感觉" },
            { time: 30, text: "手中的铅笔 在纸上来来回回" },
            { time: 35, text: "我用几行字形容你是我的谁" },
            { time: 40, text: "秋刀鱼的滋味 猫跟你都想了解" },
            { time: 45, text: "初恋的香味就这样被我们寻回" },
            { time: 50, text: "那温暖的阳光 像刚摘的鲜艳草莓" },
            { time: 55, text: "你说你舍不得吃掉这一种感觉" },
            { time: 60, text: "雨下整夜 我的爱溢出就像雨水" },
            { time: 66, text: "院子落叶 跟我的思念厚厚一叠" },
            { time: 72, text: "几句是非 也无法将我的热情冷却" },
            { time: 78, text: "你出现在我诗的每一页" }
        ]
    },
    {
        id: 4,
        title: "稻香",
        artist: "周杰伦",
        album: "魔杰座",
        year: "2008",
        duration: "3:43",
        durationSeconds: 223,
        cover: "https://picsum.photos/seed/music4/300/300",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        genre: "流行",
        lyrics: [
            { time: 0, text: "（虫鸣声开场）" },
            { time: 10, text: "对这个世界如果你有太多的抱怨" },
            { time: 14, text: "跌倒了就不敢继续往前走" },
            { time: 17, text: "为什么人要这么的脆弱 堕落" },
            { time: 21, text: "请你打开电视看看" },
            { time: 23, text: "多少人为生命在努力勇敢的走下去" },
            { time: 27, text: "我们是不是该知足" },
            { time: 29, text: "珍惜一切 就算没有拥有" },
            { time: 33, text: "还记得你说家是唯一的城堡" },
            { time: 37, text: "随着稻香河流继续奔跑" },
            { time: 41, text: "微微笑 小时候的梦我知道" },
            { time: 45, text: "不要哭让萤火虫带着你逃跑" },
            { time: 49, text: "乡间的歌谣永远的依靠" },
            { time: 53, text: "回家吧 回到最初的美好" }
        ]
    },
    {
        id: 5,
        title: "告白气球",
        artist: "周杰伦",
        album: "周杰伦的床边故事",
        year: "2016",
        duration: "3:35",
        durationSeconds: 215,
        cover: "https://picsum.photos/seed/music5/300/300",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        genre: "流行",
        lyrics: [
            { time: 0, text: "（轻快钢琴前奏）" },
            { time: 12, text: "塞纳河畔 左岸的咖啡" },
            { time: 16, text: "我手一杯 品尝你的美" },
            { time: 20, text: "留下唇印的嘴" },
            { time: 25, text: "花店玫瑰 名字写错谁" },
            { time: 29, text: "告白气球 风吹到对街" },
            { time: 33, text: "微笑在天上飞" },
            { time: 38, text: "你说你有点难追" },
            { time: 41, text: "想让我知难而退" },
            { time: 44, text: "礼物不需挑最贵" },
            { time: 47, text: "只要香榭的落叶" },
            { time: 51, text: "营造浪漫的约会" },
            { time: 54, text: "不害怕搞砸一切" },
            { time: 57, text: "拥有你就拥有 全世界" },
            { time: 62, text: "亲爱的 爱上你 从那天起" },
            { time: 66, text: "甜蜜的很轻易" },
            { time: 70, text: "亲爱的 别任性 你的眼睛" },
            { time: 74, text: "在说我愿意" }
        ]
    },
    {
        id: 6,
        title: "演员",
        artist: "薛之谦",
        album: "绅士",
        year: "2015",
        duration: "4:20",
        durationSeconds: 260,
        cover: "https://picsum.photos/seed/music6/300/300",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
        genre: "流行",
        lyrics: [
            { time: 0, text: "（钢琴前奏）" },
            { time: 14, text: "简单点 说话的方式简单点" },
            { time: 19, text: "递进的情绪请省略" },
            { time: 22, text: "你又不是个演员" },
            { time: 25, text: "别设计那些情节" },
            { time: 30, text: "没意见 我只想看看你怎么圆" },
            { time: 35, text: "你难过的太表面 像没天赋的演员" },
            { time: 40, text: "观众一眼能看见" },
            { time: 45, text: "该配合你演出的我演视而不见" },
            { time: 50, text: "在逼一个最爱你的人即兴表演" },
            { time: 55, text: "什么时候我们开始收起了底线" },
            { time: 60, text: "顺应时代的改变看那些拙劣的表演" },
            { time: 65, text: "可你曾经那么爱我干嘛演出细节" },
            { time: 70, text: "我该变成什么样子才能延缓厌倦" },
            { time: 75, text: "原来当爱放下防备后的这些那些" },
            { time: 80, text: "才是考验" }
        ]
    },
    {
        id: 7,
        title: "体面",
        artist: "于文文",
        album: "体面",
        year: "2017",
        duration: "4:12",
        durationSeconds: 252,
        cover: "https://picsum.photos/seed/music7/300/300",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
        genre: "流行",
        lyrics: [
            { time: 0, text: "（吉他前奏）" },
            { time: 15, text: "别堆砌怀念让剧情变得狗血" },
            { time: 20, text: "深爱了多年又何必毁了经典" },
            { time: 25, text: "都已成年不拖不欠" },
            { time: 29, text: "浪费时间是我情愿" },
            { time: 33, text: "像谢幕的演员" },
            { time: 36, text: "眼看着灯光熄灭" },
            { time: 40, text: "来不及再轰轰烈烈" },
            { time: 44, text: "就保留告别的尊严" },
            { time: 48, text: "我爱你不后悔 也尊重故事结尾" },
            { time: 55, text: "分手应该体面 谁都不要说抱歉" },
            { time: 61, text: "何来亏欠 我敢给就敢心碎" },
            { time: 67, text: "镜头前面是从前的我们" },
            { time: 72, text: "在喝彩 流着泪声嘶力竭" },
            { time: 78, text: "离开也很体面 才没辜负这些年" },
            { time: 84, text: "爱得热烈 认真付出的画面" },
            { time: 90, text: "别让执念 毁掉了昨天" },
            { time: 95, text: "我爱过你 利落干脆" }
        ]
    },
    {
        id: 8,
        title: "追光者",
        artist: "岑宁儿",
        album: "追光者",
        year: "2017",
        duration: "4:05",
        durationSeconds: 245,
        cover: "https://picsum.photos/seed/music8/300/300",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
        genre: "流行",
        lyrics: [
            { time: 0, text: "（钢琴前奏）" },
            { time: 16, text: "如果说你是海上的烟火" },
            { time: 20, text: "我是浪花的泡沫" },
            { time: 24, text: "某一刻你的光照亮了我" },
            { time: 28, text: "如果说你是遥远的星河" },
            { time: 32, text: "耀眼得让人想哭" },
            { time: 36, text: "我是追逐着你的眼眸" },
            { time: 40, text: "总在孤单时候眺望夜空" },
            { time: 45, text: "我可以跟在你身后" },
            { time: 48, text: "像影子追着光梦游" },
            { time: 52, text: "我可以等在这路口" },
            { time: 56, text: "不管你会不会经过" },
            { time: 60, text: "每当我为你抬起头" },
            { time: 64, text: "连眼泪都觉得自由" },
            { time: 68, text: "有的爱像阳光倾落" },
            { time: 72, text: "边拥有边失去着" }
        ]
    },
    {
        id: 9,
        title: "成都",
        artist: "赵雷",
        album: "成都",
        year: "2016",
        duration: "5:28",
        durationSeconds: 328,
        cover: "https://picsum.photos/seed/music9/300/300",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
        genre: "民谣",
        lyrics: [
            { time: 0, text: "（吉他前奏）" },
            { time: 22, text: "让我掉下眼泪的 不止昨夜的酒" },
            { time: 28, text: "让我依依不舍的 不止你的温柔" },
            { time: 34, text: "余路还要走多久 你攥着我的手" },
            { time: 41, text: "让我感到为难的 是挣扎的自由" },
            { time: 48, text: "分别总是在九月 回忆是思念的愁" },
            { time: 55, text: "深秋嫩绿的垂柳 亲吻着我额头" },
            { time: 61, text: "在那座阴雨的小城里 我从未忘记你" },
            { time: 69, text: "成都 带不走的 只有你" },
            { time: 77, text: "和我在成都的街头走一走" },
            { time: 82, text: "直到所有的灯都熄灭了也不停留" },
            { time: 89, text: "你会挽着我的衣袖 我会把手揣进裤兜" },
            { time: 97, text: "走到玉林路的尽头 坐在小酒馆的门口" }
        ]
    },
    {
        id: 10,
        title: "南山南",
        artist: "马頔",
        album: "孤岛",
        year: "2014",
        duration: "4:32",
        durationSeconds: 272,
        cover: "https://picsum.photos/seed/music10/300/300",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
        genre: "民谣",
        lyrics: [
            { time: 0, text: "（吉他前奏）" },
            { time: 18, text: "你在南方的艳阳里 大雪纷飞" },
            { time: 23, text: "我在北方的寒夜里 四季如春" },
            { time: 28, text: "如果天黑之前来得及" },
            { time: 32, text: "我要忘了你的眼睛" },
            { time: 36, text: "穷极一生 做不完一场梦" },
            { time: 42, text: "他不再和谁谈论相逢的孤岛" },
            { time: 47, text: "因为心里早已荒无人烟" },
            { time: 52, text: "他的心里再装不下一个家" },
            { time: 57, text: "做一个只对自己说谎的哑巴" },
            { time: 62, text: "他说你任何为人称道的美丽" },
            { time: 67, text: "不及他第一次遇见你" },
            { time: 72, text: "时光苟延残喘无可奈何" },
            { time: 78, text: "如果所有土地连在一起" },
            { time: 83, text: "走上一生只为拥抱你" },
            { time: 88, text: "喝醉了他的梦 晚安" }
        ]
    },
    {
        id: 11,
        title: "平凡之路",
        artist: "朴树",
        album: "猎户星座",
        year: "2014",
        duration: "4:35",
        durationSeconds: 275,
        cover: "https://picsum.photos/seed/music11/300/300",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
        genre: "摇滚",
        lyrics: [
            { time: 0, text: "（汽车引擎声）" },
            { time: 12, text: "徘徊着的 在路上的" },
            { time: 17, text: "你要走吗 Via Via" },
            { time: 22, text: "易碎的 骄傲着" },
            { time: 27, text: "那也曾是我的模样" },
            { time: 32, text: "沸腾着的 不安着的" },
            { time: 37, text: "你要去哪 Via Via" },
            { time: 42, text: "谜一样的 沉默着的" },
            { time: 47, text: "故事你真的在听吗" },
            { time: 52, text: "我曾经跨过山和大海" },
            { time: 57, text: "也穿过人山人海" },
            { time: 62, text: "我曾经拥有着的一切" },
            { time: 67, text: "转眼都飘散如烟" },
            { time: 72, text: "我曾经失落失望失掉所有方向" },
            { time: 80, text: "直到看见平凡才是唯一的答案" }
        ]
    },
    {
        id: 12,
        title: "光年之外",
        artist: "邓紫棋",
        album: "光年之外",
        year: "2016",
        duration: "3:55",
        durationSeconds: 235,
        cover: "https://picsum.photos/seed/music12/300/300",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
        genre: "流行",
        lyrics: [
            { time: 0, text: "（电子音效开场）" },
            { time: 12, text: "感受停在我发端的指尖" },
            { time: 16, text: "如何瞬间冻结时间" },
            { time: 20, text: "记住望着我坚定的双眼" },
            { time: 24, text: "也许已经没有明天" },
            { time: 29, text: "面对浩瀚的星海" },
            { time: 32, text: "我们微小得像尘埃" },
            { time: 36, text: "漂浮在一片无奈" },
            { time: 40, text: "缘分让我们相遇乱世以外" },
            { time: 45, text: "命运却要我们危难中相爱" },
            { time: 50, text: "也许未来遥远在光年之外" },
            { time: 55, text: "我愿守候未知里为你等待" },
            { time: 60, text: "我没想到为了你我能疯狂到" },
            { time: 65, text: "山崩海啸没有你根本不想逃" },
            { time: 70, text: "我的大脑为了你已经疯狂到" },
            { time: 75, text: "脉搏心跳没有你根本不重要" }
        ]
    }
];

// ===== Recommendations Data =====
const recommendations = [
    { id: 1, songId: 1, reason: "根据你的收听历史" },
    { id: 2, songId: 3, reason: "今日热门" },
    { id: 3, songId: 5, reason: "新歌推荐" },
    { id: 4, songId: 7, reason: "相似风格" },
    { id: 5, songId: 9, reason: "编辑推荐" },
    { id: 6, songId: 11, reason: "经典回顾" }
];

// ===== Collaborative Playlist Data =====
const collaborativePlaylist = {
    name: "周末派对",
    owner: "Alice",
    members: ["Alice", "Bob", "Carol"],
    lastUpdated: new Date().toISOString(),
    songs: [1, 3, 5, 7, 9]
};

// ===== User Activities =====
const userActivities = [
    { user: "Alice", action: "添加了", songId: 1, time: Date.now() - 300000 },
    { user: "Bob", action: "喜欢了", songId: 3, time: Date.now() - 600000 },
    { user: "Carol", action: "正在播放", songId: 5, time: Date.now() - 900000 }
];

// ===== Helper Functions =====
function getSongById(id) {
    return mockSongs.find(song => song.id === id);
}

function searchSongs(query) {
    const lowercaseQuery = query.toLowerCase();
    return mockSongs.filter(song =>
        song.title.toLowerCase().includes(lowercaseQuery) ||
        song.artist.toLowerCase().includes(lowercaseQuery) ||
        song.album.toLowerCase().includes(lowercaseQuery)
    );
}

function getRecommendations() {
    return recommendations.map(rec => ({
        ...rec,
        song: getSongById(rec.songId)
    }));
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parseDuration(duration) {
    const parts = duration.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// ===== Cache API Helper =====
const CACHE_NAME = 'music-stream-cache-v1';

async function openCache() {
    return await caches.open(CACHE_NAME);
}

async function cacheSong(songId) {
    const song = getSongById(songId);
    if (!song) return false;

    try {
        const cache = await openCache();
        const response = await fetch(song.audioUrl);
        await cache.put(song.audioUrl, response);

        // Store metadata
        const metadata = {
            id: song.id,
            title: song.title,
            artist: song.artist,
            cover: song.cover,
            cachedAt: Date.now()
        };

        const cachedSongs = await getCachedSongsList();
        cachedSongs[songId] = metadata;
        localStorage.setItem('cachedSongs', JSON.stringify(cachedSongs));

        return true;
    } catch (error) {
        console.error('Failed to cache song:', error);
        return false;
    }
}

async function getCachedSongsList() {
    const cached = localStorage.getItem('cachedSongs');
    return cached ? JSON.parse(cached) : {};
}

async function isSongCached(songId) {
    const cachedSongs = await getCachedSongsList();
    return !!cachedSongs[songId];
}

async function getCachedSong(songId) {
    const song = getSongById(songId);
    if (!song) return null;

    const cache = await openCache();
    const response = await cache.match(song.audioUrl);
    return response;
}

async function removeCachedSong(songId) {
    const song = getSongById(songId);
    if (!song) return false;

    try {
        const cache = await openCache();
        await cache.delete(song.audioUrl);

        const cachedSongs = await getCachedSongsList();
        delete cachedSongs[songId];
        localStorage.setItem('cachedSongs', JSON.stringify(cachedSongs));

        return true;
    } catch (error) {
        console.error('Failed to remove cached song:', error);
        return false;
    }
}