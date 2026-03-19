# 部署指南

## 本地开发

### 方法 1: Python HTTP Server

```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

### 方法 2: Node.js http-server

```bash
# 安装 http-server
npm install -g http-server

# 运行服务器
http-server -p 8080 -c-1
```

### 方法 3: PHP 内置服务器

```bash
php -S localhost:8080
```

### 方法 4: VS Code Live Server

安装 "Live Server" 扩展，右键点击 `index.html` 选择 "Open with Live Server"

## 生产部署

### 1. GitHub Pages

1. 创建 GitHub 仓库
2. 上传所有文件
3. 进入 Settings > Pages
4. 选择分支（main）
5. 访问 `https://你的用户名.github.io/仓库名`

### 2. Netlify

1. 注册 Netlify 账号
2. 拖拽项目文件夹到 Netlify 部署区域
3. 自动获得 HTTPS 链接

### 3. Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### 4. Firebase Hosting

```bash
# 安装 Firebase CLI
npm install -g firebase-tools

# 登录
firebase login

# 初始化
firebase init hosting

# 部署
firebase deploy
```

## 部署前检查清单

- [ ] 生成并上传所有 PWA 图标
- [ ] 测试离线功能
- [ ] 验证 HTTPS（PWA 必需）
- [ ] 检查 manifest.json 配置
- [ ] 测试 Service Worker 注册

## 图标生成

1. 在浏览器中打开 `generate-icons.html`
2. 点击"下载所有图标"按钮
3. 将所有 PNG 文件放入项目根目录

## HTTPS 要求

PWA 功能（Service Worker、推送通知等）需要 HTTPS 环境：

- 本地开发：`localhost` 除外
- 生产环境：必须使用 HTTPS

## 测试 PWA 功能

### Chrome DevTools

1. 打开 DevTools (F12)
2. 切换到 "Application" 标签
3. 检查：
   - Manifest
   - Service Workers
   - Storage (LocalStorage)

### Lighthouse 审核

1. 打开 DevTools
2. 切换到 "Lighthouse" 标签
3. 选择 "PWA" 类别
4. 点击 "Generate report"

## 注意事项

1. **路径问题**: 确保所有资源路径使用相对路径或正确的绝对路径
2. **缓存策略**: 更新应用时递增 Service Worker 的 CACHE_NAME
3. **图标尺寸**: 必须提供所有必需的图标尺寸
4. **浏览器兼容性**: 部分功能（如计步器）需要特定浏览器支持
