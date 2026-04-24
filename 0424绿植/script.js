// ===== Plant Database =====
const plants = [
  {
    id: 'lvluo',
    name: '绿萝',
    latin: 'Epipremnum aureum',
    emoji: '🪴',
    category: 'foliage',
    difficulty: 'easy',
    tags: ['净化空气', '耐阴', '易养'],
    light: '散射光，避免直射阳光',
    lightLevel: 40,
    water: '保持土壤微湿，每7-10天浇水一次',
    waterLevel: 60,
    temp: '15-30°C，低于10°C会冻伤',
    fertilizer: '春夏每2周施一次稀薄液肥',
    tips: ['耐阴性极强，适合放在室内任意位置', '可以用清水水培', '叶面定期擦拭保持光泽', '出现黄叶及时修剪'],
    description: '绿萝是最受欢迎的室内观叶植物之一，被誉为"生命之花"，能有效净化甲醛等有害气体。'
  },
  {
    id: 'duorou',
    name: '多肉植物',
    latin: 'Succulents',
    emoji: '🌵',
    category: 'succulent',
    difficulty: 'easy',
    tags: ['耐旱', '喜光', '造型多样'],
    light: '充足阳光，每天至少4-6小时',
    lightLevel: 80,
    water: '宁干勿湿，10-15天浇一次',
    waterLevel: 25,
    temp: '10-30°C，不耐寒',
    fertilizer: '春秋生长季每月一次稀薄液肥',
    tips: ['控制浇水是关键，积水容易烂根', '需要通风良好的环境', '选透气性好的颗粒土', '夏季高温休眠期减少浇水'],
    description: '多肉植物以其可爱的外形和简单的养护方式深受喜爱，品种繁多，形态各异。'
  },
  {
    id: 'fafu',
    name: '发财树',
    latin: 'Pachira macrocarpa',
    emoji: '🌳',
    category: 'foliage',
    difficulty: 'easy',
    tags: ['招财寓意', '耐旱', '大型绿植'],
    light: '明亮散射光，耐半阴',
    lightLevel: 50,
    water: '每月1-2次，宁干勿湿',
    waterLevel: 20,
    temp: '18-30°C',
    fertilizer: '春夏每2个月施一次复合肥',
    tips: ['非常耐旱，浇水过多容易烂根', '保持空气湿度有助于叶色翠绿', '定期转动花盆使植株均匀生长', '冬季减少浇水频率'],
    description: '发财树寓意招财进宝，是办公室和家居中常见的观赏植物，树干粗壮，叶片四季常绿。'
  },
  {
    id: 'lanhua',
    name: '兰花',
    latin: 'Orchidaceae',
    emoji: '🌸',
    category: 'flowering',
    difficulty: 'hard',
    tags: ['高雅', '花香', '观赏价值高'],
    light: '柔和散射光，忌强光直射',
    lightLevel: 45,
    water: '见干见湿，保持基质湿润',
    waterLevel: 55,
    temp: '15-28°C，需昼夜温差',
    fertilizer: '薄肥勤施，生长季每周一次',
    tips: ['使用兰花专用植料（水苔/树皮）', '保持空气流通和湿度', '浇水时避免水流入叶心', '花后剪去花茎促发新芽'],
    description: '兰花是中国传统名花，姿态优雅、花香清幽，但需要精心养护才能花开不断。'
  },
  {
    id: 'guihuaniao',
    name: '桂花盆栽',
    latin: 'Osmanthus fragrans',
    emoji: '🌼',
    category: 'flowering',
    difficulty: 'medium',
    tags: ['芳香', '秋季开花', '传统名花'],
    light: '充足阳光，每天6小时以上',
    lightLevel: 85,
    water: '保持湿润但不积水',
    waterLevel: 50,
    temp: '15-28°C',
    fertilizer: '春季施氮肥，花前施磷钾肥',
    tips: ['桂花喜阳，光照不足不易开花', '修剪疏枝以促进通风', '花芽分化期控水促花', '注意防治红蜘蛛和介壳虫'],
    description: '桂花以其甜郁的花香闻名，金秋时节满室飘香，是中国十大传统名花之一。'
  },
  {
    id: 'yezi',
    name: '龟背竹',
    latin: 'Monstera deliciosa',
    emoji: '🍃',
    category: 'foliage',
    difficulty: 'medium',
    tags: ['网红植物', '热带风', '大型叶片'],
    light: '明亮散射光，适当直射',
    lightLevel: 55,
    water: '保持湿润，每周1-2次',
    waterLevel: 65,
    temp: '18-30°C，不耐寒',
    fertilizer: '春夏每2周一次液肥',
    tips: ['需要攀爬支撑帮助生长', '定期用湿布擦拭叶面', '空气干燥时向叶面喷水', '叶片裂开需要充足光照'],
    description: '龟背竹以其独特的裂叶造型成为近年来最受欢迎的网红绿植，具有浓烈的热带风情。'
  },
  {
    id: 'rose',
    name: '月季/玫瑰',
    latin: 'Rosa chinensis',
    emoji: '🌹',
    category: 'flowering',
    difficulty: 'medium',
    tags: ['四季开花', '花色丰富', '芳香'],
    light: '全日照，每天6小时以上',
    lightLevel: 90,
    water: '保持湿润，夏季需增加浇水',
    waterLevel: 70,
    temp: '15-28°C',
    fertilizer: '薄肥勤施，花期增施磷钾肥',
    tips: ['需要充足的光照才能多开花', '注意防治白粉病和蚜虫', '花后及时修剪残花', '冬季修剪整形'],
    description: '月季被称为"花中皇后"，花色丰富，四季开花，是最受欢迎的园艺花卉之一。'
  },
  {
    id: 'mantianxing',
    name: '满天星',
    latin: 'Gypsophila',
    emoji: '✨',
    category: 'flowering',
    difficulty: 'hard',
    tags: ['鲜切花', '浪漫', '婚礼用花'],
    light: '充足阳光',
    lightLevel: 80,
    water: '见干见湿，避免积水',
    waterLevel: 45,
    temp: '15-25°C',
    fertilizer: '生长期每2周施一次稀薄液肥',
    tips: ['需要阳光充足的环境', '土壤排水要好', '花期增施磷钾肥', '注意防治灰霉病'],
    description: '满天星花朵细小繁密，常作为配花使用，烘托浪漫氛围，也是干花的优质选择。'
  },
  {
    id: 'xianrenzh',
    name: '仙人掌',
    latin: 'Cactaceae',
    emoji: '🌵',
    category: 'succulent',
    difficulty: 'easy',
    tags: ['极耐旱', '防辐射', '造型奇特'],
    light: '充足的直射阳光',
    lightLevel: 90,
    water: '极少浇水，每月1次即可',
    waterLevel: 10,
    temp: '15-35°C',
    fertilizer: '春夏每2个月施一次稀薄液肥',
    tips: ['非常耐旱，切忌频繁浇水', '冬季休眠期基本不需浇水', '选沙质土壤，排水要好', '注意防治介壳虫'],
    description: '仙人掌是最容易养护的植物之一，品种丰富，外形奇特，是懒人养花的理想选择。'
  },
  {
    id: 'jinyinteng',
    name: '金银花',
    latin: 'Lonicera japonica',
    emoji: '🌷',
    category: 'herb',
    difficulty: 'medium',
    tags: ['药用', '攀爬藤本', '芳香'],
    light: '全日照至半阴',
    lightLevel: 70,
    water: '保持湿润，耐旱也耐湿',
    waterLevel: 55,
    temp: '15-30°C',
    fertilizer: '春季施基肥，花期追施磷钾肥',
    tips: ['需要搭设攀爬支架', '耐修剪，可控制造型', '花蕾可采制金银花茶', '冬季落叶后整形修剪'],
    description: '金银花既能观赏又能药用，初开时金银双色而得名，是庭院绿化的优良植物。'
  },
  {
    id: 'qingyou',
    name: '薄荷',
    latin: 'Mentha',
    emoji: '🌿',
    category: 'herb',
    difficulty: 'easy',
    tags: ['食用', '驱蚊', '清香'],
    light: '充足阳光，也耐半阴',
    lightLevel: 65,
    water: '保持土壤湿润',
    waterLevel: 75,
    temp: '15-30°C',
    fertilizer: '每2周施一次氮肥促叶',
    tips: ['生长速度很快，需要定期修剪', '可以用于泡茶、烹饪', '掐取顶端促进分枝', '注意防治蚜虫'],
    description: '薄荷是最实用的香草植物之一，既能观赏又可食用，清新的香气还有驱蚊效果。'
  },
  {
    id: 'huahuaniao',
    name: '茉莉花',
    latin: 'Jasminum sambac',
    emoji: '🤍',
    category: 'flowering',
    difficulty: 'medium',
    tags: ['芳香', '可泡茶', '夏季开花'],
    light: '充足阳光，每天6小时以上',
    lightLevel: 85,
    water: '保持湿润，夏季每天浇水',
    waterLevel: 75,
    temp: '20-35°C，不耐寒',
    fertilizer: '花期每7天施一次磷钾肥',
    tips: ['阳光越充足花开越多花越香', '花后修剪促发新枝', '越冬温度不低于5°C', '喜酸性土壤，可加硫酸亚铁'],
    description: '茉莉花香气浓郁清新，是最受欢迎的芳香植物之一，花朵还可用于制作花茶。'
  }
];

// ===== AI Knowledge Base & Response Engine =====
const knowledgeBase = {
  water: {
    patterns: ['浇水', '水分', '干旱', '湿', '水浇', '喷水', '灌水'],
    responses: [
      {
        match: '绿萝',
        answer: `<strong>💧 绿萝浇水指南</strong><br><br>绿萝浇水遵循"<strong>见干见湿</strong>"原则：<br>
<ul>
<li><strong>频率</strong>：每7-10天浇水一次，根据季节调整</li>
<li><strong>判断方法</strong>：用手指插入土中2-3cm，感觉干了再浇</li>
<li><strong>浇水量</strong>：浇透，直到盆底有水流出</li>
<li><strong>注意事项</strong>：避免盆底积水，防止烂根</li>
</ul>
<span class="tag">见干见湿</span><span class="tag">避免积水</span><span class="tag">冬季减少</span>`
      },
      {
        match: '多肉',
        answer: `<strong>🌵 多肉浇水技巧</strong><br><br>多肉的浇水核心原则是<strong>"宁干勿湿"</strong>：<br>
<ul>
<li><strong>夏季</strong>：10-15天一次，高温休眠期甚至可更久</li>
<li><strong>春秋</strong>：7-10天一次，生长旺盛期适度浇水</li>
<li><strong>冬季</strong>：15-20天一次或更少，低温休眠期控水</li>
<li><strong>浇水时间</strong>：早晨或傍晚，避免正午浇水</li>
</ul>
<span class="tag">宁干勿湿</span><span class="tag">沿盆边浇</span><span class="tag">通风晾干</span>`
      },
      {
        match: '发财树',
        answer: `<strong>🌳 发财树浇水方法</strong><br><br>发财树非常耐旱，浇水过多是最大的杀手！<br>
<ul>
<li><strong>频率</strong>：每月1-2次即可，宁干勿湿</li>
<li><strong>观察</strong>：叶片微微下垂时再浇水也不迟</li>
<li><strong>方法</strong>：浇透但要确保排水良好</li>
<li><strong>冬季</strong>：可延长到每1-2个月一次</li>
</ul>
<span class="tag">极耐旱</span><span class="tag">少浇水</span><span class="tag">排水要好</span>`
      },
      {
        match: '(兰花|蝴蝶兰)',
        answer: `<strong>🌸 兰花浇水指南</strong><br><br>兰花对水分比较敏感，需要格外注意：<br>
<ul>
<li><strong>水质</strong>：最好使用放置1-2天的自来水或雨水</li>
<li><strong>方法</strong>：用喷壶细流浇灌，避免水流入叶心</li>
<li><strong>时间</strong>：早晨浇水，使植株有时间在夜间干燥</li>
<li><strong>频率</strong>：春秋3-5天一次，夏季每天喷雾，冬季7-10天一次</li>
</ul>
<span class="tag">清晨浇水</span><span class="tag">避免叶心积水</span><span class="tag">保持湿度</span>`
      }
    ],
    defaultAnswer: `<strong>💧 通用浇水建议</strong><br><br>不同植物的浇水需求不同，但有几个通用原则：<br>
<ul>
<li><strong>见干见湿</strong>：大多数植物适合这个原则，等表层土壤干了再浇</li>
<li><strong>宁干勿湿</strong>：多肉、发财树等耐旱植物，宁可太干也不要太湿</li>
<li><strong>浇则浇透</strong>：浇水时浇到盆底有水流出为止</li>
<li><strong>时间</strong>：春夏在早晨浇水，秋冬在中午温暖时浇水</li>
<li><strong>注意排水</strong>：确保花盆有排水孔，避免积水导致烂根</li>
</ul>
<span class="tag">见干见湿</span><span class="tag">清晨最佳</span><span class="tag">排水良好</span>`
  },

  fertilizer: {
    patterns: ['施肥', '肥料', '养分', '营养', '追肥', '底肥', '化肥', '有机肥'],
    responses: [
      {
        match: '多肉',
        answer: `<strong>🌱 多肉施肥方法</strong><br><br>多肉对肥料需求较少，施肥要格外小心：<br>
<ul>
<li><strong>施肥季节</strong>：仅春秋生长季施肥，夏冬休眠期不施</li>
<li><strong>肥料选择</strong>：使用多肉专用肥或稀释的水溶肥</li>
<li><strong>浓度</strong>：稀释到推荐浓度的一半甚至更低</li>
<li><strong>频率</strong>：每4-6周一次即可</li>
</ul>
<span class="tag">薄肥</span><span class="tag">仅春秋</span><span class="tag">宁淡不浓</span>`
      },
      {
        match: '绿萝',
        answer: `<strong>🌱 绿萝施肥指南</strong><br><br>适当施肥能让绿萝长得更茂盛：<br>
<ul>
<li><strong>春夏</strong>：每2周施一次稀薄液肥（氮钾肥为主）</li>
<li><strong>秋冬</strong>：减少或停止施肥</li>
<li><strong>方法</strong>：以液肥灌根为主，也可以喷施叶面肥</li>
<li><strong>注意事项</strong>：肥液不要沾到叶片上，浓度宁低勿高</li>
</ul>
<span class="tag">氮钾肥</span><span class="tag">春夏薄施</span><span class="tag">秋冬停肥</span>`
      },
      {
        match: '月季|玫瑰',
        answer: `<strong>🌹 月季施肥方案</strong><br><br>月季是"肥罐子"，需肥量较大：<br>
<ul>
<li><strong>春季</strong>：施氮磷钾均衡肥促新枝</li>
<li><strong>花期前</strong>：增施磷钾肥促花芽分化</li>
<li><strong>花后</strong>：追施一次速效肥补充养分</li>
<li><strong>秋冬</strong>：施缓释有机肥做底肥过冬</li>
<li><strong>原则</strong>：薄肥勤施，每10-15天一次</li>
</ul>
<span class="tag">薄肥勤施</span><span class="tag">磷钾促花</span><span class="tag">四季有别</span>`
      }
    ],
    defaultAnswer: `<strong>🌱 通用施肥指南</strong><br><br>合理施肥是植物健康生长的关键：<br>
<ul>
<li><strong>施肥原则</strong>：薄肥勤施，宁淡不浓</li>
<li><strong>时机</strong>：春秋生长季施肥为主</li>
<li><strong>肥料类型</strong>：
  - 氮肥 → 促叶片生长
  - 磷肥 → 促花芽分化和根系发育
  - 钾肥 → 增强抗性和整体健壮
</li>
<li><strong>方式</strong>：液肥灌根、叶面喷施、缓释颗粒肥</li>
<li><strong>禁忌</strong>：切忌施浓肥和生肥，高温和严寒时不施肥</li>
</ul>
<span class="tag">薄肥勤施</span><span class="tag">看苗施肥</span><span class="tag">四季有别</span>`
  },

  yellowLeaves: {
    patterns: ['黄叶', '叶子黄', '发黄', '枯叶', '落叶', '叶尖干'],
    answer: `<strong>🍂 叶片发黄原因分析</strong><br><br>叶片发黄是植物常见的健康信号，常见原因如下：<br>
<ul>
<li><strong>浇水过多</strong> → 叶片整体发黄、变软、下垂<br>→ 解决：减少浇水，改善排水</li>
<li><strong>浇水不足</strong> → 叶尖和边缘先发黄变干<br>→ 解决：适当增加浇水</li>
<li><strong>光照不当</strong> → 过强则叶片灼伤出现黄斑，过弱则叶色变淡<br>→ 解决：调整摆放位置</li>
<li><strong>养分不足</strong> → 老叶先黄，新叶淡绿<br>→ 解决：适时补充肥料</li>
<li><strong>温度不适</strong> → 低温冻伤或高温蒸腾过快<br>→ 解决：调节养护温度</li>
</ul>
<span class="tag">诊断原因</span><span class="tag">对症下药</span><span class="tag">及时处理</span>`
  },

  indoor: {
    patterns: ['室内', '家里', '办公室', '室内养', '卧室', '客厅', '适合养什么', '推荐'],
    answer: `<strong>🏠 适合室内养的植物推荐</strong><br><br>根据不同环境，推荐以下室内绿植：<br><br>
<strong>📜 新手友好型：</strong>
<ul>
<li>🌱 绿萝 — 最耐阴最好养，净化空气神器</li>
<li>🌳 发财树 — 耐旱，寓意好，养护简单</li>
<li>🌵 仙人掌 — 极少浇水，适合上班族</li>
<li>🐍 虎皮兰 — 耐阴耐旱，还能释放氧气</li>
</ul>
<strong>🌸 观赏开花型：</strong>
<ul>
<li>🤍 茉莉花 — 香气怡人，可泡茶</li>
<li>🌹 月季 — 花色丰富，四季开花</li>
<li>🌸 兰花 — 高雅脱俗，观赏价值极高</li>
</ul>
<strong>🍃 大型装饰型：</strong>
<ul>
<li>🍃 龟背竹 — 热带风情，造型独特</li>
<li>🌱 散尾葵 — 飘逸优美，净化空气</li>
<li>🌿 橡皮树 — 叶片厚实油亮，气场十足</li>
</ul>
<span class="tag">因地制宜</span><span class="tag">新手友好</span><span class="tag">净化空气</span>`
  },

  pest: {
    patterns: ['虫', '害虫', '蚜虫', '红蜘蛛', '介壳虫', '白粉', '病害', '病', '生虫'],
    answer: `<strong>🐛 常见病虫害防治</strong><br><br>常见病虫害及应对方法：<br>
<ul>
<li><strong>蚜虫</strong>：嫩芽、嫩叶上可见小虫群<br>
→ 用肥皂水喷洒，或用吡虫啉等药剂</li>
<li><strong>红蜘蛛</strong>：叶片出现黄点、细网<br>
→ 增加空气湿度，用杀螨剂喷施</li>
<li><strong>介壳虫</strong>：茎叶上出现白色/褐色小凸点<br>
→ 用酒精棉签擦拭，严重时喷药</li>
<li><strong>白粉病</strong>：叶片上出现白色粉末<br>
→ 改善通风，喷施多菌灵</li>
<li><strong>黑斑病</strong>：叶片出现黑褐色斑点<br>
→ 剪除病叶，喷施杀菌剂</li>
</ul>
<strong>预防为主</strong>：保持良好通风、适当光照、合理浇水施肥，增强植物抵抗力。
<span class="tag">预防为主</span><span class="tag">隔离病株</span><span class="tag">对症用药</span>`
  },

  season: {
    patterns: ['夏天', '冬天', '春季', '秋季', '季节', '高温', '低温', '过冬', '越冬'],
    answer: `<strong>🌡️ 四季养护要点</strong><br><br>
<strong>🌱 春季（3-5月）</strong> — 万物复苏
<ul>
<li>换盆换土的最佳时机</li>
<li>增加浇水频率，开始施肥</li>
<li>适合扦插繁殖</li>
</ul>
<strong>☀️ 夏季（6-8月）</strong> — 避暑降温
<ul>
<li>避免正午浇水，早晨傍晚浇水</li>
<li>遮阴防暴晒，加强通风</li>
<li>多肉和高冷花卉注意降温</li>
</ul>
<strong>🍂 秋季（9-11月）</strong> — 储蓄养分
<ul>
<li>磷钾肥为主，促进花芽分化</li>
<li>逐渐减少浇水频率</li>
<li>做好入冬准备</li>
</ul>
<strong>❄️ 冬季（12-2月）</strong> — 休眠越冬
<ul>
<li>减少浇水，保持偏干</li>
<li>停止施肥</li>
<li>注意保温，移到室内温暖处</li>
</ul>
<span class="tag">顺应季节</span><span class="tag">春施秋控</span><span class="tag">冬保夏遮</span>`
  }
};

// ===== AI Response Generator =====
function generateResponse(question) {
  const q = question.toLowerCase();

  for (const [, category] of Object.entries(knowledgeBase)) {
    if (category.patterns && category.answer && category.patterns.some(p => q.includes(p))) {
      // Check for specific match in responses
      if (category.responses) {
        for (const r of category.responses) {
          const regex = new RegExp(r.match);
          if (regex.test(q)) return r.answer;
        }
      }
      return category.answer;
    }

    if (category.patterns && category.defaultAnswer && category.patterns.some(p => q.includes(p))) {
      if (category.responses) {
        for (const r of category.responses) {
          const regex = new RegExp(r.match);
          if (regex.test(q)) return r.answer;
        }
      }
      return category.defaultAnswer;
    }
  }

  // Plant-specific questions
  for (const plant of plants) {
    if (q.includes(plant.name.toLowerCase()) || q.includes(plant.id)) {
      return `<strong>${plant.emoji} ${plant.name}养护全攻略</strong><br><br>
${plant.description}<br><br>
<strong>💡 光照需求</strong>：${plant.light}<br>
<strong>💧 浇水方法</strong>：${plant.water}<br>
<strong>🌡️ 适宜温度</strong>：${plant.temp}<br>
<strong>🌱 施肥建议</strong>：${plant.fertilizer}<br><br>
<strong>📋 养护要点：</strong>
<ul>${plant.tips.map(t => `<li>${t}</li>`).join('')}</ul>
<span class="tag">${plant.tags.join('</span> <span class="tag">')}</span>`;
    }
  }

  // General greening questions
  if (q.includes('你好') || q.includes('hi') || q.includes('hello')) {
    return `你好呀！我是你的 AI 绿植助手 🌱<br><br>我可以帮你解答以下方面的问题：<br>
<ul>
<li>💧 各种植物的浇水方法</li>
<li>🌱 施肥方案和肥料选择</li>
<li>☀️ 光照和温度需求</li>
<li>🐛 病虫害识别和防治</li>
<li>🍂 叶片异常诊断</li>
<li>🏠 室内植物推荐</li>
<li>🌡️ 四季养护要点</li>
</ul>
直接输入你的问题，比如"绿萝怎么浇水？"<br>或者点击上方的快捷按钮开始吧！`;
  }

  if (q.includes('谢谢') || q.includes('感谢') || q.includes('thanks')) {
    return `不客气！🙏 很高兴能帮到你。<br><br>记住养护绿植最重要的是<strong>观察</strong>和<strong>耐心</strong>，每棵植物都有自己的性格，认真观察它的状态，它会用美丽的叶片和花朵回报你的！🌿<br><br>如果还有其他问题，随时问我哦~`;
  }

  // Default response
  return `感谢你的提问！🌿<br><br>关于"${question}"，我有以下建议：<br><br>
养护植物的关键在于三点：<br>
<ul>
<li><strong>了解植物习性</strong>：每棵植物对光照、水分、温度的需求不同</li>
<li><strong>观察植物状态</strong>：叶片颜色、土壤湿度、生长速度都能反映健康状况</li>
<li><strong>因时制宜</strong>：不同季节养护方法需要相应调整</li>
</ul>
你可以试着更具体地描述你的问题，比如："<strong>XX植物怎么浇水？</strong>"或"<strong>XX植物叶子发黄怎么办？</strong>"，这样我能给出更精准的建议！<br><br>
<span class="tag">你可以逛逛植物百科</span><span class="tag">查看养护日历</span><span class="tag">阅读养护贴士</span>`;
}

// ===== Chat System =====
const chatContainer = document.getElementById('chatContainer');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const welcomeDiv = chatContainer.querySelector('.chat-welcome');

function addMessage(content, type = 'ai') {
  // Hide welcome on first message
  if (welcomeDiv) {
    welcomeDiv.style.display = 'none';
  }

  const msg = document.createElement('div');
  msg.className = `chat-msg ${type}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = type === 'ai' ? '🌱' : '😊';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = content;

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  return bubble;
}

function showTyping() {
  const msg = document.createElement('div');
  msg.className = 'chat-msg ai';
  msg.id = 'typingMsg';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = '🌱';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById('typingMsg');
  if (typing) typing.remove();
}

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  chatInput.value = '';
  chatInput.style.height = 'auto';

  showTyping();

  // Simulate AI thinking
  const delay = 600 + Math.random() * 1200;
  setTimeout(() => {
    removeTyping();
    const response = generateResponse(text);
    addMessage(response, 'ai');
  }, delay);
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
});

// Quick questions
document.querySelectorAll('.quick-q').forEach(btn => {
  btn.addEventListener('click', () => {
    chatInput.value = btn.dataset.q;
    sendMessage();
  });
});

// ===== Tab Navigation =====
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const pageTitle = document.getElementById('pageTitle');
const pageDesc = document.getElementById('pageDesc');
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');

const tabInfo = {
  chat: { title: '💬 智能问答', desc: '向 AI 咨询任何花草养护问题' },
  plants: { title: '🍀 植物百科', desc: '了解各种植物的养护要点' },
  calendar: { title: '📅 养护日历', desc: '规划和管理你的养护计划' },
  tips: { title: '💡 养护小贴士', desc: '实用的园艺知识和技巧' }
};

function switchTab(tabName) {
  navItems.forEach(item => item.classList.toggle('active', item.dataset.tab === tabName));
  tabContents.forEach(content => content.classList.toggle('active', content.id === `tab-${tabName}`));
  pageTitle.textContent = tabInfo[tabName].title;
  pageDesc.textContent = tabInfo[tabName].desc;

  // Close mobile sidebar
  sidebar.classList.remove('open');
  const overlay = document.querySelector('.sidebar-overlay');
  if (overlay) overlay.classList.remove('show');

  // Initialize tab content
  if (tabName === 'plants') renderPlants();
  if (tabName === 'calendar') renderCalendar();
  if (tabName === 'tips') renderTips();
}

navItems.forEach(item => {
  item.addEventListener('click', () => switchTab(item.dataset.tab));
});

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
    document.body.appendChild(overlay);
  }
  overlay.classList.toggle('show');
});

// ===== Plant Encyclopedia =====
let currentCategory = 'all';
let searchQuery = '';

function renderPlants() {
  const grid = document.getElementById('plantGrid');
  const filtered = plants.filter(p => {
    const matchCat = currentCategory === 'all' || p.category === currentCategory;
    const matchSearch = !searchQuery ||
      p.name.includes(searchQuery) ||
      p.latin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(t => t.includes(searchQuery));
    return matchCat && matchSearch;
  });

  grid.innerHTML = filtered.map(p => `
    <div class="plant-card" data-id="${p.id}">
      <span class="difficulty ${p.difficulty}">${p.difficulty === 'easy' ? '简单' : p.difficulty === 'medium' ? '中等' : '困难'}</span>
      <span class="plant-card-emoji">${p.emoji}</span>
      <h3>${p.name}</h3>
      <p class="plant-latin">${p.latin}</p>
      <div class="plant-tags">
        ${p.tags.map(t => `<span class="plant-tag">${t}</span>`).join('')}
      </div>
    </div>
  `).join('');

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;">没有找到匹配的植物 🌿</p>';
  }

  grid.querySelectorAll('.plant-card').forEach(card => {
    card.addEventListener('click', () => openPlantModal(card.dataset.id));
  });
}

document.getElementById('plantSearch').addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  renderPlants();
});

document.getElementById('categoryFilter').addEventListener('click', (e) => {
  if (e.target.classList.contains('filter-btn')) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentCategory = e.target.dataset.cat;
    renderPlants();
  }
});

// ===== Plant Modal =====
function openPlantModal(plantId) {
  const plant = plants.find(p => p.id === plantId);
  if (!plant) return;

  document.getElementById('modalEmoji').textContent = plant.emoji;
  document.getElementById('modalTitle').textContent = plant.name;
  document.getElementById('modalSubtitle').textContent = plant.latin;
  document.getElementById('modalBody').innerHTML = `
    <p style="color:var(--text-secondary);margin-bottom:20px;line-height:1.7;">${plant.description}</p>

    <div class="care-section">
      <h4>☀️ 光照需求</h4>
      <div class="care-bar"><div class="care-bar-fill" style="width:${plant.lightLevel}%"></div></div>
      <p>${plant.light}</p>
    </div>

    <div class="care-section">
      <h4>💧 浇水频率</h4>
      <div class="care-bar"><div class="care-bar-fill" style="width:${plant.waterLevel}%"></div></div>
      <p>${plant.water}</p>
    </div>

    <div class="care-section">
      <h4>🌡️ 温度要求</h4>
      <p>${plant.temp}</p>
    </div>

    <div class="care-section">
      <h4>🌱 施肥建议</h4>
      <p>${plant.fertilizer}</p>
    </div>

    <div class="care-section">
      <h4>📋 养护要点</h4>
      <ul>${plant.tips.map(t => `<li>${t}</li>`).join('')}</ul>
    </div>
  `;

  document.getElementById('modalAsk').onclick = () => {
    closeModal();
    switchTab('chat');
    chatInput.value = `${plant.name}怎么养护？`;
    sendMessage();
  };

  document.getElementById('plantModal').classList.add('show');
}

function closeModal() {
  document.getElementById('plantModal').classList.remove('show');
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('plantModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// ===== Calendar =====
let calDate = new Date();
let calSelected = null;

const taskTemplates = {
  water: { icon: '💧', type: 'water', title: '浇水', desc: '检查土壤湿度，适时浇水' },
  fertilize: { icon: '🌱', type: 'fertilize', title: '施肥', desc: '施加适量肥料补充养分' },
  prune: { icon: '✂️', type: 'prune', title: '修剪', desc: '修剪枯枝黄叶，促进新枝' },
  repot: { icon: '🪴', type: 'repot', title: '换盆', desc: '更换新土，检查根系' }
};

function generateTasks(year, month) {
  const tasks = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const season = month >= 2 && month <= 4 ? 'spring' :
                 month >= 5 && month <= 7 ? 'summer' :
                 month >= 8 && month <= 10 ? 'fall' : 'winter';

  // Water tasks - more frequent in summer
  const waterInterval = season === 'summer' ? 3 : season === 'winter' ? 7 : 5;
  for (let d = 1; d <= daysInMonth; d += waterInterval) {
    const key = d;
    if (!tasks[key]) tasks[key] = [];
    tasks[key].push({ ...taskTemplates.water, desc: '检查所有盆栽，适时浇水' });
  }

  // Fertilize tasks - mainly spring and fall
  if (season === 'spring' || season === 'fall') {
    for (let d = 7; d <= daysInMonth; d += 14) {
      const key = d;
      if (!tasks[key]) tasks[key] = [];
      tasks[key].push({ ...taskTemplates.fertilize });
    }
  }

  // Prune tasks
  if (season === 'spring') {
    for (let d = 10; d <= daysInMonth; d += 15) {
      const key = d;
      if (!tasks[key]) tasks[key] = [];
      tasks[key].push({ ...taskTemplates.prune, desc: '修剪枯枝，整形促新枝' });
    }
  }

  // Repot task in spring
  if (season === 'spring' && daysInMonth >= 15) {
    if (!tasks[20]) tasks[20] = [];
    tasks[20].push({ ...taskTemplates.repot, desc: '为需要换盆的植物更换新土' });
  }

  return tasks;
}

function renderCalendar() {
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  document.getElementById('calMonth').textContent = `${year}年 ${monthNames[month]}`;

  const grid = document.getElementById('calendarGrid');
  const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
  let html = weekdays.map(w => `<div class="cal-weekday">${w}</div>`).join('');

  const firstDay = new Date(year, month, 1).getDay();
  const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const tasks = generateTasks(year, month);

  for (let i = 0; i < adjustedFirst; i++) {
    html += '<div class="cal-day empty"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    const isSelected = calSelected && calSelected.year === year && calSelected.month === month && calSelected.day === d;
    const dayTasks = tasks[d] || [];

    let dots = '';
    if (dayTasks.length > 0) {
      dots = '<div class="cal-dots">' + dayTasks.map(t => `<div class="cal-dot ${t.type}"></div>`).join('') + '</div>';
    }

    html += `<div class="cal-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}" data-day="${d}">${d}${dots}</div>`;
  }

  grid.innerHTML = html;

  grid.querySelectorAll('.cal-day:not(.empty)').forEach(el => {
    el.addEventListener('click', () => {
      const day = parseInt(el.dataset.day);
      calSelected = { year, month, day };
      renderCalendar();
      renderDayTasks(day, tasks[day]);
    });
  });

  // Show today's tasks by default if no selection
  if (!calSelected && today.getFullYear() === year && today.getMonth() === month) {
    calSelected = { year, month, day: today.getDate() };
    renderCalendar();
    renderDayTasks(today.getDate(), tasks[today.getDate()]);
  } else if (calSelected && calSelected.year === year && calSelected.month === month) {
    renderDayTasks(calSelected.day, tasks[calSelected.day]);
  }
}

function renderDayTasks(day, dayTasks) {
  const container = document.getElementById('calendarTasks');
  if (!dayTasks || dayTasks.length === 0) {
    container.innerHTML = `
      <h4 style="margin-bottom:16px;">${calDate.getMonth() + 1}月${day}日</h4>
      <div class="task-empty">
        <span>📭</span>
        <p>今天没有养护任务</p>
        <p style="font-size:0.78rem;margin-top:4px;">好好享受绿植的美好吧~</p>
      </div>
    `;
  } else {
    container.innerHTML = `
      <h4 style="margin-bottom:16px;">${calDate.getMonth() + 1}月${day}日 · ${dayTasks.length}项任务</h4>
      ${dayTasks.map(t => `
        <div class="task-item">
          <div class="task-icon ${t.type}">${t.icon}</div>
          <div class="task-info">
            <h4>${t.title}</h4>
            <p>${t.desc}</p>
          </div>
        </div>
      `).join('')}
    `;
  }
}

document.getElementById('calPrev').addEventListener('click', () => {
  calDate.setMonth(calDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('calNext').addEventListener('click', () => {
  calDate.setMonth(calDate.getMonth() + 1);
  renderCalendar();
});

// ===== Tips =====
const tipsData = [
  {
    icon: '💧', title: '浇水黄金法则',
    text: '掌握好浇水时机是养花的关键。用手指插入土壤2-3厘米，感觉干燥再浇水。记住"见干见湿"比固定频率更重要。',
    list: ['早晨浇水优于傍晚', '浇水浇透直到盆底流出', '避免水直接浇在叶片上', '冬季减少浇水频率']
  },
  {
    icon: '☀️', title: '正确摆放位置',
    text: '不同朝向的窗户光照条件不同，选择合适的摆放位置至关重要。',
    list: ['南窗：光照最强，适合喜阳植物', '东窗：晨光柔和，适合大部分植物', '西窗：午后阳光强烈，需注意遮阴', '北窗：散射光，适合耐阴植物']
  },
  {
    icon: '🌱', title: '土壤选择攻略',
    text: '好的土壤是植物健康生长的基础，不同植物需要不同的土壤配比。',
    list: ['通用：泥炭土+珍珠岩+蛭石 2:1:1', '多肉：颗粒土为主，保证排水', '兰花：水苔或树皮，通气为主', '月季：疏松肥沃的园土加腐殖质']
  },
  {
    icon: '🌡️', title: '温度与湿度管理',
    text: '大多数室内植物适宜温度为15-28°C，湿度40-60%。冬季注意保暖，夏季注意通风。',
    list: ['避免将植物放在空调/暖气出风口', '干燥季节用加湿器或在周围放水盘', '高温天向叶面喷雾降温增湿', '温差过大会导致落叶']
  },
  {
    icon: '✂️', title: '修剪基础知识',
    text: '正确的修剪能促进植物分枝、改善通风、减少病虫害。',
    list: ['随时修剪枯黄叶片', '花后及时剪除残花', '修剪工具要消毒', '春季是修剪的最佳时机']
  },
  {
    icon: '🪴', title: '换盆指南',
    text: '当植物根系长满花盆或生长停滞时，就需要换盆了。',
    list: ['换盆最佳时间：春秋季', '新盆比旧盆大1-2号即可', '换盆时适当修剪老根', '换盆后先放阴凉处缓苗']
  }
];

const seasonalData = {
  spring: [
    { icon: '🌸', title: '春暖花开', desc: '翻盆换土的最佳时节，可以开始大量扦插繁殖，增加施肥频率。' },
    { icon: '🐛', title: '虫害预防', desc: '气温回升害虫开始活跃，注意检查叶片背面，提前做好防治。' },
    { icon: '🌱', title: '播种季节', desc: '一年生花卉和蔬菜适合在春季播种，把握时机好好享受播种乐趣。' },
    { icon: '💧', title: '增加浇水', desc: '随着气温升高植物蒸腾加快，逐步增加浇水量和频率。' }
  ],
  summer: [
    { icon: '☀️', title: '遮阴防晒', desc: '高温期避免正午阳光直射，为不耐热的植物搭建遮阴设施。' },
    { icon: '💧', title: '早晚浇水', desc: '选择清晨或傍晚浇水，避免正午高温时浇水导致根系损伤。' },
    { icon: '🐛', title: '病虫害防治', desc: '红蜘蛛、蚜虫高发期，保持通风良好，发现问题及时处理。' },
    { icon: '🌡️', title: '通风降温', desc: '加强通风，必要时节制浇水帮助多肉等植物安全度夏。' }
  ],
  fall: [
    { icon: '🍂', title: '追肥过冬', desc: '秋季是储存养分的关键期，适量施肥帮助植物安全越冬。' },
    { icon: '✂️', title: '秋季修剪', desc: '修剪枯枝弱枝，控制植株形态，减少养分消耗。' },
    { icon: '🧅', title: '球根种植', desc: '郁金香、风信子等球根花卉秋季种下，来年春天绽放。' },
    { icon: '💧', title: '减少浇水', desc: '气温下降生长减缓，逐步减少浇水频率。' }
  ],
  winter: [
    { icon: '❄️', title: '防寒保暖', desc: '将不耐寒植物移到室内，夜间关闭窗户避免冷风直吹。' },
    { icon: '💧', title: '控制浇水', desc: '冬季植物进入休眠，大幅减少浇水频率，保持土壤偏干。' },
    { icon: '☀️', title: '增加光照', desc: '冬日阳光柔和，尽量让植物多晒太阳，有利于越冬。' },
    { icon: '🚿', title: '暂停施肥', desc: '休眠期植物不需施肥，等待春天再恢复。' }
  ]
};

function getCurrentSeason() {
  const month = new Date().getMonth();
  return month >= 2 && month <= 4 ? 'spring' :
         month >= 5 && month <= 7 ? 'summer' :
         month >= 8 && month <= 10 ? 'fall' : 'winter';
}

function renderTips() {
  const grid = document.getElementById('tipsGrid');
  grid.innerHTML = tipsData.map(tip => `
    <div class="tip-card">
      <div class="tip-header">
        <div class="tip-icon">${tip.icon}</div>
        <h3>${tip.title}</h3>
      </div>
      <p>${tip.text}</p>
      <ul class="tip-list">${tip.list.map(item => `<li>${item}</li>`).join('')}</ul>
    </div>
  `).join('');

  const season = getCurrentSeason();
  const seasonNames = { spring: '🌸 春季', summer: '☀️ 夏季', fall: '🍂 秋季', winter: '❄️ 冬季' };
  document.querySelector('.seasonal-advice h3').textContent = `${seasonNames[season]}养护建议`;

  document.getElementById('seasonalContent').innerHTML = `
    <div class="seasonal-grid">
      ${seasonalData[season].map(item => `
        <div class="seasonal-item">
          <span>${item.icon}</span>
          <div>
            <h4>${item.title}</h4>
            <p>${item.desc}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ===== Theme Toggle =====
let darkMode = false;
document.getElementById('themeToggle').addEventListener('click', () => {
  darkMode = !darkMode;
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  document.getElementById('themeToggle').textContent = darkMode ? '☀️' : '🌙';
});

// ===== Keyboard shortcut =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ===== Init =====
console.log('🌱 AI 绿植助手已启动！');
