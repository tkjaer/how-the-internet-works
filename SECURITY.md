# Security

How the Internet Works is a static site: no accounts and no server code of its own. Its one data collection, a visit
count, runs on a separate server set up in [tkjaer/open-stats](https://github.com/tkjaer/open-stats) (see
[privacy](docs/privacy.md#counting-visits)). Security issues are still possible, for example in the build tooling,
the dependencies or the CI workflows. Issues in the stats server belong in open-stats.

## Reporting a problem

Please **don't open a public issue**. Report it privately through
[GitHub's private vulnerability reporting](https://github.com/tkjaer/how-the-internet-works/security/advisories/new).
I'll reply as soon as I can and credit you in the fix unless you'd rather not be named.

## Supported versions

Only the current `main` branch (the published site) gets fixes.
