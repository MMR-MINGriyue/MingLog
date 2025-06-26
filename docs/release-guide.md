# 🚀 MingLog 发布指南

本指南详细说明了 MingLog 项目的发布流程，包括版本管理、构建、测试和分发。

## 🚀 Release Types

### Beta Releases
Beta releases are pre-release versions for testing and feedback.

**Automatic Beta Release:**
```bash
# Push to develop or beta branch
git push origin develop
```

**Manual Beta Release:**
```bash
# Using PowerShell script
./scripts/release-beta.ps1

# Using GitHub Actions (manual trigger)
# Go to GitHub Actions → Beta Release → Run workflow
```

### Stable Releases
Stable releases are production-ready versions.

**Create Stable Release:**
```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

## 📋 Release Process

### 1. Pre-Release Checklist

- [ ] All tests are passing
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] Version numbers are consistent
- [ ] No critical bugs in the current build
- [ ] All features are properly tested

### 2. Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes, backward compatible
- **Beta** (0.0.0-beta.X): Pre-release versions

Examples:
- `1.0.0` - First stable release
- `1.1.0` - New features added
- `1.1.1` - Bug fixes
- `1.2.0-beta.1` - Beta version of 1.2.0

### 3. Release Workflow

#### Automated Release (Recommended)

1. **Beta Release:**
   ```bash
   # Option 1: Push to develop branch
   git checkout develop
   git push origin develop
   
   # Option 2: Use release script
   ./scripts/release-beta.ps1 -Version "1.0.0-beta.2"
   
   # Option 3: Manual GitHub Actions trigger
   # GitHub → Actions → Beta Release → Run workflow
   ```

2. **Stable Release:**
   ```bash
   # Create and push version tag
   git tag v1.0.0
   git push origin v1.0.0
   ```

#### Manual Release

1. **Prepare the release:**
   ```bash
   # Install dependencies
   pnpm install
   
   # Build web app
   pnpm run web:build
   
   # Build desktop app
   pnpm run desktop:build
   ```

2. **Update version numbers:**
   ```bash
   # Update root package.json
   npm version 1.0.0-beta.1 --no-git-tag-version
   
   # Update desktop package.json
   cd apps/desktop
   npm version 1.0.0-beta.1 --no-git-tag-version
   cd ../..
   ```

3. **Create release:**
   ```bash
   # Commit changes
   git add .
   git commit -m "chore: bump version to 1.0.0-beta.1"
   
   # Create and push tag
   git tag v1.0.0-beta.1
   git push origin v1.0.0-beta.1
   git push origin HEAD
   ```

## 🔧 GitHub Actions Workflows

### 1. Build and Test (`build-test.yml`)
- Runs on every push and PR
- Tests code quality and builds
- Ensures everything works before release

### 2. Beta Release (`beta-release.yml`)
- Triggers on push to `develop` or `beta` branches
- Can be manually triggered
- Creates beta releases automatically

### 3. Desktop Release (`release-desktop.yml`)
- Triggers on version tags
- Builds for all platforms (Windows, macOS, Linux)
- Creates GitHub releases with downloadable assets

## 📦 Build Artifacts

Each release creates the following artifacts:

### Windows
- `MingLog-Setup-{version}.exe` - NSIS installer
- `MingLog-{version}.exe` - Portable executable

### macOS
- `MingLog-{version}.dmg` - Disk image
- `MingLog-{version}-mac.zip` - Compressed app

### Linux
- `MingLog-{version}.AppImage` - Portable application
- `minglog_{version}_amd64.deb` - Debian package

## 🔒 Security and Signing

### Code Signing (Optional)

For production releases, you may want to sign the applications:

1. **Windows:** Use a code signing certificate
2. **macOS:** Use Apple Developer ID
3. **Linux:** GPG signing for packages

Add signing certificates to GitHub Secrets:
- `CSC_LINK` - Certificate file (base64 encoded)
- `CSC_KEY_PASSWORD` - Certificate password

## 🚨 Troubleshooting

### Common Issues

1. **Build fails on specific platform:**
   - Check platform-specific dependencies
   - Verify build environment setup
   - Review GitHub Actions logs

2. **Version conflicts:**
   - Ensure all package.json files have consistent versions
   - Check for existing tags with the same version

3. **Release assets not uploading:**
   - Verify GitHub token permissions
   - Check artifact paths in workflow
   - Ensure build completed successfully

### Debug Commands

```bash
# Test local build
pnpm run desktop:pack

# Check version consistency
grep -r "version" package.json apps/*/package.json

# Verify git tags
git tag -l
```

## 📊 Monitoring Releases

### GitHub Actions
- Monitor workflow runs: `https://github.com/MMR-MINGriyue/MingLog/actions`
- Check build logs for errors
- Verify artifact uploads

### Release Analytics
- Download statistics on GitHub Releases
- User feedback on beta releases
- Crash reports and error logs

## 📝 Post-Release Tasks

1. **Update documentation**
2. **Announce release** (if stable)
3. **Monitor for issues**
4. **Prepare next release** (update roadmap)
5. **Update CHANGELOG.md**

## 🔗 Useful Links

- [GitHub Releases](https://github.com/MMR-MINGriyue/MingLog/releases)
- [GitHub Actions](https://github.com/MMR-MINGriyue/MingLog/actions)
- [Electron Builder Documentation](https://www.electron.build/)
- [Semantic Versioning](https://semver.org/)
