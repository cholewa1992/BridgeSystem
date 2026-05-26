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
  alerted?: boolean;
  /**
   * If set, this node's children are resolved from the matching ConventionDef
   * rather than from the stored `children` array (which will be `[]`).
   */
  conventionRef?: string;
  /**
   * Parameter values for the referenced convention, keyed by ConventionParam.name.
   * Used to substitute `{{paramName}}` placeholders in the convention's subtree.
   */
  conventionArgs?: Record<string, string>;
  children: BidNode[];
}

export interface BidTreeRoot {
  children: BidNode[];
}

/** A named, reusable subtree that can be attached to any node in the bid tree. */
export interface ConventionDef {
  id: string;
  name: string;
  description?: string;
  /**
   * Declared parameters. Their names are used as placeholders (`{{name}}`) in
   * the convention subtree's meaning / notes strings, substituted at render
   * time with values from the referencing node's `conventionArgs`.
   */
  parameters?: ConventionParam[];
  /**
   * The convention's subtree. Uses the same synthetic-root convention as
   * BidTreeRoot: `root.bids` is `[]` and `root.children` are the top-level
   * convention responses (e.g. 5♣/5♦/5♥/5♠ for RKCB 1430).
   */
  root: BidNode;
}

/** A substitution variable declared on a ConventionDef. */
export interface ConventionParam {
  /** Unique identifier for this parameter. */
  id: string;
  /** Short identifier used in `{{name}}` placeholders (no spaces). */
  name: string;
  description?: string;
  defaultValue?: string;
  /** 'suit' renders a ♣/♦/♥/♠ picker instead of a text input when linking. */
  type?: 'text' | 'suit';
  /** Human-readable label shown in the param-input form. */
  label?: string;
}

export interface BidSection {
  label: string;
  nodes: BidNode[];
}

export interface SystemSummary {
  id: string;
  name: string;
  description: string | null;
  ownerUsername: string;
  ownedByMe: boolean;
  permission: 'OWNER' | 'READ' | 'WRITE' | 'NONE';
  updatedAt: string;
  likeCount: number;
  forkCount: number;
  isPublic: boolean;
  likedByMe: boolean | null; // null = not logged in
}

export interface ConventionDetail {
  id: string;
  name: string;
  description?: string;
  parameters: ConventionParam[];
  root: BidNode;
  isPublic: boolean;
  ownerUsername: string;
  ownedByMe: boolean;
  permission: 'OWNER' | 'READ' | 'WRITE' | 'NONE';
  forkedFrom?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  forkCount: number;
  likedByMe: boolean | null;
}

export interface ConventionSummary {
  id: string;
  name: string;
  description?: string;
  paramCount: number;
  ownerUsername: string;
  ownedByMe: boolean;
  isPublic: boolean;
  updatedAt: string;
  likeCount: number;
  forkCount: number;
  likedByMe: boolean | null;
}

export interface SystemDetail extends SystemSummary {
  tree: BidTreeRoot;
  createdAt: string;
  forkedFrom?: { id: string; name: string; ownerUsername: string };
  conventions: ConventionDetail[];
}

export interface UserProfile {
  username: string;
  displayName: string;
  createdAt: string;
  publicSystemCount: number;
}

export interface LikeResponse {
  likeCount: number;
  likedByMe: boolean;
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
