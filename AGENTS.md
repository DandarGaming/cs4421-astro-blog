## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Review workflow

- Complete the requested work and run the relevant checks once. If those checks pass, report the results and stop rather than repeating the same checks.
- Leave changes unstaged and uncommitted for the user's review. Only stage or commit after the user explicitly approves or requests a commit.
- Never push unless the user explicitly requests a push.
- For each acceptance criterion, give a concise pass/fail result backed by implementation or test evidence. Distinguish verified behavior from assumptions or deployment behavior that was not tested.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
