To-do:

- [x] Show GitHub repo if homepage is missing
- [x] Fill width of terminal
- [x] Add a binary
- [x] Highlight matching terms
- [ ] Distribute it
  - [x] Check on the name (dtsearch is good)
  - [ ] Put it on GitHub
  - [ ] Fill out the readme
- [x] Flag parsing
  - [x] -y/--yarn and -n/--npm
  - [x] Number of results
  - [x] Allow results w/o types
- [ ] Nits
  - [ ] Only use the flame character if the terminal supports it
  - [ ] Exclude "POP" column if nothing is popular
  - [x] Show "for untyped results, use -u"
  - [x] Unescape html entities (dateformat / &#39;)
  - [x] Refactor columns + formatting
  - [x] Add a "no results" output

Punt:

- [ ] Get my own Algolia API key (they only offer a 14 day free trial)
- [ ] Count emojis as double-wide for width (dtsearch --num 20 solar)
      This seems hard, see https://github.com/xtermjs/xterm.js/pull/2568
      Alternatively, uses curses to write text at a specific position.
