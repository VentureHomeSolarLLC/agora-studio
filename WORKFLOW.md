# Development Workflow with PRs

## Branch Structure

```
main (production) ←── PR ←── develop ←── PR ←── feature/*
     ↑                                               
     └──────── hotfix/* (emergency fixes) ───────────┘
```

## Branches

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `main` | Production code | https://help.venturehome.com |
| `develop` | Integration branch | https://staging.help.venturehome.com |
| `feature/*` | New features | - |
| `hotfix/*` | Emergency fixes | - |

## Workflow

### 1. Start New Feature
```bash
git checkout develop
git pull origin develop
git checkout -b feature/visual-page-builder
git push origin feature/visual-page-builder
```

### 2. Create Pull Request
1. Go to: https://github.com/VentureHomeSolarLLC/agora-studio/pulls
2. Click "New Pull Request"
3. **base:** `develop`, **compare:** `feature/visual-page-builder`
4. Fill in PR description:
   - What changed
   - Why
   - Testing notes
5. Request review
6. Merge when approved

### 3. Deploy to Staging
Merging to `develop` auto-deploys to staging.

### 4. Deploy to Production
Create PR from `develop` → `main`
- Review and merge
- Auto-deploys to production

## Hotfix Process (Emergency)

For critical bugs in production:
```bash
git checkout main
git checkout -b hotfix/critical-bug
git push origin hotfix/critical-bug
```

Create PR directly to `main` (bypassing develop).

## Setting Up Branch Protection

### Step 1: Protect `main` Branch
1. Go to: https://github.com/VentureHomeSolarLLC/agora-studio/settings/branches
2. Click "Add rule"
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Dismiss stale PR approvals when new commits are pushed
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators
   - ✅ Restrict pushes that create files larger than 100MB

### Step 2: Protect `develop` Branch
Same as above, but for `develop` branch.

## Commit Message Format

Follow conventional commits:
```
feat: Add new feature
fix: Fix a bug
docs: Documentation changes
style: Code style changes
refactor: Code refactoring
test: Adding tests
chore: Maintenance tasks
```

Example:
```bash
git commit -m "feat: Add drag-and-drop page builder"
```

## Current Setup

✅ `develop` branch created
✅ Staging deployment workflow
✅ Production deployment from `main` only

**Next: Set up branch protection in GitHub UI**
