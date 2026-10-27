export interface BrewingStep {
  stepNumber: number;
  title: string;
  detail: string;
  timing?: string;
  temperature?: string;
  tips?: string;
}

export interface DetailedRecipe {
  id: string;
  name: string;
  enName: string;
  category: string;
  difficulty: '新手友善' | '進階調配' | '職人手作';
  prepTime: string;
  servingSize: string;
  description: string;
  story: string;
  ingredients: {
    name: string;
    amount: string;
    note?: string;
    type: 'tea' | 'dairy' | 'sweetener' | 'topping' | 'ice';
  }[];
  steps: BrewingStep[];
  variations: {
    title: string;
    description: string;
    formulaDiff: string;
  }[];
  masterTips: string[];
}

export const DETAILED_RECIPES: DetailedRecipe[] = [
  {
    id: 'recipe_tiger_boba',
    name: '琥珀黑糖波霸厚鮮奶',
    enName: 'Brown Sugar Tiger Boba Fresh Milk',
    category: '招牌厚乳',
    difficulty: '新手友善',
    prepTime: '25 分鐘 (含熬煮與燜糖)',
    servingSize: '1 杯 (700ml 大杯)',
    description: '經典不敗的台灣手搖名作！溫熱軟Q的手炒黑糖珍珠在杯壁劃出炙熱虎紋，撞上冰透濃純生鮮乳，冷熱交織、濃醇甘甜。',
    story: '起源於台灣夜市與手搖品牌創新，以炒糖掛壁的「虎紋 (Tiger Stripes)」視覺風靡全球，不加一滴茶湯，純粹以黑糖與鮮乳碰撞極致濃醇。',
    ingredients: [
      { name: '手工生黑糖粉圓(波霸)', amount: '80g', note: '煮透後呈半透明琥珀狀', type: 'topping' },
      { name: '手炒黑糖濃縮蜜', amount: '50ml', note: '高黏稠度，掛壁效果最佳', type: 'sweetener' },
      { name: '小農特級生鮮乳', amount: '280ml', note: '4°C 冰鎮冷藏，全脂為佳', type: 'dairy' },
      { name: '高純度方冰塊', amount: '160g', note: '約 6-7 顆冰塊', type: 'ice' },
      { name: '起司海鹽奶蓋 (可選)', amount: '30g', note: '增添鹹甜奶香頂部', type: 'dairy' },
    ],
    steps: [
      {
        stepNumber: 1,
        title: '燜煮晶透波霸珍珠',
        detail: '水沸騰後呈放射狀倒入生粉圓，中大火煮 20 分鐘（期間每隔 5 分鐘輕輕順時針攪拌避免沾底）。熄火後加蓋燜 25 分鐘至芯部完全熟透軟Q。',
        timing: '煮20分 + 燜25分',
        temperature: '滾水 100°C',
        tips: '煮完撈起以飲用溫水輕洗表面浮膠，維持彈牙口感。',
      },
      {
        stepNumber: 2,
        title: '熱鍋慢蜜黑糖',
        detail: '將洗淨瀝乾的溫熱波霸倒入小雪平鍋中，加入 50ml 手炒黑糖濃蜜，小火溫熱翻拌 3-5 分鐘，使黑糖糖蜜充分滲透珍珠核心並呈現濃稠膠質狀。',
        timing: '小火 3~5 分鐘',
        temperature: '小火微沸 65°C',
        tips: '保持波霸微溫（約 45°C–50°C），入口軟糯度最佳。',
      },
      {
        stepNumber: 3,
        title: '手工轉杯掛壁虎紋',
        detail: '將 80g 裹滿濃稠黑糖蜜的溫熱波霸放入 700ml 杯底。傾斜杯身 45 度角，緩慢旋轉杯身 360 度，讓濃黑糖蜜順著杯壁自然流淌，形成絕美「琥珀虎紋」。',
        timing: '約 10 秒',
        tips: '杯身必須維持乾燥，糖蜜溫度適中，虎紋可維持 5-10 分鐘不化。',
      },
      {
        stepNumber: 4,
        title: '冰塊架構與鮮乳緩衝',
        detail: '輕柔放入冰塊至杯身 7 分滿。冰塊能阻隔下層熱珍珠與上層冰鮮奶直接融和，鎖定視覺分層。沿著冰塊緩慢注入 280ml 冰鮮乳至 9 分滿。',
        timing: '約 15 秒',
        temperature: '4°C 冷藏鮮乳',
      },
      {
        stepNumber: 5,
        title: '封口出杯與品飲儀式',
        detail: '封上專用防漏消光膜。飲用前提醒顧客：先插粗吸管品嚐底層溫熱軟Q黑糖波霸，再上下均勻搖晃 15-18 下，使冰乳與黑糖徹底交融！',
        timing: '即刻享用',
      },
    ],
    variations: [
      {
        title: '🔥 炙燒布蕾焦糖黑糖厚奶',
        description: '在最上層擠上一圈手作香草卡士達布蕾奶霜，灑上粗粒赤砂糖，以噴槍高溫炙烤出金黃焦脆脆皮糖霜。',
        formulaDiff: '頂層替換：+40g 香草布蕾霜 + 5g 二砂糖炙燒',
      },
      {
        title: '🌱 燕麥奶植物系清爽版 (乳糖不耐友善)',
        description: '將鮮牛乳替換為烘焙特調燕麥奶，麥芽穀物堅果香氣與手炒黑糖互相輝映，口感滑順無負擔。',
        formulaDiff: '以咖啡師燕麥奶 260ml 取代生鮮乳',
      },
      {
        title: '🍵 宇治黑糖抹茶雙層拿鐵',
        description: '在黑糖珍珠與鮮奶之上，頂層緩緩淋入現刷日本抹茶濃液，呈現「琥珀黑、雪白、碧綠」三層漸層。',
        formulaDiff: '頂部注入手刷靜岡抹茶濃液 45ml (4g抹茶粉 + 45ml 80°C溫水)',
      },
    ],
    masterTips: [
      '珍珠千萬不可冰鎮！冷藏會導致澱粉老化返硬，黑糖珍珠最佳品嚐黃金期為出鍋後 3 小時內。',
      '手炒黑糖蜜可加入少許台南龍眼蜜（約5%），可大幅提升香氣尾韻與層次厚度。',
      '搖勻前喝一口冷熱溫差，搖勻後感受乳糖與焦香的絲滑融合。',
    ],
  },
  {
    id: 'recipe_cheese_tieguanyin',
    name: '炭焙鐵觀音芝士海鹽厚奶蓋',
    enName: 'Roasted Tieguanyin with Sea Salt Cheese Crown',
    category: '芝士奶蓋',
    difficulty: '進階調配',
    prepTime: '15 分鐘',
    servingSize: '1 杯 (700ml 大杯)',
    description: '茶中霸王炭焙鐵觀音的濃烈火香，與紐西蘭奶油乳酪現打鹹甜海鹽芝士奶霜相遇。45度角仰頭大口啜飲，先鹹甜、後回甘！',
    story: '新式茶飲的里程碑發明。打破了傳統茶葉苦澀的刻板印象，透過高壓低溫萃取濃茶，搭配乳脂豐厚的綿密奶霜，形成如卡布奇諾般的醇厚茶乳體驗。',
    ingredients: [
      { name: '木柵特級炭焙鐵觀音茶葉', amount: '18g', note: '重發酵、重度龍眼木慢焙', type: 'tea' },
      { name: '純淨熱水 (茶湯萃取)', amount: '350ml', note: '水溫 95°C，萃取時間 7 分鐘', type: 'tea' },
      { name: '純天然台糖蔗糖漿', amount: '25ml', note: '微糖推薦，可依客製調整', type: 'sweetener' },
      { name: '海鹽芝士奶蓋霜', amount: '80ml (約2大勺)', note: '現打乳霜，濃稠如融化霜淇淋', type: 'dairy' },
      { name: '高純度方冰塊', amount: '180g', note: '冰鎮鎖香', type: 'ice' },
      { name: '研磨綠茶粉/可可粉', amount: '少許 (點綴)', note: '表面微篩', type: 'topping' },
    ],
    steps: [
      {
        stepNumber: 1,
        title: '高溫喚醒重火茶香',
        detail: '以 95°C 純淨熱水 350ml 沖淋 18g 炭焙鐵觀音茶葉，加蓋浸潤悶泡 7 分鐘，讓深層木質火香與熟果香完全舒展。濾出清澈琥珀茶湯。',
        timing: '7 分鐘',
        temperature: '95°C',
        tips: '鐵觀音需要高水溫逼出茶骨焙火氣，水溫過低則茶韻出不來。',
      },
      {
        stepNumber: 2,
        title: '急速雪克鎖香',
        detail: '將熱茶湯濾入雪克杯，加入蔗糖漿 25ml 與 180g 冰塊，蓋上雪克杯快速手搖 12-15 下，利用冰塊急速降溫鎖住茶芳，並產生細緻微氣泡。',
        timing: '10 秒',
        temperature: '急凍至 5°C',
      },
      {
        stepNumber: 3,
        title: '打發法式海鹽芝士奶蓋霜',
        detail: '鮮奶油 100ml + 奶油乳酪 30g + 煉乳 15ml + 玫瑰海鹽 1g，使用電動打蛋器低速打發至 6-7 分發（呈濃稠流動狀，紋路不易消失但仍具備滑動性）。',
        timing: '2-3 分鐘',
        tips: '切忌打發過硬成抹醬狀，必須能順暢滑入口中。',
      },
      {
        stepNumber: 4,
        title: '茶湯入杯與平穩鋪霜',
        detail: '將冰鎮鐵觀音茶湯（含適量碎冰）倒入專用奶蓋杯至 8 分滿。使用深口湯勺順著杯壁，平緩鋪上 80ml 芝士海鹽厚奶蓋，形成厚達 2.5 公分的雪白冠冕。',
        timing: '約 15 秒',
      },
      {
        stepNumber: 5,
        title: '香氣點綴與直飲杯蓋',
        detail: '奶蓋表面輕篩少許純綠茶粉點綴增添層次，蓋上「可開關小紅塞直飲杯蓋」。',
        timing: '出杯即飲',
      },
    ],
    variations: [
      {
        title: '🌰 芝士琥珀白玉丸子烏龍',
        description: '在奶蓋頂部放上一串現烤日式白玉糰子，沾著濃郁鹹甜奶蓋與黃豆粉食用，視覺與飽足感滿分。',
        formulaDiff: '奶蓋頂部加置白玉丸子串 + 灑日式熟黃豆粉',
      },
      {
        title: '🍑 蜜桃烏龍初戀奶蓋',
        description: '基底茶替換為低溫冷萃白桃烏龍，清甜果香結合海鹽芝士，甜度更清新雅致。',
        formulaDiff: '茶湯替換為蜜桃烏龍原葉茶 350ml',
      },
      {
        title: '🍮 奶蓋布丁藏心鐵觀音',
        description: '杯底滑入一整顆統一雞蛋布丁，吸管吸得到焦糖布丁，仰頭喝得到鹹甜奶蓋與甘醇茶湯。',
        formulaDiff: '杯底預先放入手作雞蛋布丁 1 顆 (約100g)',
      },
    ],
    masterTips: [
      '品嚐方式：絕對不要用吸管！請打開直飲杯小蓋，杯身傾斜 45 度角大口喝，讓奶蓋與茶湯以 1:2 比例同時流入口腔。',
      '若茶湯澀味偏重，可將浸泡時間縮短 30 秒，或在煮茶完成後加入 0.5g 烘焙食用小蘇打中和單寧酸。',
    ],
  },
  {
    id: 'recipe_passion_double_q',
    name: '茉莉百香雙Q果茶',
    enName: 'Jasmine Passion Fruit Double Q Fruit Tea',
    category: '鮮果嚼感',
    difficulty: '新手友善',
    prepTime: '8 分鐘',
    servingSize: '1 杯 (700ml 大杯)',
    description: '夏日解渴人氣王！埔里天然百香果酸甜果汁遇上七次薰花茉莉綠茶，鋪滿彈牙波霸珍珠與脆口高纖椰果，咀嚼感爆棚！',
    story: '台灣經典手搖茶「雙Q」代表作，融合「Q彈（波霸）」與「脆口（椰果）」兩種截然不同的質地，搭配酸爽高維生素C果香，是四季都暢銷的消暑聖品。',
    ingredients: [
      { name: '冷萃茉莉綠茶茶湯', amount: '260ml', note: '清爽茉莉花香，低溫冷萃不苦澀', type: 'tea' },
      { name: '埔里大坪頂百香果純原汁', amount: '55ml', note: '含新鮮百香果天然黑籽', type: 'sweetener' },
      { name: '純天然台糖蔗糖漿', amount: '35ml', note: '平衡百香果酸度', type: 'sweetener' },
      { name: '手工琥珀黑糖珍珠', amount: '50g', note: '彈牙口感', type: 'topping' },
      { name: '原味高纖脆椰果', amount: '45g', note: '脆爽多汁', type: 'topping' },
      { name: '新鮮金桔或檸檬片', amount: '2 顆 (輕壓提味)', note: '提昇柑橘清香', type: 'topping' },
      { name: '純淨方冰塊', amount: '180g', note: '維持清涼酸爽', type: 'ice' },
    ],
    steps: [
      {
        stepNumber: 1,
        title: '基底雙Q配料就位',
        detail: '取 700ml 透明高杯，依序放入瀝乾的 50g 彈牙黑糖波霸與 45g 脆口椰果，沉積在杯底形成豐盈咀嚼層。',
        timing: '約 10 秒',
        tips: '椰果需濾掉多餘糖水，避免影響果茶酸甜黃金比例。',
      },
      {
        stepNumber: 2,
        title: '鮮果原汁與茶湯調和',
        detail: '在雪克杯中注入 260ml 冷泡茉莉綠茶湯、55ml 百香果純原汁、35ml 台糖純蔗糖漿。以攪拌棒輕壓 2 顆對切新鮮金桔，逼出表皮天然精油。',
        timing: '約 15 秒',
        temperature: '常溫或冷藏',
      },
      {
        stepNumber: 3,
        title: '滿冰急速激烈雪克',
        detail: '加入 180g 冰塊至雪克杯 8 分滿，蓋緊杯蓋，由胸前向上斜 45 度角高速激烈雪克 15-20 下，將果酸、茶香與空氣充分乳化，帶出金黃綿密果沫。',
        timing: '15 秒',
        tips: '雪克力道要足夠，才能將金桔精油與百香果果酸完全激發。',
      },
      {
        stepNumber: 4,
        title: '注杯出單',
        detail: '將雪克杯中金黃澄澈的百香果綠茶（連同百香果黑籽與冰塊）順暢倒入裝有雙Q配料的杯中。金黃茶湯與底部黑白分明的雙Q相映成趣。',
        timing: '約 10 秒',
      },
      {
        stepNumber: 5,
        title: '斜口粗吸管封膜出杯',
        detail: '封上專用防溢封口膜，附上 12mm 斜口粗吸管。喝之前輕輕戳底攪動，每一口都能吸入滿滿百香果與 Q 彈配料。',
        timing: '即刻品嚐',
      },
    ],
    variations: [
      {
        title: '🌟 茉莉百香「三Q霸王杯」',
        description: '在雙Q基礎上再額外加入滑溜低熱量的「寒天晶球」，黑、白、透明三重嚼感交疊，嚼勁天花板。',
        formulaDiff: '+30g 寒天晶球Q凍 (雙Q變三Q)',
      },
      {
        title: '🍃 鮮香薄荷百香氣泡綠',
        description: '將部分茶湯替換為現打氣泡水，加入幾片新鮮搗碎薄荷葉，瞬間化身莫希托風格無酒精氣泡果茶。',
        formulaDiff: '以 150ml 茉莉茶 + 110ml 強氣泡水 + 5片新鮮薄荷',
      },
      {
        title: '🥭 楊枝甘露百香金芒版',
        description: '加入愛文芒果果泥與椰漿，保留百香果酸香，增添熱帶南洋奢華濃郁風味。',
        formulaDiff: '+40ml 芒果濃泥 + 20ml 特濃椰漿',
      },
    ],
    masterTips: [
      '百香果籽不要濾掉！百香果籽富含抗氧化多酚，咀嚼時「喀滋喀滋」的口感是手搖果茶的靈魂。',
      '綠茶請選擇冷泡或 80°C 低溫慢泡，避免高溫單寧苦澀破壞鮮果天然芳香。',
    ],
  },
  {
    id: 'recipe_dajia_taro',
    name: '大甲手作蜜芋頭厚鮮奶',
    enName: 'Dajia Taro Chunks Pure Fresh Milk',
    category: '暖心經典',
    difficulty: '職人手作',
    prepTime: '40 分鐘 (含熬煮蜜芋頭)',
    servingSize: '1 杯 (500ml/700ml)',
    description: '嚴選台中大甲檳榔心芋頭，半泥半塊雙重口感！先蒸透再以二砂糖慢火蜜漬，杯壁抹上厚厚芋泥，注入香濃純鮮乳，紫白相間、綿密銷魂。',
    story: '台灣在地農業與手搖文化的完美結合。大甲產區因大安溪水源與砂質土壤，產出的芋頭質地鬆軟綿密，香氣濃郁，是全台手搖飲秋冬最期待的明星品項。',
    ingredients: [
      { name: '大甲檳榔心蜜芋泥 (含顆粒)', amount: '120g', note: '鬆軟綿密、半泥半塊', type: 'topping' },
      { name: '小農特級生鮮乳', amount: '240ml', note: '純鮮乳，無加一滴水', type: 'dairy' },
      { name: '天然蔗糖液或二砂糖糖蜜', amount: '15ml', note: '芋頭已帶蜜甜，微糖即可', type: 'sweetener' },
      { name: '純方冰 (或溫熱鮮奶)', amount: '120g', note: '冷熱皆宜，熱飲更是冬日極品', type: 'ice' },
      { name: '關西手作仙草凍 (可選)', amount: '40g', note: '滑順甘甜', type: 'topping' },
    ],
    steps: [
      {
        stepNumber: 1,
        title: '蒸煮極致鬆綿大甲芋頭',
        detail: '大甲芋頭去皮切 2cm 方塊，入蒸爐大火蒸 30 分鐘至竹籤可輕易穿透。出鍋後趁熱分兩半：一半以壓泥器壓成細膩芋泥，另一半保留顆粒塊狀。',
        timing: '蒸 30 分鐘',
        temperature: '蒸氣 100°C',
        tips: '一定要保留 30% 塊狀顆粒，才能享有嚼感。',
      },
      {
        stepNumber: 2,
        title: '低火慢蜜入味',
        detail: '將芋泥與顆粒加入小鍋，加入台糖二砂糖 40g 與少許鮮奶小火翻拌燜煮 8 分鐘，直至糖分完全融解滲透，芋泥泛出油潤紫色光澤。放涼備用。',
        timing: '8 分鐘',
        temperature: '小火微滾',
      },
      {
        stepNumber: 3,
        title: '抹杯掛壁與堆底',
        detail: '挖取 120g 蜜芋頭泥，將 80g 鋪於杯底，剩餘 40g 以矽膠刮刀在透明杯身內壁均勻塗抹出紫白相間的雲霧漸層。',
        timing: '約 15 秒',
      },
      {
        stepNumber: 4,
        title: '注入純厚鮮乳',
        detail: '加入冰塊（若做熱飲則將鮮奶蒸熱至 65°C），緩慢倒入 240ml 冰鮮乳與 15ml 蔗糖液。鮮奶的純白與芋泥的粉紫形成溫潤柔和的視覺享受。',
        timing: '約 10 秒',
      },
      {
        stepNumber: 5,
        title: '封膜出杯',
        detail: '封口出杯，附上 12mm 粗吸管。品嚐前可用吸管輕搗底層芋頭塊，吸入滿口濃香芋泥與香醇牛奶。',
        timing: '即刻享用',
      },
    ],
    variations: [
      {
        title: '西米露椰香芋頭仙境',
        description: '加入晶亮彈滑的煮透西米露與南洋椰奶，宛如港式甜品楊枝甘露般華麗。',
        formulaDiff: '+40g 煮透西米露 + 30ml 濃郁椰漿',
      },
      {
        title: '黑糖波霸芋頭奶',
        description: '加入現煮熱黑糖波霸，雙重咀嚼滿足，芋香、焦香、乳香三重奏。',
        formulaDiff: '+50g 琥珀黑糖珍珠',
      },
      {
        title: '🔥 冬日暖心熱芋奶',
        description: '將鮮乳加熱至 65°C 打出薄奶泡，與溫熱蜜芋頭交融，暖手暖胃。',
        formulaDiff: '以 65°C 溫熱厚鮮奶取代冰塊與冷乳',
      },
    ],
    masterTips: [
      '芋泥具有高吸水性，煮好後若質地過稠，可適量加入鮮奶稀釋調整黏稠度。',
      '芋頭本身富含天然澱粉與甜香，建議甜度選擇微糖（3分糖）或無糖，最能品嚐到純粹芋香。',
    ],
  },
];
