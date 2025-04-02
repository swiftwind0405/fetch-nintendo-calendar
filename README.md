# Nintendo Museum Calendar Fetcher

这个应用每30分钟自动获取 Nintendo Museum 的日历数据。

## 部署到 Vercel

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 中导入该仓库
3. 在 Vercel 项目设置中添加以下环境变量：
   - `XSRF_TOKEN`: Nintendo Museum 网站的 XSRF token
   - `COOKIE`: Nintendo Museum 网站的 cookie

## 设置定时任务

在 Vercel 项目设置中：

1. 进入 "Settings" > "Cron Jobs"
2. 添加新的定时任务：
   - Path: `/api/cron`
   - Schedule: `*/30 * * * *` (每30分钟执行一次)
   - HTTP Headers: 
     ```
     Authorization: Bearer your-cron-secret-key
     ```

## 本地开发

1. 安装依赖：
   ```bash
   npm install
   ```

2. 创建 `.env.local` 文件并添加必要的环境变量：
   ```
   XSRF_TOKEN=your-xsrf-token
   COOKIE=your-cookie
   ```

3. 运行开发服务器：
   ```bash
   npm run dev
   ```

4. 访问 http://localhost:3000 查看应用 