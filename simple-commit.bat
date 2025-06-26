@echo off
cd /d "d:\Git proj\minglog"
git add -A
git commit -m "fix: resolve TypeScript compilation errors in core package"
git push origin develop
git tag v0.1.0-beta.7
git push origin v0.1.0-beta.7
echo "Fixes committed and tagged as v0.1.0-beta.7"
