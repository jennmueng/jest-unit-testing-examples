import add from './simple';
import { describe, test, expect } from '@jest/globals';

describe('add function', () => {
  test('should correctly add two numbers', () => {
    // Arrange
    const a = 1;
    const b = 2;
    const expectedResult = 3;

    // Act
    const result = add(a, b);

    // Assert
    expect(result).toBe(expectedResult);
  });
}); 