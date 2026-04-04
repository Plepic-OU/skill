# Agentic Development Skills webapp

The webapp targets software developers. Allows users to
- self access their agentic coding skills
- store their results in the app backend
- share their results with others
- see path to development
- authenticate with social login

## Skills
See @skill-tree.md for details about skills available.

## Style
- use plepic design system 
-- https://github.com/Plepic-OU/public-web/raw/refs/heads/main/design-system.html
-- https://github.com/Plepic-OU/public-web/raw/refs/heads/main/design-system.css
- mobile-first, but with desktop support too
- playful > seriousness
- less is more
- world class UX
- Remember, main Plepic color is the green defined there. Orange is to be used only sparingly

## Non-functional
Focus on code quality and automated tests. Pre-commit hooks for code quality.
Include Gherkin style BDD tests to cover main user flows. 
In tests use firebase testing framework. For E2E tests use firebase emulator.
Use modern and mature web technologies, prefer pnpm over npm.
Typescript with strong types.

Use Google Firebase for authentication and for storing user skills.
SPA hosted in github pages (skill.plepic.com is already forwarded to the repo)
Infra setup as much as possible with terraform.

## Agentic native development
We use claude code
When starting to use any 3rd party technology, we use context7 for up to date examples
Project decisions are documented in CLAUDE.md
We use chrome dev tools
Task cleanup up (updating documentations and commit) is done by AI Agent too.