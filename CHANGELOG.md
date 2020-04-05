# Changelog

## (Unreleased)

## 1.1.0 - 2020-04-05

- Added `--stars` flag to show GitHub star counts. Currently off by default since it has to do a GitHub GraphQL query _after_ Algolia returns, which slows the command down. But I may revisit this if it proves useful.
- Show the query that was run when there are no results (which may not be obvious when it's multiple words).

## 1.0.2 - 2020-04-01

- Initial version publicized. See [reddit post].

[reddit post]: https://www.reddit.com/r/typescript/comments/ftvegk/dtsearch_cli_to_find_npm_packages_with_types/
