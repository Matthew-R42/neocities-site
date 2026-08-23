(() => {
  const data = window.MAIMAI_CATALOG || {};
  const defaultPageSize = 50;
  const japanesePattern = /[\u3040-\u30ff\u3400-\u9fff]/;
  const retiredPattern = /(no longer available|not available|distribution ended|unobtainable|入手不可|配布終了)/i;
  const typeOrder = ['Title', 'Icon', 'Big icon', 'Name plate', 'Frame', 'Jewel', 'Plate', 'Partner'];
  const typeLabels = {
    Title: 'Titles',
    Icon: 'Icons',
    'Big icon': 'Big icons',
    'Name plate': 'Name plates',
    Frame: 'Frames',
    Jewel: 'Jewels',
    Plate: 'Plates',
    Partner: 'Partners'
  };

  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);
  const normalise = (value) => String(value ?? '').normalize('NFKC').toLocaleLowerCase().trim();
  const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
  const sourceById = new Map((data.sources || []).map((source) => [source.id, source]));

  const usefulEnglish = (original, candidate) => {
    const sourceText = String(original || '').trim();
    const englishText = String(candidate || '').trim();
    if (!englishText || normalise(sourceText) === normalise(englishText)) return '';
    if (!japanesePattern.test(sourceText) && !sourceText.includes('/')) return '';
    if (!/[A-Za-z]/.test(englishText)) return '';
    if (/(creditplay|rating\d+reach|DXを|でplay)/i.test(englishText)) return '';
    return englishText;
  };

  const tierLabels = {
    Normal: 'Normal (white)',
    Bronze: 'Bronze',
    Silver: 'Silver',
    Gold: 'Gold',
    Rainbow: 'Rainbow',
    Unlabelled: 'Colour unconfirmed'
  };
  const tierClass = (tier) => `tier-${normalise(tier || 'unlabelled').replace(/[^a-z0-9]+/g, '-')}`;
  const acquisitionMethods = [
    ['song-title-all-dx-ap', 'Song title, all DX difficulties AP'],
    ['all-perfect-plus', 'ALL PERFECT+'],
    ['all-perfect', 'ALL PERFECT'],
    ['full-combo-plus', 'FULL COMBO+'],
    ['full-combo', 'FULL COMBO'],
    ['full-sync-dx-plus', 'FULL SYNC DX+'],
    ['full-sync-dx', 'FULL SYNC DX'],
    ['full-sync', 'FULL SYNC'],
    ['miss-count', 'Exact miss count'],
    ['rank-sss', 'Rank SSS'],
    ['rank-ss', 'Rank SS'],
    ['rank-s', 'Rank S'],
    ['rank-a', 'Rank A'],
    ['dx-score', 'DX score or stars'],
    ['rating', 'Rating'],
    ['otomo-battle', 'Otomodachi Battle'],
    ['king-performai', 'KING of Performai'],
    ['circle-festa', 'Circle Festa'],
    ['circle-ranking', 'Circle ranking'],
    ['tournament-ranking', 'Tournament or ranking'],
    ['class-course', 'Class or course'],
    ['circle-points', 'Circle points'],
    ['stamps-collection', 'Stamp card or collection progress'],
    ['event-points', 'Event points'],
    ['currency-exchange', 'Currency or item exchange'],
    ['serial-code', 'Serial code'],
    ['partner-tour', 'Tour Member or Partner'],
    ['multiplayer', 'Multiplayer result'],
    ['equipment-option', 'Equipment or play option'],
    ['area-event', 'Area or event completion'],
    ['linked-game', 'Linked game'],
    ['multi-song-credit', 'One credit or multi-song'],
    ['login-play-count', 'Login, travel or play count'],
    ['campaign-purchase', 'Campaign, gift or purchase'],
    ['default-automatic', 'Default, gift or carry-over'],
    ['play-clear', 'Play or clear'],
    ['system-selector', 'System selector, not an unlock'],
    ['other-unknown', 'Other or unknown']
  ].map(([id, label], order) => ({ id, label, order }));
  const acquisitionById = new Map(acquisitionMethods.map((method) => [method.id, method]));
  const acquisitionGroups = [
    {
      label: 'Performance',
      methods: ['song-title-all-dx-ap', 'all-perfect-plus', 'all-perfect', 'full-combo-plus', 'full-combo', 'full-sync-dx-plus', 'full-sync-dx', 'full-sync', 'miss-count', 'rank-sss', 'rank-ss', 'rank-s', 'rank-a', 'dx-score']
    },
    {
      label: 'Progress and play',
      methods: ['rating', 'class-course', 'area-event', 'play-clear', 'login-play-count']
    },
    {
      label: 'Social and competitive',
      methods: ['otomo-battle', 'king-performai', 'circle-festa', 'circle-ranking', 'tournament-ranking', 'circle-points', 'multiplayer']
    },
    {
      label: 'Collection and account',
      methods: ['stamps-collection', 'currency-exchange', 'serial-code', 'partner-tour', 'equipment-option', 'default-automatic', 'system-selector']
    },
    {
      label: 'Events and other',
      methods: ['event-points', 'linked-game', 'multi-song-credit', 'campaign-purchase', 'other-unknown']
    }
  ];
  const rawAcquisitionFallbacks = {
    default_or_start: 'default-automatic',
    carryover: 'default-automatic',
    gift_or_serial: 'serial-code',
    song_play: 'play-clear',
    song_rank: 'other-unknown',
    combo_or_accuracy: 'other-unknown',
    full_sync: 'full-sync',
    area_or_chiho: 'area-event',
    tour_member_or_partner: 'partner-tour',
    stamp_card: 'stamps-collection',
    mai_mile_shop: 'currency-exchange',
    event_or_campaign: 'campaign-purchase',
    unknown: 'other-unknown'
  };

  const isSongTitleAllDxAp = (item) => {
    if (item.type !== 'Title' || item.tier !== 'Gold') return false;
    const match = String(item.condition || '').trim().match(/^(.*?)\[でらっくす\]\/全難易度\/ALL PERFECT$/i);
    return Boolean(match && normalise(match[1]) === normalise(item.name));
  };

  const acquisitionCategories = (item) => {
    const conditionText = normalise([
      item.condition,
      item.englishCondition,
      item.rainbowGroup
    ].join(' '));
    const matches = [];
    const add = (id, pattern) => {
      if (pattern.test(conditionText)) matches.push(id);
    };

    if (isSongTitleAllDxAp(item)) matches.push('song-title-all-dx-ap');
    add('all-perfect-plus', /all perfect\+|all perfect plus|all-perfect\+|\bap\+/i);
    add('all-perfect', /all perfect(?!\s*(?:\+|plus))|\ball-perfect(?!\+)|\bap\b(?!\+)/i);
    add('full-combo-plus', /full combo\+|full combo plus|full-combo\+|\bfc\+/i);
    add('full-combo', /full combo(?!\s*(?:\+|plus))|\bfull-combo(?!\+)|\bfc\b(?!\+)/i);
    add('full-sync-dx-plus', /full sync dx\+|full-sync dx\+/i);
    add('full-sync-dx', /full sync dx(?!\+)|full-sync dx(?!\+)/i);
    add('full-sync', /full sync(?!\s*dx)|full-sync(?!\s*dx)/i);
    add('miss-count', /(?:exactly\s*)?\d+\s*miss|\d+\s*ミス/i);
    add('rank-sss', /\brank\s*sss(?:\+|\b)/i);
    add('rank-ss', /\brank\s*ss(?:\+|\b)/i);
    add('rank-s', /\brank\s*s(?:\+|\b)/i);
    add('rank-a', /\brank\s*a(?:\+|\b)/i);
    add('dx-score', /dx\s*score|でらっくすスコア|deluxe score|dx star|でらっくすスター/i);
    add('rating', /\brating\b|レーティング/i);
    add('otomo-battle', /otomo(?:dachi)? battle|オトモダチ対戦/i);
    add('king-performai', /king of performai|performai/i);
    add('circle-festa', /circle festa|サークルフェスタ/i);
    add('circle-ranking', /circle ranking|サークル(?:クラス|ランキング)/i);
    add('tournament-ranking', /\btop\s*\d+|top-?\d+|ranking|ranked|runner-up|champion|tournament|score attack|tenkaichi|wec\d*|上位|ランキング|優勝|準優勝|大会|天下一音ゲ祭/i);
    add('class-course', /course mode|class|段位認定|クラス|コース.*(?:合格|clear)|pass .*course/i);
    add('circle-points', /circle points?|サークルポイント/i);
    add('stamps-collection', /stamp|スタンプ|collect .*?(?:item|icon|frame|plate)|コレクション/i);
    add('event-points', /event points?|present event.*?\d+ points?|プレゼントイベント.*?\d+ポイント|イベント.*?\d+ポイント/i);
    add('currency-exchange', /currency exchange|exchange for|mai miles|チーズ|交換|maiマイル/i);
    add('serial-code', /serial code|シリアルコード/i);
    add('partner-tour', /tour member|partner|affection|intimacy|ascension|つあーメンバー|パートナー|親密度|覚醒/i);
    add('multiplayer', /multiplayer|matching game|with (?:at least )?\d+ players|\d+人(?:以上)?でプレイ|\bwin\b|\blose\b|勝利|敗北|マッチングプレイ/i);
    add('equipment-option', /(?:icon|title|cosmetic) equipped|アイコン.*?(?:セット|装備)|称号.*?(?:セット|装備)|頭像.*?(?:set|play)|movie brightness|track skip|favourites category|vertical mirror|horizontal mirror|ムービーの明るさ|トラックスキップ|お気に入り|上下ミラー|左右ミラー|[12]p側/i);
    add('area-event', /event area|area completion|obtain from .*area|ちほー|エリア|扉をクリア|door|イベントちほー/i);
    add('linked-game', /(?:obtain|owned|progress).*?(?:chunithm|ongeki)|(?:chunithm|オンゲキ)で.*?(?:獲得|所持)|連動/i);
    add('multi-song-credit', /one credit|single credit|一回のクレジット|1回のクレジット|multi-song/i);
    add('login-play-count', /log in|login|ログイン|play .*?\d+ times|\d+\s*回プレイ|play count|累計移動距離|travel .*?in total|都道府県/i);
    add('campaign-purchase', /campaign|purchase|present event|キャンペーン|購入|プレゼントイベント/i);
    add('default-automatic', /owned from the start|from the start|default|gift from sega|carried over|はじめから所持|初めから所持|segaからのプレゼント|引き継ぎ/i);
    add('system-selector', /random selection|randomly selected|camera icon|ランダム|ユーザーアイコン|撮影/i);

    if (!matches.length && /\bplay\b|\bclear\b|プレイ|クリア/i.test(conditionText)) matches.push('play-clear');
    if (!matches.length && Array.isArray(item.rawAcquisitionCategories)) {
      item.rawAcquisitionCategories.forEach((category) => {
        matches.push(rawAcquisitionFallbacks[category] || 'other-unknown');
      });
    }
    return matches.length ? [...new Set(matches)] : ['other-unknown'];
  };

  const titleItems = (data.titles || []).map((title, index) => ({
    id: `title-${index}`,
    type: 'Title',
    name: title.title,
    translation: title.translation,
    condition: title.description,
    englishCondition: usefulEnglish(title.description, title.english_condition),
    version: title.version,
    tier: title.tier,
    category: title.category,
    subcategory: title.subcategory,
    overseasStatus: title.overseas_status || '',
    rainbowGroup: title.rainbow_group || '',
    lxnsRecords: title.lxns_records || [],
    retired: Boolean(title.unavailable),
    legacy: false,
    sources: title.sources || [],
    sourceUrl: title.source_url,
    alternates: title.alternates || [],
    sourceRecords: title.source_records || [],
    titleOrigins: title.title_origins || [],
    confidence: title.confidence || '',
    regionScope: title.region_scope || '',
    availability: title.availability || '',
    discrepancyFlags: title.discrepancy_flags || [],
    rawAcquisitionCategories: title.acquisition_categories || [],
    rawAcquisitionPrimary: title.acquisition_primary || ''
  }));

  const songTitleAllDxApMembers = titleItems.filter(isSongTitleAllDxAp);
  const songTitleAllDxApMemberIds = new Set(songTitleAllDxApMembers.map((item) => item.id));
  const songTitleAllDxApAggregate = songTitleAllDxApMembers.length ? {
    id: 'title-song-title-all-difficulties-ap',
    type: 'Title',
    name: 'Song title, all difficulties AP (DX song)',
    titleLanguage: 'en',
    translation: '',
    condition: '(曲名)[でらっくす]/全難易度/ALL PERFECT',
    englishCondition: `Earned by getting ALL PERFECT on every difficulty of a specific DX song.`,
    version: `${songTitleAllDxApMembers.length.toLocaleString()} titles`,
    tier: 'Gold',
    category: 'Song Rewards',
    subcategory: 'Collapsed aggregate',
    overseasStatus: '',
    rainbowGroup: '',
    lxnsRecords: [],
    retired: false,
    legacy: false,
    sources: unique(songTitleAllDxApMembers.flatMap((item) => item.sources || [])),
    sourceUrl: '',
    alternates: [],
    sourceRecords: [],
    confidence: '',
    regionScope: 'multi-source aggregate',
    availability: 'mixed',
    discrepancyFlags: [],
    rawAcquisitionCategories: [],
    rawAcquisitionPrimary: '',
    fixedAcquisitionCategories: ['song-title-all-dx-ap'],
    fixedAcquisitionPrimary: 'song-title-all-dx-ap',
    aggregateCount: songTitleAllDxApMembers.length,
    memberTitles: songTitleAllDxApMembers.map((item) => item.name),
    memberConditions: songTitleAllDxApMembers.map((item) => item.condition)
  } : null;

  const rawCollectionItems = (data.collectibles || [])
    .filter((item) => item.type !== 'Title reward')
    .map((item, index) => {
      const statusText = `${item.conditions || ''} ${item.location || ''}`;
      return {
        id: `collection-${index}`,
        type: item.type,
        name: item.name,
        translation: item.translation,
        imageUrl: item.image_url,
        condition: item.conditions,
        englishCondition: usefulEnglish(item.conditions, item.english_condition),
        version: '',
        tier: '',
        category: item.section,
        location: item.location,
        retired: retiredPattern.test(statusText),
        legacy: item.type === 'Big icon',
        sources: item.sources || [],
        sourceUrl: item.source_url,
        alternates: item.alternates || [],
        sourceRecords: item.source_records || [],
        confidence: item.confidence || '',
        regionScope: item.region_scope || '',
        availability: item.availability || item.availability_status || '',
        discrepancyFlags: item.discrepancy_flags || [],
        rawAcquisitionCategories: item.acquisition_categories || [],
        rawAcquisitionPrimary: item.acquisition_primary || ''
      };
    });

  const jewelVersionForFrame = (name) => {
    const value = normalise(name);
    if (value.startsWith('thank you for playing')) {
      if (/でらっくす|\bdx\b/.test(value)) return 'dx';
      if (/スプラッシュ|splash/.test(value)) return 'splash';
      if (/universe/.test(value)) return 'universe';
      if (/festival/.test(value)) return 'festival';
      if (/buddies/.test(value)) return 'buddies';
      if (/prism/.test(value)) return 'prism';
    }
    if (!/(?:perfect|sync) jewel/.test(value)) return '';
    if (/diamond/.test(value)) return 'dx';
    if (/emeraid|emerald/.test(value)) return 'splash';
    if (/sapphire/.test(value)) return 'universe';
    if (/amethyst/.test(value)) return 'festival';
    if (/topaz/.test(value)) return 'buddies';
    if (/opal/.test(value)) return 'prism';
    return '';
  };

  const jewelRewardKind = (name) => {
    const value = normalise(name);
    if (value.startsWith('thank you for playing')) return 'CLEAR';
    if (value.startsWith('perfect jewel')) return 'ALL PERFECT';
    if (value.startsWith('sync jewel')) return 'FULL SYNC DX';
    return '';
  };

  const jewelFrameItems = rawCollectionItems.filter((item) => (
    item.type === 'Frame' && jewelVersionForFrame(item.name)
  ));
  const collectionWithoutJewels = rawCollectionItems.filter((item) => !jewelFrameItems.includes(item));

  const versionPlateRewardNames = new Set((data.plates || [])
    .map((plate) => `${plate.plate_kanji || ''}神`)
    .filter((name) => name !== '神'));
  const isVersionWideAllPerfectNamePlate = (item) => {
    if (item.type !== 'Name plate' || !versionPlateRewardNames.has(item.name)) return false;
    const condition = String(item.condition || '');
    if (!/all perfect/i.test(condition)) return false;
    return /all songs.*basic\s*[-~～]\s*master/i.test(condition)
      || /全曲\/basic\s*[-~～]\s*master/i.test(condition)
      || /all standard songs and difficulties/i.test(condition);
  };
  const versionPlateRewardCandidates = new Map();
  collectionWithoutJewels.filter(isVersionWideAllPerfectNamePlate).forEach((item) => {
    const nameKey = normalise(item.name);
    versionPlateRewardCandidates.set(nameKey, [...(versionPlateRewardCandidates.get(nameKey) || []), item]);
  });
  const versionPlateRewards = new Map();
  versionPlateRewardCandidates.forEach((candidates, nameKey) => {
    if (candidates.length === 1) versionPlateRewards.set(nameKey, candidates[0]);
  });

  const iconByName = new Map(collectionWithoutJewels
    .filter((item) => item.type === 'Icon')
    .map((item) => [normalise(item.name), item]));
  const collapsedBigIcons = new Set();
  collectionWithoutJewels.filter((item) => item.type === 'Big icon').forEach((item) => {
    const icon = iconByName.get(normalise(item.name));
    if (!icon) return;
    collapsedBigIcons.add(item);
    icon.sources = unique([...icon.sources, ...item.sources]);
    icon.sourceRecords = [...(icon.sourceRecords || []), ...(item.sourceRecords || [])];
    icon.alternates = [...(icon.alternates || []), {
      conditions: item.condition,
      english_condition: item.englishCondition,
      section: item.category,
      source: item.sources[0] || '',
      original_type: 'でかアイコン'
    }];
    icon.legacyCosmeticTypes = unique([...(icon.legacyCosmeticTypes || []), 'Big icon']);
  });
  const collectionItems = collectionWithoutJewels.filter((item) => (
    !collapsedBigIcons.has(item) && !versionPlateRewards.has(normalise(item.name))
  ));

  const preferredJewelReward = (records, kind) => records
    .filter((item) => jewelRewardKind(item.name) === kind)
    .sort((a, b) => Number(b.sources.includes('chinese-fandom-frames')) - Number(a.sources.includes('chinese-fandom-frames')))[0];

  const jewelItems = (data.jewels || []).map((jewel, index) => {
    const evidence = jewelFrameItems.filter((item) => jewelVersionForFrame(item.name) === jewel.version);
    const rewards = ['CLEAR', 'ALL PERFECT', 'FULL SYNC DX']
      .map((kind) => preferredJewelReward(evidence, kind))
      .filter(Boolean);
    return {
      id: `jewel-${index}`,
      type: 'Jewel',
      name: jewel.display_name,
      condition: 'Complete the required charts from BASIC through MASTER across this DX version pair.',
      englishCondition: '',
      version: jewel.display_name,
      tier: '',
      retired: false,
      legacy: false,
      sources: unique(['jerry-jewels', ...rewards.flatMap((item) => item.sources)]),
      sourceUrl: sourceById.get('jerry-jewels')?.url,
      sourceRecords: rewards.flatMap((item) => item.sourceRecords || []),
      artworkVersion: jewel.version,
      jewelRewards: rewards.map((item) => ({
        kind: jewelRewardKind(item.name),
        name: item.name,
        condition: item.condition,
        englishCondition: item.englishCondition
      }))
    };
  });

  const plateItems = (data.plates || []).map((plate, index) => {
    const namePlateReward = versionPlateRewards.get(normalise(`${plate.plate_kanji || ''}神`));
    return {
      id: `plate-${index}`,
      type: 'Plate',
      name: plate.plate_kanji,
      subtitle: `${plate.display_name} plate`,
      condition: namePlateReward?.condition || '',
      englishCondition: namePlateReward?.englishCondition || '',
      version: plate.display_name,
      tier: '',
      retired: false,
      legacy: false,
      sources: unique(['jerry-plates', ...(namePlateReward?.sources || [])]),
      sourceUrl: sourceById.get('jerry-plates')?.url,
      sourceRecords: namePlateReward?.sourceRecords || [],
      plateName: plate.plate_name,
      artworkVersion: plate.version,
      charts: plate.charts || [],
      namePlateReward: namePlateReward ? {
        name: namePlateReward.name,
        condition: namePlateReward.condition,
        englishCondition: namePlateReward.englishCondition,
        sources: namePlateReward.sources,
        sourceUrl: namePlateReward.sourceUrl,
        sourceRecords: namePlateReward.sourceRecords,
        confidence: namePlateReward.confidence,
        regionScope: namePlateReward.regionScope,
        availability: namePlateReward.availability,
        discrepancyFlags: namePlateReward.discrepancyFlags
      } : null
    };
  });

  const state = {
    search: '',
    type: 'all',
    tier: 'all',
    acquisition: 'all',
    image: 'all',
    includeRetired: true,
    groupedSongTitles: true,
    acquisitionGroup: null,
    page: 1,
    pageSize: defaultPageSize,
    showAll: false
  };

  const searchText = (item) => normalise([
    item.type,
    typeLabels[item.type],
    item.name,
    item.translation,
    item.subtitle,
    item.condition,
    item.englishCondition,
    item.version,
    item.tier,
    item.overseasStatus,
    item.rainbowGroup,
    item.aggregateCount ? `${item.aggregateCount} titles` : '',
    ...(item.memberTitles || []),
    ...(item.memberConditions || []),
    item.namePlateReward?.name,
    item.namePlateReward?.condition,
    item.namePlateReward?.englishCondition,
    ...(item.lxnsRecords || []).flatMap((record) => [record.name, record.color, record.genre]),
    item.category,
    item.subcategory,
    item.location,
    ...(item.acquisitionCategories || []).map((category) => acquisitionById.get(category)?.label),
    ...(item.charts || []).map((chart) => chart.display_name),
    ...(item.alternates || []).flatMap((alternate) => [alternate.conditions, alternate.english_condition])
  ].join(' '));

  let items = [];
  const buildItems = () => {
    const visibleTitleItems = state.groupedSongTitles
      ? titleItems.filter((item) => !songTitleAllDxApMemberIds.has(item.id))
      : titleItems.slice();
    if (state.groupedSongTitles && songTitleAllDxApAggregate) visibleTitleItems.unshift(songTitleAllDxApAggregate);
    const builtItems = [...visibleTitleItems, ...collectionItems, ...jewelItems, ...plateItems]
      .filter((item) => typeOrder.includes(item.type));
    builtItems.forEach((item) => {
      item.acquisitionCategories = item.fixedAcquisitionCategories?.length
        ? [...item.fixedAcquisitionCategories]
        : acquisitionCategories(item);
      item.acquisitionPrimary = item.fixedAcquisitionPrimary || item.acquisitionCategories[0];
      item.hasImage = Boolean(item.imageUrl || item.type === 'Jewel' || item.type === 'Plate');
      item.searchText = searchText(item);
    });
    items = builtItems;
    return builtItems;
  };

  const renderTypeFilters = () => {
    const currentItems = buildItems();
    const currentTypeCounts = Object.fromEntries(typeOrder.map((type) => [
      type,
      currentItems.filter((item) => item.type === type).length
    ]));
    const buttons = [
      `<button type="button" data-type="all" aria-pressed="true">All <span>${currentItems.length.toLocaleString()}</span></button>`,
      ...typeOrder.filter((type) => currentTypeCounts[type] > 0).map((type) => (
        `<button type="button" data-type="${escapeHtml(type)}" aria-pressed="false">${escapeHtml(typeLabels[type])} <span>${currentTypeCounts[type].toLocaleString()}</span></button>`
      ))
    ];
    $('#type-filters').innerHTML = buttons.join('');
  };

  const renderTierOptions = () => {
    const tiers = unique(titleItems.map((item) => item.tier));
    $('#tier-filter').insertAdjacentHTML('beforeend', tiers.map((tier) => (
      `<option value="${escapeHtml(tier)}">${escapeHtml(tier)}</option>`
    )).join(''));
  };

  const renderAcquisitionBrowser = () => {
    const scope = buildItems().filter((item) => {
      if (state.type !== 'all' && item.type !== state.type) return false;
      if (state.tier !== 'all' && item.tier !== state.tier) return false;
      if (state.image === 'has-image' && !item.hasImage) return false;
      if (state.image === 'no-image' && item.hasImage) return false;
      if (!state.includeRetired && item.retired) return false;
      return !state.search || item.searchText.includes(state.search);
    });
    const counts = new Map(acquisitionMethods.map((method) => [
      method.id,
      scope.filter((item) => item.acquisitionCategories.includes(method.id)).length
    ]));
    const methodButton = (methodId) => {
      const method = acquisitionById.get(methodId);
      const count = counts.get(methodId) || 0;
      if (!method || (!count && methodId !== state.acquisition)) return '';
      return `<button class="acquisition-method" type="button" data-acquisition="${escapeHtml(method.id)}" aria-pressed="${String(state.acquisition === method.id)}">${escapeHtml(method.label)} <span>${count.toLocaleString()}</span></button>`;
    };
    const selectedLabel = state.acquisition === 'all'
      ? ''
      : acquisitionById.get(state.acquisition)?.label || state.acquisition;
    const groups = acquisitionGroups.map((group, index) => {
      const groupCount = scope.filter((item) => group.methods.some((methodId) => item.acquisitionCategories.includes(methodId))).length;
      if (!groupCount) return '';
      // A group is expanded only when it was opened deliberately. Holding the
      // active method keeps the tab highlighted without forcing it back open.
      const expanded = state.acquisitionGroup === index;
      const holdsSelection = state.acquisition !== 'all' && group.methods.includes(state.acquisition);
      const selection = holdsSelection
        ? `<b class="acquisition-group-selection">${escapeHtml(selectedLabel)}</b>`
        : '';
      return `<button class="acquisition-group-tab" type="button" data-acquisition-group="${index}" aria-pressed="${String(expanded || holdsSelection)}" aria-expanded="${String(expanded)}" aria-controls="acquisition-methods" aria-haspopup="true">${escapeHtml(group.label)} <span>${groupCount.toLocaleString()}</span>${selection}</button>`;
    }).filter(Boolean).join('');
    const openGroup = state.acquisitionGroup === null ? null : acquisitionGroups[state.acquisitionGroup];
    const openMethods = openGroup ? openGroup.methods.map(methodButton).filter(Boolean).join('') : '';
    const panel = openGroup && openMethods
      ? `<div class="acquisition-methods" id="acquisition-methods" role="group" aria-label="${escapeHtml(openGroup.label)} methods"><div class="acquisition-methods-heading"><span>${escapeHtml(openGroup.label)}</span><button class="acquisition-methods-close" type="button" data-acquisition-close>Close</button></div><div class="acquisition-methods-grid">${openMethods}</div></div>`
      : '';
    $('#acquisition-browser').innerHTML = `<div class="acquisition-browser-heading" id="acquisition-browser-label">Browse acquisition methods</div><div class="acquisition-group-tabs" role="group" aria-labelledby="acquisition-browser-label"><button class="acquisition-all-button" type="button" data-acquisition="all" aria-pressed="${String(state.acquisition === 'all')}">All methods <span>${scope.length.toLocaleString()}</span></button>${groups}</div>${panel}`;
  };

  const closeAcquisitionPanel = () => {
    if (state.acquisitionGroup === null) return false;
    state.acquisitionGroup = null;
    // Only redraw the browser. A full render() would rebuild the result list
    // out from under whatever the user actually clicked on.
    renderAcquisitionBrowser();
    return true;
  };

  const renderMoreFilters = () => {
    const fields = $('#more-filters .filter-fields');
    if (!fields) return;
    if (!$('#group-song-titles')) {
      fields.insertAdjacentHTML('afterbegin', `
        <label class="checkbox-label">
          <input id="group-song-titles" type="checkbox" checked />
          <span>Group song titles earned by ALL PERFECT on every difficulty of one specific DX song</span>
        </label>
      `);
    }
    $('#group-song-titles').checked = state.groupedSongTitles;
  };

  const jewelUrl = (version, layer) =>
    `https://storage.googleapis.com/cdn.jerry.games/plates/frames/${encodeURIComponent(version)}_${layer}.png`;

  const plateLayers = (item) => {
    if (item.artworkVersion === 'base') return ['kiwami', 'kami', 'maimai'];
    if (item.artworkVersion === 'maimai') return ['hasha', 'shou', 'kami', 'maimai'];
    return ['kiwami', 'shou', 'kami', 'maimai'];
  };

  const plateUrl = (item, layer) =>
    `https://storage.googleapis.com/cdn.jerry.games/plates/${encodeURIComponent(item.artworkVersion)}/${encodeURIComponent(item.plateName)}_${layer}.png`;

  const renderArtwork = (item) => {
    if (item.type === 'Jewel') {
      return `<div class="artwork-strip jewel-artwork">${['clear', 'ap', 'fdx'].map((layer) => (
        `<figure><img loading="lazy" src="${jewelUrl(item.artworkVersion, layer)}" alt="${escapeHtml(layer.toUpperCase())} artwork for ${escapeHtml(item.name)}"><figcaption>${escapeHtml(layer.toUpperCase())}</figcaption></figure>`
      )).join('')}</div>`;
    }
    if (item.type === 'Plate') {
      return `<div class="artwork-strip plate-artwork">${plateLayers(item).map((layer) => (
        `<img loading="lazy" src="${plateUrl(item, layer)}" alt="${escapeHtml(layer)} artwork for the ${escapeHtml(item.name)} plate">`
      )).join('')}</div>`;
    }
    if (item.type === 'Icon' && item.imageUrl) {
      return `<div class="artwork-strip icon-artwork"><img loading="lazy" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)} icon artwork"></div>`;
    }
    if (item.type === 'Frame' && item.imageUrl) {
      return `<div class="artwork-strip frame-artwork"><img loading="lazy" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)} frame artwork"></div>`;
    }
    return '';
  };

  const sourceLinks = (item) => {
    const titleOriginSourceIds = new Set((item.titleOrigins || []).map((origin) => origin.source_id));
    const links = item.sources
      .filter((sourceId) => !titleOriginSourceIds.has(sourceId))
      .map((sourceId) => sourceById.get(sourceId))
      .filter(Boolean);
    if (!links.length && item.sourceUrl) {
      return `<a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noreferrer">Open source</a>`;
    }
    return links.map((source) => (
      `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.name)}</a>`
    )).join('');
  };

  const renderPlateCharts = (item) => {
    if (item.type !== 'Plate' || !item.charts.length) return '';
    return `<div class="chart-list"><h3>${item.charts.length.toLocaleString()} chart requirements</h3><ul>${item.charts.map((chart) => (
      `<li><span lang="ja">${escapeHtml(chart.display_name)}</span><small>${escapeHtml([chart.difficulty, chart.type, chart.constant].filter(Boolean).join(' · '))}</small></li>`
    )).join('')}</ul></div>`;
  };

  const renderPlateNamePlateReward = (item) => {
    if (item.type !== 'Plate' || !item.namePlateReward) return '';
    const reward = item.namePlateReward;
    return `<div class="jewel-rewards"><h3>ALL PERFECT Plate reward</h3><ul><li><strong lang="ja">${escapeHtml(reward.name)}</strong><span lang="ja">${escapeHtml(reward.condition)}</span>${reward.englishCondition ? `<small>${escapeHtml(reward.englishCondition)}</small>` : ''}</li></ul></div>`;
  };

  const renderJewelRewards = (item) => {
    if (item.type !== 'Jewel' || !item.jewelRewards?.length) return '';
    return `<div class="jewel-rewards"><h3>How to earn each frame</h3><ul>${item.jewelRewards.map((reward) => (
      `<li><strong>${escapeHtml(reward.kind)}</strong><span lang="ja">${escapeHtml(reward.condition)}</span>${reward.englishCondition ? `<small>${escapeHtml(reward.englishCondition)}</small>` : ''}</li>`
    )).join('')}</ul></div>`;
  };

  const renderSourceRecords = (item) => {
    const records = (item.sourceRecords || []).filter((record) => !record.discrepancy_flags?.includes('title_origin'));
    if (!records.length) return '';
    return `<div class="source-records"><h3>Evidence records</h3>${records.map((record) => (
      `<p><strong>${escapeHtml(record.id || 'source')}</strong>${record.region_scope ? ` · ${escapeHtml(record.region_scope)}` : ''}${record.confidence ? ` · ${escapeHtml(record.confidence)}` : ''}<br>${escapeHtml(record.evidence_snippet || record.condition || '')}</p>`
    )).join('')}</div>`;
  };

  const renderTitleOrigins = (item) => {
    if (item.type !== 'Title' || !item.titleOrigins?.length) return '';
    return `<div class="title-origins"><h3>Title origin</h3><ul>${item.titleOrigins.map((origin) => (
      `<li>${origin.song ? `<strong lang="ja">${escapeHtml(origin.song)}</strong>` : ''}<span lang="ja">${escapeHtml(origin.original_text || '')}</span>${origin.english_text ? `<small>English translation: ${escapeHtml(origin.english_text)}</small>` : ''}${origin.source_url ? `<a href="${escapeHtml(origin.source_url)}" target="_blank" rel="noreferrer">Source</a>` : ''}</li>`
    )).join('')}</ul></div>`;
  };

  const renderAggregateMembers = (item) => {
    if (!item.aggregateCount || !item.memberTitles?.length) return '';
    return `<details class="aggregate-member-list"><summary>Member titles (${item.aggregateCount.toLocaleString()})</summary><div class="aggregate-member-body"><ul>${item.memberTitles.map((name) => (
      `<li lang="ja">${escapeHtml(name)}</li>`
    )).join('')}</ul></div></details>`;
  };

  const renderCard = (item) => {
    const metadata = [
      item.version,
      item.type === 'Title' && item.rainbowGroup ? item.rainbowGroup : '',
      acquisitionById.get(item.acquisitionPrimary)?.label || '',
      item.legacy ? 'Legacy category' : '',
      item.legacyCosmeticTypes?.includes('Big icon') ? 'Legacy でかアイコン source' : '',
      item.type === 'Title' && item.overseasStatus === 'unavailable' ? 'Overseas unavailable' : '',
      item.retired ? 'Retired' : ''
    ].filter(Boolean);
    const displayName = item.type === 'Title'
      ? `<div class="title-preview ${tierClass(item.tier)}">
          <span class="title-colour-label">Title colour: ${escapeHtml(tierLabels[item.tier] || item.tier || tierLabels.Unlabelled)}</span>
          <h2 lang="${escapeHtml(item.titleLanguage || 'ja')}">${escapeHtml(item.name)}</h2>
        </div>`
      : `<h2 lang="ja">${escapeHtml(item.name)}</h2>`;
    const translation = item.translation && normalise(item.translation) !== normalise(item.name)
      ? item.type === 'Title'
        ? `<p class="title-meaning"><span>Title meaning</span>${escapeHtml(item.translation)}</p>`
        : `<p class="item-translation">${escapeHtml(item.translation)}</p>`
      : '';
    const extraDetails = [
      item.category ? `<p><strong>Category:</strong> ${escapeHtml(item.category)}</p>` : '',
      item.subcategory ? `<p><strong>Subcategory:</strong> ${escapeHtml(item.subcategory)}</p>` : '',
      item.location ? `<p><strong>Location:</strong> ${escapeHtml(item.location)}</p>` : '',
      item.aggregateCount ? `<p><strong>Aggregated titles:</strong> ${item.aggregateCount.toLocaleString()} song titles earned by ALL PERFECT on every difficulty of one specific DX song.</p>` : '',
      item.regionScope ? `<p><strong>Region scope:</strong> ${escapeHtml(item.regionScope)}</p>` : '',
      item.availability ? `<p><strong>Availability:</strong> ${escapeHtml(item.availability)}</p>` : '',
      item.confidence ? `<p><strong>Confidence:</strong> ${escapeHtml(item.confidence)}</p>` : '',
      item.discrepancyFlags?.length ? `<p><strong>Flags:</strong> ${escapeHtml(item.discrepancyFlags.join(', '))}</p>` : ''
    ].join('');
    const hasDetails = item.sources.length || item.sourceUrl || extraDetails || item.charts?.length || item.sourceRecords?.length || item.titleOrigins?.length || item.jewelRewards?.length || item.namePlateReward || item.aggregateCount;
    return `<article class="result-card" data-type="${escapeHtml(item.type)}">
      <div class="result-main">
        <div class="result-topline">
          <span class="type-label">${escapeHtml(typeLabels[item.type] || item.type)}</span>
          ${metadata.length ? `<span class="metadata">${metadata.map(escapeHtml).join(' · ')}</span>` : ''}
        </div>
        ${displayName}
        ${translation}
        ${item.subtitle ? `<p class="subtitle">${escapeHtml(item.subtitle)}</p>` : ''}
        ${item.condition ? `<p class="condition"><span>Unlock condition</span>${escapeHtml(item.condition)}</p>` : ''}
        ${item.englishCondition ? `<p class="english-condition"><span>English</span>${escapeHtml(item.englishCondition)}</p>` : ''}
      </div>
      ${renderArtwork(item)}
      ${hasDetails ? `<details class="item-details"><summary>Sources and details</summary><div class="details-body">${extraDetails}${renderAggregateMembers(item)}${renderJewelRewards(item)}${renderPlateNamePlateReward(item)}${renderTitleOrigins(item)}<div class="source-links">${sourceLinks(item)}</div>${renderSourceRecords(item)}${renderPlateCharts(item)}</div></details>` : ''}
    </article>`;
  };

  const filteredItems = () => {
    const results = items.filter((item) => {
      if (state.type !== 'all' && item.type !== state.type) return false;
      if (state.tier !== 'all' && item.tier !== state.tier) return false;
      if (state.acquisition !== 'all' && !item.acquisitionCategories.includes(state.acquisition)) return false;
      if (state.image === 'has-image' && !item.hasImage) return false;
      if (state.image === 'no-image' && item.hasImage) return false;
      if (!state.includeRetired && item.retired) return false;
      return !state.search || item.searchText.includes(state.search);
    });
    const rainbowGroupOrder = [
      'ALL PERFECT+',
      'Otomodachi Battle',
      'Circle ranking',
      'Score Attack',
      'KING of Performai',
      'Tenkaichi Otogesai',
      'Partner level',
      'All-prefecture travel',
      'Official broadcast or event',
      'Legacy carry-over'
    ];
    const rainbowOrder = new Map(rainbowGroupOrder.map((group, index) => [group, index]));
    return results.sort((a, b) => {
      const acquisitionA = acquisitionById.get(a.acquisitionPrimary)?.order ?? 999;
      const acquisitionB = acquisitionById.get(b.acquisitionPrimary)?.order ?? 999;
      const groupA = rainbowOrder.get(a.rainbowGroup) ?? 999;
      const groupB = rainbowOrder.get(b.rainbowGroup) ?? 999;
      return acquisitionA - acquisitionB
        || groupA - groupB
        || a.name.localeCompare(b.name, undefined, { numeric: true });
    });
  };

  const updateContextNote = () => {
    const note = $('#context-note');
    const messages = [];
    if (state.type === 'Icon') {
      messages.push('<strong>Artwork coverage:</strong> Images are shown only when a verified source has an exact match. Legacy and regional icons can still be listed without a reliable image.');
    }
    if (state.type === 'Big icon') {
      messages.push('<strong>Big icons are real legacy cosmetics.</strong> They were introduced as でかアイコン in maimai PiNK. Later references often group them with ordinary icons or display carried-over big icons as normal icons.');
    }
    if (state.type === 'Frame') {
      messages.push('<strong>Jewels are frame cosmetics.</strong> They are kept in their own section so they are not counted twice. <button class="inline-link-button" type="button" data-show-type="Jewel">Open Jewels</button>');
    }
    if (state.type === 'Jewel') {
      messages.push('<strong>Jewels are version-completion frames.</strong> Each card shows the CLEAR, ALL PERFECT and FULL SYNC DX rewards and their sourced requirements.');
    }
    if (state.tier === 'Rainbow') {
      messages.push('<strong>Rainbow titles are grouped by unlock type.</strong> Open each card for the original Japanese condition and its English translation.');
    }
    if (state.acquisition !== 'all') {
      const label = acquisitionById.get(state.acquisition)?.label || state.acquisition;
      messages.push(`<strong>Acquisition filter:</strong> ${escapeHtml(label)}. Multi-step unlocks can appear in more than one method.`);
    }
    note.hidden = messages.length === 0;
    note.innerHTML = messages.join(' ');
  };

  const updateClearButton = () => {
    $('#clear-filters').hidden = !(
      state.search || state.type !== 'all' || state.tier !== 'all'
      || state.acquisition !== 'all' || !state.includeRetired
      || state.image !== 'all'
    );
  };

  const render = () => {
    buildItems();
    renderAcquisitionBrowser();
    const results = filteredItems();
    const pageCount = state.showAll ? 1 : Math.max(1, Math.ceil(results.length / state.pageSize));
    state.page = Math.min(state.page, pageCount);
    const start = state.showAll ? 0 : (state.page - 1) * state.pageSize;
    const visible = state.showAll ? results : results.slice(start, start + state.pageSize);
    const resultList = $('#result-list');
    $('.results-section').setAttribute('aria-busy', 'true');
    $('#result-count').textContent = results.length.toLocaleString();
    $('#empty-state').hidden = results.length !== 0;
    resultList.innerHTML = visible.map(renderCard).join('');
    const pagination = $('#result-pagination');
    const pageSizeInput = $('#page-size');
    const previousPage = $('#previous-page');
    const nextPage = $('#next-page');
    const loadAll = $('#load-all');
    pagination.hidden = results.length === 0;
    pageSizeInput.value = state.pageSize;
    pageSizeInput.disabled = state.showAll;
    previousPage.disabled = state.showAll || state.page <= 1;
    nextPage.disabled = state.showAll || state.page >= pageCount;
    loadAll.hidden = state.showAll || results.length <= state.pageSize;
    const firstVisible = results.length === 0 ? 0 : start + 1;
    const lastVisible = state.showAll ? results.length : Math.min(start + visible.length, results.length);
    $('#page-status').textContent = state.showAll
      ? `Showing all ${results.length.toLocaleString()}`
      : `Page ${state.page.toLocaleString()} of ${pageCount.toLocaleString()} · ${firstVisible.toLocaleString()}-${lastVisible.toLocaleString()} of ${results.length.toLocaleString()}`;
    updateContextNote();
    updateClearButton();
    $('.results-section').setAttribute('aria-busy', 'false');
  };

  const resetLimitAndRender = () => {
    state.page = 1;
    state.showAll = false;
    render();
  };

  renderTypeFilters();
  renderTierOptions();
  renderMoreFilters();
  $('#catalogue-count').textContent = buildItems().length.toLocaleString();

  $('#type-filters').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-type]');
    if (!button) return;
    state.type = button.dataset.type;
    document.querySelectorAll('#type-filters button').forEach((candidate) => {
      candidate.setAttribute('aria-pressed', String(candidate === button));
    });
    resetLimitAndRender();
  });

  $('#catalogue-search').addEventListener('input', (event) => {
    state.search = normalise(event.target.value);
    resetLimitAndRender();
  });

  $('#tier-filter').addEventListener('change', (event) => {
    state.tier = event.target.value;
    resetLimitAndRender();
  });

  $('#acquisition-browser').addEventListener('click', (event) => {
    if (event.target.closest('button[data-acquisition-close]')) {
      const openIndex = state.acquisitionGroup;
      closeAcquisitionPanel();
      $(`.acquisition-group-tab[data-acquisition-group="${openIndex}"]`)?.focus();
      return;
    }
    const groupButton = event.target.closest('button[data-acquisition-group]');
    if (groupButton) {
      const groupIndex = Number(groupButton.dataset.acquisitionGroup);
      // Opening a group is just a peek, so it leaves the active method alone.
      state.acquisitionGroup = state.acquisitionGroup === groupIndex ? null : groupIndex;
      renderAcquisitionBrowser();
      // event.detail is 0 for keyboard-activated clicks, so a keyboard user
      // lands inside the panel while a mouse user keeps their pointer focus.
      if (state.acquisitionGroup !== null && event.detail === 0) {
        $('#acquisition-methods .acquisition-method')?.focus();
      }
      return;
    }
    const button = event.target.closest('button[data-acquisition]');
    if (!button) return;
    state.acquisition = button.dataset.acquisition;
    // Choosing a method answers the question the panel was asking, so close it.
    state.acquisitionGroup = null;
    resetLimitAndRender();
  });

  // Capture phase: the DOM is still intact here, so closest() can tell whether
  // the click started inside the browser before any re-render detaches it.
  document.addEventListener('click', (event) => {
    if (state.acquisitionGroup === null) return;
    if (event.target.closest?.('#acquisition-browser')) return;
    closeAcquisitionPanel();
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.acquisitionGroup !== null) {
      const openIndex = state.acquisitionGroup;
      closeAcquisitionPanel();
      $(`.acquisition-group-tab[data-acquisition-group="${openIndex}"]`)?.focus();
      return;
    }
    if (!event.key.startsWith('Arrow')) return;
    const current = event.target.closest?.('#acquisition-methods .acquisition-method');
    if (!current) return;
    const methods = [...document.querySelectorAll('#acquisition-methods .acquisition-method')];
    const grid = $('.acquisition-methods-grid');
    const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length || 1;
    const step = event.key === 'ArrowLeft' ? -1
      : event.key === 'ArrowRight' ? 1
        : event.key === 'ArrowUp' ? -columns : columns;
    const next = methods[methods.indexOf(current) + step];
    if (!next) return;
    event.preventDefault();
    next.focus();
  });

  $('#more-filters').addEventListener('change', (event) => {
    if (event.target?.id !== 'group-song-titles') return;
    state.groupedSongTitles = event.target.checked;
    resetLimitAndRender();
  });

  $('#retired-filter').addEventListener('change', (event) => {
    state.includeRetired = event.target.checked;
    resetLimitAndRender();
  });

  $('#image-filter').addEventListener('change', (event) => {
    state.image = event.target.value;
    resetLimitAndRender();
  });

  $('#page-size').addEventListener('input', (event) => {
    const rawValue = event.target.value.trim();
    if (!rawValue) return;
    const requestedSize = Number.parseInt(rawValue, 10);
    state.pageSize = Math.max(1, Math.min(10000, Number.isFinite(requestedSize) ? requestedSize : defaultPageSize));
    state.page = 1;
    state.showAll = false;
    render();
  });

  $('#previous-page').addEventListener('click', () => {
    state.page -= 1;
    render();
  });

  $('#next-page').addEventListener('click', () => {
    state.page += 1;
    render();
  });

  $('#load-all').addEventListener('click', () => {
    state.showAll = true;
    state.page = 1;
    render();
  });

  $('#clear-filters').addEventListener('click', () => {
    state.search = '';
    state.type = 'all';
    state.tier = 'all';
    state.acquisition = 'all';
    state.image = 'all';
    state.includeRetired = true;
    state.groupedSongTitles = true;
    state.acquisitionGroup = null;
    state.page = 1;
    state.showAll = false;
    $('#catalogue-search').value = '';
    $('#tier-filter').value = 'all';
    $('#image-filter').value = 'all';
    $('#retired-filter').checked = true;
    $('#group-song-titles').checked = true;
    document.querySelectorAll('#type-filters button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.type === 'all'));
    });
    render();
  });

  $('#context-note').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-show-type]');
    if (!button) return;
    state.type = button.dataset.showType;
    document.querySelectorAll('#type-filters button').forEach((candidate) => {
      candidate.setAttribute('aria-pressed', String(candidate.dataset.type === state.type));
    });
    resetLimitAndRender();
  });

  document.addEventListener('keydown', (event) => {
    const activeTag = document.activeElement?.tagName;
    if (event.key === '/' && activeTag !== 'INPUT' && activeTag !== 'TEXTAREA' && activeTag !== 'SELECT') {
      event.preventDefault();
      $('#catalogue-search').focus();
    }
  });

  document.addEventListener('error', (event) => {
    if (event.target instanceof HTMLImageElement) event.target.hidden = true;
  }, true);

  $('#source-list').innerHTML = (data.sources || []).map((source) => (
    `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer"><span>${escapeHtml(source.name)}</span><small>${escapeHtml(source.role)}</small></a>`
  )).join('');

  const sourcesDialog = $('#sources-dialog');
  const openSources = () => sourcesDialog.showModal();
  $('#open-sources').addEventListener('click', openSources);
  $('#open-sources-footer').addEventListener('click', openSources);
  $('#close-sources').addEventListener('click', () => sourcesDialog.close());
  sourcesDialog.addEventListener('click', (event) => {
    if (event.target === sourcesDialog) sourcesDialog.close();
  });

  render();
  window.addEventListener('load', render, { once: true });
})();
