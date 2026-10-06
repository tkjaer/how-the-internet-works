# Contributing

Thank you for helping! Issues and pull requests are welcome.

## Run it

```sh
npm install && npm run dev   # then open http://localhost:5173/
npm run dev -- --host        # to try it on a phone on the same network
npm test                     # content validation, routes, layer stacks, URLs (Vitest)
npm run build                # type-check + static build into dist/
```

The engine is in `src/` and the content in `content/`: nodes, technologies, layers, dive scenes, places, eras,
languages and themes are each added as a folder ([docs/authoring.md](docs/authoring.md)). The location is in the URL,
e.g. `#/da/on-the-go/watch-video/internet/@mobile-core`; `?level=technical` starts at the technical level,
`?mode=night` at night and `?sound=off` muted ([docs/architecture.md](docs/architecture.md#from-url-to-pixels)).

## Checks in a browser

`npm run evaluate` runs headless Chrome (Playwright) against a preview of a fresh build:

```sh
npm run build && npx vite preview --host 127.0.0.1 --port 5318 &
npm run evaluate                      # screenshots in docs/img/app-* and frame times in docs/app-metrics.json
npm run evaluate -- --only=perf       # frame times only
npm run evaluate -- --only=a11y       # accessibility (docs/accessibility.md); writes nothing
npm run evaluate -- --only=subpath    # serves dist/ itself under /how-the-internet-works/, as GitHub Pages does
```

Runs on one machine take turns (a lock in the temp dir), so parallel worktrees don't skew each other's timings; set
`EVALUATE_NO_LOCK=1` to skip it (CI). The details are under Performance in
[docs/architecture.md](docs/architecture.md#performance). Two more scripts use the same preview and lock:
`node scripts/record-clip.mjs` records the README clip (and a square cut with captions for social media, to `out/clip/`),
and `node scripts/link-preview.mjs` draws the link preview image and the icons in `public/`.

## License of contributions

This project is licensed under [AGPL-3.0-or-later](LICENSE), with the additional terms in [NOTICE.md](NOTICE.md).
By contributing, you agree that your contribution is licensed under the same terms ("inbound = outbound"). You keep
the copyright in your own work.

## Sign off your commits (DCO)

We use the [Developer Certificate of Origin](https://developercertificate.org/) (DCO): by signing off a commit you
certify that you wrote it, or otherwise have the right to submit it under this project's license. Add the sign-off
with `-s`:

```sh
git commit -s -m "Explain the fibre splitter"
```

This adds a line with your name and email, which must be your real name:

```
Signed-off-by: Your Name <you@example.com>
```

Forgot it? `git commit --amend -s` fixes the last commit, and `git rebase --signoff main` all commits on your branch.

## Before you open a pull request

- `npm test` and `npm run build` pass.
- New content is added as folders under `content/` ([docs/authoring.md](docs/authoring.md)); the engine in `src/`
  names no content ids ([docs/architecture.md](docs/architecture.md)).
- Text is in English, Danish and German, at both levels (Simple and Technical: the `kid` and `nerd` keys) where it differs.
