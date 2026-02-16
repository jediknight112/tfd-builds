import { getApiKeys, getLanguage } from './config.js';

// Localized string constants for game-specific categories
// These are used for filtering and UI logic across different languages
export const LOCALIZED_STRINGS = {
  moduleClass: {
    Descendant: {
      de: 'Nachfahre',
      en: 'Descendant',
      es: 'Descendiente',
      fr: 'Légataire',
      it: 'Discendente',
      ja: '継承者',
      ko: '계승자',
      pl: 'Potomek',
      pt: 'Descendente',
      ru: 'Потомок',
      'zh-CN': '继承者',
      'zh-TW': '繼承者',
    },
    'General Rounds': {
      de: 'Standardmunition',
      en: 'General Rounds',
      es: 'Balas generales',
      fr: 'Munitions standard',
      it: 'Colpi generali',
      ja: '通常弾',
      ko: '일반탄',
      pl: 'Standardowe naboje',
      pt: 'Cartuchos Comuns',
      ru: 'Обычные патроны',
      'zh-CN': '普通弹',
      'zh-TW': '一般彈',
    },
    'Special Rounds': {
      de: 'Spezialmunition',
      en: 'Special Rounds',
      es: 'Balas especiales',
      fr: 'Munitions spéciales',
      it: 'Colpi speciali',
      ja: '特殊弾',
      ko: '특수탄',
      pl: 'Specjalne naboje',
      pt: 'Cartuchos Especiais',
      ru: 'Спец. патроны',
      'zh-CN': '特殊弹',
      'zh-TW': '特殊彈',
    },
    'Impact Rounds': {
      de: 'Einschlagmunition',
      en: 'Impact Rounds',
      es: 'Balas de impacto',
      fr: 'Munitions percutantes',
      it: 'Colpi impattanti',
      ja: 'ショック弾',
      ko: '충격탄',
      pl: 'Naboje ogłuszające',
      pt: 'Cartuchos de Impacto',
      ru: 'Ударные патроны',
      'zh-CN': '冲击弹',
      'zh-TW': '衝擊彈',
    },
    'High-Power Rounds': {
      de: 'Hochleistungsmunition',
      en: 'High-Power Rounds',
      es: 'Balas de gran potencia',
      fr: 'Munitions gros calibre',
      it: 'Colpi intensi',
      ja: '高威力弾',
      ko: '고위력탄',
      pl: 'Silniejsze naboje',
      pt: 'Cartuchos mais potentes',
      ru: 'Мощные патроны',
      'zh-CN': '强力弹',
      'zh-TW': '高威力彈',
    },
  },
  socketType: {
    Almandine: {
      de: 'Almandin',
      en: 'Almandine',
      es: 'Almandino',
      fr: 'Almandin',
      it: 'Almandino',
      ja: 'アルマンディン',
      ko: '알만딘',
      pl: 'Almandynowe',
      pt: 'Almandina',
      ru: 'Гранатовый',
      'zh-CN': '铁铝榴石',
      'zh-TW': '鐵鋁榴石',
    },
    Malachite: {
      de: 'Malachit',
      en: 'Malachite',
      es: 'Malaquita',
      fr: 'Malachite',
      it: 'Malachite',
      ja: 'マラカイト',
      ko: '말라카이트',
      pl: 'Malachitowe',
      pt: 'Malaquita',
      ru: 'Малахитовый',
      'zh-CN': '孔雀石',
      'zh-TW': '孔雀石',
    },
    Cerulean: {
      de: 'Coelin',
      en: 'Cerulean',
      es: 'Cerúleo',
      fr: 'Céruléen',
      it: 'Ceruleo',
      ja: 'セルリアン',
      ko: '세룰리안',
      pl: 'Lazurowe',
      pt: 'Cerúleo',
      ru: 'Лазурный',
      'zh-CN': '蔚蓝',
      'zh-TW': '晶藍',
    },
    Xantic: {
      de: 'Xanthin',
      en: 'Xantic',
      es: 'Xantina',
      fr: 'Xantique',
      it: 'Xantico',
      ja: 'キサンチン',
      ko: '크산틱',
      pl: 'Ksantynowe',
      pt: 'Xântico',
      ru: 'Желтый',
      'zh-CN': '黄质',
      'zh-TW': '黃質',
    },
    Rutile: {
      de: 'Rutil',
      en: 'Rutile',
      es: 'Rutilo',
      fr: 'Rutile',
      it: 'Rutilo',
      ja: 'ルチル',
      ko: '루틸',
      pl: 'Rutylowe',
      pt: 'Rútilo',
      ru: 'Рутиловый',
      'zh-CN': '金红石',
      'zh-TW': '金紅石',
    },
  },
  equipmentType: {
    'Auxiliary Power': {
      de: 'Hilfsenergie',
      en: 'Auxiliary Power',
      es: 'Energía auxiliar',
      fr: 'Puissance auxiliaire',
      it: 'Alimentazione ausiliaria',
      ja: '補助電源',
      ko: '보조 전원',
      pl: 'Zapasowa moc',
      pt: 'Poder Auxiliar',
      ru: 'Дополнительный источник энергии',
      'zh-CN': '辅助电源',
      'zh-TW': '輔助電源',
    },
    Sensor: {
      de: 'Sensor',
      en: 'Sensor',
      es: 'Sensor',
      fr: 'Détecteur',
      it: 'Sensore',
      ja: 'センサー',
      ko: '센서',
      pl: 'Czujnik',
      pt: 'Sensor',
      ru: 'Датчик',
      'zh-CN': '传感器',
      'zh-TW': '感應器',
    },
    Memory: {
      de: 'Speicher',
      en: 'Memory',
      es: 'Memoria',
      fr: 'Mémoire',
      it: 'Memoria',
      ja: 'メモリー',
      ko: '메모리',
      pl: 'Pamięć',
      pt: 'Memória',
      ru: 'Память',
      'zh-CN': '存储器',
      'zh-TW': '儲存器',
    },
    Processor: {
      de: 'Prozessor',
      en: 'Processor',
      es: 'Procesador',
      fr: 'Processeur',
      it: 'Processore',
      ja: '処理装置',
      ko: '처리 장치',
      pl: 'Procesor',
      pt: 'Processador',
      ru: 'Процессор',
      'zh-CN': '处理装置',
      'zh-TW': '處理裝置',
    },
  },
  weaponType: {
    Handgun: {
      de: 'Pistole',
      en: 'Handgun',
      es: 'Pistola',
      fr: 'Pistolet',
      it: 'Pistola',
      ja: 'ピストル',
      ko: '권총',
      pl: 'Broń krótka',
      pt: 'Pistola',
      ru: 'Пистолет',
      'zh-CN': '手枪',
      'zh-TW': '手槍',
    },
    'Assault Rifle': {
      de: 'Sturmgewehr',
      en: 'Assault Rifle',
      es: 'Rifle de asalto',
      fr: "Fusil d'assaut",
      it: "Fucile d'assalto",
      ja: 'アサルトライフル',
      ko: '돌격소총',
      pl: 'Karabin szturmowy',
      pt: 'Rifle de Assalto',
      ru: 'Штурмовая винтовка',
      'zh-CN': '突击步枪',
      'zh-TW': '突擊步槍',
    },
    SMG: {
      de: 'Maschinenpistole',
      en: 'Submachine Gun',
      es: 'Subfusil',
      fr: 'Pistolet-mitrailleur',
      it: 'Mitragliatrice',
      ja: 'サブマシンガン',
      ko: '기관단총',
      pl: 'Pistolet maszynowy',
      pt: 'Submetralhadora',
      ru: 'Пистолет-пулемет',
      'zh-CN': '冲锋枪',
      'zh-TW': '衝鋒槍',
    },
    Shotgun: {
      de: 'Schrotflinte',
      en: 'Shotgun',
      es: 'Escopeta',
      fr: 'Fusil de chasse',
      it: 'Fucile a pompa',
      ja: 'ショットガン',
      ko: '산탄총',
      pl: 'Strzelba',
      pt: 'Escopeta',
      ru: 'Дробовик',
      'zh-CN': '霰弹枪',
      'zh-TW': '散彈槍',
    },
    'Machine Gun': {
      de: 'Maschinengewehr',
      en: 'Machine Gun',
      es: 'Ametralladora',
      fr: 'Mitrailleuse',
      it: 'Mitra pesante',
      ja: 'マシンガン',
      ko: '기관총',
      pl: 'Karabin maszynowy',
      pt: 'Metralhadora',
      ru: 'Пулемет',
      'zh-CN': '机关枪',
      'zh-TW': '機關槍',
    },
    'Scout Rifle': {
      de: 'Spähergewehr',
      en: 'Scout Rifle',
      es: 'Rifle de cerrojo',
      fr: 'Fusil éclaireur',
      it: 'Fucile da ricognizione',
      ja: 'スカウトライフル',
      ko: '정찰소총',
      pl: 'Karabin zwiadowczy',
      pt: 'Rifle de Reconhecimento',
      ru: 'Винтовка разведчика',
      'zh-CN': '向导步枪',
      'zh-TW': '偵察步槍',
    },
    'Sniper Rifle': {
      de: 'Scharfschützengewehr',
      en: 'Sniper Rifle',
      es: 'Rifle de francotirador',
      fr: 'Fusil de précision',
      it: 'Fucile da cecchino',
      ja: 'スナイパーライフル',
      ko: '저격총',
      pl: 'Karabin snajperski',
      pt: 'Rifle de Precisão',
      ru: 'Снайперская винтовка',
      'zh-CN': '狙击步枪',
      'zh-TW': '狙擊槍',
    },
    'Tactical Rifle': {
      de: 'Taktisches Gewehr',
      en: 'Tactical Rifle',
      es: 'Rifle táctico',
      fr: 'Fusil tactique',
      it: 'Fucile tattico',
      ja: 'タクティカルライフル',
      ko: '전술소총',
      pl: 'Karabin taktyczny',
      pt: 'Rifle Tático',
      ru: 'Тактическая винтовка',
      'zh-CN': '战术步枪',
      'zh-TW': '戰術步槍',
    },
    'Beam Rifle': {
      de: 'Strahlengewehr',
      en: 'Beam Rifle',
      es: 'Rifle de haz',
      fr: 'Fusil à rayons',
      it: 'Fucile laser',
      ja: 'ビームライフル',
      ko: '광선소총',
      pl: 'Karabin laserowy',
      pt: 'Fuzil Laser',
      ru: 'Лучевая винтовка',
      'zh-CN': '光束步枪',
      'zh-TW': '光束步槍',
    },
    'Hand Cannon': {
      de: 'Revolver',
      en: 'Hand Cannon',
      es: 'Cañón de mano',
      fr: 'Revolver',
      it: 'Revolver',
      ja: 'ハンドキャノン',
      ko: '핸드 캐논',
      pl: 'Działko ręczne',
      pt: 'Canhão de Mão',
      ru: 'Ручная пушка',
      'zh-CN': '手炮',
      'zh-TW': '手銃',
    },
    Launcher: {
      de: 'Werfer/Kanone',
      en: 'Launcher',
      es: 'Lanzamisiles',
      fr: 'Lanceur',
      it: 'Lanciarazzi',
      ja: 'ランチャー',
      ko: '런처',
      pl: 'Wyrzutnia',
      pt: 'Lançador',
      ru: 'Ракетница',
      'zh-CN': '发射器',
      'zh-TW': '發射器',
    },
  },
  coreType: {
    'Free Augmentation': {
      de: 'Freie Erweiterung',
      en: 'Free Augmentation',
      es: 'Aumento libre',
      fr: 'Amélioration libre',
      it: 'Incremento libero',
      ja: 'フリー増強',
      ko: '자유 증강',
      pl: 'Wolne spotęgowanie',
      pt: 'Incremento Livre',
      ru: 'Свободная аугментация',
      'zh-CN': '自由增强',
      'zh-TW': '自由增強',
    },
  },
};

// State Management
class AppState {
  constructor() {
    this.descendants = [];
    this.modules = [];
    this.weapons = [];
    this.reactors = [];
    this.externalComponents = [];
    this.archeTuningNodes = [];
    this.archeTuningBoards = [];
    this.archeTuningBoardGroups = [];
    this.descendantGroups = [];
    this.weaponTypes = [];
    this.tiers = [];
    this.stats = [];
    this.coreSlots = [];
    this.coreTypes = [];
    this.statLookup = {}; // Map stat_id to stat_name
    this.weaponTypeNameLookup = {}; // Map weapon_type_name to weapon_type
    this.coreSlotLookup = {}; // Map core_slot_id to core slot data
    this.coreTypeLookup = {}; // Map core_type_id to core type data
    this.tierLookup = {}; // Map tier_id to localized tier_name
    this.currentDescendant = null;
    this.currentBuild = {
      triggerModule: null,
      descendantModules: Array(12).fill(null),
      weapons: Array(3)
        .fill(null)
        .map(() => ({
          weapon: null,
          modules: Array(10).fill(null),
          customStats: [],
          coreType: null,
          coreStats: [], // Array of { option_id, stat_id, stat_value }
        })),
      reactor: null,
      reactorAdditionalStats: [
        { name: '', value: 0 },
        { name: '', value: 0 },
      ],
      externalComponents: {}, // { 'Auxiliary Power': { component, coreStats }, ... }
      archeTuning: null,
      fellow: null,
      vehicle: null,
      inversionReinforcement: null,
    };
    this.currentTab = 'modules';
    this.apiKeys = getApiKeys();
    this.language = getLanguage();
    this.dataLoaded = false;
    this.currentModuleSlot = null; // Track which module slot is being filled
    this.currentWeaponSlot = null; // Track which weapon slot is being filled (weapon or module)
    this.currentExternalComponentCoreType = null; // Track which external component is being configured for cores
    this.selectedStatId = null; // Track selected stat in custom stat selector
  }

  setApiKeys(workerApiKey, nexonApiKey) {
    this.apiKeys = { workerApiKey, nexonApiKey };
    if (workerApiKey) localStorage.setItem('workerApiKey', workerApiKey);
    if (nexonApiKey) localStorage.setItem('nexonApiKey', nexonApiKey);
  }

  setLanguage(languageCode) {
    this.language = languageCode;
    localStorage.setItem('languageCode', languageCode);
  }

  // Build stat lookup map
  buildStatLookup() {
    this.statLookup = {};
    if (this.stats && Array.isArray(this.stats)) {
      this.stats.forEach((stat) => {
        if (stat.stat_id && stat.stat_name) {
          this.statLookup[stat.stat_id] = stat.stat_name;
        }
      });
    }
  }

  // Build weapon type lookup map
  buildWeaponTypeLookup() {
    this.weaponTypeNameLookup = {};
    if (this.weaponTypes && Array.isArray(this.weaponTypes)) {
      this.weaponTypes.forEach((weaponType) => {
        if (weaponType.weapon_type_name && weaponType.weapon_type) {
          this.weaponTypeNameLookup[weaponType.weapon_type_name] =
            weaponType.weapon_type;
        }
      });
    }
  }

  // Build core slot lookup map
  buildCoreSlotLookup() {
    this.coreSlotLookup = {};
    if (this.coreSlots && Array.isArray(this.coreSlots)) {
      this.coreSlots.forEach((coreSlot) => {
        if (coreSlot.core_slot_id) {
          this.coreSlotLookup[coreSlot.core_slot_id] = coreSlot;
        }
      });
    }
  }

  // Build core type lookup map
  buildCoreTypeLookup() {
    this.coreTypeLookup = {};
    if (this.coreTypes && Array.isArray(this.coreTypes)) {
      this.coreTypes.forEach((coreType) => {
        if (coreType.core_type_id) {
          this.coreTypeLookup[coreType.core_type_id] = coreType;
        }
      });
    }
  }

  // Build tier lookup map
  buildTierLookup() {
    this.tierLookup = {};
    if (this.tiers && Array.isArray(this.tiers)) {
      this.tiers.forEach((tier) => {
        if (tier.tier_id && tier.tier_name) {
          this.tierLookup[tier.tier_id] = tier.tier_name;
        }
      });
    }
  }

  // Get localized module class
  getLocalizedModuleClass(enClass) {
    return (
      LOCALIZED_STRINGS.moduleClass[enClass]?.[this.language] ||
      LOCALIZED_STRINGS.moduleClass[enClass]?.en ||
      enClass
    );
  }

  // Get localized slot type
  getLocalizedSlotType(enSlotType) {
    // Slot types are currently not localized in the API (Main, Skill, Sub, Trigger)
    return enSlotType;
  }

  // Get localized socket type
  getLocalizedSocketType(enSocketType) {
    return (
      LOCALIZED_STRINGS.socketType[enSocketType]?.[this.language] ||
      LOCALIZED_STRINGS.socketType[enSocketType]?.en ||
      enSocketType
    );
  }

  // Get English key for a localized socket type (for styling)
  getSocketTypeKey(localizedName) {
    const entry = Object.entries(LOCALIZED_STRINGS.socketType).find(
      ([enKey, localizations]) => localizedName === localizations[this.language]
    );
    return entry ? entry[0] : localizedName;
  }

  // Get localized weapon type
  getLocalizedWeaponType(enWeaponType) {
    return (
      LOCALIZED_STRINGS.weaponType[enWeaponType]?.[this.language] ||
      LOCALIZED_STRINGS.weaponType[enWeaponType]?.en ||
      enWeaponType
    );
  }

  // Get localized node type
  getLocalizedNodeType(enNodeType) {
    // Only 'Hole' is used for styling and it's not localized in API logic
    return enNodeType;
  }

  // Get localized equipment type
  getLocalizedEquipmentType(enEquipmentType) {
    return (
      LOCALIZED_STRINGS.equipmentType[enEquipmentType]?.[this.language] ||
      LOCALIZED_STRINGS.equipmentType[enEquipmentType]?.en ||
      enEquipmentType
    );
  }

  // Get localized core type
  getLocalizedCoreType(enCoreType) {
    return (
      LOCALIZED_STRINGS.coreType[enCoreType]?.[this.language] ||
      LOCALIZED_STRINGS.coreType[enCoreType]?.en ||
      enCoreType
    );
  }

  // Get localized tier display name
  getTierDisplayName(tierId) {
    return this.tierLookup[tierId] || tierId;
  }

  // Get stat name by ID
  getStatName(statId) {
    return this.statLookup[statId] || statId || 'Unknown Stat';
  }

  // Get weapon type code from weapon type name
  getWeaponTypeCode(weaponTypeName) {
    return this.weaponTypeNameLookup[weaponTypeName] || null;
  }

  // Get core slot by ID
  getCoreSlot(coreSlotId) {
    return this.coreSlotLookup[coreSlotId] || null;
  }

  // Get core type by ID
  getCoreType(coreTypeId) {
    return this.coreTypeLookup[coreTypeId] || null;
  }
}

export const state = new AppState();
