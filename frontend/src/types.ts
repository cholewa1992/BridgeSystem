export interface BidNode {
  id: string;
  /**
   * One or more equivalent calls sharing this node's meaning and continuations.
   * Length 0 only for the synthetic root sentinel. Length ≥ 1 otherwise.
   * Groups conventionally share a level (e.g. ["1♥","1♠"]).
   * X and XX are always single-call (length 1) and never grouped.
   */
  bids: string[];
  meaning: string;
  notes?: string;
  byOpponent?: boolean;
  children: BidNode[];
}

export interface BidTreeRoot {
  children: BidNode[];
}

export interface SystemSummary {
  id: string;
  name: string;
  description: string | null;
  ownerUsername: string;
  ownedByMe: boolean;
  permission: 'OWNER' | 'READ' | 'WRITE' | 'NONE';
  updatedAt: string;
}

export interface SystemDetail extends SystemSummary {
  tree: BidTreeRoot;
  createdAt: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
}

export interface Share {
  username: string;
  displayName: string;
  permission: 'READ' | 'WRITE';
  createdAt: string;
}
