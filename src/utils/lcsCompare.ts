/**
 * Character-level LCS (Longest Common Subsequence) comparison algorithm
 * Works for both English and Chinese text without word delimiters
 */

export interface CharacterComparison {
  original: string;
  status: 'correct' | 'missing';
  userChar: string | null;
}

export interface ComparisonResult {
  diffResult: CharacterComparison[];
  accuracy: string;
  total: number;
  correct: number;
  missed: number;
}

/**
 * Build LCS table using dynamic programming
 */
function buildLCSTable(source: string[], user: string[]): number[][] {
  const m = source.length;
  const n = user.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (source[i - 1] === user[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

/**
 * Backtrack through LCS table to find character-level differences
 */
function backtrackLCS(
  source: string[],
  user: string[],
  dp: number[][],
  i: number,
  j: number
): CharacterComparison[] {
  if (i === 0 && j === 0) {
    return [];
  }

  if (i === 0) {
    // Only user characters left (extra characters - ignore them)
    return backtrackLCS(source, user, dp, i, j - 1);
  }

  if (j === 0) {
    // Only source characters left (all missing)
    const result = backtrackLCS(source, user, dp, i - 1, j);
    result.push({
      original: source[i - 1],
      status: 'missing',
      userChar: null
    });
    return result;
  }

  if (source[i - 1] === user[j - 1]) {
    // Characters match - correct
    const result = backtrackLCS(source, user, dp, i - 1, j - 1);
    result.push({
      original: source[i - 1],
      status: 'correct',
      userChar: user[j - 1]
    });
    return result;
  }

  if (dp[i - 1][j] > dp[i][j - 1]) {
    // Source character not in LCS - missing
    const result = backtrackLCS(source, user, dp, i - 1, j);
    result.push({
      original: source[i - 1],
      status: 'missing',
      userChar: null
    });
    return result;
  } else {
    // User character not in LCS - extra (skip it, don't add to result)
    return backtrackLCS(source, user, dp, i, j - 1);
  }
}

/**
 * Compare source text with user input at character level using LCS algorithm
 */
export function compareTextLCS(sourceText: string, userText: string): ComparisonResult {
  // Convert to character arrays
  const sourceChars = Array.from(sourceText);
  const userChars = Array.from(userText);

  // Build LCS table
  const dp = buildLCSTable(sourceChars, userChars);

  // Backtrack to find differences
  const diffResult = backtrackLCS(sourceChars, userChars, dp, sourceChars.length, userChars.length);

  // Calculate statistics
  const correctCount = diffResult.filter(d => d.status === 'correct').length;
  const missedCount = diffResult.filter(d => d.status === 'missing').length;
  const accuracy = sourceChars.length > 0 
    ? ((correctCount / sourceChars.length) * 100).toFixed(1)
    : '0.0';

  return {
    diffResult,
    accuracy,
    total: sourceChars.length,
    correct: correctCount,
    missed: missedCount
  };
}
