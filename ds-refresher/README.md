# DS Refresher — Data Science Visual Refresher

A personal, self-paced, interactive web app that re-activates the knowledge from
the **IBM Data Science Professional Certificate** (Coursera, 2019 · 9 courses)
without re-taking ~100 hours of coursework. Built visual-first: every concept is
taught by a manipulable interactive — sliders, drag, step-through animation —
with compact code snippets as secondary and self-check quizzes for retention.

## The eight modules

1. **Data Science Methodology** — the 10-stage IBM loop (interactive) + question→approach matcher
2. **Python for Data Science** — broadcasting visualizer, split-apply-combine player, merge lab
3. **Databases & SQL** — join visualizer (+ Venn), logical query-order pipeline
4. **Data Wrangling** — missing-data flowchart, scaling lab, binning slider, one-hot animation
5. **EDA & Statistics** — Pearson playground, Anscombe's quartet, ANOVA intuition, boxplot anatomy
6. **Regression & Model Evaluation** — the flagship **Overfit Lab**, least-squares, k-fold CV, ridge shrinkage, pipeline diagram
7. **Data Visualization** — matplotlib figure anatomy, chart chooser, same-data-five-charts, waffle/word cloud
8. **Machine Learning** — KNN, decision trees, logistic regression, SVM, k-means, hierarchical, DBSCAN, recommenders, confusion-matrix lab + 2019 capstone retrospective

## Tech stack

- **Vite + React 19 + TypeScript**, `react-router-dom` (HashRouter)
- **Tailwind CSS v4** — dark-mode default, IBM Plex Sans/Mono, one accent hue per module
- **Custom SVG** for every interactive (d3-scale / d3-shape as utilities only — no charting library)
- **KaTeX** for the handful of formulas, **Prism** for syntax highlighting
- **localStorage** for progress + best quiz scores (no backend, no auth, single user)
- Respects `prefers-reduced-motion` — every animation has step-button fallbacks

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # preview the production build
npm run lint     # eslint
```

## Deploy

Static build, zero server code. Deploys to **Vercel** as-is (`vercel.json` included).
The app uses `HashRouter`, so deep links work on any static host without rewrite
rules; the included rewrite is belt-and-suspenders.

## Design principles

- **Visual first:** the diagram is at the top of every concept; prose is ≤150 words; code is collapsed behind "Show the code."
- **Manipulable, not static:** every core concept has at least one slider / drag / step-through interactive.
- **Spatial memory anchors:** consistent per-module accent colors ("the blue module is SQL").
- **Retention-checked:** 8–10 quiz questions per module, shuffled each attempt, with mandatory explanations; ≥80% marks a module mastered.
