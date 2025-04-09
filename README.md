# Nintendo Museum Calendar Fetcher

✌️，购买成功：
![image](https://github.com/user-attachments/assets/7e3cf75b-2a7d-442a-8acc-a86569eef398)


这个应用每30分钟自动获取 Nintendo Museum 的日历数据。

## 部署到 Vercel

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 中导入该仓库
3. 在 Vercel 项目设置中添加以下环境变量：
   - `XSRF_TOKEN`: Nintendo Museum 网站的 XSRF token
   - `COOKIE`: Nintendo Museum 网站的 cookie

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
