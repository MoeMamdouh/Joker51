import { formatNumber } from '../formatNumber';

describe('formatNumber', () => {
  describe('English locale', () => {
    it('returns "0" for 0', () => expect(formatNumber(0, 'en')).toBe('0'));
    it('returns "42" for 42', () => expect(formatNumber(42, 'en')).toBe('42'));
    it('returns "100" for 100', () => expect(formatNumber(100, 'en')).toBe('100'));
    it('returns "999" for 999', () => expect(formatNumber(999, 'en')).toBe('999'));
  });

  describe('Arabic locale — Eastern Arabic numerals', () => {
    it('returns "٠" for 0', () => expect(formatNumber(0, 'ar')).toBe('٠'));
    it('returns "٤٢" for 42', () => expect(formatNumber(42, 'ar')).toBe('٤٢'));
    it('returns "١٠٠" for 100', () => expect(formatNumber(100, 'ar')).toBe('١٠٠'));
    it('returns "٩٩٩" for 999', () => expect(formatNumber(999, 'ar')).toBe('٩٩٩'));
    it('returns all ten digits correctly for 1234567890', () => {
      expect(formatNumber(1234567890, 'ar')).toBe('١٢٣٤٥٦٧٨٩٠');
    });
  });
});
