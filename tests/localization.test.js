import { describe, it, expect, beforeEach, vi } from 'vitest';
import { state } from '../src/state.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

describe('Localization Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    state.setLanguage('en');
  });

  it('should set and get language correctly', () => {
    state.setLanguage('ko');
    expect(state.language).toBe('ko');
    expect(localStorage.setItem).toHaveBeenCalledWith('languageCode', 'ko');
  });

  describe('Module Class Localization', () => {
    it('should localize Descendant class', () => {
      state.setLanguage('de');
      expect(state.getLocalizedModuleClass('Descendant')).toBe('Nachfahre');

      state.setLanguage('fr');
      expect(state.getLocalizedModuleClass('Descendant')).toBe('Légataire');

      state.setLanguage('ko');
      expect(state.getLocalizedModuleClass('Descendant')).toBe('계승자');
    });

    it('should localize Rounds types', () => {
      state.setLanguage('ja');
      expect(state.getLocalizedModuleClass('General Rounds')).toBe('通常弾');
      expect(state.getLocalizedModuleClass('High-Power Rounds')).toBe(
        '高威力弾'
      );
    });

    it('should fallback to English if translation is missing', () => {
      state.setLanguage('it');
      // Using a class that doesn't exist in LOCALIZED_STRINGS
      expect(state.getLocalizedModuleClass('NonExistentClass')).toBe(
        'NonExistentClass'
      );
    });
  });

  describe('Socket Type Localization', () => {
    it('should localize socket names', () => {
      state.setLanguage('es');
      expect(state.getLocalizedSocketType('Almandine')).toBe('Almandino');
      expect(state.getLocalizedSocketType('Cerulean')).toBe('Cerúleo');
    });

    it('should correctly map localized names back to English keys', () => {
      state.setLanguage('zh-TW');
      const localizedName = '鐵鋁榴石'; // Almandine in zh-TW
      expect(state.getSocketTypeKey(localizedName)).toBe('Almandine');

      state.setLanguage('ko');
      expect(state.getSocketTypeKey('말라카이트')).toBe('Malachite');
    });
  });

  describe('Weapon and Equipment Localization', () => {
    it('should localize weapon types', () => {
      state.setLanguage('pt');
      expect(state.getLocalizedWeaponType('Handgun')).toBe('Pistola');
      expect(state.getLocalizedWeaponType('Launcher')).toBe('Lançador');
    });

    it('should localize equipment types', () => {
      state.setLanguage('ru');
      expect(state.getLocalizedEquipmentType('Auxiliary Power')).toBe(
        'Дополнительный источник энергии'
      );
      expect(state.getLocalizedEquipmentType('Sensor')).toBe('Датчик');
    });

    it('should reverse-lookup localized equipment types to English keys', () => {
      expect(state.getEnglishEquipmentType('Auxiliary Power')).toBe(
        'Auxiliary Power'
      );
      expect(state.getEnglishEquipmentType('Hilfsenergie')).toBe(
        'Auxiliary Power'
      );
      expect(state.getEnglishEquipmentType('輔助電源')).toBe('Auxiliary Power');
      expect(state.getEnglishEquipmentType('感應器')).toBe('Sensor');
      expect(state.getEnglishEquipmentType('儲存器')).toBe('Memory');
      expect(state.getEnglishEquipmentType('處理裝置')).toBe('Processor');
      expect(state.getEnglishEquipmentType('Датчик')).toBe('Sensor');
      // Unknown should pass through
      expect(state.getEnglishEquipmentType('UnknownType')).toBe('UnknownType');
    });

    it('should localize core types (Free Augmentation)', () => {
      state.setLanguage('ko');
      expect(state.getLocalizedCoreType('Free Augmentation')).toBe('자유 증강');

      state.setLanguage('de');
      expect(state.getLocalizedCoreType('Free Augmentation')).toBe(
        'Freie Erweiterung'
      );
    });
  });

  describe('Tier and Stat Localization', () => {
    it('should return tier display name from tierLookup', () => {
      state.tiers = [{ tier_id: 'Tier3', tier_name: 'Ultimate' }];
      state.buildTierLookup();
      expect(state.getTierDisplayName('Tier3')).toBe('Ultimate');
    });

    it('should return stat name from statLookup', () => {
      state.stats = [{ stat_id: '105000026', stat_name: 'Firearm ATK' }];
      state.buildStatLookup();
      expect(state.getStatName('105000026')).toBe('Firearm ATK');
    });
  });
});
