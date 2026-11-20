# Checklist — Stage 1: Outline

Each item is PASS or FAIL. One FAIL = stage FAIL.

## Accuracy
- [ ] Every step can be done in the current version of the tool named in brief.md.
- [ ] Every UI label in quotes matches the live app exactly (case and wording).
      Verify with `node ../../scripts/probe.mjs <url> "Label 1" "Label 2" ...`.
      If the page needs login and no session exists, mark the label "NEEDS MANUAL CHECK" (not PASS).
- [ ] No step is missing between two steps (a beginner could not get stuck).

## Completeness
- [ ] The outline states the start state (what the viewer sees first).
- [ ] The outline states the end state, and it matches the Goal in brief.md.
- [ ] One clear action per step.

## Length
- [ ] Estimated time fits the video length in brief.md (allow ±10%).
      Estimate: ~12 seconds per simple step, ~20 seconds per step with typing.
