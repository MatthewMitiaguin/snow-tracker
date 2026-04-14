# Snow CLI

## Purpose

This project is a decision tool, not a data viewer.

All features should help answer:
"Should I go skiing, and where?"

---

## Current state

- Fetches snow conditions for a single resort
- Parses data from snow-forecast (HTML scraping)
- TypeScript CLI using Commander.js
- Clean separation between parsing, types, and config

---

## Vision

Three core features, build in this order:

### 1. Scoring engine (`snow check <resort>`)

Rate conditions 1–10 answering:
- Is there fresh snow coming?
- Is it enough to matter?
- Will it still be good by the weekend?
- Is it worth the trip?

Inputs:
- Fresh snowfall (last 24–72h)
- Forecast snowfall (next 3–5 days)
- Base depth
- Temperature (powder vs slush)
- Wind (lifts + visibility)

Output example:

$ snow check falls-creek  
🔥 8.7/10
- 25cm forecast Thurs–Fri  
- Cold temps → good quality powder  
- Base: 140cm (solid coverage)  
- Low wind expected  

Best day: Saturday morning  

---

### 2. Multi-resort comparison (`snow compare`)

Compare all Australian resorts side by side, ranked by score.

Target resorts:
- Falls Creek
- Mount Hotham
- Perisher
- Thredbo

Output example:

$ snow compare  
Resort         Score   Fresh   Base   Verdict  
Hotham         8.7     25cm    140cm  🔥 Best option  
Falls Creek    7.9     18cm    130cm  ✅ Good  
Perisher       6.2     5cm     110cm  😐 Meh  

---

### 3. Powder alerts (`snow alerts`)

Alert when conditions are exceptional:

- >15cm forecast in next 48h  
- First big dump of the season  
- Best conditions in recent weeks  

Output example:

$ snow alerts  
🚨 Hotham: 18cm forecast Friday  
🚨 Perisher: 22cm over 3 days  

👉 This weekend is your best window in 3 weeks  

Future:
- Push to Slack/Discord webhook
- Simple persistence layer (file or lightweight DB)

---

## Architecture rules

- `parsers/` → responsible ONLY for extracting raw data from HTML (no business logic)
- `services/` → contains all scoring and decision logic
- `config/` → static resort definitions (URLs, metadata)
- `types/` → shared TypeScript types
- CLI layer → formatting + user output only (no logic)

Do NOT mix parsing and scoring logic.

---

## Change guidelines

- Prefer modifying existing files over creating new ones
- Keep functions small and pure where possible
- Do not break existing CLI output unless explicitly asked
- Maintain existing TypeScript types — extend them rather than replacing
- Add or update tests when modifying parsing or scoring logic

---

## Types

- `ConditionsReport` is the core domain object
- All scoring functions should accept `ConditionsReport`
- Scoring should return:
  - numeric score (0–10)
  - explanation / contributing factors

Avoid loosely typed objects — prefer explicit interfaces.

---

## Scoring system design

Score should be composed of weighted factors:

- Fresh snowfall (0–4 points)
- Forecast snowfall (0–3 points)
- Base depth (0–2 points)
- Weather penalties (temperature, wind) (-3 to 0)

Final score normalized to 0–10.

Scoring must be explainable — return both score and contributing factors.

---

## Snow quality heuristics

- Fresh snow + temps below -2°C = good powder
- Fresh snow + temps above 0°C = heavy/slushy (penalty)
- Wind above 60km/h = likely lift closures (penalty)
- 15cm+ fresh in 48h = worth the trip
- Base depth below 50cm = patchy coverage (penalty)

---

## CLI output rules

- Output should be concise and human-readable
- Use emojis sparingly for clarity (🔥, ✅, 😐)
- Always include:
  - score
  - key contributing factors
  - clear recommendation

Do not introduce verbose or debug-heavy output.

---

## Tech decisions

- TypeScript, no framework
- CLI-first design
- May add API mode later
- No AI/LLM in scoring — deterministic heuristics only

---

## Future considerations

- Multi-resort support should reuse shared scoring logic
- Alerts will likely require persistence (file or lightweight storage)
- API mode may be added later — keep business logic framework-agnostic