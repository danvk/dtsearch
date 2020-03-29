# dtsearch

Find npm packages that have type declarations, either bundled or on [DefinitelyTyped].

Usage with `npx`:

```
$ npx dtsearch sprintf
   DLS NAME              TYPES             DESCRIPTION
533.3k sprintf           @types/sprintf    sprintf() for node.js
 47.4m sprintf-js        @types/sprintf-js JavaScript sprintf implementation
 82.9m extsprintf        @types/extsprintf extended POSIX-style sprintf
  2.1m ssf               <bundled>         Format data using ECMA-376 spreadsheet Format Codes
  1.6m printj            <bundled>         Pure-JS printf
  123k voca              @types/voca       The ultimate JavaScript string library
746.4k printf            <bundled>         Full implementation of the `printf` family in pure JS.
  1.5k sprintfjs         <bundled>         POSIX sprintf(3)-style String Formatting for JavaScript
   169 @jitesoft/sprintf <bundled>         sprintf function for javascript.
    94 stringd           <bundled>         A string variable parser for JavaScript
```

Alternatively, you can install `dtsearch` globally using either:

    npm install --global dtsearch
    yarn global add dtsearch

You can use `--yarn` or `--npm` to produce copy/pastable commands to depend on packages _and_ their types:

![Demonstration of search for a library and installing it using yarn](demo.gif)

## Background

There are two ways to distribute TypeScript types for a package on npm:

1. With the package itself ("bundled" or "included"). This is common if the package is written in TypeScript, or if the owner is committed to maintaining its type declarations. The tell-tale sign of bundled types is a `typings` entry in `package.json`.
2. As a separate `@types` package on [DefinitelyTyped]. This is more common for packages which are written in plain JavaScript or another language. The type declarations are often written by someone other than the package author.

Both approaches are common and there are many tradeoffs between them.

As a TypeScript user, you'll often find yourself wanting to search for a package that does X and has type declarations (of either form). The usual approach is to search for packages and then check if they have type declarations ([yarnpkg] has recently added TypeScript badges which help with this).

Once you've found a package, you need to run different commands depending on whether it bundles its types or gets them from DefinitelyTyped. For example, using `yarn` and [`moment`][moment]:

    yarn add moment  # bundled types

    # Types on DefinitelyTyped
    yarn add moment-timezone
    yarn add -D @types/moment-timzeone

`dtsearch` aims to solve these problems with a fast, simple CLI. It lets you search only packages with types and shows you the exact commands you need to run to add them to your project.

## How this works

This uses Algolia's [npm search][2], the same search that you find on [yarnpkg].

## Options

- `-n`, `--num <number>` Maximum number of results to show (default: 10)
- `--npm` Output `npm install` commands
- `-y`, `--yarn` Output yarn add commands
- `--bundled` Only show packages with bundled types
- `--dt` Only show packages with types on DefinitelyTyped (@types)
- `-u`, `--untyped` Search all packages, even those without type declarations.
- `--repo` Show repo URLs, even if package specifies a homepage
- `--debug` Enable debug logging

## Related Work

- The old [`typings search`](https://yarnpkg.com/package/typings) command from c. 2016 (before `@types`).
- Microsoft's [TypeSearch](https://microsoft.github.io/TypeSearch/). Unfortunately this only searches DefinitelyTyped and only searches package names. It does not search bundled types or package descriptions.
- [yarnpkg]'s search. This shows small "TS" icons next to packages with type declarations, either bundled or on DT. It does not surface a filter to search only packages with type declarations, however.
- [pikapkg] lets you search packages with a [`has:types`][pikasearch] filter. This only searches bundled typings; it does not consider types on DT.

## Support

If you like this tool, consider buying my book, [_Effective TypeScript_][ets]. [Chapter 6] and particularly Item 46 ("Understand the Three Versions Involved in Type Declarations") are all about the trials and tribulations of getting TypeScript types for your dependencies.

[DefinitelyTyped]: https://github.com/DefinitelyTyped/DefinitelyTyped
[2]: https://discourse.algolia.com/t/2016-algolia-community-gift-yarn-package-search/319
[moment]: https://momentjs.com/
[yarnpkg]: https://yarnpkg.com/
[pikapkg]: https://www.pika.dev/
[pikasearch]: https://www.pika.dev/search?q=has%3Atypes%20moment
[ets]: https://effectivetypescript.com/
[Chapter 6]: https://effectivetypescript.com/#Chapter-6-Types-Declarations-and-types
