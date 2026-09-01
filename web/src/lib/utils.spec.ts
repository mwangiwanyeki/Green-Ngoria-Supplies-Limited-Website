import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDate,
  formatCurrency,
  formatNumber,
  getInitials,
  slugify,
  truncate,
  pluralise,
} from './utils';

describe('Frontend Utils', () => {
  it('merges classnames correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('formats dates safely', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('2026-08-30T12:00:00Z', 'yyyy-MM-dd')).toBe('2026-08-30');
  });

  it('formats currency safely', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(1500, 'USD')).toBe('$1,500.00');
  });

  it('formats numbers safely', () => {
    expect(formatNumber(null)).toBe('—');
    expect(formatNumber(12500)).toBe('12,500');
  });

  it('computes initials correctly', () => {
    expect(getInitials('Green Ngoria')).toBe('GN');
    expect(getInitials('John')).toBe('J');
  });

  it('slugifies titles into valid urls', () => {
    expect(slugify('Gold CIP/CIL Processing Plant 2026')).toBe('gold-cip-cil-processing-plant-2026');
  });

  it('truncates text with ellipsis', () => {
    expect(truncate('Hello world', 5)).toBe('Hello…');
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('pluralises terms accurately', () => {
    expect(pluralise(1, 'plant')).toBe('plant');
    expect(pluralise(2, 'plant')).toBe('plants');
    expect(pluralise(2, 'category', 'categories')).toBe('categories');
  });
});
