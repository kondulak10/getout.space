# FontAwesome Pro Setup

This project uses FontAwesome Pro icons, which requires authentication to install the packages.

## Local Development Setup

1. Get your FontAwesome NPM token from https://fontawesome.com/account

2. Set the environment variable:

**Windows (PowerShell):**
```powershell
$env:FONTAWESOME_TOKEN="your-token-here"
```

**Windows (Command Prompt):**
```cmd
set FONTAWESOME_TOKEN=your-token-here
```

**Mac/Linux:**
```bash
export FONTAWESOME_TOKEN=your-token-here
```

3. Install dependencies:
```bash
npm install
```

## CI/CD Setup

Add the `FONTAWESOME_TOKEN` secret to your GitHub repository:
1. Go to Settings > Secrets and variables > Actions
2. Add a new repository secret named `FONTAWESOME_TOKEN`
3. Set the value to your FontAwesome NPM token

The deployment workflow will automatically use this secret to authenticate with FontAwesome.

## Security Notes

- Never commit the `.npmrc` file with a hardcoded token
- The `.npmrc` file uses environment variable substitution: `${FONTAWESOME_TOKEN}`
- The `.npmrc` file is ignored by git (see `.gitignore`)
- Use `.npmrc.example` as a template reference

