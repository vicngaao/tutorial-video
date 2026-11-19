# Checklist — Stage 2: Script + Shots

## Coverage
- [ ] Every outline step appears in script.md and shots.json, in the same order.
- [ ] No shot exists that is not in the outline.

## Timing
- [ ] Spoken word count ≈ (video minutes × words per minute from brief.md), ±10%.
      Count with: `python3 scripts/compare_text.py --count script.md`
- [ ] Sum of `hold_ms` in shots.json is within ±10% of the target video length.

## Mapping
- [ ] Every narration sentence maps to exactly one shot (`say` field).
- [ ] Every shot has a valid `do` value: goto, click, type, press, hover, scroll, wait.
- [ ] Every click/type/hover shot has a `target` (Playwright selector).
- [ ] Every type shot has a `text` field. Every goto shot has a `url` field.
- [ ] shots.json is valid JSON: `python3 -m json.tool shots.json > /dev/null`

## Language
- [ ] Beginner-friendly. No jargon without a short explanation.
- [ ] UI labels in the narration match the labels in outline.md exactly.
