/**
 * Character-based LCS (Longest Common Subsequence) comparison algorithm
 * Works for both English and Chinese text without relying on word boundaries
 */

export interface CharacterComparison {
  original: string;
  status: 'correct' | 'wrong' | 'missing';
  userChar: string | null;
}

/**
 * Build LCS table using dynamic programming
 */
function buildLCSTable(source: string[], user: string[]): number[][] {
  const m = source.length;
  const n = user.length;
  const table: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (source[i - 1] === user[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1;
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
  }

  return table;
}

/**
 * Backtrack through LCS table to find the alignment
 */
function backtrackLCS(
  source: string[],
  user: string[],
  table: number[][],
  i: number,
  j: number
): CharacterComparison[] {
  if (i === 0 && j === 0) {
    return [];
  }

  if (i === 0) {
    // All remaining user characters are extra (we ignore these)
    return backtrackLCS(source, user, table, i, j - 1);
  }

  if (j === 0) {
    // All remaining source characters are missing
    const rest = backtrackLCS(source, user, table, i - 1, j);
    return [...rest, { original: source[i - 1], status: 'missing', userChar: null }];
  }

  if (source[i - 1] === user[j - 1]) {
    // Characters match - correct
    const rest = backtrackLCS(source, user, table, i - 1, j - 1);
    return [...rest, { original: source[i - 1], status: 'correct', userChar: user[j - 1] }];
  }

  // Choose path with higher LCS value
  if (table[i - 1][j] > table[i][j - 1]) {
    // Move up - source character is missing
    const rest = backtrackLCS(source, user, table, i - 1, j);
    return [...rest, { original: source[i - 1], status: 'missing', userChar: null }];
  } else if (table[i - 1][j] < table[i][j - 1]) {
    // Move left - user has extra character (ignore it)
    return backtrackLCS(source, user, table, i, j - 1);
  } else {
    // Equal - prefer treating as wrong (substitution)
    const rest = backtrackLCS(source, user, table, i - 1, j - 1);
    return [...rest, { original: source[i - 1], status: 'wrong', userChar: user[j - 1] }];
  }
}

/**
 * Compare two texts character by character using LCS algorithm
 * @param sourceText - The correct reference text
 * @param userText - The user's input text
 * @returns Array of character comparisons
 */
export function compareTexts(sourceText: string, userText: string): CharacterComparison[] {
  // Convert strings to character arrays
  const sourceChars = Array.from(sourceText);
  const userChars = Array.from(userText);

  // Build LCS table
  const table = buildLCSTable(sourceChars, userChars);

  // Backtrack to get alignment
  const result = backtrackLCS(sourceChars, userChars, table, sourceChars.length, userChars.length);

  return result;
}

/**
 * Calculate accuracy statistics from comparison result
 */
export function calculateStats(comparison: CharacterComparison[]) {
  const total = comparison.length;
  const correct = comparison.filter(c => c.status === 'correct').length;
  const wrong = comparison.filter(c => c.status === 'wrong').length;
  const missing = comparison.filter(c => c.status === 'missing').length;
  const accuracy = total > 0 ? ((correct / total) * 100).toFixed(1) : '0';

  return {
    total,
    correct,
    wrong,
    missing,
    accuracy
  };
}
