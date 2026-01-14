import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatDateValue,
  isIsoDateString,
} from '@/lib/utils/format-date';

describe('format-date utility', () => {
  describe('isIsoDateString', () => {
    it('returns true for ISO date string with time', () => {
      expect(isIsoDateString('2026-01-11T15:30:00.000000Z')).toBe(true);
    });

    it('returns true for ISO date string without time', () => {
      expect(isIsoDateString('2026-01-11')).toBe(true);
    });

    it('returns false for non-date string', () => {
      expect(isIsoDateString('hello world')).toBe(false);
    });

    it('returns false for non-string values', () => {
      expect(isIsoDateString(123)).toBe(false);
      expect(isIsoDateString(null)).toBe(false);
      expect(isIsoDateString(undefined)).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('formats Date object to human-readable date', () => {
      const date = new Date('2026-01-11T00:00:00Z');
      const result = formatDate(date);
      expect(result).toContain('Jan');
      expect(result).toContain('11');
      expect(result).toContain('2026');
    });

    it('formats ISO string to human-readable date', () => {
      const result = formatDate('2026-01-11');
      expect(result).toContain('Jan');
      expect(result).toContain('11');
      expect(result).toContain('2026');
    });

    it('returns null for null input', () => {
      expect(formatDate(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(formatDate(undefined)).toBeNull();
    });
  });

  describe('formatDateTime', () => {
    it('formats Date object to human-readable datetime', () => {
      const date = new Date('2026-01-11T15:30:00Z');
      const result = formatDateTime(date);
      expect(result).toContain('Jan');
      expect(result).toContain('11');
      expect(result).toContain('2026');
    });

    it('formats ISO string to human-readable datetime', () => {
      const result = formatDateTime('2026-01-11T15:30:00.000000Z');
      expect(result).toContain('Jan');
      expect(result).toContain('11');
      expect(result).toContain('2026');
    });

    it('returns null for null input', () => {
      expect(formatDateTime(null)).toBeNull();
    });
  });

  describe('formatDateValue', () => {
    it('formats ISO date string automatically', () => {
      const result = formatDateValue('2026-01-11T15:30:00.000000Z');
      expect(result).toContain('Jan');
      expect(result).toContain('11');
      expect(result).toContain('2026');
    });

    it('returns dash for null input', () => {
      expect(formatDateValue(null)).toBe('-');
    });

    it('returns dash for undefined input', () => {
      expect(formatDateValue(undefined)).toBe('-');
    });

    it('converts boolean to string', () => {
      expect(formatDateValue(true)).toBe('true');
      expect(formatDateValue(false)).toBe('false');
    });

    it('converts non-date string to string', () => {
      expect(formatDateValue('hello world')).toBe('hello world');
    });

    it('converts number to string', () => {
      expect(formatDateValue(123)).toBe('123');
    });

    it('converts object to JSON string', () => {
      const result = formatDateValue({ key: 'value' });
      expect(result).toBe('{"key":"value"}');
    });
  });
});
