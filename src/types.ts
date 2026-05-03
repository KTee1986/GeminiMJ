/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Position = 'East' | 'South' | 'West' | 'North';
export const POSITIONS: Position[] = ['East', 'South', 'West', 'North'];

export type ScoreMode = 'CHIPS' | 'MANUAL' | 'DELTA';

export interface Player {
  name: string;
  email: string;
  group?: string;
}

export interface AccountingRecord {
  gameId: string;
  timestamp: string;
  group: string;
  amount: number;
  user?: string;
  comment?: string;
}

export interface TransferRecord {
  transferId: string;
  timestamp: string;
  fromGroup: string;
  toGroup: string;
  amount: number;
}

export interface GroupBalance {
  group: string;
  balance: number;
}

export interface PlayerStatsDetailed {
  name: string;
  games: number;
  totalScore: number;
  wins: number;
  highest: number;
  lowest: number;
  partnerScores: Record<string, { total: number; count: number }>;
  monthlyScores: Record<string, { total: number; count: number }>;
  inGamesStats: { totalFieldScore: number; count: number };
}

export interface GameRecord {
  gameId: string;
  timestamp: string;
  east: { player: string; score: string };
  south: { player: string; score: string };
  west: { player: string; score: string };
  north: { player: string; score: string };
}

export interface Chips {
  red: number;
  blue: number;
  green: number;
  white: number;
}

export interface PositionState {
  players: string[];
  chips: Chips;
  mode: ScoreMode;
  manualScore: number;
  deltaChips: Chips;
}

export const CHIP_VALUES = {
  red: 20,
  blue: 10,
  green: 2,
  white: 0.4
};

export const DEFAULT_CHIPS: Chips = {
  red: 8,
  blue: 2,
  green: 9,
  white: 5
};

export const ZERO_CHIPS: Chips = {
  red: 0,
  blue: 0,
  green: 0,
  white: 0
};
