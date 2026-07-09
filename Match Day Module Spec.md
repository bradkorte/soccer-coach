# Match Day Module — Product Specification

**Status:** Implemented  
**Last updated:** July 2026

---

## Overview

Match Day is the operational core of Khula. It covers the full match lifecycle: preparation before kick-off, live tracking during the match, and structured review after. It connects data from the Team module (squad, lineup) and feeds results back into the Season module (game log, player profiles).

The module has five distinct phases, each with its own screen:

| Phase | Screen | Entry Point |
|---|---|---|
| 1. Preparation | Match Day Hub | Bottom nav → Match |
| 2. Lineup building | Squad/Lineup Screen | Checklist → Line-up |
| 3. Live match | Match Screen | START MATCH or Quick Play |
| 4. Quick log | Quick Play Screen | QUICK PLAY |
| 5. Post-match review | Post-Match Review Screen | Automatic on game save |

---

## Phase 1 — Match Day Hub

**Screen:** `MatchDayScreen`

The hub is the starting point for every match. It persists match context between visits via a `contextKey` derived from the fixture and opponent, so prep work (lineup, scouting, settings) is remembered per match.

### Opposition Selector

A dropdown (or free-text input) at the top of the screen for selecting the opponent before anything else is visible. Behaviour:

- Defaults to the **next scheduled fixture** opponent if one exists, pre-populated automatically.
- Falls back to a dropdown of all teams from the fixtures list.
- "Custom…" option opens a free-text input for friendlies or unlisted opponents.
- Switching opponents reloads the context data (checklist status, saved lineup) for that specific match.

### Hero Card — Match Context

Shows both teams side by side with their badges, HOME/AWAY labels, and fixture metadata (date, time, venue) if the opponent matches a scheduled fixture. Shows "Friendly / no fixture" if no fixture link exists.

### Action Buttons

Two full-width buttons sit between the hero card and the checklist:

**QUICK PLAY** (dark, always available)
— Skips lineup and jumps directly to the Quick Play screen. For when you just want to log a score.

**START MATCH** (green when ready, disabled otherwise)
— Launches the live Match Screen using the saved lineup. Disabled with the label "Save your line-up first" until a lineup exists for the selected opponent.

### Pre-Match Checklist

Four nav rows with status indicators (Ready ✓ / Review →):

| Row | Destination | Unlock condition | Status tracked |
|---|---|---|---|
| Players | Player availability screen | Always accessible | `playersSeen` flag |
| Line-up | Lineup builder | Players must be reviewed first | Lineup saved |
| Scout | Opponent Stats screen | Opponent must be selected | `scoutSeen` flag |
| Match Settings | Settings screen (Match tab) | Always accessible | `settingsSeen` flag |

Status flags are stored in `contextData` per match, so they survive navigation away and back. The Line-up row is visually dimmed and non-tappable until Players has been reviewed.

### Upcoming Fixtures Card

Shows the next 3 fixtures for the team. Tapping any row switches the opponent selector to that team and loads their context. A green tick appears on rows where a lineup has already been saved.

---

## Phase 2 — Lineup Building

**Screen:** `SquadScreen` (mode: lineup)

Accessed via the Pre-Match Checklist → Line-up row. The lineup builder shows the full squad and allows the coach to assign players to positions across periods and halves. Data is saved to `contextData.lineup` keyed by match.

What's configured here:
- Formation (inherited from Match Settings / Team Settings default)
- Player-to-position assignments per period per half
- Number of periods (from Match Settings)

The saved lineup is what `START MATCH` launches with.

---

## Phase 3 — Live Match

**Screen:** `MatchScreen`

The live tracking screen. Launched from START MATCH with the saved lineup loaded.

### Three tabs (SectionTabs)

**Overview tab**
- Live pitch view showing current player positions
- Running game clock (count-down per period)
- Period navigation — auto-advances, can be manually overridden
- Substitution plan: shows upcoming period changes with time-until-next-sub countdown
- Quick event buttons for logging goals and match events

**Line-up tab**
- Half/period selector
- Pitch view for any past or future period
- Diff view showing swap pairs between consecutive periods (colour-coded by in/out status)

**Events tab**
- Chronological event log for the match
- Goal logging with scorer and assist attribution
- Match events (yellow card, injury, corner, free kick, etc.) with player, category, and free-text note
- Quick Notes: voice-dictated or typed observations captured in real time

### Clock behaviour
- Counts down from period duration (set in Match Settings)
- Auto-advances to next period when timer reaches zero
- Bell/alarm fires at the period boundary
- Manual override available via period chip taps

### Goal logging
- Goals can be attributed to us or them
- Our goals take scorer + assist player (from squad)
- Half and time-within-half are recorded automatically

### Saving
- "End Match" saves the full game object (lineup, goals, events, voice notes, auto-generated report) and navigates to Post-Match Review.

---

## Phase 4 — Quick Play

**Screen:** `QuickPlayScreen`

A lightweight alternative to the full match flow. No lineup required.

What it captures:
- Final score (stepper: +/− for us and them)
- Goal scorers (squad names, with count per player)
- Player of the Match (squad selector)
- Coach Notes (free text + voice dictation)

On save, creates a game object with empty `halves` and `matchEvents` arrays, then routes to Post-Match Review.

---

## Phase 5 — Post-Match Review

**Screen:** `PostMatchReviewScreen`

A four-step wizard presented after every completed match (full or quick play).

### Step 0 — Match Summary

Displays:
- Result badge (WIN / DRAW / LOSS) with colour coding
- Final score
- Goals list with scorer, assist, half, and time
- Match events log
- Voice note transcript (with delete option)

### Step 1 — Star Ratings

Two rating panels (1–5 stars per dimension), voice dictation on each free-text field:

**Opponent ratings:**
Overall Strength, Attacking, Defending, Passing, Pressing, Physicality, Goalkeeper

**Our team ratings:**
Overall Performance, Team Shape, Communication, Work Rate, Decision Making, Composure, Finishing

Free-text fields for: what the opponent did well, what caused problems, and advice for playing them again in future.

### Step 2 — Our Notes

Free-text fields (each with voice dictation toggle):
- What pleased you
- What to improve

Player-specific observations panel — shows all squad members, each with a free-text notes field. Fills into the player's profile under Development.

Most Improved player selector (chip grid of squad names).

### Step 3 — Training Priorities

19 pre-defined training focus areas presented as a chip grid. Up to 3 can be selected. Selection flows into:
- The post-match output (parent summary, team analysis)
- The AI review prompt

### Output generation

A single "Generate Report" button triggers:

1. **Local outputs** (no network required):
   - Parent summary (emoji + result + 2 key points — copy-to-clipboard)
   - Team analysis (tactical summary — copy-to-clipboard)

2. **AI review** (calls Claude claude-sonnet-4-6):
   - 3–4 paragraph match review
   - Inputs: score, goals, events, voice notes, coach notes, player observations, player development focus from profiles
   - Output is displayed inline with a copy button

All outputs and ratings are saved to `soccerCoach_allPostMatch` (last 50 entries) and player notes are written back to individual player profiles.

---

## Data Flow

```
Match Settings (Settings screen)
  └─ formation, numPeriods, periodMins
       └─ Lineup Builder (SquadScreen)
            └─ contextData.lineup
                 └─ Match Screen (MatchScreen)
                      ├─ goals[]
                      ├─ matchEvents[]
                      ├─ halves[] (period/slot assignments)
                      ├─ voiceNotes
                      └─ Game object saved to soccerCoach_games
                           └─ Post-Match Review (PostMatchReviewScreen)
                                ├─ oppR, ourR (star ratings)
                                ├─ notes (text fields)
                                ├─ priorities (training focus)
                                ├─ playerNotes → player profiles
                                └─ saved to soccerCoach_allPostMatch
```

Results surface in:
- Season module → Game Log, Recent Games
- Season module → Season Snapshot (last result)
- Team module → Recent Activity
- Player Profile → History tab, Development tab

---

## Context Persistence

Each match's prep state is stored under a key derived from the fixture and opponent (`makeContextKey`). This means:

- Multiple upcoming matches can have independent lineups and prep states simultaneously.
- Switching between opponents in the hub loads/unloads the correct context.
- Checklist status (Players Seen, Scout Seen, etc.) persists between app sessions.

---

## Match Settings (accessed via Checklist → Match Settings)

Stored in Settings screen, Match tab:

| Setting | Default | Description |
|---|---|---|
| Periods per half | 2 | How many rotation periods per half |
| Minutes per period | 10 | Duration of each period |
| Number of halves | 2 | Full game halves |

These values drive the clock, the lineup builder period count, and the minutes-played calculation in player stats.

---

## Known Gaps / Future Considerations

- **No half-time break indicator** — the transition between half 1 and half 2 isn't explicitly prompted; the coach navigates manually.
- **Quick Play doesn't capture halves or events** — the game object saved has empty arrays, so player stats (minutes played) can't be computed from quick play games.
- **AI review requires network** — no offline fallback; the local outputs still generate, but the AI paragraph is silently skipped on failure.
- **Star ratings not persisted to the game object** — ratings live only in `soccerCoach_allPostMatch`, not in the individual game record. Re-opening a game's match report doesn't show previous ratings.
- **Match Day hub has no summary metrics** — unlike Team and Season, the hub doesn't show any season-to-date stats or a hero card showing current form. A small context bar (e.g. season record, last result) would align it with the KHULA design standard.
- **No "resume match" state** — if the app is closed mid-match, in-progress state is lost. Game is only saved on explicit "End Match".
