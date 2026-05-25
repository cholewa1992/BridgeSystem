DO $$
DECLARE
  seed_user_id  UUID := '00000000-0000-0000-0000-000000000001';
  system_irg5_id UUID := '00000000-0000-0000-0000-000000000004';
BEGIN
  -- ── Seed user (idempotent) ────────────────────────────────────────────────
  INSERT INTO app_user (id, username, display_name, user_handle, created_at)
  VALUES (
    seed_user_id,
    'bridge-system',
    'Bridge System',
    decode('00000000000000000000000000000001', 'hex'),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── Junior IRG 5 ─────────────────────────────────────────────────────────
  INSERT INTO bidding_system (id, owner_id, name, description, tree_json, is_public, created_at, updated_at)
  VALUES (
    system_irg5_id,
    seed_user_id,
    'Junior IRG 5',
    'Danish competitive system. 5-card majors, 1NT 15-17 (may have 5M), 2/1 GF, Gazzilli after 1M, reversed minors (2♣/2♦ GF raises), 2♣ strong 22+, 2♦ balanced 18-19 (NOT Multi), natural 2M 8-11, RKCB 1430, Fitbids, Lebensohl.',
    $jsonIRG5$
{
  "children": [
    {
      "id": "node-00000000-0000-0000-0004-000000000001",
      "bids": ["1♣"],
      "meaning": "12-21 HCP, 2+ clubs; may be as few as 2 in balanced hands",
      "notes": "Catch-all opener. Balanced 12-14 opens 1♣ (not 1NT). Balanced 15-17 opens 1NT. Interference: after 1♣-(X): XX=10+ HP penalty interest, pass=forcing; fitbids apply when opps double or bid at 1-2 level. After 1♣-(1x): 2♣=natural, 2x=invit+ (cuebid), jump new=fitbid, 3♣=preempt, 3x=splinter 9+ HP.",
      "children": [
        {
          "id": "node-00000000-0000-0000-0004-000000000010",
          "bids": ["1♦"],
          "meaning": "4+ diamonds, 6+ HCP, one-round force",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000011",
          "bids": ["1♥"],
          "meaning": "4+ hearts, 6+ HCP, one-round force",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000012",
          "bids": ["1♠"],
          "meaning": "4+ spades, 6+ HCP, one-round force",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000013",
          "bids": ["1NT"],
          "meaning": "6-11 HCP, balanced; no 4-card major",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000014",
          "bids": ["2♣"],
          "meaning": "GF raise, 5+ clubs — reversed minor (same-suit raise = game force)",
          "notes": "Reversed minor: 2♣ raise over 1♣ = GF (not invitational as normal). After reversed minor: new suit from both = singleton; jump from both = void. Opponents intervening after: X=shortage, cuebid=void, NT=natural stopper, pass=no shortage but no stopper.",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000015",
          "bids": ["2♦"],
          "meaning": "Invitational raise of clubs, 5+ clubs — reversed minor (2♦ = inv, NOT natural diamonds)",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000016",
          "bids": ["2♥", "2♠"],
          "meaning": "Preemptive (weak, 6-card suit)",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000017",
          "bids": ["2NT"],
          "meaning": "Natural invite, balanced",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000018",
          "bids": ["3♣"],
          "meaning": "Preemptive raise",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000019",
          "bids": ["3♦"],
          "meaning": "Splinter, singleton/void in diamonds, 9-12 HCP with club fit",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000020",
          "bids": ["3♥"],
          "meaning": "Splinter, singleton/void in hearts, 9-12 HCP with club fit",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000021",
          "bids": ["3♠"],
          "meaning": "Splinter, singleton/void in spades, 9-12 HCP with club fit",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0004-000000000002",
      "bids": ["1♦"],
      "meaning": "12-21 HCP, 4+ diamonds (always at least 4)",
      "notes": "Interference: after 1♦-(X): same as 1♣. After 1♦-(1x): same structure. After Michaels cuebid 1♣-(2♣) or 1♦-(2♦): Nær/fjern (Near/Far) — X=strength invit+, lower cuebid=GF with non-shown minor, higher cuebid=invit+ with shown minor, 2NT=natural invite.",
      "children": [
        {
          "id": "node-00000000-0000-0000-0004-000000000022",
          "bids": ["1♥"],
          "meaning": "4+ hearts, 6+ HCP, one-round force",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000023",
          "bids": ["1♠"],
          "meaning": "4+ spades, 6+ HCP, one-round force",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000024",
          "bids": ["1NT"],
          "meaning": "6-11 HCP, balanced",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000025",
          "bids": ["2♣"],
          "meaning": "2/1 GF, 5+ clubs — game forcing (12/13+ HCP)",
          "notes": "Opener rebid principles (2/1 GF): jump in own suit=solid self-running suit (EDBTxx quality); simple rebid=minimum or bad suit; 2NT=12-14 or 18-19 bal; 3NT=15-17 bal; new lower suit=natural 5+/4+ min or extra; splinter=shortage with fit; direct raise=5422 minimum; jump raise=extras.",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000026",
          "bids": ["2♦"],
          "meaning": "GF raise, 4+ diamonds — reversed minor (same-suit raise = game force)",
          "notes": "After reversed minor: new suit from both = singleton; jump = void. If opponents bid after reversed minor: X=shortage, cuebid=void, NT=natural, pass=no shortage and no stopper.",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000027",
          "bids": ["2♥", "2♠"],
          "meaning": "Preemptive (weak, 6-card suit)",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000028",
          "bids": ["2NT"],
          "meaning": "Natural invite, balanced",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000029",
          "bids": ["3♣"],
          "meaning": "Invitational raise of clubs, 4+ clubs — reversed minor",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000030",
          "bids": ["3♦"],
          "meaning": "Preemptive raise",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000031",
          "bids": ["3♥"],
          "meaning": "Splinter, singleton/void in hearts, 9-12 HCP with diamond fit",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000032",
          "bids": ["3♠"],
          "meaning": "Splinter, singleton/void in spades, 9-12 HCP with diamond fit",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000033",
          "bids": ["4♣"],
          "meaning": "Splinter, singleton/void in clubs, 9-12 HCP with diamond fit",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0004-000000000003",
      "bids": ["1♥"],
      "meaning": "12-21 HCP, 5+ hearts",
      "notes": "Interference (2.8): Fitbids apply when opponents double or bid at 1-2 level (normal raises are OFF). Fitbid = 4-card support + 4-5 card side suit, 8-9 HP. After 1♥-(X): 1NT=natural 7-10, 2♣/2♦=natural 10+, 2♦=suit-below=3♥+8+, 2♥=normal single raise, 2NT=4+♥10+HP, 3♣/3♦=fitbid, 3♦=mixed raise 7-9 HP 4-card, 3♥=4-card weak. Cuebid=3-card invit+, jump cuebid=splinter invit+. Omvendt Toronto after 1M in 3rd/4th seat: 1M-2♣: 2♦=real opening, 2M=not real opening.",
      "children": [
        {
          "id": "node-00000000-0000-0000-0004-000000000034",
          "bids": ["1♠"],
          "meaning": "4+ spades, 6+ HCP, one-round force; Gazzilli applies from opener",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000035",
              "bids": ["2♣"],
              "meaning": "Gazzilli — ambiguous: A=11-15 HCP 5♥4♣, or B=16+ HCP (not 5-5 or 6+ as in section 2.5)",
              "notes": "If opponents double or overcall, Gazzilli is off.",
              "children": [
                {
                  "id": "node-00000000-0000-0000-0004-000000000036",
                  "bids": ["2♦"],
                  "meaning": "8+ HCP, GF relay vs type B; if type A opener bids 2♥",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000037",
                  "bids": ["2♥"],
                  "meaning": "Weak, doubleton ♥, 5-7 HCP",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000038",
                  "bids": ["2♠"],
                  "meaning": "Weak 5-8 HCP, 5+ spades",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000039",
                  "bids": ["2NT"],
                  "meaning": "Weak, minimum 4-4 in minors, 0-1 hearts",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000040",
                  "bids": ["3♣", "3♦"],
                  "meaning": "Natural 6+, 5-7 HCP",
                  "children": []
                }
              ]
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000041",
          "bids": ["1NT"],
          "meaning": "5-11 HCP, not forcing; Gazzilli applies from opener's 2♣ rebid",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000042",
              "bids": ["2♣"],
              "meaning": "Gazzilli — ambiguous: A=11-15 HCP 5♥4♣, or B=16+ HCP",
              "notes": "Gazzilli off if opponents double or overcall.",
              "children": [
                {
                  "id": "node-00000000-0000-0000-0004-000000000043",
                  "bids": ["2♦"],
                  "meaning": "8+ HCP, GF relay vs type B; if type A opener bids 2♥",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000044",
                  "bids": ["2♥"],
                  "meaning": "Weak 5-7 HCP, doubleton ♥",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000045",
                  "bids": ["2♠"],
                  "meaning": "Strong 8-11 HCP, 5-5 in minors",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000046",
                  "bids": ["2NT"],
                  "meaning": "Weak, 5-4 in minors",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000047",
                  "bids": ["3♣", "3♦"],
                  "meaning": "Natural 6+, 5-7 HCP",
                  "children": []
                }
              ]
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000048",
              "bids": ["2♦"],
              "meaning": "5-5 hearts/clubs, 16+ HCP",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000049",
              "bids": ["2♥"],
              "meaning": "Minimum rebid (6+ hearts or 11-15 HCP)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000050",
              "bids": ["2NT"],
              "meaning": "Ambiguous: 12-14 HCP balanced or 18-19 HCP balanced",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000051",
              "bids": ["3♥"],
              "meaning": "Invitational with 6+ good hearts",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000052",
              "bids": ["3NT"],
              "meaning": "15-17 HCP balanced",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000053",
          "bids": ["2♣"],
          "meaning": "2/1 GF, 5+ clubs; game forcing (12/13+ HCP)",
          "notes": "Opener rebids: jump in own suit=solid suit (EDBTxx); simple rebid=minimum or bad suit; 2NT=12-14 or 18-19 bal; 3NT=15-17 bal; new suit below=natural 5+/4+; splinter=shortage with club fit; 3♣=5422 minimum support; 4♣=extras; reverse (2♠)=17+ HCP. Responder's 2nd bid: secondary support at 3M=minimum, 4M=extras; rebid own suit 3-level=minimum, 4-level=extras+good suit; 2NT=GF stopper in 4th suit no fit; nonserious 3NT when major agreed+both unlimited=mild slam try; cuebid=serious slam.",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000054",
              "bids": ["2♥"],
              "meaning": "Minimum rebid (either bad suit or minimum hand)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000055",
              "bids": ["2♠"],
              "meaning": "Reverse, 17+ HCP, 4+ spades",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000056",
              "bids": ["2NT"],
              "meaning": "Ambiguous: 12-14 HCP balanced or 18-19 HCP balanced",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000057",
              "bids": ["3♣"],
              "meaning": "Minimum support for clubs, 5422 shape",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000058",
              "bids": ["3♥"],
              "meaning": "Jump rebid — solid self-running suit (EDBTxx quality), not total minimum",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000059",
              "bids": ["3NT"],
              "meaning": "15-17 HCP balanced",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000060",
              "bids": ["4♣"],
              "meaning": "Jump support for clubs with extras",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000061",
              "bids": ["3♦"],
              "meaning": "Splinter — singleton/void diamonds with club fit",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000062",
              "bids": ["3♠"],
              "meaning": "Splinter — singleton/void spades with club fit",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000063",
          "bids": ["2♦"],
          "meaning": "2/1 GF, 4+ diamonds; game forcing (12/13+ HCP)",
          "notes": "Same rebid principles as after 2♣ GF. Opener's 2NT=12-14 or 18-19 bal; 3NT=15-17. Responder's 2NT=GF stopper in 4th suit. 4th suit (clubs) by responder = GF, no stopper.",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000064",
          "bids": ["2♥"],
          "meaning": "3-card raise, 6-9 HCP",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000065",
          "bids": ["2NT"],
          "meaning": "Game-forcing raise, 4-card support, 10+ HCP",
          "notes": "Opener first shows HCP range then singletons. Voids shown directly at higher bids. Step answers (trinsvar) always apply. Interference: after 1M-pass-2NT-(opp bids): pass=precisely invit; 3M=minimum; X=GF+forcing pass; new suit=natural distributional no FP; 3NT=singleton in their suit+FP.",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000066",
              "bids": ["3♣"],
              "meaning": "11-14 HCP",
              "children": [
                {
                  "id": "node-00000000-0000-0000-0004-000000000067",
                  "bids": ["3♦"],
                  "meaning": "Asks for singleton (step answers as ①)",
                  "notes": "After 3♦ asks: 3♥=no singleton; 3♠=singleton ♣; 3NT=singleton ♦; 4♣=singleton ♠ (AM). Remember step answers (trinsvar)!",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000068",
                  "bids": ["3♥"],
                  "meaning": "To play",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000069",
                  "bids": ["3♠"],
                  "meaning": "Singleton ♣ (shown directly)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000070",
                  "bids": ["3NT"],
                  "meaning": "Singleton ♦ (shown directly)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000071",
                  "bids": ["4♣"],
                  "meaning": "Singleton ♠ — other major (AM)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000072",
                  "bids": ["4♥"],
                  "meaning": "To play",
                  "children": []
                }
              ]
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000073",
              "bids": ["3♦"],
              "meaning": "15-17 HCP",
              "children": [
                {
                  "id": "node-00000000-0000-0000-0004-000000000074",
                  "bids": ["3♥"],
                  "meaning": "Asks for singleton (step answers as ②)",
                  "notes": "After 3♥ asks: 3♠=no singleton; 3NT=singleton ♣; 4♣=singleton ♦; 4♦=singleton ♠ (AM); 4♥=to play. Remember step answers (trinsvar)!",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000075",
                  "bids": ["3♠"],
                  "meaning": "Singleton ♣ (shown directly)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000076",
                  "bids": ["3NT"],
                  "meaning": "Singleton ♦ (shown directly)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000077",
                  "bids": ["4♣"],
                  "meaning": "Singleton ♠ — other major (AM)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000078",
                  "bids": ["4♥"],
                  "meaning": "To play",
                  "children": []
                }
              ]
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000079",
              "bids": ["3♥"],
              "meaning": "18+ HCP",
              "children": [
                {
                  "id": "node-00000000-0000-0000-0004-000000000080",
                  "bids": ["3♠"],
                  "meaning": "Asks for singleton",
                  "notes": "After 3♠ asks: 3NT=no singleton; 4♣=singleton ♣; 4♦=singleton ♦; 4♥=singleton ♠ (AM). Remember step answers!",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000081",
                  "bids": ["3NT"],
                  "meaning": "Singleton ♣ (shown directly)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000082",
                  "bids": ["4♣"],
                  "meaning": "Singleton ♦ (shown directly)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000083",
                  "bids": ["4♦"],
                  "meaning": "Singleton ♠ — other major (AM)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000084",
                  "bids": ["4♥"],
                  "meaning": "To play",
                  "children": []
                }
              ]
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000085",
              "bids": ["3♠"],
              "meaning": "Unknown void, minimum hand; 3NT asks for which void (step answers)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000086",
              "bids": ["3NT"],
              "meaning": "Void in clubs, 14+ HCP",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000087",
              "bids": ["4♣"],
              "meaning": "Void in diamonds, 14+ HCP",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000088",
              "bids": ["4♦"],
              "meaning": "Void in spades (other major), 14+ HCP",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000089",
          "bids": ["3♣"],
          "meaning": "Invitational raise, 3-card support, 10-12 HCP",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000090",
              "bids": ["3♦"],
              "meaning": "Asks for singleton (step answers as ①: 3♥=none, 3♠=single♣, 3NT=single♦, 4♣=single♠)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000091",
              "bids": ["3♥"],
              "meaning": "To play",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000092",
              "bids": ["3NT"],
              "meaning": "Suggestion (proposal for contract)",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000093",
          "bids": ["3♦"],
          "meaning": "Constructive raise, 3-card support, 6-9 HCP, typically an ace and a king",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000094",
              "bids": ["3♥"],
              "meaning": "To play",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000095",
              "bids": ["3♠"],
              "meaning": "Asks for singleton (step answers as ②: 3NT=none, 4♣=single♣, 4♦=single♦, 4♥=single♠)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000096",
              "bids": ["3NT"],
              "meaning": "Suggestion",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000097",
          "bids": ["3♥"],
          "meaning": "Preemptive raise, 4-card support, 0-5 HCP",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000098",
          "bids": ["3♠"],
          "meaning": "Limited void, 4-card ♥ support, 8-11 HCP (unknown void; 3NT asks with step answers)",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000099",
          "bids": ["3NT"],
          "meaning": "Void in clubs, 4+ ♥ support, 14+ HCP",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000100",
          "bids": ["4♣"],
          "meaning": "Void in diamonds, 4+ ♥ support, 14+ HCP",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000101",
          "bids": ["4♦"],
          "meaning": "Void in spades (other major), 4+ ♥ support, 14+ HCP",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0004-000000000004",
      "bids": ["1♠"],
      "meaning": "12-21 HCP, 5+ spades",
      "notes": "Interference: same fitbid structure as 1♥. After 1♠-(X): 1NT=natural 7-10, 2♣/2♦=natural 10+, 2♥=3-card ♠+8+, 2♠=normal raise, 2NT=4+♠10+HP, 3♣/3♦=fitbid, 3♥=mixed raise 7-9 HP 4-card, 3♠=4-card weak. Omvendt Toronto applies in 3rd/4th seat.",
      "children": [
        {
          "id": "node-00000000-0000-0000-0004-000000000102",
          "bids": ["1NT"],
          "meaning": "5-11 HCP, not forcing; Gazzilli applies from opener's 2♣ rebid",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000103",
              "bids": ["2♣"],
              "meaning": "Gazzilli — ambiguous: A=11-15 HCP 5♠4♣, or B=16+ HCP",
              "notes": "Gazzilli off if opponents double or overcall.",
              "children": [
                {
                  "id": "node-00000000-0000-0000-0004-000000000104",
                  "bids": ["2♦"],
                  "meaning": "8+ HCP, GF relay vs type B; if type A opener bids 2♠",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000105",
                  "bids": ["2♥"],
                  "meaning": "Natural 5+ hearts, 5-11 HCP",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000106",
                  "bids": ["2♠"],
                  "meaning": "Weak 5-7 HCP, doubleton spade",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000107",
                  "bids": ["2NT"],
                  "meaning": "Weak, 5-7 HCP, 5-4 or 5-5 in minors",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000108",
                  "bids": ["3♣", "3♦"],
                  "meaning": "Natural 6+, 5-7 HCP",
                  "children": []
                }
              ]
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000109",
          "bids": ["2♣"],
          "meaning": "2/1 GF, 5+ clubs; game forcing (12/13+ HCP)",
          "notes": "Same 2/1 GF principles as under 1♥. Opener 2NT=12-14 or 18-19 bal; 3NT=15-17.",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000110",
          "bids": ["2♦"],
          "meaning": "2/1 GF, 4+ diamonds; game forcing",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000111",
          "bids": ["2♥"],
          "meaning": "2/1 GF, 5+ hearts; game forcing",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000112",
          "bids": ["2♠"],
          "meaning": "3-card raise, 6-9 HCP",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000113",
          "bids": ["2NT"],
          "meaning": "Game-forcing raise, 4-card support, 10+ HCP",
          "notes": "Same structure as after 1♥-2NT. Opener shows HCP range then singletons. AM = other major = hearts.",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000114",
              "bids": ["3♣"],
              "meaning": "11-14 HCP",
              "children": [
                {
                  "id": "node-00000000-0000-0000-0004-000000000115",
                  "bids": ["3♦"],
                  "meaning": "Asks for singleton (step answers: 3♠=none, 3♥=single♣, 3NT=single♦, 4♣=single♥(AM))",
                  "notes": "Remember step answers (trinsvar)!",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000116",
                  "bids": ["3♠"],
                  "meaning": "To play",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000117",
                  "bids": ["3♥"],
                  "meaning": "Singleton ♣ (shown directly)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000118",
                  "bids": ["3NT"],
                  "meaning": "Singleton ♦ (shown directly)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000119",
                  "bids": ["4♣"],
                  "meaning": "Singleton ♥ — other major (AM)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000120",
                  "bids": ["4♠"],
                  "meaning": "To play",
                  "children": []
                }
              ]
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000121",
              "bids": ["3♦"],
              "meaning": "15-17 HCP",
              "children": [
                {
                  "id": "node-00000000-0000-0000-0004-000000000122",
                  "bids": ["3♥"],
                  "meaning": "Asks for singleton (step answers: 3♠=none, 3NT=single♣, 4♣=single♦, 4♦=single♥(AM); 4♠=to play)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000123",
                  "bids": ["3♠"],
                  "meaning": "To play",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000124",
                  "bids": ["3NT"],
                  "meaning": "Singleton ♣ (shown directly)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000125",
                  "bids": ["4♣"],
                  "meaning": "Singleton ♦ (shown directly)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000126",
                  "bids": ["4♦"],
                  "meaning": "Singleton ♥ — other major (AM)",
                  "children": []
                }
              ]
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000127",
              "bids": ["3♥"],
              "meaning": "18+ HCP",
              "children": [
                {
                  "id": "node-00000000-0000-0000-0004-000000000128",
                  "bids": ["3♠"],
                  "meaning": "Asks for singleton (step answers: 3NT=none, 4♣=single♣, 4♦=single♦, 4♥=single♥(AM))",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000129",
                  "bids": ["3NT"],
                  "meaning": "Singleton ♣ (shown directly)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000130",
                  "bids": ["4♣"],
                  "meaning": "Singleton ♦ (shown directly)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000131",
                  "bids": ["4♦"],
                  "meaning": "Singleton ♥ — other major (AM)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000132",
                  "bids": ["4♠"],
                  "meaning": "To play",
                  "children": []
                }
              ]
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000133",
              "bids": ["3♠"],
              "meaning": "Unknown void, minimum; 4♣ asks (step answers)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000134",
              "bids": ["3NT"],
              "meaning": "Void in clubs, 14+ HCP",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000135",
              "bids": ["4♣"],
              "meaning": "Void in diamonds, 14+ HCP",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000136",
              "bids": ["4♦"],
              "meaning": "Void in hearts (other major), 14+ HCP",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000137",
          "bids": ["3♣"],
          "meaning": "Invitational raise, 3-card support, 10-12 HCP",
          "notes": "After 3♣: 3♦=asks singleton (step: 3♠=none, 3♥=single♣, 3NT=single♦, 4♣=single♥); 3♠=to play; 3NT=suggestion.",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000138",
          "bids": ["3♦"],
          "meaning": "Constructive raise, 3-card support, 6-9 HCP",
          "notes": "After 3♦: 3♠=to play; 3♥=asks singleton (step: 3NT=none, 4♣=single♣, 4♦=single♦, 4♥=single♥); 3NT=suggestion.",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000139",
          "bids": ["3♠"],
          "meaning": "Preemptive raise, 4-card support, 0-5 HCP",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000140",
          "bids": ["3NT"],
          "meaning": "Limited void, 4-card ♠ support, 8-11 HCP (4♣ asks for which void)",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000141",
          "bids": ["4♣"],
          "meaning": "Void in clubs, 4+ ♠ support, 14+ HCP",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000142",
          "bids": ["4♦"],
          "meaning": "Void in diamonds, 4+ ♠ support, 14+ HCP",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000143",
          "bids": ["4♥"],
          "meaning": "Void in hearts (other major), 4+ ♠ support, 14+ HCP",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0004-000000000005",
      "bids": ["1NT"],
      "meaning": "15-17 HCP, balanced; may have a 5-card major",
      "notes": "Interference (3.10): X=takeout (strength if artificial); after first double: 1 more takeout together, then penalty. Bids 2NT-3♦=transfer+invit+; opener breaks relay with fit+good cards. 3♦=GF 5-5 minors. 4-level=long major even after interference. Double of 1NT (3.11): if penalty: pass=neutral, XX=strength; if conventional: system on. If opps double Stayman: pass=no ♣ stopper, XX=suggestion. If opps double transfer: pass=no support, XX=suggestion, 2♥=3-card support. Vs weak 1NT overcall (Landy): X=15+; vs strong 1NT: X=ambiguous 4M+5m or strong.",
      "children": [
        {
          "id": "node-00000000-0000-0000-0004-000000000144",
          "bids": ["2♣"],
          "meaning": "Stayman — asks for 4-card major",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000145",
              "bids": ["2♦"],
              "meaning": "No 4-card major",
              "children": [
                {
                  "id": "node-00000000-0000-0000-0004-000000000146",
                  "bids": ["2♥"],
                  "meaning": "5 hearts, 4 spades — invitational (Smolen)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000147",
                  "bids": ["2♠"],
                  "meaning": "5 spades, 4 hearts — invitational (Smolen)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000148",
                  "bids": ["3♥"],
                  "meaning": "5 hearts, 4 spades — game forcing (Smolen; shows 4♠ at 3-level so strong hand is declarer)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000149",
                  "bids": ["3♠"],
                  "meaning": "5 spades, 4 hearts — game forcing (Smolen; shows 4♥ at 3-level)",
                  "children": []
                }
              ]
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000150",
              "bids": ["2♥"],
              "meaning": "4+ hearts",
              "children": [
                {
                  "id": "node-00000000-0000-0000-0004-000000000151",
                  "bids": ["2♠"],
                  "meaning": "Fastens hearts as trump, GF (section 3.6)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000152",
                  "bids": ["3♥"],
                  "meaning": "Fastens spades as trump, GF (section 3.6)",
                  "children": []
                }
              ]
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000153",
              "bids": ["2♠"],
              "meaning": "4+ spades",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000154",
          "bids": ["2♦"],
          "meaning": "Transfer to hearts",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000155",
              "bids": ["2♥"],
              "meaning": "Normal accept (2-3 hearts)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000156",
              "bids": ["2♠"],
              "meaning": "Super-accept: 4 hearts + good spades (at least EBTx/KDxx)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000157",
              "bids": ["2NT"],
              "meaning": "Super-accept: 4 hearts + good transfer suit (diamonds)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000158",
              "bids": ["3♣"],
              "meaning": "Super-accept: 4 hearts + good clubs",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000159",
              "bids": ["3♥"],
              "meaning": "4 hearts, no good stiff-giving side suit",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000160",
          "bids": ["2♥"],
          "meaning": "Transfer to spades",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000161",
              "bids": ["2♠"],
              "meaning": "Normal accept (2-3 spades); new suit from responder = short suit, GF",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000162",
              "bids": ["3NT"],
              "meaning": "4 spades in transfer suit",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000163",
          "bids": ["2♠"],
          "meaning": "Ambiguous: transfer to clubs (6+ clubs) or natural invite (total transfer system)",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000164",
              "bids": ["2NT"],
              "meaning": "Minimum; if responder has natural invite, 3♠ now = stop",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000165",
              "bids": ["3♠"],
              "meaning": "Maximum",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000166",
          "bids": ["2NT"],
          "meaning": "Transfer to diamonds with 6+ diamonds",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000167",
              "bids": ["3♣"],
              "meaning": "Bad fit for diamonds",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000168",
              "bids": ["3♦"],
              "meaning": "Good fit for diamonds",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000169",
          "bids": ["3♣"],
          "meaning": "Balanced slam invite with 5-6 hearts",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000170",
          "bids": ["3♦"],
          "meaning": "Balanced slam invite with 5-6 spades",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000171",
          "bids": ["3♥"],
          "meaning": "Splinter — singleton; 5/4 or 5/5 in minors; opener looks first toward 3NT",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000172",
          "bids": ["3♠"],
          "meaning": "Splinter — singleton; 5/4 or 5/5 in minors",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000173",
          "bids": ["4♣"],
          "meaning": "Transfer to 4♥ (long hearts)",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000174",
          "bids": ["4♦"],
          "meaning": "Transfer to 4♠ (long spades)",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000175",
          "bids": ["4♥"],
          "meaning": "To play",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000176",
          "bids": ["4♠"],
          "meaning": "To play",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0004-000000000006",
      "bids": ["2♣"],
      "meaning": "22+ balanced or strong/GF one-suiter (typically unspecified)",
      "notes": "Do NOT open 2♣ with: values in the lower range, two-suited hands where you may not be able to show the hand, awkward hands with too many values in short suits. Interference: X=strength+takeout; pass=weakness; natural bids=UK 5+. If doubled: XX=suggestion to play, otherwise ignore.",
      "children": [
        {
          "id": "node-00000000-0000-0000-0004-000000000177",
          "bids": ["2♦"],
          "meaning": "Relay (waiting)",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000178",
              "bids": ["2♥"],
              "meaning": "Natural UK (unspecified GF)",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000179",
              "bids": ["2♠"],
              "meaning": "Natural UK",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000180",
              "bids": ["2NT"],
              "meaning": "22-24 balanced",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000181",
              "bids": ["3♣"],
              "meaning": "Natural UK",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000182",
              "bids": ["3♦"],
              "meaning": "Natural UK",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000183",
              "bids": ["3♥"],
              "meaning": "(5)6+ diamonds with 4 hearts — UK",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000184",
              "bids": ["3♠"],
              "meaning": "(5)6+ diamonds with 4 spades — UK",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000185",
              "bids": ["3NT"],
              "meaning": "25-27 balanced",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000186",
          "bids": ["2♥"],
          "meaning": "Natural positive — at least HHxxx",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000187",
          "bids": ["2♠"],
          "meaning": "Natural positive — at least HHxxx",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000188",
          "bids": ["2NT", "3♣", "3♦"],
          "meaning": "HHHxxx+ in suit above — typically no side values",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000189",
          "bids": ["3♥", "3♠"],
          "meaning": "Natural positive",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0004-000000000007",
      "bids": ["2♦"],
      "meaning": "18-19 HCP, balanced — NOT Multi; uses transfer response structure",
      "notes": "Interference: X=strength+takeout; pass=weakness; bids=natural UK 5+. Doubled: XX=suggestion to play, otherwise ignore.",
      "children": [
        {
          "id": "node-00000000-0000-0000-0004-000000000190",
          "bids": ["2♥"],
          "meaning": "Transfer to spades",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000191",
          "bids": ["2♠"],
          "meaning": "Transfer to 2NT; then normal NT system as if opened 2NT. Note: 3♥ now shows 4-1-4-4 (denied 5♠ by not bidding 2♥)",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000192",
          "bids": ["2NT"],
          "meaning": "Transfer to clubs with 6+ clubs",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000193",
          "bids": ["3♣"],
          "meaning": "Transfer to diamonds with 6+ diamonds",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000194",
          "bids": ["3♦"],
          "meaning": "GF, 5-5 in both majors",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000195",
          "bids": ["3♥", "3♠"],
          "meaning": "Short suit (singleton/void), 5/4+ in minors; opener bids 3NT if possible",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000196",
          "bids": ["4♣"],
          "meaning": "Transfer to 4♥",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000197",
          "bids": ["4♦"],
          "meaning": "Transfer to 4♠",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0004-000000000008",
      "bids": ["2♥"],
      "meaning": "8-11 HCP, 6+ hearts — natural (better than Multi); good suit quality, avoid 6-5/6-4",
      "notes": "After (1x)-2♥-(pass)?: same system as after opening 2♥ (3♥/4♥=preemptive, 2NT asks singleton). Leaping Michaels: (2♥)-4♦=good hand 5♦+5♠.",
      "children": [
        {
          "id": "node-00000000-0000-0000-0004-000000000198",
          "bids": ["2NT"],
          "meaning": "Asks for singleton/void",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000199",
              "bids": ["3♣"],
              "meaning": "Singleton/void in clubs",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000200",
              "bids": ["3♦"],
              "meaning": "Singleton/void in diamonds",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000201",
              "bids": ["3♠"],
              "meaning": "Singleton/void in spades",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000202",
              "bids": ["3♥"],
              "meaning": "Minimum, no shortage",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000203",
              "bids": ["3NT"],
              "meaning": "Maximum, no shortage",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000204",
          "bids": ["3♣", "3♦", "3♠"],
          "meaning": "New suit — game force",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000205",
          "bids": ["3♥"],
          "meaning": "To play — 3-card support",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000206",
          "bids": ["4♥"],
          "meaning": "To play — 4-card support",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0004-000000000009",
      "bids": ["2♠"],
      "meaning": "8-11 HCP, 6+ spades — natural (better than Multi); good suit quality, avoid 6-5/6-4",
      "notes": "Leaping Michaels: (2♠)-4♦=good hand 5♦+5♥.",
      "children": [
        {
          "id": "node-00000000-0000-0000-0004-000000000207",
          "bids": ["2NT"],
          "meaning": "Asks for singleton/void",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000208",
              "bids": ["3♣"],
              "meaning": "Singleton/void in clubs",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000209",
              "bids": ["3♦"],
              "meaning": "Singleton/void in diamonds",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000210",
              "bids": ["3♥"],
              "meaning": "Singleton/void in hearts",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000211",
              "bids": ["3♠"],
              "meaning": "Minimum, no shortage",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000212",
              "bids": ["3NT"],
              "meaning": "Maximum, no shortage",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000213",
          "bids": ["3♣", "3♦", "3♥"],
          "meaning": "New suit — game force",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000214",
          "bids": ["3♠"],
          "meaning": "To play — 3-card support",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000215",
          "bids": ["4♠"],
          "meaning": "To play — 4-card support",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0004-00000000000a",
      "bids": ["2NT"],
      "meaning": "20-22 HCP, balanced",
      "notes": "Slam conventions: RKCB 1430 (5♣=1/4 aces, 5♦=0/3, 5♥=2 no queen, 5♠=2 with queen). Cuebids: A/K/singleton/void; cuebid of partner's suit = A or K ONLY. Last Train: last bid below game in cuebid sequence = mild slam try. 5NT Pick a slam: jump to 5NT when trump not fixed. Exclusion Keycard: jump past game = asks aces outside that suit.",
      "children": [
        {
          "id": "node-00000000-0000-0000-0004-000000000216",
          "bids": ["3♣"],
          "meaning": "Stayman",
          "children": [
            {
              "id": "node-00000000-0000-0000-0004-000000000217",
              "bids": ["3♦"],
              "meaning": "No major",
              "children": [
                {
                  "id": "node-00000000-0000-0000-0004-000000000218",
                  "bids": ["3♥"],
                  "meaning": "5 spades, 4 hearts — GF (Smolen; shows 4♥ so strong hand is declarer)",
                  "children": []
                },
                {
                  "id": "node-00000000-0000-0000-0004-000000000219",
                  "bids": ["3♠"],
                  "meaning": "5 hearts, 4 spades — GF (Smolen; shows 4♠ so strong hand is declarer)",
                  "children": []
                }
              ]
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000220",
              "bids": ["3♥"],
              "meaning": "4+ hearts",
              "children": []
            },
            {
              "id": "node-00000000-0000-0000-0004-000000000221",
              "bids": ["3♠"],
              "meaning": "4+ spades",
              "children": []
            }
          ]
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000222",
          "bids": ["3♦"],
          "meaning": "Transfer to hearts; accept=2-3, 3NT=4 hearts then cuebid, cuebid=3 hearts + good 5-card side suit",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000223",
          "bids": ["3♥"],
          "meaning": "Transfer to spades",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000224",
          "bids": ["4♣"],
          "meaning": "5-5 in both majors — slam invite; 4♦ from opener=no; 4M=yes",
          "children": []
        },
        {
          "id": "node-00000000-0000-0000-0004-000000000225",
          "bids": ["4♦"],
          "meaning": "5-5 in both majors — to play game; opener prefers and that is where you play",
          "children": []
        }
      ]
    },
    {
      "id": "node-00000000-0000-0000-0004-00000000000b",
      "bids": ["3♣", "3♦", "3♥", "3♠"],
      "meaning": "Preemptive opening",
      "notes": "Sound style at 2-level (2M) preferred. 3-level can be VERY weak alone. Free hand in 3rd seat. New major = natural constructive NF; new minor = cuebid. Style guide by seat/vulnerability — 3rd seat has free imagination.",
      "children": []
    }
  ]
}
$jsonIRG5$,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
END $$;
