# Contributing to @hgraph/agent

## Commit Message Conventions

This project uses conventional commits to automatically determine version bumps:

### Version Bumps

- **Minor version** (1.x.0): New features
  - `feat:` or `feature:` - New feature
  - Example: `feat: add support for custom models`

- **Patch version** (1.0.x): Bug fixes and maintenance
  - `fix:` or `bugfix:` - Bug fixes
  - `patch:` - Small patches
  - `chore:` - Maintenance tasks
  - `docs:` - Documentation only
  - `style:` - Code style changes
  - `refactor:` - Code refactoring
  - `perf:` - Performance improvements
  - `test:` - Test additions or fixes
  - `build:` - Build system changes
  - `ci:` - CI configuration changes
  - Example: `fix: resolve memory leak in agent execution`

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

- **type**: One of the types listed above
- **scope**: Optional, the area of code affected (e.g., `agent`, `tools`, `model`)
- **subject**: Short description of the change
- **body**: Optional, detailed explanation
- **footer**: Optional, references to issues

### Examples

```bash
# Minor version bump
git commit -m "feat: add streaming support for all tools"
git commit -m "feature(agent): implement retry mechanism"

# Patch version bump
git commit -m "fix: correct TypeScript types for tool parameters"
git commit -m "chore: update dependencies"
git commit -m "docs: improve README examples"
```

## Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure lint passes: `npm run lint`
5. Ensure build passes: `npm run build`
6. Commit with conventional commit message
7. Push and create a pull request

## Release Process

### Automatic Release (on push to main)

When changes are pushed to the main branch, the release workflow will:
1. Analyze commit messages since last release
2. Determine version bump (patch or minor)
3. Run lint and build
4. Bump version and create git tag
5. Publish to npm with public access
6. Create GitHub release with changelog

### Manual Release

For manual releases, use the GitHub Actions UI:
1. Go to Actions → Manual Release
2. Click "Run workflow"
3. Select version bump type (patch, minor, or major)
4. The workflow will handle the rest

## Setup Requirements

To enable automatic publishing, set the following secret in your GitHub repository:
- `NPM_TOKEN`: Your npm authentication token for publishing