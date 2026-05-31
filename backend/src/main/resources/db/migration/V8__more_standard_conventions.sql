DO $$
DECLARE
  seed_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN

  -- ── 1. Gerber ────────────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000009',
    seed_user_id,
    'Gerber',
    '4♣ over NT asking for aces. Responses: 4♦=0/4, 4♥=1, 4♠=2, 4NT=3. A follow-up 5♣ asks for kings.',
    '[]'::jsonb,
    $jd1${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00c9-000000000001","bids":["4♦"],"meaning":"0 or 4 aces","children":[]},{"id":"node-00000000-0000-0000-00c9-000000000002","bids":["4♥"],"meaning":"1 ace","children":[]},{"id":"node-00000000-0000-0000-00c9-000000000003","bids":["4♠"],"meaning":"2 aces","children":[]},{"id":"node-00000000-0000-0000-00c9-000000000004","bids":["4NT"],"meaning":"3 aces","children":[{"id":"node-00000000-0000-0000-00c9-000000000005","bids":["5♣"],"meaning":"Asks for kings","children":[{"id":"node-00000000-0000-0000-00c9-000000000006","bids":["5♦"],"meaning":"0 or 4 kings","children":[]},{"id":"node-00000000-0000-0000-00c9-000000000007","bids":["5♥"],"meaning":"1 king","children":[]},{"id":"node-00000000-0000-0000-00c9-000000000008","bids":["5♠"],"meaning":"2 kings","children":[]},{"id":"node-00000000-0000-0000-00c9-000000000009","bids":["5NT"],"meaning":"3 kings","children":[]}]}]}]}$jd1$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 2. Puppet Stayman ────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-00000000000a',
    seed_user_id,
    'Puppet Stayman',
    '3♣ over 2NT, asking opener to bid a 5-card major first, then locating a 4-card major fit. Avoids the problem of opener rebidding a 4-card major and becoming declarer.',
    '[]'::jsonb,
    $jd2${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00ca-000000000001","bids":["3♦"],"meaning":"No 5-card major","children":[{"id":"node-00000000-0000-0000-00ca-000000000002","bids":["3♥"],"meaning":"Responder has 4 spades — opener bids 3♠ with 4 spades or 3NT without","children":[]},{"id":"node-00000000-0000-0000-00ca-000000000003","bids":["3♠"],"meaning":"Responder has 4 hearts — opener bids 4♥ with 4 hearts or 3NT without","children":[]},{"id":"node-00000000-0000-0000-00ca-000000000004","bids":["3NT"],"meaning":"No 4-card major fit — to play","children":[]}]},{"id":"node-00000000-0000-0000-00ca-000000000005","bids":["3♥"],"meaning":"5+ hearts","children":[{"id":"node-00000000-0000-0000-00ca-000000000006","bids":["4♥"],"meaning":"Accepts — heart fit confirmed","children":[]},{"id":"node-00000000-0000-0000-00ca-000000000007","bids":["3NT"],"meaning":"Only doubleton hearts — prefers NT","children":[]}]},{"id":"node-00000000-0000-0000-00ca-000000000008","bids":["3♠"],"meaning":"5+ spades","children":[{"id":"node-00000000-0000-0000-00ca-000000000009","bids":["4♠"],"meaning":"Accepts — spade fit confirmed","children":[]},{"id":"node-00000000-0000-0000-00ca-00000000000a","bids":["3NT"],"meaning":"Only doubleton spades — prefers NT","children":[]}]}]}$jd2$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 3. Jacoby 2NT ────────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-00000000000b',
    seed_user_id,
    'Jacoby 2NT',
    '2NT game-forcing raise of opener''s major (4+ trumps). Opener''s rebids describe shape: shortness (3-level) or extra suit (4-level). 4 of the major = minimum no-shortness.',
    '[]'::jsonb,
    $jd3${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00cb-000000000001","bids":["3♣"],"meaning":"Void or singleton in clubs","children":[]},{"id":"node-00000000-0000-0000-00cb-000000000002","bids":["3♦"],"meaning":"Void or singleton in diamonds","children":[]},{"id":"node-00000000-0000-0000-00cb-000000000003","bids":["3om"],"meaning":"Void or singleton in the other major","children":[]},{"id":"node-00000000-0000-0000-00cb-000000000004","bids":["3NT"],"meaning":"No shortness, strong hand (slam interest)","children":[]},{"id":"node-00000000-0000-0000-00cb-000000000005","bids":["4♣"],"meaning":"Second suit — 5+ clubs","children":[]},{"id":"node-00000000-0000-0000-00cb-000000000006","bids":["4♦"],"meaning":"Second suit — 5+ diamonds","children":[]},{"id":"node-00000000-0000-0000-00cb-000000000007","bids":["4om"],"meaning":"Second suit — 5+ cards in the other major","children":[]},{"id":"node-00000000-0000-0000-00cb-000000000008","bids":["4ma"],"meaning":"Minimum hand, no shortness — sign-off","children":[]}]}$jd3$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 4. Splinter Bids ─────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-00000000000c',
    seed_user_id,
    'Splinter Bids',
    'A double-jump to show a singleton or void in the bid suit, with 4+ trump support and game-forcing values. Partner evaluates by wasted honours in the short suit.',
    '[]'::jsonb,
    $jd4${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00cc-000000000001","bids":["4ma"],"meaning":"Sign-off — no slam interest despite splinter","children":[]},{"id":"node-00000000-0000-0000-00cc-000000000002","bids":["4NT"],"meaning":"RKCB — slam interest, asking for key cards","children":[{"id":"node-00000000-0000-0000-00cc-000000000003","bids":["5♣"],"meaning":"1 or 4 key cards (1430)","notes":"Key cards = 4 aces + king of agreed trump suit","children":[]},{"id":"node-00000000-0000-0000-00cc-000000000004","bids":["5♦"],"meaning":"0 or 3 key cards (1430)","children":[]},{"id":"node-00000000-0000-0000-00cc-000000000005","bids":["5♥"],"meaning":"2 key cards, no queen of trumps","children":[]},{"id":"node-00000000-0000-0000-00cc-000000000006","bids":["5♠"],"meaning":"2 key cards + queen of trumps","children":[]}]},{"id":"node-00000000-0000-0000-00cc-000000000007","bids":["5ma"],"meaning":"Mild slam try — good trumps but declining to use RKCB","children":[]}]}$jd4$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 5. Drury ─────────────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-00000000000d',
    seed_user_id,
    'Drury',
    '2♣ by a passed hand over a 3rd/4th seat major opening, asking if opener is full value. Opener bids 2♦ (artificial, sub-minimum) or a natural bid (full value).',
    '[]'::jsonb,
    $jd5${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00cd-000000000001","bids":["2♦"],"meaning":"Artificial — sub-minimum opener (11-12 HCP range)","children":[{"id":"node-00000000-0000-0000-00cd-000000000002","bids":["2ma"],"meaning":"Sign-off — to play opener's major","children":[]}]},{"id":"node-00000000-0000-0000-00cd-000000000003","bids":["2ma"],"meaning":"Full value — opener rebids the major","children":[{"id":"node-00000000-0000-0000-00cd-000000000004","bids":["3ma"],"meaning":"Invitational — responder shows game interest","children":[]},{"id":"node-00000000-0000-0000-00cd-000000000005","bids":["4ma"],"meaning":"Game — to play","children":[]}]},{"id":"node-00000000-0000-0000-00cd-000000000006","bids":["2NT"],"meaning":"Full value — strong balanced hand","children":[]},{"id":"node-00000000-0000-0000-00cd-000000000007","bids":["3♣"],"meaning":"Full value — good club suit","children":[]},{"id":"node-00000000-0000-0000-00cd-000000000008","bids":["3♦"],"meaning":"Full value — good diamond suit","children":[]}]}$jd5$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 6. New Minor Forcing ─────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-00000000000e',
    seed_user_id,
    'New Minor Forcing',
    'After 1m–1M–1NT, a bid of an unbid minor (2♣ or 2♦) is artificial and forcing, asking opener to clarify shape: 3-card major support, 4-card second suit, or NT.',
    '[]'::jsonb,
    $jd6${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00ce-000000000001","bids":["2ma"],"meaning":"3-card support for responder's major, minimum (12-14 HCP)","children":[]},{"id":"node-00000000-0000-0000-00ce-000000000002","bids":["3ma"],"meaning":"3-card support for responder's major, maximum (15-17 HCP)","children":[]},{"id":"node-00000000-0000-0000-00ce-000000000003","bids":["2NT"],"meaning":"Balanced, no 3-card major support, minimum","children":[]},{"id":"node-00000000-0000-0000-00ce-000000000004","bids":["3NT"],"meaning":"Balanced, maximum","children":[]},{"id":"node-00000000-0000-0000-00ce-000000000005","bids":["2om"],"meaning":"4-card other major — reverse values","children":[]},{"id":"node-00000000-0000-0000-00ce-000000000006","bids":["3♣"],"meaning":"5+ clubs rebid, minimum","children":[]},{"id":"node-00000000-0000-0000-00ce-000000000007","bids":["3♦"],"meaning":"5+ diamonds rebid, minimum","children":[]}]}$jd6$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 7. Fourth Suit Forcing ───────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-00000000000f',
    seed_user_id,
    'Fourth Suit Forcing',
    'Bidding the fourth suit artificially to create a game force when no natural bid fits. Asks opener to show: a stopper in the 4th suit (NT), 3-card major support, or extra shape.',
    '[]'::jsonb,
    $jd7${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00cf-000000000001","bids":["2NT"],"meaning":"Stopper in 4th suit, minimum","children":[]},{"id":"node-00000000-0000-0000-00cf-000000000002","bids":["3NT"],"meaning":"Stopper in 4th suit, maximum","children":[]},{"id":"node-00000000-0000-0000-00cf-000000000003","bids":["2ma"],"meaning":"3-card support for responder's major","children":[]},{"id":"node-00000000-0000-0000-00cf-000000000004","bids":["3♣"],"meaning":"6+ clubs — extra length","children":[]},{"id":"node-00000000-0000-0000-00cf-000000000005","bids":["3♦"],"meaning":"6+ diamonds or 5-5 shape","children":[]},{"id":"node-00000000-0000-0000-00cf-000000000006","bids":["3♥"],"meaning":"5+ hearts — extra length","children":[]}]}$jd7$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 8. Lebensohl ─────────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000010',
    seed_user_id,
    'Lebensohl',
    '2NT after opponent overcalls partner''s 1NT, relaying to 3♣. Slow (via 2NT relay) shows no stopper; fast (direct bid) shows stopper. Allows differentiation of weak signoffs from game tries.',
    '[]'::jsonb,
    $jd8${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00d0-000000000001","bids":["3♣"],"meaning":"Forced relay — 1NT opener must bid 3♣","children":[{"id":"node-00000000-0000-0000-00d0-000000000002","bids":["3♦"],"meaning":"Weak — to play in diamonds","children":[]},{"id":"node-00000000-0000-0000-00d0-000000000003","bids":["3♥"],"meaning":"Weak to play or invitational via slow auction","children":[]},{"id":"node-00000000-0000-0000-00d0-000000000004","bids":["3♠"],"meaning":"Weak to play or invitational via slow auction","children":[]},{"id":"node-00000000-0000-0000-00d0-000000000005","bids":["3NT"],"meaning":"To play WITHOUT stopper in opponent's suit (slow = no stopper)","children":[]},{"id":"node-00000000-0000-0000-00d0-000000000006","bids":["4♥"],"meaning":"Game in hearts — no stopper (slow auction)","children":[]},{"id":"node-00000000-0000-0000-00d0-000000000007","bids":["4♠"],"meaning":"Game in spades — no stopper (slow auction)","children":[]}]}]}$jd8$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 9. Western Cue ───────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000011',
    seed_user_id,
    'Western Cue',
    'Cuebid of the opponent''s suit asking partner to bid NT if holding a stopper. Denies a stopper yourself; partner bids NT with one, otherwise bids their own suit.',
    '[]'::jsonb,
    $jd9${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00d1-000000000001","bids":["2NT"],"meaning":"Has stopper — minimum values","children":[]},{"id":"node-00000000-0000-0000-00d1-000000000002","bids":["3NT"],"meaning":"Has stopper — game values","children":[]},{"id":"node-00000000-0000-0000-00d1-000000000003","bids":["3♣"],"meaning":"No stopper — natural club suit","children":[]},{"id":"node-00000000-0000-0000-00d1-000000000004","bids":["3♦"],"meaning":"No stopper — natural diamond suit","children":[]},{"id":"node-00000000-0000-0000-00d1-000000000005","bids":["3♥"],"meaning":"No stopper — natural heart suit","children":[]},{"id":"node-00000000-0000-0000-00d1-000000000006","bids":["3♠"],"meaning":"No stopper — natural spade suit","children":[]}]}$jd9$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 10. Control Bids ─────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000012',
    seed_user_id,
    'Control Bids',
    'Cue bids showing first-round control (ace or void) in a suit during slam exploration after trump fit is agreed. Skipping a suit denies first-round control there.',
    '[]'::jsonb,
    $jd10${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00d2-000000000001","bids":["4♣"],"meaning":"First-round control in clubs (ace or void)","children":[]},{"id":"node-00000000-0000-0000-00d2-000000000002","bids":["4♦"],"meaning":"First-round control in diamonds (ace or void)","children":[]},{"id":"node-00000000-0000-0000-00d2-000000000003","bids":["4♥"],"meaning":"First-round control in hearts (ace or void)","children":[]},{"id":"node-00000000-0000-0000-00d2-000000000004","bids":["4♠"],"meaning":"First-round control in spades (ace or void)","children":[]},{"id":"node-00000000-0000-0000-00d2-000000000005","bids":["4NT"],"meaning":"RKCB — all key controls shown, asking for key cards","children":[]}]}$jd10$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 11. Bergen Raises ────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000013',
    seed_user_id,
    'Bergen Raises',
    '3♣ and 3♦ responses to a major opening showing 4-card support. Versions vary: common is 3♣=constructive (7-9 HCP) and 3♦=limit raise (10-12 HCP).',
    '[]'::jsonb,
    $jd11${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00d3-000000000001","bids":["3♣"],"meaning":"Constructive raise — 7-9 HCP, 4+ trumps","children":[{"id":"node-00000000-0000-0000-00d3-000000000002","bids":["3♦"],"meaning":"Reject — opener is below minimum","children":[]},{"id":"node-00000000-0000-0000-00d3-000000000003","bids":["3ma"],"meaning":"Accept invite — bid opener's major","children":[]},{"id":"node-00000000-0000-0000-00d3-000000000004","bids":["4ma"],"meaning":"Game — strong opener","children":[]}]},{"id":"node-00000000-0000-0000-00d3-000000000005","bids":["3♦"],"meaning":"Limit raise — 10-12 HCP, 4+ trumps","children":[{"id":"node-00000000-0000-0000-00d3-000000000006","bids":["3ma"],"meaning":"Reject — minimum opener","children":[]},{"id":"node-00000000-0000-0000-00d3-000000000007","bids":["4ma"],"meaning":"Accept — game","children":[]}]}]}$jd11$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 12. Inverted Minors ──────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000014',
    seed_user_id,
    'Inverted Minors',
    'Over 1♣ or 1♦: a single raise (2m) shows 10+ HCP (strong, forcing one round); a jump raise (3m) is weak and preemptive (0-8 HCP). Inverts the traditional meaning.',
    '[]'::jsonb,
    $jd12${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00d4-000000000001","bids":["2♣"],"meaning":"Strong raise — 10+ HCP, forcing one round (mirrors 2♦ over 1♦)","children":[{"id":"node-00000000-0000-0000-00d4-000000000002","bids":["2NT"],"meaning":"NT minimum — balanced no second suit","children":[]},{"id":"node-00000000-0000-0000-00d4-000000000003","bids":["2♥"],"meaning":"4+ hearts — natural second suit","children":[]},{"id":"node-00000000-0000-0000-00d4-000000000004","bids":["2♠"],"meaning":"4+ spades — natural second suit","children":[]},{"id":"node-00000000-0000-0000-00d4-000000000005","bids":["3♣"],"meaning":"6+ clubs, minimum — extra length","children":[]},{"id":"node-00000000-0000-0000-00d4-000000000006","bids":["3NT"],"meaning":"Balanced maximum","children":[]}]},{"id":"node-00000000-0000-0000-00d4-000000000007","bids":["3♣"],"meaning":"Weak preemptive raise — 0-8 HCP, 5+ clubs; opener typically passes or bids game","children":[]}]}$jd12$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 13. Flannery 2♦ ─────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000015',
    seed_user_id,
    'Flannery 2♦',
    '2♦ opening showing exactly 4 spades and 5 hearts, 11-15 HCP. Responder can place the contract or ask for more information.',
    '[]'::jsonb,
    $jd13${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00d5-000000000001","bids":["2♥"],"meaning":"To play — prefers hearts","children":[]},{"id":"node-00000000-0000-0000-00d5-000000000002","bids":["2♠"],"meaning":"To play — prefers spades","children":[]},{"id":"node-00000000-0000-0000-00d5-000000000003","bids":["2NT"],"meaning":"Asks for distribution","children":[{"id":"node-00000000-0000-0000-00d5-000000000004","bids":["3♣"],"meaning":"3-2-5-3 distribution, minimum","children":[]},{"id":"node-00000000-0000-0000-00d5-000000000005","bids":["3♦"],"meaning":"2-3-5-3 distribution, minimum","children":[]},{"id":"node-00000000-0000-0000-00d5-000000000006","bids":["3♥"],"meaning":"3-3-5-2 or 3-2-5-3 distribution, maximum","children":[]},{"id":"node-00000000-0000-0000-00d5-000000000007","bids":["3♠"],"meaning":"4-4 minors possible, maximum","children":[]}]},{"id":"node-00000000-0000-0000-00d5-000000000008","bids":["3NT"],"meaning":"To play from responder's side","children":[]},{"id":"node-00000000-0000-0000-00d5-000000000009","bids":["4♥"],"meaning":"To play in hearts","children":[]},{"id":"node-00000000-0000-0000-00d5-00000000000a","bids":["4♠"],"meaning":"To play in spades","children":[]}]}$jd13$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 14. Landy ────────────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000016',
    seed_user_id,
    'Landy',
    '2♣ overcall of opponent''s 1NT, showing at least 4-4 in both majors. Partner bids their preferred major or uses 2♦ to ask for the longer major.',
    '[]'::jsonb,
    $jd14${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00d6-000000000001","bids":["2♦"],"meaning":"Asks for the longer major","children":[{"id":"node-00000000-0000-0000-00d6-000000000002","bids":["2♥"],"meaning":"Hearts longer or equal","children":[]},{"id":"node-00000000-0000-0000-00d6-000000000003","bids":["2♠"],"meaning":"Spades longer","children":[]}]},{"id":"node-00000000-0000-0000-00d6-000000000004","bids":["2♥"],"meaning":"Choosing hearts — to play","children":[]},{"id":"node-00000000-0000-0000-00d6-000000000005","bids":["2♠"],"meaning":"Choosing spades — to play","children":[]},{"id":"node-00000000-0000-0000-00d6-000000000006","bids":["2NT"],"meaning":"Strong invitational — asks for more information","children":[]},{"id":"node-00000000-0000-0000-00d6-000000000007","bids":["3♥"],"meaning":"Invitational raise of hearts","children":[]},{"id":"node-00000000-0000-0000-00d6-000000000008","bids":["3♠"],"meaning":"Invitational raise of spades","children":[]}]}$jd14$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 15. Cappelletti (Hamilton) ───────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000017',
    seed_user_id,
    'Cappelletti',
    'Overcall convention over opponent''s 1NT: 2♣=one-suited hand (any), 2♦=both majors 5-5, 2♥=hearts+minor, 2♠=spades+minor, 2NT=both minors.',
    '[]'::jsonb,
    $jd15${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00d7-000000000001","bids":["2♣"],"meaning":"One-suited hand — any single suit","children":[{"id":"node-00000000-0000-0000-00d7-000000000002","bids":["2♦"],"meaning":"Relay — show your suit","children":[{"id":"node-00000000-0000-0000-00d7-000000000003","bids":["2♥"],"meaning":"Hearts","children":[]},{"id":"node-00000000-0000-0000-00d7-000000000004","bids":["2♠"],"meaning":"Spades","children":[]},{"id":"node-00000000-0000-0000-00d7-000000000005","bids":["3♣"],"meaning":"Clubs","children":[]},{"id":"node-00000000-0000-0000-00d7-000000000006","bids":["3♦"],"meaning":"Diamonds","children":[]}]}]},{"id":"node-00000000-0000-0000-00d7-000000000007","bids":["2♦"],"meaning":"Both majors — 5-5","children":[{"id":"node-00000000-0000-0000-00d7-000000000008","bids":["2♥"],"meaning":"Choosing hearts","children":[]},{"id":"node-00000000-0000-0000-00d7-000000000009","bids":["2♠"],"meaning":"Choosing spades","children":[]}]},{"id":"node-00000000-0000-0000-00d7-00000000000a","bids":["2♥"],"meaning":"Hearts + unspecified minor","children":[{"id":"node-00000000-0000-0000-00d7-00000000000b","bids":["2♠"],"meaning":"Asks for the minor","children":[{"id":"node-00000000-0000-0000-00d7-00000000000c","bids":["3♣"],"meaning":"Clubs","children":[]},{"id":"node-00000000-0000-0000-00d7-00000000000d","bids":["3♦"],"meaning":"Diamonds","children":[]}]}]},{"id":"node-00000000-0000-0000-00d7-00000000000e","bids":["2♠"],"meaning":"Spades + unspecified minor","children":[{"id":"node-00000000-0000-0000-00d7-00000000000f","bids":["2NT"],"meaning":"Asks for the minor","children":[{"id":"node-00000000-0000-0000-00d7-000000000010","bids":["3♣"],"meaning":"Clubs","children":[]},{"id":"node-00000000-0000-0000-00d7-000000000011","bids":["3♦"],"meaning":"Diamonds","children":[]}]}]},{"id":"node-00000000-0000-0000-00d7-000000000012","bids":["2NT"],"meaning":"Both minors","children":[{"id":"node-00000000-0000-0000-00d7-000000000013","bids":["3♣"],"meaning":"Choosing clubs","children":[]},{"id":"node-00000000-0000-0000-00d7-000000000014","bids":["3♦"],"meaning":"Choosing diamonds","children":[]}]}]}$jd15$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 16. Forcing 1NT ──────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000018',
    seed_user_id,
    'Forcing 1NT',
    '1NT response to a major opening is forcing for one round (opener may not pass). Used in 2/1 Game Force — allows exploration while keeping options open.',
    '[]'::jsonb,
    $jd16${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00d8-000000000001","bids":["2♣"],"meaning":"Minimum — 4+ clubs or catch-all (12-14 HCP)","children":[]},{"id":"node-00000000-0000-0000-00d8-000000000002","bids":["2♦"],"meaning":"Minimum — 4+ diamonds","children":[]},{"id":"node-00000000-0000-0000-00d8-000000000003","bids":["2ma"],"meaning":"Minimum — 6+ cards in the major, simple rebid","children":[]},{"id":"node-00000000-0000-0000-00d8-000000000004","bids":["2om"],"meaning":"Strong reverse — 17+ HCP, 4+ cards in the other major","children":[]},{"id":"node-00000000-0000-0000-00d8-000000000005","bids":["2NT"],"meaning":"18-19 HCP balanced","children":[]},{"id":"node-00000000-0000-0000-00d8-000000000006","bids":["3♣"],"meaning":"5-5 shape with clubs","children":[]},{"id":"node-00000000-0000-0000-00d8-000000000007","bids":["3♦"],"meaning":"5-5 shape with diamonds","children":[]},{"id":"node-00000000-0000-0000-00d8-000000000008","bids":["3ma"],"meaning":"6+ strong major suit — invitational","children":[]}]}$jd16$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 17. Smolen ───────────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000019',
    seed_user_id,
    'Smolen',
    'After 1NT–2♣–2♦ (Stayman, no major), responder bids 3♥ to show 5 spades (transferring to spades) or 3♠ to show 5 hearts. Keeps NT on the strong side.',
    '[]'::jsonb,
    $jd17${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00d9-000000000001","bids":["3♥"],"meaning":"5+ spades, game-forcing (transfer to spades)","children":[{"id":"node-00000000-0000-0000-00d9-000000000002","bids":["3♠"],"meaning":"Opener bids spades — completes transfer (3+ spades)","children":[]},{"id":"node-00000000-0000-0000-00d9-000000000003","bids":["3NT"],"meaning":"No spade fit — only 2 spades, to play NT","children":[]}]},{"id":"node-00000000-0000-0000-00d9-000000000004","bids":["3♠"],"meaning":"5+ hearts, game-forcing (transfer to hearts)","children":[{"id":"node-00000000-0000-0000-00d9-000000000005","bids":["4♥"],"meaning":"Opener bids hearts — completes transfer (3+ hearts)","children":[]},{"id":"node-00000000-0000-0000-00d9-000000000006","bids":["3NT"],"meaning":"No heart fit — only 2 hearts, to play NT","children":[]}]}]}$jd17$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 18. Checkback Stayman ────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-00000000001a',
    seed_user_id,
    'Checkback Stayman',
    '2♣ by responder after opener''s 1NT rebid (1x–1M–1NT), asking opener to show 3-card major support or a 4-card major. Also called XYZ or 2-way Checkback.',
    '[]'::jsonb,
    $jd18${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00da-000000000001","bids":["2♦"],"meaning":"Forced relay — opener must bid 2♦","children":[{"id":"node-00000000-0000-0000-00da-000000000002","bids":["2ma"],"meaning":"3-card support for responder's major","children":[]},{"id":"node-00000000-0000-0000-00da-000000000003","bids":["2om"],"meaning":"4 cards in the other major","children":[]},{"id":"node-00000000-0000-0000-00da-000000000004","bids":["2NT"],"meaning":"Minimum balanced — no fit found","children":[]},{"id":"node-00000000-0000-0000-00da-000000000005","bids":["3NT"],"meaning":"Maximum balanced — no fit found","children":[]}]}]}$jd18$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 19. Gambling 3NT ─────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-00000000001b',
    seed_user_id,
    'Gambling 3NT',
    '3NT opening showing a solid 7-card minor suit (AKQxxxx) with little outside strength. Partner passes or corrects to 4♣ (pass or correct to opener''s minor).',
    '[]'::jsonb,
    $jd19${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00db-000000000001","bids":["4♣"],"meaning":"Artificial relay — pass or correct to opener's minor","children":[{"id":"node-00000000-0000-0000-00db-000000000002","bids":["4♦"],"meaning":"Opener corrects — diamonds is the long suit (partner passes with clubs)","children":[]}]},{"id":"node-00000000-0000-0000-00db-000000000003","bids":["4♥"],"meaning":"Natural game — to play","children":[]},{"id":"node-00000000-0000-0000-00db-000000000004","bids":["4♠"],"meaning":"Natural game — to play","children":[]},{"id":"node-00000000-0000-0000-00db-000000000005","bids":["5♣"],"meaning":"Hopes opener has clubs — willing to play 5m","children":[]},{"id":"node-00000000-0000-0000-00db-000000000006","bids":["5♦"],"meaning":"Hopes opener has diamonds — willing to play 5m","children":[]}]}$jd19$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 20. Kokish Relay ─────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-00000000001c',
    seed_user_id,
    'Kokish Relay',
    'After 2♣–2♦, a 2♥ rebid by opener is an artificial relay: either a real 5+ heart suit (game force) or a balanced 25+ HCP hand. Responder bids 2♠ to relay; opener then clarifies.',
    '[]'::jsonb,
    $jd20${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00dc-000000000001","bids":["2♠"],"meaning":"Forced relay — asks opener to clarify","children":[{"id":"node-00000000-0000-0000-00dc-000000000002","bids":["2NT"],"meaning":"Balanced 25-27 HCP — relay was the balanced hand type","children":[]},{"id":"node-00000000-0000-0000-00dc-000000000003","bids":["3♣"],"meaning":"5+ clubs — natural game force","children":[]},{"id":"node-00000000-0000-0000-00dc-000000000004","bids":["3♦"],"meaning":"5+ diamonds — natural game force","children":[]},{"id":"node-00000000-0000-0000-00dc-000000000005","bids":["3♥"],"meaning":"5+ hearts (real hearts, not balanced) — game force","children":[]},{"id":"node-00000000-0000-0000-00dc-000000000006","bids":["3♠"],"meaning":"5+ spades — natural game force","children":[]}]},{"id":"node-00000000-0000-0000-00dc-000000000007","bids":["2NT"],"meaning":"To play — responder declines relay, very weak hand","children":[]}]}$jd20$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

END $$;
