# Contributing

Thanks for helping improve `stellar-toml-lint`. Please keep changes focused and include tests for observable behavior.

## Local setup

1. Install Node.js 18+ and npm.
2. Clone the repository and run `npm ci`.
3. Run `npm run build`, `npm run lint`, `npm run typecheck`, and `npm run test:coverage`.

Useful scripts:

| Script                                 | Purpose                                 |
| -------------------------------------- | --------------------------------------- |
| `npm run dev -- --file ./stellar.toml` | Run the CLI from TypeScript             |
| `npm test`                             | Run tests                               |
| `npm run test:coverage`                | Run tests with coverage thresholds      |
| `npm run lint`                         | Check ESLint rules                      |
| `npm run format`                       | Format project files with Prettier      |
| `npm run typecheck`                    | Type-check without emitting             |
| `npm run build`                        | Create ESM, CJS, and declaration builds |

## Adding a rule

1. Choose the group file in `src/rules/` (or create one for a new group). Define a `Rule` with a stable uppercase `id`, severity, description, and a `check(ctx)` function.
2. Return `LintIssue` objects with actionable messages and hints. Include `path` when the issue maps to a TOML key.
3. Export the rule from its group and add it to `defaultRules` in `src/rules/index.ts`.
4. Add a regression test in the matching `tests/<group>.test.ts`. Include at least one valid and one invalid case.
5. Add the rule and its severity to the README rule table.
6. Run formatting, lint, type-checking, coverage tests, and build.

Example:

```ts
const descriptionRule: Rule = {
  id: "ORG_DESCRIPTION_MISSING",
  severity: "info",
  description: "Documentation should include an organization description.",
  check: ({ toml }) => {
    const documentation = toml.DOCUMENTATION;
    if (typeof documentation !== "object" || documentation === null) return [];
    if ("ORG_DESCRIPTION" in documentation) return [];
    return [
      {
        rule: "ORG_DESCRIPTION_MISSING",
        severity: "info",
        message: "DOCUMENTATION.ORG_DESCRIPTION is missing.",
        path: "DOCUMENTATION.ORG_DESCRIPTION",
        hint: "Add a short organization description.",
      },
    ];
  },
};
```

```ts
it("reports a missing description", () => {
  expect(
    descriptionRule.check({ toml: { DOCUMENTATION: {} }, raw: "" })[0]?.rule,
  ).toBe("ORG_DESCRIPTION_MISSING");
});
```

When SEP-1 requirements are unclear, prefer a warning or informational result rather than inventing an error requirement, and document verification with a TODO comment.

## Issues and Drips Wave

Before starting substantial work, open or claim an issue so its scope and acceptance criteria are clear. This project participates in Drips Wave; PRs are reviewed against the issue acceptance criteria. Link your PR to the issue and explain how each criterion is met.

## Commit messages

Use Conventional Commits, for example `feat: add validator URL rule`, `fix: reject malformed public keys`, or `docs: clarify CLI exit codes`.

## Pull request checklist

- [ ] The change is linked to an issue (or explains why no issue is needed).
- [ ] Tests cover the changed behavior and do not access the real network.
- [ ] `npm run format`, `npm run lint`, `npm run typecheck`, `npm run test:coverage`, and `npm run build` pass.
- [ ] Documentation and the rule table are updated when relevant.
- [ ] The PR description maps implementation and tests to issue acceptance criteria.
