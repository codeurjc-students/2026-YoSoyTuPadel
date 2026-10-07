import { describe, expect, test } from 'vitest';
import { getWelcomeMessage } from './welcomeMessage.ts';

describe('getWelcomeMessage', () => {
  test('includes the user name when it is present', () => {
    expect(getWelcomeMessage('Victor')).toBe('¡Qué alegría verte, Victor!');
  });

  test('omits missing or blank names', () => {
    expect(getWelcomeMessage(null)).toBe('¡Qué alegría verte!');
    expect(getWelcomeMessage('  ')).toBe('¡Qué alegría verte!');
  });
});
