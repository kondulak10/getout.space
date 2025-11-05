# Git History Cleanup Instructions

Your FontAwesome NPM token was committed to git history in commit `7bea2727539c35002dd8db9efdaee102c95c2de2`.

## IMPORTANT: First Steps

1. **Regenerate your FontAwesome token immediately**
   - Go to https://fontawesome.com/account
   - Revoke the old token: `4355333A-1B8C-4869-A494-6BEAF49F1C71`
   - Generate a new token

2. **Set the new token as an environment variable**
   ```powershell
   $env:FONTAWESOME_TOKEN="your-new-token-here"
   ```

## Cleanup Git History

### Option 1: Using BFG Repo-Cleaner (Recommended - Fastest)

1. Download BFG: https://rtyley.github.io/bfg-repo-cleaner/

2. Clone a fresh bare copy of your repo:
   ```powershell
   git clone --mirror https://github.com/yourusername/getout.space.git
   ```

3. Run BFG to remove the file:
   ```powershell
   java -jar bfg.jar --delete-files .npmrc getout.space.git
   ```

4. Clean up and push:
   ```powershell
   cd getout.space.git
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

### Option 2: Using git filter-repo

1. Install git-filter-repo:
   ```powershell
   pip install git-filter-repo
   ```

2. Run the filter:
   ```powershell
   git filter-repo --path frontend/.npmrc --invert-paths --force
   ```

3. Force push:
   ```powershell
   git push origin --force --all
   git push origin --force --tags
   ```

### Option 3: Using git filter-branch (Slower, but works everywhere)

```powershell
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch frontend/.npmrc" --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
git push origin --force --tags
```

## After Cleanup

1. **Notify collaborators** to re-clone the repository (their local copies will have the old history)

2. **Update GitHub secrets**:
   - Go to your GitHub repository
   - Settings > Secrets and variables > Actions
   - Update `FONTAWESOME_TOKEN` to use your new token

3. **Verify the token is gone**:
   ```powershell
   git log --all --full-history -- frontend/.npmrc
   ```
   This should return no results.

## Prevention

The following files have been updated to prevent future leaks:
- `.gitignore` - Added `**/.npmrc`
- `frontend/.gitignore` - Added `.npmrc`
- `frontend/.npmrc` - Now uses environment variable `${FONTAWESOME_TOKEN}`
- `frontend/.npmrc.example` - Template file for reference
- `frontend/FONTAWESOME_SETUP.md` - Setup documentation

## Warning

After force pushing, anyone who has cloned the repository will need to:
1. Delete their local clone
2. Clone fresh from the remote
3. Set up their `FONTAWESOME_TOKEN` environment variable

