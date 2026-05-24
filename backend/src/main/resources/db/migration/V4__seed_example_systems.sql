DO $$
DECLARE
  seed_user_id UUID := '00000000-0000-0000-0000-000000000001';
  system_21_id UUID := '00000000-0000-0000-0000-000000000002';
  system_ns_id UUID := '00000000-0000-0000-0000-000000000003';
BEGIN
  -- ── Seed user ────────────────────────────────────────────────────────────
  INSERT INTO app_user (id, username, display_name, user_handle, created_at)
  VALUES (
    seed_user_id,
    'bridge-system',
    'Bridge System',
    decode('00000000000000000000000000000001', 'hex'),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── 2/1 Game Force ───────────────────────────────────────────────────────
  INSERT INTO bidding_system (id, owner_id, name, description, tree_json, is_public, created_at, updated_at)
  VALUES (
    system_21_id,
    seed_user_id,
    '2/1 Game Force',
    'The popular American standard system. 2/1 responses are game-forcing, 1NT response to a major is forcing for one round. Features Jacoby 2NT and weak two-bids.',
    $json21${
  "children": [
    {
      "id": "node-00000000-0000-0000-0001-000000000001",
      "bids": ["1♣"],
      "meaning": "12-21 HCP, usually 3+ clubs; may be 2 clubs in balanced hands",
      "notes": "The catch-all minor. With 4-4 in minors open 1♣. With balanced 12-14 open 1♣ (not 1NT which shows 15-17).",
      "children": [
        {
          "id": "node-00000000-0000-0000-0001-000000000002",
          "bids": ["1♦"],
          "meaning": "4+ diamonds, 6+ HCP, forcing one round",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000003",
          "bids": ["1♥"],
          "meaning": "4+ hearts, 6+ HCP, forcing one round",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000004",
          "bids": ["1♠"],
          "meaning": "4+ spades, 6+ HCP, forcing one round",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000005",
          "bids": ["1NT"],
          "meaning": "6-9 HCP, balanced, no 4-card major (semi-forcing)",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000006",
          "bids": ["2♣"],
          "meaning": "5+ clubs, 10+ HCP — game force",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000007",
          "bids": ["3♣"],
          "meaning": "Limit raise, 10-11 HCP, 5+ clubs",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0001-000000000008",
      "bids": ["1♦"],
      "meaning": "12-21 HCP, 4+ diamonds, unbalanced; no 4-card major, not 15-17 balanced",
      "children": [
        {
          "id": "node-00000000-0000-0000-0001-000000000009",
          "bids": ["1♥"],
          "meaning": "4+ hearts, 6+ HCP, one-round force",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-00000000000a",
          "bids": ["1♠"],
          "meaning": "4+ spades, 6+ HCP, one-round force",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-00000000000b",
          "bids": ["1NT"],
          "meaning": "6-9 HCP, no 4-card major",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-00000000000c",
          "bids": ["2♦"],
          "meaning": "6-9 HCP, 4+ diamonds, simple raise",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-00000000000d",
          "bids": ["3♦"],
          "meaning": "10-11 HCP, 5+ diamonds, limit raise",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0001-00000000000e",
      "bids": ["1♥"],
      "meaning": "12-21 HCP, 5+ hearts",
      "children": [
        {
          "id": "node-00000000-0000-0000-0001-00000000000f",
          "bids": ["1♠"],
          "meaning": "4+ spades, 6+ HCP, forcing one round",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000010",
          "bids": ["1NT"],
          "meaning": "Forcing 1NT — 6-12 HCP; denies 3+ hearts and 4 spades; opener must rebid",
          "children": [
            {
              "id": "node-00000000-0000-0000-0001-000000000011",
              "bids": ["2♣"],
              "meaning": "Minimum (12-14 HCP), 4+ clubs or catchall rebid",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000012",
              "bids": ["2♦"],
              "meaning": "Minimum, 4+ diamonds",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000013",
              "bids": ["2♥"],
              "meaning": "Minimum, 6+ hearts — simple rebid of suit",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000014",
              "bids": ["2♠"],
              "meaning": "Strong reverse, 17+ HCP, 4+ spades",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000015",
              "bids": ["2NT"],
              "meaning": "18-19 HCP, balanced",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000016",
          "bids": ["2♣"],
          "meaning": "Game force, 5+ clubs, 13+ HCP",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000017",
          "bids": ["2♦"],
          "meaning": "Game force, 5+ diamonds, 13+ HCP",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000018",
          "bids": ["2♥"],
          "meaning": "Simple raise, 6-9 HCP, 3+ hearts",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000019",
          "bids": ["2NT"],
          "meaning": "Jacoby 2NT — 4+ hearts, game-forcing raise",
          "notes": "Opener rebids to show shortness: 3♣/3♦/3♠ = singleton/void in that suit. 3♥ = minimum no shortness.",
          "children": [
            {
              "id": "node-00000000-0000-0000-0001-00000000001a",
              "bids": ["3♣"],
              "meaning": "Singleton or void in clubs",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-00000000001b",
              "bids": ["3♦"],
              "meaning": "Singleton or void in diamonds",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-00000000001c",
              "bids": ["3♥"],
              "meaning": "Minimum hand (no shortness), 5+ hearts",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-00000000001d",
              "bids": ["3♠"],
              "meaning": "Singleton or void in spades",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0001-00000000001e",
          "bids": ["3♥"],
          "meaning": "Limit raise, 10-12 HCP, 3+ hearts",
          "notes": "With 4+ hearts and weak hand, bid 4♥ preemptively.",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0001-00000000001f",
      "bids": ["1♠"],
      "meaning": "12-21 HCP, 5+ spades",
      "children": [
        {
          "id": "node-00000000-0000-0000-0001-000000000020",
          "bids": ["1NT"],
          "meaning": "Forcing 1NT — 6-12 HCP; denies 3+ spades; opener must rebid",
          "children": [
            {
              "id": "node-00000000-0000-0000-0001-000000000021",
              "bids": ["2♣"],
              "meaning": "Minimum (12-14 HCP), 4+ clubs",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000022",
              "bids": ["2♦"],
              "meaning": "Minimum, 4+ diamonds",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000023",
              "bids": ["2♥"],
              "meaning": "Reverse, 17+ HCP, 4+ hearts",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000024",
              "bids": ["2♠"],
              "meaning": "6+ spades, minimum, non-forcing rebid",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000025",
              "bids": ["2NT"],
              "meaning": "18-19 HCP, balanced",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000026",
          "bids": ["2♣"],
          "meaning": "Game force, 5+ clubs, 13+ HCP",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000027",
          "bids": ["2♦"],
          "meaning": "Game force, 5+ diamonds, 13+ HCP",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000028",
          "bids": ["2♥"],
          "meaning": "Game force, 5+ hearts, 13+ HCP",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000029",
          "bids": ["2♠"],
          "meaning": "Simple raise, 6-9 HCP, 3+ spades",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-00000000002a",
          "bids": ["2NT"],
          "meaning": "Jacoby 2NT — 4+ spades, game-forcing raise",
          "notes": "Opener rebids to show shortness: 3♣/3♦/3♥ = singleton/void. 3♠ = minimum no shortness.",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-00000000002b",
          "bids": ["3♠"],
          "meaning": "Limit raise, 10-12 HCP, 3+ spades",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0001-00000000002c",
      "bids": ["1NT"],
      "meaning": "15-17 HCP, balanced; no singleton, no void, usually no 5-card major",
      "children": [
        {
          "id": "node-00000000-0000-0000-0001-00000000002d",
          "bids": ["2♣"],
          "meaning": "Stayman — asks for a 4-card major",
          "notes": "Promises at least one 4-card major or game-invitational strength.",
          "children": [
            {
              "id": "node-00000000-0000-0000-0001-00000000002e",
              "bids": ["2♦"],
              "meaning": "No 4-card major",
              "children": [
                {
                  "id": "node-00000000-0000-0000-0001-00000000002f",
                  "bids": ["2NT"],
                  "meaning": "Invitational (8-9 HCP); opener passes or bids 3NT",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0001-000000000030",
                  "bids": ["3NT"],
                  "meaning": "To play (10-15 HCP)",
                  "children": []
                }
              ]
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000031",
              "bids": ["2♥"],
              "meaning": "4+ hearts (may also have 4 spades)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000032",
              "bids": ["2♠"],
              "meaning": "4+ spades, denies 4 hearts",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000033",
          "bids": ["2♦"],
          "meaning": "Jacoby transfer to hearts — opener must accept with 2♥",
          "children": [
            {
              "id": "node-00000000-0000-0000-0001-000000000034",
              "bids": ["2♥"],
              "meaning": "Forced accept of heart transfer",
              "children": [
                {
                  "id": "node-00000000-0000-0000-0001-000000000035",
                  "bids": ["2NT"],
                  "meaning": "Invitational, exactly 5 hearts",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0001-000000000036",
                  "bids": ["3♥"],
                  "meaning": "Invitational, 6+ hearts",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0001-000000000037",
                  "bids": ["4♥"],
                  "meaning": "To play — 6+ hearts or 5 hearts with values",
                  "children": []
                }
              ]
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000038",
          "bids": ["2♥"],
          "meaning": "Jacoby transfer to spades — opener must accept with 2♠",
          "children": [
            {
              "id": "node-00000000-0000-0000-0001-000000000039",
              "bids": ["2♠"],
              "meaning": "Forced accept of spade transfer",
              "children": [
                {
                  "id": "node-00000000-0000-0000-0001-00000000003a",
                  "bids": ["2NT"],
                  "meaning": "Invitational, exactly 5 spades",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0001-00000000003b",
                  "bids": ["3♠"],
                  "meaning": "Invitational, 6+ spades",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0001-00000000003c",
                  "bids": ["4♠"],
                  "meaning": "To play — 6+ spades or 5 spades with values",
                  "children": []
                }
              ]
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0001-00000000003d",
          "bids": ["2NT"],
          "meaning": "Invitational (8-9 HCP, balanced)",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-00000000003e",
          "bids": ["3NT"],
          "meaning": "To play (10-15 HCP, balanced)",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0001-00000000003f",
      "bids": ["2♣"],
      "meaning": "Strong and artificial — 22+ HCP or any hand too strong to open 1-level",
      "notes": "The only game-forcing opening. All hands with 22+ HCP, or hands with 9+ playing tricks.",
      "children": [
        {
          "id": "node-00000000-0000-0000-0001-000000000040",
          "bids": ["2♦"],
          "meaning": "Waiting / artificial (0-7 HCP, or any waiting response)",
          "notes": "Does not promise diamonds. Responder waits to hear opener's rebid.",
          "children": [
            {
              "id": "node-00000000-0000-0000-0001-000000000041",
              "bids": ["2♥"],
              "meaning": "5+ hearts, game force",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000042",
              "bids": ["2♠"],
              "meaning": "5+ spades, game force",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000043",
              "bids": ["2NT"],
              "meaning": "Balanced, 22-24 HCP",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000044",
              "bids": ["3♣"],
              "meaning": "5+ clubs, game force",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000045",
              "bids": ["3♦"],
              "meaning": "5+ diamonds, game force",
              "children": []
            }
          ]
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0001-000000000046",
      "bids": ["2♦"],
      "meaning": "Weak two — 6-10 HCP, 6+ diamonds",
      "notes": "Non-vulnerable more aggressive (5-card suit possible). Vulnerable more disciplined.",
      "children": [
        {
          "id": "node-00000000-0000-0000-0001-000000000047",
          "bids": ["2NT"],
          "meaning": "Feature ask — invitational to game",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000048",
          "bids": ["3♦"],
          "meaning": "Preemptive raise — to play",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0001-000000000049",
      "bids": ["2♥"],
      "meaning": "Weak two — 6-10 HCP, 6+ hearts",
      "children": [
        {
          "id": "node-00000000-0000-0000-0001-00000000004a",
          "bids": ["2NT"],
          "meaning": "Ogust — asks opener to describe hand quality and suit quality",
          "children": [
            {
              "id": "node-00000000-0000-0000-0001-00000000004b",
              "bids": ["3♣"],
              "meaning": "Bad hand, bad suit (6-8 HCP, weak suit)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-00000000004c",
              "bids": ["3♦"],
              "meaning": "Bad hand, good suit",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-00000000004d",
              "bids": ["3♥"],
              "meaning": "Good hand, bad suit",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-00000000004e",
              "bids": ["3♠"],
              "meaning": "Good hand, good suit (9-10 HCP, strong suit)",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0001-00000000004f",
          "bids": ["4♥"],
          "meaning": "To play",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0001-000000000050",
      "bids": ["2♠"],
      "meaning": "Weak two — 6-10 HCP, 6+ spades",
      "children": [
        {
          "id": "node-00000000-0000-0000-0001-000000000051",
          "bids": ["2NT"],
          "meaning": "Ogust — asks opener to describe hand quality and suit quality",
          "children": [
            {
              "id": "node-00000000-0000-0000-0001-000000000052",
              "bids": ["3♣"],
              "meaning": "Bad hand, bad suit (6-8 HCP, weak suit)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000053",
              "bids": ["3♦"],
              "meaning": "Bad hand, good suit",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000054",
              "bids": ["3♥"],
              "meaning": "Good hand, bad suit",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0001-000000000055",
              "bids": ["3♠"],
              "meaning": "Good hand, good suit (9-10 HCP, strong suit)",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0001-000000000056",
          "bids": ["4♠"],
          "meaning": "To play",
          "children": []
        }
      ]
    }
  ]
}$json21$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── Nordic Standard ───────────────────────────────────────────────────────
  INSERT INTO bidding_system (id, owner_id, name, description, tree_json, is_public, created_at, updated_at)
  VALUES (
    system_ns_id,
    seed_user_id,
    'Nordic Standard',
    'The Scandinavian standard system. Features a multi 2♦ (weak two in a major or 20-21 balanced), natural 2♣ opening, and 5-card majors with limit raises.',
    $json_ns${
  "children": [
    {
      "id": "node-00000000-0000-0000-0002-000000000001",
      "bids": ["1♣"],
      "meaning": "12-17 HCP; 4+ clubs OR balanced 12-14 without 4-card major; may be short",
      "notes": "Unlike 2/1, a 1NT opening in Nordic shows 15-17. Balanced 12-14 opens 1♣ (may be only 2 clubs).",
      "children": [
        {
          "id": "node-00000000-0000-0000-0002-000000000002",
          "bids": ["1♦"],
          "meaning": "4+ diamonds, 6+ HCP, forcing one round",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000003",
          "bids": ["1♥"],
          "meaning": "4+ hearts, 6+ HCP, forcing one round",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000004",
          "bids": ["1♠"],
          "meaning": "4+ spades, 6+ HCP, forcing one round",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000005",
          "bids": ["1NT"],
          "meaning": "8-10 HCP, balanced, no 4-card major",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000006",
          "bids": ["2♣"],
          "meaning": "6-9 HCP, 5+ clubs — simple raise",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000007",
          "bids": ["2NT"],
          "meaning": "11-12 HCP, balanced, invitational to 3NT",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0002-000000000008",
      "bids": ["1♦"],
      "meaning": "12-17 HCP, 4+ diamonds, unbalanced, no 4-card major",
      "children": [
        {
          "id": "node-00000000-0000-0000-0002-000000000009",
          "bids": ["1♥"],
          "meaning": "4+ hearts, 6+ HCP, forcing",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-00000000000a",
          "bids": ["1♠"],
          "meaning": "4+ spades, 6+ HCP, forcing",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-00000000000b",
          "bids": ["1NT"],
          "meaning": "8-10 HCP, no 4-card major",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-00000000000c",
          "bids": ["2♦"],
          "meaning": "6-9 HCP, 4+ diamonds — raise",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-00000000000d",
          "bids": ["3♦"],
          "meaning": "10-11 HCP, 5+ diamonds — limit raise",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0002-00000000000e",
      "bids": ["1♥"],
      "meaning": "12-17 HCP, 5+ hearts",
      "children": [
        {
          "id": "node-00000000-0000-0000-0002-00000000000f",
          "bids": ["1♠"],
          "meaning": "4+ spades, 6+ HCP, forcing one round",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000010",
          "bids": ["1NT"],
          "meaning": "6-10 HCP, semi-forcing (opener may pass with minimum balanced)",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000011",
          "bids": ["2♣"],
          "meaning": "10+ HCP, 5+ clubs — game force (strong jump shift in Nordic)",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000012",
          "bids": ["2♦"],
          "meaning": "10+ HCP, 5+ diamonds — game force",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000013",
          "bids": ["2♥"],
          "meaning": "6-9 HCP, 3+ hearts, simple raise",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000014",
          "bids": ["2NT"],
          "meaning": "10-11 HCP, invitational with 3+ hearts (Baron 2NT)",
          "notes": "Shows a game-invitational hand with heart support. Opener bids on to game or shows suit shape.",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000015",
          "bids": ["3♥"],
          "meaning": "10-11 HCP, 4+ hearts, limit raise",
          "notes": "With weaker hand and 4+ hearts, bid 4♥ preemptively.",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0002-000000000016",
      "bids": ["1♠"],
      "meaning": "12-17 HCP, 5+ spades",
      "children": [
        {
          "id": "node-00000000-0000-0000-0002-000000000017",
          "bids": ["1NT"],
          "meaning": "6-10 HCP, semi-forcing",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000018",
          "bids": ["2♣"],
          "meaning": "10+ HCP, 5+ clubs — game force",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000019",
          "bids": ["2♦"],
          "meaning": "10+ HCP, 5+ diamonds — game force",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-00000000001a",
          "bids": ["2♥"],
          "meaning": "10+ HCP, 5+ hearts — game force",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-00000000001b",
          "bids": ["2♠"],
          "meaning": "6-9 HCP, 3+ spades, simple raise",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-00000000001c",
          "bids": ["3♠"],
          "meaning": "10-11 HCP, 4+ spades, limit raise",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0002-00000000001d",
      "bids": ["1NT"],
      "meaning": "15-17 HCP, balanced",
      "children": [
        {
          "id": "node-00000000-0000-0000-0002-00000000001e",
          "bids": ["2♣"],
          "meaning": "Stayman — asks for a 4-card major",
          "children": [
            {
              "id": "node-00000000-0000-0000-0002-00000000001f",
              "bids": ["2♦"],
              "meaning": "No 4-card major",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0002-000000000020",
              "bids": ["2♥"],
              "meaning": "4+ hearts",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0002-000000000021",
              "bids": ["2♠"],
              "meaning": "4+ spades, denies 4 hearts",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000022",
          "bids": ["2♦"],
          "meaning": "Transfer to hearts — opener accepts with 2♥",
          "children": [
            {
              "id": "node-00000000-0000-0000-0002-000000000023",
              "bids": ["2♥"],
              "meaning": "Accept transfer",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000024",
          "bids": ["2♥"],
          "meaning": "Transfer to spades — opener accepts with 2♠",
          "children": [
            {
              "id": "node-00000000-0000-0000-0002-000000000025",
              "bids": ["2♠"],
              "meaning": "Accept transfer",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000026",
          "bids": ["2NT"],
          "meaning": "Invitational (8-9 HCP)",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000027",
          "bids": ["3NT"],
          "meaning": "To play",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0002-000000000028",
      "bids": ["2♣"],
      "meaning": "12-17 HCP, 5+ clubs, unbalanced (or strong 6-card suit 15-17)",
      "notes": "Natural club opening, unlike the artificial strong 2♣ in American systems.",
      "children": [
        {
          "id": "node-00000000-0000-0000-0002-000000000029",
          "bids": ["2♦"],
          "meaning": "Artificial relay — asks opener to describe shape",
          "children": [
            {
              "id": "node-00000000-0000-0000-0002-00000000002a",
              "bids": ["2♥"],
              "meaning": "4+ hearts (5-4 or better in clubs-hearts)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0002-00000000002b",
              "bids": ["2♠"],
              "meaning": "4+ spades (5-4 or better in clubs-spades)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0002-00000000002c",
              "bids": ["2NT"],
              "meaning": "Both minors (5-5 or better in clubs-diamonds)",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0002-00000000002d",
          "bids": ["2NT"],
          "meaning": "Natural invitational (10-11 HCP)",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0002-00000000002e",
      "bids": ["2♦"],
      "meaning": "Multi! — weak two in hearts OR spades (6-10 HCP, 6 cards) OR balanced 20-21 HCP",
      "notes": "The hallmark of Nordic Standard. Responder must bid carefully since opener's suit is unknown.",
      "children": [
        {
          "id": "node-00000000-0000-0000-0002-00000000002f",
          "bids": ["2♥"],
          "meaning": "Pass or correct — responder is willing to play 2♥; opener passes with hearts, corrects to 2♠ with spades",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000030",
          "bids": ["2♠"],
          "meaning": "Pass or correct — responder is willing to play 2♠; opener passes with spades, corrects to 3♥ with hearts",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000031",
          "bids": ["2NT"],
          "meaning": "Asking bid — opener clarifies hand type",
          "notes": "With balanced 20-21, opener rebids 2NT. Otherwise shows suit and strength.",
          "children": [
            {
              "id": "node-00000000-0000-0000-0002-000000000032",
              "bids": ["3♣"],
              "meaning": "Minimum, 6+ hearts (6-8 HCP)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0002-000000000033",
              "bids": ["3♦"],
              "meaning": "Minimum, 6+ spades (6-8 HCP)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0002-000000000034",
              "bids": ["3♥"],
              "meaning": "Maximum, 6+ hearts (9-10 HCP)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0002-000000000035",
              "bids": ["3♠"],
              "meaning": "Maximum, 6+ spades (9-10 HCP)",
              "children": []
            }
          ]
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0002-000000000036",
      "bids": ["2♥"],
      "meaning": "Weak two — 6-10 HCP, 6+ hearts",
      "notes": "In Nordic often acceptable with a good 5-card suit. More disciplined than Multi.",
      "children": [
        {
          "id": "node-00000000-0000-0000-0002-000000000037",
          "bids": ["2NT"],
          "meaning": "Feature ask — invitational to game",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-000000000038",
          "bids": ["4♥"],
          "meaning": "To play",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0002-000000000039",
      "bids": ["2♠"],
      "meaning": "Weak two — 6-10 HCP, 6+ spades",
      "children": [
        {
          "id": "node-00000000-0000-0000-0002-00000000003a",
          "bids": ["2NT"],
          "meaning": "Feature ask — invitational to game",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0002-00000000003b",
          "bids": ["4♠"],
          "meaning": "To play",
          "children": []
        }
      ]
    }
  ]
}$json_ns$::jsonb,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
END $$;
