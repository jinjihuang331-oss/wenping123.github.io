// ============================================================
// Mock Dataset — 歌曲、播放列表、歌词
// ============================================================

const MOCK_SONGS = [
  {
    id: 's1', title: '星空下的旋律', artist: '林月华', album: '夜色温柔', duration: 234,
    cover: 'https://picsum.photos/seed/s1/300/300',
    genre: '流行', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 's2', title: '夏日微风', artist: '陈海潮', album: '海边故事', duration: 198,
    cover: 'https://picsum.photos/seed/s2/300/300',
    genre: '民谣', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 's3', title: '东京夜雨', artist: '藤原美樱', album: '城市之光', duration: 267,
    cover: 'https://picsum.photos/seed/s3/300/300',
    genre: 'J-Pop', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 's4', title: 'Midnight Drive', artist: 'Nova Waves', album: 'Neon Horizon', duration: 312,
    cover: 'https://picsum.photos/seed/s4/300/300',
    genre: '电子', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 's5', title: '古城谣', artist: '李墨白', album: '墨色山河', duration: 285,
    cover: 'https://picsum.photos/seed/s5/300/300',
    genre: '国风', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: 's6', title: 'Electric Dreams', artist: 'Synthwave Collective', album: 'Retrowave', duration: 245,
    cover: 'https://picsum.photos/seed/s6/300/300',
    genre: '电子', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  {
    id: 's7', title: '咖啡馆的故事', artist: '周小弦', album: '午后时光', duration: 213,
    cover: 'https://picsum.photos/seed/s7/300/300',
    genre: '爵士', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 's8', title: 'Broken Wings', artist: 'Aria Stone', album: 'Phoenix', duration: 276,
    cover: 'https://picsum.photos/seed/s8/300/300',
    genre: '摇滚', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 's9', title: '江南可采莲', artist: '沈清韵', album: '水乡梦', duration: 302,
    cover: 'https://picsum.photos/seed/s9/300/300',
    genre: '国风', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 's10', title: 'Starlight Serenade', artist: 'Luna Park', album: 'Celestial', duration: 228,
    cover: 'https://picsum.photos/seed/s10/300/300',
    genre: '流行', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 's11', title: '落日余晖', artist: '林月华', album: '夜色温柔', duration: 251,
    cover: 'https://picsum.photos/seed/s11/300/300',
    genre: '流行', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: 's12', title: 'Neon City', artist: 'Nova Waves', album: 'Neon Horizon', duration: 290,
    cover: 'https://picsum.photos/seed/s12/300/300',
    genre: '电子', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  {
    id: 's13', title: '竹林深处', artist: '李墨白', album: '墨色山河', duration: 318,
    cover: 'https://picsum.photos/seed/s13/300/300',
    genre: '国风', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 's14', title: 'Rainy Sunday', artist: 'Jazz Cats', album: 'Lazy Afternoon', duration: 243,
    cover: 'https://picsum.photos/seed/s14/300/300',
    genre: '爵士', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 's15', title: '追光者', artist: '杨光辉', album: '追光', duration: 264,
    cover: 'https://picsum.photos/seed/s15/300/300',
    genre: '流行', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 's16', title: 'Ocean Breeze', artist: 'The Drifters', album: 'Seaside', duration: 229,
    cover: 'https://picsum.photos/seed/s16/300/300',
    genre: '民谣', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 's17', title: '春江花月夜', artist: '沈清韵', album: '水乡梦', duration: 345,
    cover: 'https://picsum.photos/seed/s17/300/300',
    genre: '国风', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: 's18', title: 'Digital Love', artist: 'Synthwave Collective', album: 'Retrowave', duration: 256,
    cover: 'https://picsum.photos/seed/s18/300/300',
    genre: '电子', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  {
    id: 's19', title: '晚风轻拂', artist: '周小弦', album: '午后时光', duration: 209,
    cover: 'https://picsum.photos/seed/s19/300/300',
    genre: '爵士', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 's20', title: 'Wildflower', artist: 'Aria Stone', album: 'Phoenix', duration: 238,
    cover: 'https://picsum.photos/seed/s20/300/300',
    genre: '摇滚', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  }
];

// 播放列表数据
const MOCK_PLAYLISTS = [
  { id: 'pl-1', name: '我喜欢的音乐', icon: 'fas fa-heart', songIds: ['s1','s3','s5','s7','s9','s10','s15'] },
  { id: 'pl-2', name: '工作必备', icon: 'fas fa-briefcase', songIds: ['s2','s6','s7','s14','s16','s19'] },
  { id: 'pl-3', name: '运动节奏', icon: 'fas fa-running', songIds: ['s4','s6','s8','s12','s18','s20'] },
  { id: 'featured-1', name: '热门排行', icon: 'fas fa-fire', songIds: ['s1','s4','s5','s10','s15','s20'] },
  { id: 'featured-2', name: '浪漫情歌', icon: 'fas fa-heart', songIds: ['s1','s3','s9','s11','s17'] },
  { id: 'featured-3', name: '电子节拍', icon: 'fas fa-bolt', songIds: ['s4','s6','s12','s18'] },
  { id: 'featured-4', name: '民谣时光', icon: 'fas fa-guitar', songIds: ['s2','s5','s9','s13','s16','s17'] },
  { id: 'collab-1', name: '周五派对', icon: 'fas fa-users', songIds: ['s4','s6','s8','s10','s20'], collaborative: true },
  { id: 'collab-2', name: '办公室音乐', icon: 'fas fa-users', songIds: ['s2','s7','s14','s16','s19'], collaborative: true }
];

// 时间同步歌词数据
const MOCK_LYRICS = {
  s1: [
    { time: 0, text: '♪ 前奏 ♪' },
    { time: 8, text: '夜空中最亮的星' },
    { time: 14, text: '能否听清那仰望的人' },
    { time: 20, text: '心底的孤独和叹息' },
    { time: 28, text: '我祈祷拥有一颗透明的心灵' },
    { time: 36, text: '和会流泪的眼睛' },
    { time: 44, text: '给我再去相信的勇气' },
    { time: 52, text: '越过谎言去拥抱你' },
    { time: 62, text: '每当我找不到存在的意义' },
    { time: 70, text: '每当我迷失在黑夜里' },
    { time: 80, text: '夜空中最亮的星' },
    { time: 88, text: '请照亮我前行' },
    { time: 98, text: '♪ 间奏 ♪' },
    { time: 110, text: '我宁愿所有痛苦都留在心里' },
    { time: 118, text: '也不愿忘记你的眼睛' },
    { time: 126, text: '给我再去相信的勇气' },
    { time: 134, text: '越过谎言去拥抱你' },
    { time: 144, text: '每当我找不到存在的意义' },
    { time: 152, text: '每当我迷失在黑夜里' },
    { time: 162, text: '夜空中最亮的星' },
    { time: 170, text: '请照亮我前行' },
    { time: 180, text: '♪ 尾奏 ♪' }
  ],
  s2: [
    { time: 0, text: '♪ 前奏 ♪' },
    { time: 10, text: '微风轻轻吹过脸庞' },
    { time: 18, text: '带来远方海的气息' },
    { time: 26, text: '脚踏细软的沙滩上' },
    { time: 34, text: '和你一起看夕阳' },
    { time: 44, text: '夏日的微风吹走了忧愁' },
    { time: 52, text: '浪花拍打着记忆的温柔' },
    { time: 62, text: '在这宁静的海边' },
    { time: 70, text: '我们许下永恒的诺言' },
    { time: 80, text: '♪ 间奏 ♪' },
    { time: 95, text: '海鸥在天空中自由翱翔' },
    { time: 103, text: '就像我们心中的梦想' },
    { time: 112, text: '不管未来有多远' },
    { time: 120, text: '有你在身旁就足够' },
    { time: 130, text: '♪ 尾奏 ♪' }
  ],
  s3: [
    { time: 0, text: '♪ intro ♪' },
    { time: 12, text: '東京の夜に雨が降る' },
    { time: 20, text: '窓を伝う雫のよう' },
    { time: 28, text: 'あなたの笑顔 思い出して' },
    { time: 36, text: 'いつまでも探している' },
    { time: 48, text: '雨の音が 心を揺らす' },
    { time: 56, text: '忘れられない あの夜のこと' },
    { time: 66, text: '東京の街で もう一度' },
    { time: 74, text: 'あなたに会いたい' },
    { time: 86, text: '♪ interlude ♪' },
    { time: 100, text: '雨上がりの空に 虹がかかる' },
    { time: 108, text: '明日はきっと 晴れるだろう' },
    { time: 118, text: 'この想いを 届けたい' },
    { time: 126, text: 'あなたの元へ' },
    { time: 138, text: '♪ outro ♪' }
  ],
  s4: [
    { time: 0, text: '♪ Synth Intro ♪' },
    { time: 15, text: 'Cruising down the highway' },
    { time: 22, text: 'Under the midnight sky' },
    { time: 30, text: 'Neon lights reflecting in my eyes' },
    { time: 38, text: 'The city never sleeps tonight' },
    { time: 48, text: 'Radio playing our favorite song' },
    { time: 56, text: 'We keep driving all night long' },
    { time: 66, text: 'Through the darkness we will find our way' },
    { time: 74, text: 'Chasing the dawn of a brand new day' },
    { time: 86, text: '♪ Drop ♪' },
    { time: 100, text: 'Midnight drive, take me higher' },
    { time: 108, text: 'Feel the beat of the electric wire' },
    { time: 118, text: 'Nothing can stop us now' },
    { time: 126, text: 'We own the night somehow' },
    { time: 140, text: '♪ Outro ♪' }
  ],
  s5: [
    { time: 0, text: '♪ 古筝前奏 ♪' },
    { time: 12, text: '青石板路蜿蜒向远方' },
    { time: 20, text: '城墙根下老人弈棋忙' },
    { time: 28, text: '炊烟袅袅升起在黄昏' },
    { time: 36, text: '古城的故事随风传唱' },
    { time: 48, text: '千年古城 岁月悠悠' },
    { time: 56, text: '多少往事 化作春秋' },
    { time: 66, text: '谁在楼头 倚栏回望' },
    { time: 74, text: '一曲古城谣 唱不尽离愁' },
    { time: 86, text: '♪ 琵琶间奏 ♪' },
    { time: 100, text: '月落乌啼霜满天' },
    { time: 108, text: '江枫渔火对愁眠' },
    { time: 118, text: '古城依旧 人已非' },
    { time: 126, text: '唯有谣曲 代代传' },
    { time: 140, text: '♪ 尾声 ♪' }
  ]
};

// 为没有专属歌词的歌曲生成通用歌词
function getLyricsForSong(songId) {
  if (MOCK_LYRICS[songId]) return MOCK_LYRICS[songId];
  const song = MOCK_SONGS.find(s => s.id === songId);
  if (!song) return [];
  const lines = [];
  const baseTexts = [
    '♪ 前奏 ♪',
    `${song.title} — 旋律响起`,
    '音符在空气中飘荡',
    `这是${song.artist}的代表作`,
    '每一个音符都触动心灵',
    '♪ 间奏 ♪',
    '让我们沉浸在这美妙的音乐中',
    `${song.album} — 值得回味`,
    '感受节奏的律动',
    '♪ 渐弱 ♪'
  ];
  const interval = Math.floor(song.duration / baseTexts.length);
  baseTexts.forEach((text, i) => {
    lines.push({ time: i * interval, text });
  });
  return lines;
}

// 获取歌曲通过ID
function getSongById(id) {
  return MOCK_SONGS.find(s => s.id === id);
}

// 格式化时间（秒 → mm:ss）
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
