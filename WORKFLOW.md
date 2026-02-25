# Agora Studio - Development Workflow

## Branching Strategy

### Main Branches
- **`main`** - Production code (protected)
- **`develop`** - Integration branch for features
- **`feature/*`** - Individual feature branches

### Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/visual-page-builder
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: Add visual page builder"
   ```

3. **Push branch**
   ```bash
   git push origin feature/visual-page-builder
   ```

4. **Create Pull Request** on GitHub
   - Go to: https://github.com/VentureHomeSolarLLC/agora-studio/pulls
   - Click "New Pull Request"
   - Base: `main`, Compare: `feature/visual-page-builder`
   - Add description of changes
   - Request review (if desired)
   - Click "Create Pull Request"

5. **Merge when ready**
   - Auto-deploys to production after merge

## Protection Rules (Recommended)

Set up branch protection for `main`:
1. Go to Settings → Branches
2. Add rule for `main`
3. Enable:
   - Require pull request reviews
   - Require status checks
   - Restrict pushes

## Current Status

We've been pushing directly to `main` for speed during MVP development.
For Phase 2 and beyond, let's use PRs for:
- Better code review
- Version history
- Rollback capability
- Team collaboration

## Quick Fix for Past Commits

All commits are already in Git history - we have full version history!
Just need to switch to PR workflow going forward.
