DO $$
DECLARE
  seed_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN

  -- ── Remove the 3 seeded base systems ────────────────────────────────────────
  -- system_like and system_share have ON DELETE CASCADE on system_id,
  -- so all related rows are removed automatically.
  DELETE FROM bidding_system
  WHERE id IN (
    '00000000-0000-0000-0000-000000000002',  -- 2/1 Game Force
    '00000000-0000-0000-0000-000000000003',  -- Nordic Standard
    '00000000-0000-0000-0000-000000000004'   -- Junior IRG 5
  );

  -- ── 1. Stayman ───────────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000001',
    seed_user_id,
    'Stayman',
    '2♣ over a 1NT (or 2NT) opening, asking opener to bid a 4-card major. Used to find a 4-4 major-suit fit.',
    '[]'::jsonb,
    $jc1${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00c1-000000000001","bids":["2♦"],"meaning":"No 4-card major","children":[{"id":"node-00000000-0000-0000-00c1-000000000002","bids":["2NT"],"meaning":"Invitational (8-9 HCP)","children":[]},{"id":"node-00000000-0000-0000-00c1-000000000003","bids":["3NT"],"meaning":"To play (10+ HCP)","children":[]}]},{"id":"node-00000000-0000-0000-00c1-000000000004","bids":["2♥"],"meaning":"4+ hearts (may also hold 4 spades)","children":[{"id":"node-00000000-0000-0000-00c1-000000000005","bids":["2♠"],"meaning":"4+ spades; looking for 4-4 spade fit","children":[]},{"id":"node-00000000-0000-0000-00c1-000000000006","bids":["3♥"],"meaning":"Invitational raise (8-9 HCP, 4+ hearts)","children":[]},{"id":"node-00000000-0000-0000-00c1-000000000007","bids":["4♥"],"meaning":"Game (10+ HCP, 4+ hearts)","children":[]},{"id":"node-00000000-0000-0000-00c1-000000000008","bids":["3NT"],"meaning":"To play — no heart fit","children":[]}]},{"id":"node-00000000-0000-0000-00c1-000000000009","bids":["2♠"],"meaning":"4+ spades, denies 4 hearts","children":[{"id":"node-00000000-0000-0000-00c1-00000000000a","bids":["3♠"],"meaning":"Invitational raise (8-9 HCP, 4+ spades)","children":[]},{"id":"node-00000000-0000-0000-00c1-00000000000b","bids":["4♠"],"meaning":"Game (10+ HCP, 4+ spades)","children":[]},{"id":"node-00000000-0000-0000-00c1-00000000000c","bids":["3NT"],"meaning":"To play — no spade fit","children":[]}]}]}$jc1$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 2. Jacoby Transfers ──────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000002',
    seed_user_id,
    'Jacoby Transfers',
    '2♦ and 2♥ over 1NT, transferring to the next-higher major. Opener completes the transfer, then responder describes the hand further.',
    '[]'::jsonb,
    $jc2${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00c2-000000000001","bids":["2♦"],"meaning":"Transfer to hearts — promises 5+ hearts","children":[{"id":"node-00000000-0000-0000-00c2-000000000002","bids":["2♥"],"meaning":"Accept transfer (forced with 2-3 hearts)","children":[{"id":"node-00000000-0000-0000-00c2-000000000003","bids":["2NT"],"meaning":"Invitational, exactly 5 hearts (8-9 HCP)","children":[]},{"id":"node-00000000-0000-0000-00c2-000000000004","bids":["3♥"],"meaning":"Invitational, 6+ hearts","children":[]},{"id":"node-00000000-0000-0000-00c2-000000000005","bids":["4♥"],"meaning":"To play (5+ hearts with game values)","children":[]},{"id":"node-00000000-0000-0000-00c2-000000000006","bids":["3NT"],"meaning":"Choice of games — exactly 5 hearts, game values","children":[]}]},{"id":"node-00000000-0000-0000-00c2-000000000007","bids":["3♥"],"meaning":"Super-accept — 4+ hearts, maximum hand","children":[]}]},{"id":"node-00000000-0000-0000-00c2-000000000008","bids":["2♥"],"meaning":"Transfer to spades — promises 5+ spades","children":[{"id":"node-00000000-0000-0000-00c2-000000000009","bids":["2♠"],"meaning":"Accept transfer (forced with 2-3 spades)","children":[{"id":"node-00000000-0000-0000-00c2-00000000000a","bids":["2NT"],"meaning":"Invitational, exactly 5 spades (8-9 HCP)","children":[]},{"id":"node-00000000-0000-0000-00c2-00000000000b","bids":["3♠"],"meaning":"Invitational, 6+ spades","children":[]},{"id":"node-00000000-0000-0000-00c2-00000000000c","bids":["4♠"],"meaning":"To play (5+ spades with game values)","children":[]},{"id":"node-00000000-0000-0000-00c2-00000000000d","bids":["3NT"],"meaning":"Choice of games — exactly 5 spades, game values","children":[]}]},{"id":"node-00000000-0000-0000-00c2-00000000000e","bids":["3♠"],"meaning":"Super-accept — 4+ spades, maximum hand","children":[]}]}]}$jc2$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 3. Texas Transfers ───────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000003',
    seed_user_id,
    'Texas Transfers',
    '4♦ and 4♥ over 1NT or 2NT, transferring directly to a major-suit game. Used with a 6+ card major and no slam interest.',
    '[]'::jsonb,
    $jc3${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00c3-000000000001","bids":["4♦"],"meaning":"Transfer to hearts — 6+ hearts, to play 4♥","children":[{"id":"node-00000000-0000-0000-00c3-000000000002","bids":["4♥"],"meaning":"Accept transfer (forced)","children":[]}]},{"id":"node-00000000-0000-0000-00c3-000000000003","bids":["4♥"],"meaning":"Transfer to spades — 6+ spades, to play 4♠","children":[{"id":"node-00000000-0000-0000-00c3-000000000004","bids":["4♠"],"meaning":"Accept transfer (forced)","children":[]}]}]}$jc3$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 4. Blackwood ─────────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000004',
    seed_user_id,
    'Blackwood',
    '4NT asking for aces. Responses: 5♣=0/4 aces, 5♦=1, 5♥=2, 5♠=3. A follow-up 5NT asks for kings.',
    '[]'::jsonb,
    $jc4${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00c4-000000000001","bids":["5♣"],"meaning":"0 or 4 aces","children":[{"id":"node-00000000-0000-0000-00c4-000000000002","bids":["5NT"],"meaning":"Asks for kings","children":[{"id":"node-00000000-0000-0000-00c4-000000000003","bids":["6♣"],"meaning":"0 kings","children":[]},{"id":"node-00000000-0000-0000-00c4-000000000004","bids":["6♦"],"meaning":"1 king","children":[]},{"id":"node-00000000-0000-0000-00c4-000000000005","bids":["6♥"],"meaning":"2 kings","children":[]},{"id":"node-00000000-0000-0000-00c4-000000000006","bids":["6♠"],"meaning":"3 kings","children":[]},{"id":"node-00000000-0000-0000-00c4-000000000007","bids":["6NT"],"meaning":"4 kings","children":[]}]}]},{"id":"node-00000000-0000-0000-00c4-000000000008","bids":["5♦"],"meaning":"1 ace","children":[]},{"id":"node-00000000-0000-0000-00c4-000000000009","bids":["5♥"],"meaning":"2 aces","children":[]},{"id":"node-00000000-0000-0000-00c4-00000000000a","bids":["5♠"],"meaning":"3 aces","children":[]}]}$jc4$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 5. RKCB 1430 ─────────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000005',
    seed_user_id,
    'RKCB 1430',
    '4NT asking for key cards (4 aces + king of agreed trump suit). 1430: 5♣=1/4 key cards, 5♦=0/3, 5♥=2 without trump queen, 5♠=2 with trump queen.',
    '[]'::jsonb,
    $jc5${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00c5-000000000001","bids":["5♣"],"meaning":"1 or 4 key cards","notes":"Key cards = 4 aces + king of agreed trump suit. '14' in 1430.","children":[]},{"id":"node-00000000-0000-0000-00c5-000000000002","bids":["5♦"],"meaning":"0 or 3 key cards","notes":"'30' in 1430.","children":[]},{"id":"node-00000000-0000-0000-00c5-000000000003","bids":["5♥"],"meaning":"2 key cards, no queen of trumps","children":[]},{"id":"node-00000000-0000-0000-00c5-000000000004","bids":["5♠"],"meaning":"2 key cards + queen of trumps","children":[]},{"id":"node-00000000-0000-0000-00c5-000000000005","bids":["5NT"],"meaning":"2 key cards + queen of trumps (used when trump suit is ♥, bypassing 5♠)","children":[]}]}$jc5$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 6. Negative Doubles ──────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000006',
    seed_user_id,
    'Negative Doubles',
    'Double of opponent''s overcall showing the unbid suit(s) rather than penalty. Typically promises 6+ HCP and 4+ cards in the unbid major(s).',
    '[]'::jsonb,
    $jc6${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00c6-000000000001","bids":["1♠"],"meaning":"4 spades, minimum (after 1♣/1♦ open, 1♥ overcall)","children":[]},{"id":"node-00000000-0000-0000-00c6-000000000002","bids":["2♥"],"meaning":"4 hearts, minimum (after any open, 1♠ overcall)","children":[]},{"id":"node-00000000-0000-0000-00c6-000000000003","bids":["1NT"],"meaning":"Stopper in overcalled suit, balanced minimum","children":[]},{"id":"node-00000000-0000-0000-00c6-000000000004","bids":["2♣"],"meaning":"Natural minimum rebid — 4+ clubs","children":[]},{"id":"node-00000000-0000-0000-00c6-000000000005","bids":["2♦"],"meaning":"Natural minimum rebid — 4+ diamonds","children":[]},{"id":"node-00000000-0000-0000-00c6-000000000006","bids":["2NT"],"meaning":"18-19 HCP balanced, stopper in overcalled suit","children":[]},{"id":"node-00000000-0000-0000-00c6-000000000007","bids":["3♥"],"meaning":"4+ hearts, invitational+ (after 1♠ overcall)","children":[]},{"id":"node-00000000-0000-0000-00c6-000000000008","bids":["3♠"],"meaning":"4+ spades, invitational+ (after 1♥ overcall)","children":[]}]}$jc6$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 7. Michaels Cuebid ───────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000007',
    seed_user_id,
    'Michaels Cuebid',
    'Cuebid of opponent''s opening suit showing a 5-5 two-suiter. Over minor: both majors. Over major: the other major + an unspecified minor.',
    '[]'::jsonb,
    $jc7${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00c7-000000000001","bids":["2♥"],"meaning":"Choosing hearts (when Michaels shows both majors over a minor)","children":[]},{"id":"node-00000000-0000-0000-00c7-000000000002","bids":["2♠"],"meaning":"Choosing spades (when Michaels shows both majors over a minor)","children":[]},{"id":"node-00000000-0000-0000-00c7-000000000003","bids":["2NT"],"meaning":"Asks for the minor suit (when Michaels shows major + minor)","children":[{"id":"node-00000000-0000-0000-00c7-000000000004","bids":["3♣"],"meaning":"Clubs","children":[]},{"id":"node-00000000-0000-0000-00c7-000000000005","bids":["3♦"],"meaning":"Diamonds","children":[]}]},{"id":"node-00000000-0000-0000-00c7-000000000006","bids":["3♥"],"meaning":"Choosing hearts (when Michaels over 1♠ shows hearts + minor)","children":[]}]}$jc7$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 8. Unusual 2NT ───────────────────────────────────────────────────────────
  INSERT INTO convention (id, owner_id, name, description, parameters_json, root_json, is_public, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0003-000000000008',
    seed_user_id,
    'Unusual 2NT',
    '2NT in direct or balancing seat over an opponent''s opening, showing 5-5 in the two lowest unbid suits (usually both minors over 1♥ or 1♠).',
    '[]'::jsonb,
    $jc8${"id":"root","bids":[],"meaning":"","children":[{"id":"node-00000000-0000-0000-00c8-000000000001","bids":["3♣"],"meaning":"Choosing clubs — to play or constructive","children":[]},{"id":"node-00000000-0000-0000-00c8-000000000002","bids":["3♦"],"meaning":"Choosing diamonds — to play or constructive","children":[]},{"id":"node-00000000-0000-0000-00c8-000000000003","bids":["4♣"],"meaning":"Strong fit — invitational raise in clubs","children":[]},{"id":"node-00000000-0000-0000-00c8-000000000004","bids":["4♦"],"meaning":"Strong fit — invitational raise in diamonds","children":[]}]}$jc8$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

END $$;
