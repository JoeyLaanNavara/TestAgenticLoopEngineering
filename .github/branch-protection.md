# Branch Protection Setup

After pushing this workflow, configure branch protection on GitHub:

1. Go to **Settings → Branches → Add branch ruleset** (or "Branch protection rules")
2. Branch name pattern: `main`
3. Enable **Require status checks to pass before merging**
4. Add these required status checks:
   - `Lint`
   - `Unit Tests`
   - `E2E Tests`
   - `Build`
5. Enable **Require branches to be up to date before merging**
6. Enable **Do not allow bypassing the above settings** (optional but recommended)
7. Save changes
