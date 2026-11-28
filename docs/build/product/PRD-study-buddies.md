# PRD — Study buddies, sign-up and the Me page

Status: in build · Owner: product · Date: 2026-11-27 · Stage: 0 · Depends on: PRD-subjects-skills-revamp

## Why
"Learn With Me — but with whom?" People keep studying when they have at least one peer.
Today accounts are created by the owner only, so strangers can't find each other.

## Outcome
**Learners who connect with a buddy keep practising.** Measure: 14-day return rate of learners
with ≥1 accepted buddy vs without. Guardrails: reports per 100 active users; blocked-after-
first-message rate.
Activation event: first accepted buddy request.

## Decisions (user, 2026-11-27)
- Anyone may use it (minors possible) → safety defaults below are not optional.
- Sign-up = **username + password only**; email optional (for recovery later); no emails sent.
- Peers see general info + interests. In-app messages + a Discord username field
  (Discord OAuth "link account" later). Format chosen by us: opt-in study buddies.
- Forum: not in this slice (owner to discuss with partner).

## Slices
### B1 — Sign-up & login
- `/signup`: username (3–20, `a-z 0-9 _ .`, unique, case-insensitive), password (≥ 8).
- Login accepts username or email. Existing users get a username derived from their email.
- Sign-ups and failed logins are throttled.

AC
- Given a taken username (any case), sign-up is refused with a clear message.
- Given 10 failed logins for one username within 15 min, further attempts are refused for that window.

### B2 — Me page (personal section)
- `/me`: display name, @username, bio, interests (tags), subjects I'm learning, Discord
  username, optional recovery email, "show me to study buddies" toggle; my skill charts;
  my buddies and requests.

### B3 — Study buddies
- Only learners who **opted in** are discoverable, and only opted-in learners can send requests.
- Suggestions ranked by shared subjects, then shared interests.
- Request → the other person accepts or declines. **Messaging and Discord are visible only
  between accepted buddies.** Declines are silent.
- Block (either side, any time) ends the connection and hides each from the other everywhere.
- Report a person or a message → owner sees it in Studio → Reports.
- Limits: 20 requests/day, messages ≤ 2000 chars, ~1 message/second.

AC
- Given A has not opted in, B never sees A in suggestions and cannot send A a request.
- Given a pending or declined request, neither side can message; Discord is not shown.
- Given A blocked B, B cannot see A, request A, or message A — and vice versa.
- Given a report, the owner sees reporter, reported user, the message (if any) and reason.

## Out
Forum, Discord OAuth, email verification/reset, push/real-time (threads refresh by polling),
group study rooms.
