GITHUB_URL="https://github.com/hex976/guozi-kaogong.git"

echo "🚀 推送到 GitHub..."
git remote add origin $GITHUB_URL 2>/dev/null || git remote set-url origin $GITHUB_URL
git branch -M main
git push -u origin main
git push origin V00.00.01
echo "✅ 完成！"
