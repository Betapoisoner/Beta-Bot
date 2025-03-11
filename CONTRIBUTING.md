# Contribution Guidelines

## Code Style
- 2-space indentation
- TypeScript strict mode
- ESLint rules enforced
- Prettier formatting
- JSDoc comments for public methods

## Development Workflow
1. Create feature branch: `git checkout -b feat/feature-name`
2. Install dependencies: `pnpm install`
3. Develop with watch mode: `pnpm dev`
4. Write tests for new features
5. Format code: `pnpm format`
6. Lint code: `pnpm lint`
7. Commit using conventional commits: `pnpm commit`

## Testing Guidelines
- Place tests in `__tests__` directories
- Use Jest for unit tests
- Aim for 80%+ coverage
- Mock external services
- Update snapshot tests when UI changes

## Documentation
- Update README for user-facing changes
- Add JSDoc comments for API changes
- Keep type definitions in `/src/interfaces`

## Pull Requests
- Reference related issues
- Include screenshots for UI changes
- Provide testing evidence
- Allow maintainer edits