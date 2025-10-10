/**
 * Character-level LCS (Longest Common Subsequence) comparison for bilingual text
 * Supports both English and Chinese text without word-level assumptions
 */

export interface CharDiff {
  original: string;
  status: 'correct' | 'wrong' | 'missing';
  userChar?: string;
}

/**
 * Builds LCS table using dynamic programming
 */
function buildLCSTable(source: string, user: string): number[][] {
  const m = source.length;
  const n = user.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

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
 * Backtrack through LCS table to find the actual LCS
 */
function getLCS(source: string, user: string, dp: number[][]): Set<string> {
  const lcs = new Set<string>();
  let i = source.length;
  let j = user.length;

  const lcsChars: Array<{ sourceIdx: number; userIdx: number }> = [];

  while (i > 0 && j > 0) {
    if (source[i - 1] === user[j - 1]) {
      lcsChars.unshift({ sourceIdx: i - 1, userIdx: j - 1 });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  lcsChars.forEach(({ sourceIdx, userIdx }) => {
    lcs.add(`${sourceIdx}:${userIdx}`);
  });

  return lcs;
}

/**
 * Performs character-level comparison using LCS algorithm
 */
export function compareTexts(sourceText: string, userText: string): CharDiff[] {
  // Build LCS table
  const dp = buildLCSTable(sourceText, userText);
  const lcs = getLCS(sourceText, userText, dp);

  const result: CharDiff[] = [];
  let userIdx = 0;

  for (let sourceIdx = 0; sourceIdx < sourceText.length; sourceIdx++) {
    // Check if this source character is in the LCS
    let foundInLCS = false;

    // Look for matching character in user text
    for (let tempUserIdx = userIdx; tempUserIdx < userText.length; tempUserIdx++) {
      if (lcs.has(`${sourceIdx}:${tempUserIdx}`) && sourceText[sourceIdx] === userText[tempUserIdx]) {
        foundInLCS = true;
        
        // Mark any skipped user characters as extra (we ignore extras in final output)
        userIdx = tempUserIdx + 1;
        result.push({
          original: sourceText[sourceIdx],
          status: 'correct',
          userChar: userText[tempUserIdx]
        });
        break;
      }
    }

    if (!foundInLCS) {
      // Check if user has a different character at current position
      if (userIdx < userText.length && !lcs.has(`${sourceIdx}:${userIdx}`)) {
        // This is a substitution (wrong character)
        result.push({
          original: sourceText[sourceIdx],
          status: 'wrong',
          userChar: userText[userIdx]
        });
        userIdx++;
      } else {
        // This character was missed entirely
        result.push({
          original: sourceText[sourceIdx],
          status: 'missing'
        });
      }
    }
  }

  return result;
}

/**
 * Calculate accuracy statistics from comparison results
 */
export function calculateStats(diffResult: CharDiff[]) {
  const total = diffResult.length;
  const correct = diffResult.filter(d => d.status === 'correct').length;
  const wrong = diffResult.filter(d => d.status === 'wrong').length;
  const missed = diffResult.filter(d => d.status === 'missing').length;
  const accuracy = total > 0 ? ((correct / total) * 100).toFixed(1) : '0.0';

  return {
    total,
    correct,
    wrong,
    missed,
    accuracy
  };
}
