# Portfolio V2

Local working branch: `v2-redesign`.

The local tag `v1-before-redesign-2026-09-30` preserves the original committed site at `de8c1092c083cbd5805759e54f0ab8d2b282d139`. The original checkout is maintained separately and has not been changed.

## Preview

Run `python3 scripts/preview.py`, then open <http://127.0.0.1:4173/>. The browser refreshes after files in `docs/` change. The server binds to this computer only and serves only `docs/`, with directory listings disabled. Keep reference packages, career notes and other private files outside this repository and its document root.

## Pages

- `docs/index.html`: Home and selected work
- `docs/sroi.html`: Calculator case study
- `docs/reporting.html`: Warehouse and reporting
- `docs/music.html`: Music journalism
- `docs/warfield.html`: Interview feature
- `docs/profiles.html`: Profile writing and editing
- `docs/about.html`: About, contact and resume

The seven pages currently preserve the selected Claude Design export, including its shared `site.js`, `support.js` and `image-slot.js`. Earlier concepts were not imported. Page content and most styling currently live in each HTML file; the exported editor runtime is retained for initial design review and needs replacement before release. Images are in `docs/images/` and `docs/uploads/`. Original V1 assets remain available during migration.

## Publishing

The existing GitHub Pages deployment records use `main`, and the live homepage matches `docs/index.html`. The saved Pages source setting still needs confirmation. This V2 branch is local only. Do not push, merge into `main`, or publish without explicit approval of the exact change.

The imported design contains placeholders and assets requiring review. Local preview availability is not release approval. Review content, asset permissions, links, keyboard access, mobile layouts and reduced motion before publication. Do not expose the private review resume as a public download.
