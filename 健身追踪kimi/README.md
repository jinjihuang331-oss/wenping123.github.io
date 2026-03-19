# 健身追踪仪表盘 PWA

一个功能完整的健身追踪渐进式网络应用 (PWA)，帮助您记录锻炼、追踪进展并实现健身目标。

## 功能特性

### 核心功能
- **锻炼记录** - 支持多种运动类型：跑步、骑行、举重、游泳
- **详细数据追踪** - 记录时长、距离、重量、卡路里消耗
- **体重记录** - 追踪体重变化趋势
- **进展图表** - 使用 Chart.js 展示数据可视化
- **目标设定** - 带有可视化里程碑的目标追踪系统
- **分享功能** - 生成精美的锻炼成果卡片（图片/HTML）

### PWA 特性
- **离线支持** - Service Worker 实现离线访问
- **可安装** - 支持添加到主屏幕
- **后台同步** - 离线数据自动同步
- **推送通知** - 锻炼提醒功能（可选）

### 计步器
- **Pedometer API 集成** - 使用设备传感器进行计步
- **每日目标** - 默认 10,000 步目标
- **自动重置** - 每日自动重置步数

## 项目结构

```
健身追踪仪表盘kimi/
├── index.html              # 主应用页面
├── manifest.json           # PWA 配置文件
├── sw.js                   # Service Worker
├── icon.svg                # SVG 图标源文件
├── generate-icons.html     # 图标生成工具
└── README.md              # 项目说明

# 需要生成的图标文件：
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
└── icon-512x512.png
```

## 快速开始

### 1. 生成图标

打开 `generate-icons.html` 文件，点击"下载所有图标"按钮，将所有生成的 PNG 文件保存到项目目录。

### 2. 本地运行

使用任意本地服务器运行项目：

```bash
# 使用 Python 3
python -m http.server 8080

# 使用 Node.js (http-server)
npx http-server -p 8080

# 使用 PHP
php -S localhost:8080
```

### 3. 访问应用

在浏览器中打开 `http://localhost:8080`

### 4. 安装 PWA

- **Chrome/Edge**: 地址栏右侧点击安装图标
- **Safari (iOS)**: 分享 > 添加到主屏幕
- **Chrome (Android)**: 菜单 > 添加到主屏幕

## 使用指南

### 记录锻炼

1. 点击底部导航栏的"记录"
2. 选择锻炼类型（跑步、骑行、举重、游泳）
3. 填写锻炼详情（时长、距离、卡路里等）
4. 点击"保存锻炼记录"

### 设置目标

1. 点击底部导航栏的"目标"
2. 点击"添加新目标"
3. 填写目标名称、目标值、单位和周期
4. 系统会自动根据您的锻炼记录计算进度

### 分享成果

1. 点击任意锻炼记录
2. 预览生成的分享卡片
3. 选择"下载图片"或"分享"

### 使用计步器

1. 前往"目标"页面
2. 点击"开始计步"按钮
3. 授予运动传感器权限（如需要）
4. 步数会自动更新

## 技术栈

- **前端**: HTML5, CSS3, Vanilla JavaScript
- **图表**: Chart.js
- **截图**: html2canvas
- **PWA**: Service Worker, Web App Manifest
- **存储**: LocalStorage
- **API**: Pedometer API, Device Motion API

## 浏览器兼容性

| 功能 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| PWA 安装 | ✅ | ⚠️ | ✅ | ✅ |
| 离线访问 | ✅ | ✅ | ⚠️ | ✅ |
| 计步器 | ✅ | ❌ | ❌ | ✅ |
| 分享功能 | ✅ | ❌ | ✅ | ✅ |

## 离线功能

应用完全支持离线使用：

- 所有数据存储在 LocalStorage
- Service Worker 缓存核心资源
- 离线时仍可记录锻炼（联网后同步）
- 图表和统计数据本地计算

## 自定义配置

### 修改默认目标

编辑 `index.html` 中的 `goals` 初始值：

```javascript
let goals = [
    { id: 1, title: '每周锻炼次数', target: 4, current: 0, unit: '次', period: 'weekly' },
    { id: 2, title: '每月跑步距离', target: 50, current: 0, unit: '公里', period: 'monthly' }
];
```

### 修改步数目标

```javascript
let stepGoal = 10000; // 修改为您想要的目标步数
```

### 修改主题颜色

编辑 CSS 变量：

```css
:root {
    --primary-color: #4CAF50;
    --primary-dark: #388E3C;
    --accent-color: #FF9800;
}
```

## 开发计划

- [ ] 数据导出/导入功能
- [ ] 云同步备份
- [ ] 更多运动类型
- [ ] 社交分享集成
- [ ] 锻炼计划模板
- [ ] 营养追踪

## 许可证

MIT License - 自由使用和修改

## 贡献

欢迎提交 Issue 和 Pull Request！

---

💪 坚持锻炼，成就更好的自己！
