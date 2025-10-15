# War3-Model 本地开发与使用指南

本项目基于 [4eb0da/war3-model](https://github.com/4eb0da/war3-model)，添加了自动纹理加载功能。

## 🎯 功能特性

### 原版功能
- MDX/MDL 模型解析与渲染
- WebGL/WebGPU 双渲染支持
- Reforged PBR 材质支持
- 完整的粒子系统渲染

### 新增功能
✨ **自动纹理加载**：拖入 MDX 文件后，自动从本地 MPQ 目录查找并加载所有纹理文件

---

## 📋 修改说明

### 1. Bug 修复
- **renderer/particles.ts**: 修复 WebGPU multisample 配置错误
- **renderer/ribbons.ts**: 修复 WebGPU multisample 配置错误

### 2. 自动纹理加载
- **docs/preview/preview.ts**: 添加 `loadTextureFromServer()` 函数，自动从服务器查找纹理
- **texture_server.py**: Python 后端服务器，提供纹理查找 API 和 MPQ 文件代理

### 3. 构建配置
- **vite.config.ts**: 将 `base` 从在线 CDN 改为相对路径 `./`，支持本地访问

### 4. 工具脚本
- **mdx2json.mjs**: MDX/MDL 转 JSON 工具（Node.js 版本）
- **mdx2json.py**: MDX/MDL 转 JSON 工具（Python 版本）

---

## 🚀 快速开始

### 前置要求
```bash
# Node.js (建议 18+)
node --version

# Python 3 (建议 3.8+)
python3 --version

# npm
npm --version
```

### 安装依赖
```bash
npm install
```

### 构建项目
```bash
# 构建预览页面
npm run build-samples
```

---

## 🌐 本地预览（带自动纹理加载）

### 1. 启动纹理服务器
```bash
python3 texture_server.py
```

输出：
```
✅ War3 Model 纹理服务器启动成功
📁 静态文件目录: docs/dist
📁 MPQ 根目录: /Users/ruijie/Desktop/workspace/unity/war3/mpq
🌐 访问地址: http://localhost:8081/docs/preview/preview.html
🔍 纹理查找 API: http://localhost:8081/api/find-texture/<filename>
📦 MPQ 文件代理: http://localhost:8081/mpq/<path>
```

### 2. 访问预览页面
```bash
open http://localhost:8081/docs/preview/preview.html
```

### 3. 使用方法
1. 将 `.mdx` 或 `.mdl` 文件拖入浏览器窗口
2. **不需要手动拖入纹理文件** - 会自动加载！
3. 打开浏览器控制台 (F12) 查看纹理加载日志：
   ```
   🔍 自动查找纹理: Textures\WaterEnv1.blp
   ✅ 找到纹理: Textures\WaterEnv1.blp -> extract/Units/Human/WaterElemental/WaterEnv1.blp
   ✅ 纹理加载成功: Textures\WaterEnv1.blp
   ```

---

## 🔧 配置说明

### 纹理搜索路径

服务器会在以下目录查找纹理（按优先级）：

```python
MPQ_ROOT = "/Users/ruijie/Desktop/workspace/unity/war3/mpq"

# 搜索路径：
1. lowercase/textures/          # 优化过的小写纹理
2. extract/<完整路径>           # 模型指定的路径
3. extract/Textures/            # 通用纹理目录
4. 递归搜索整个 extract/ 目录   # 兜底搜索
```

**修改 MPQ 目录**：
编辑 `texture_server.py` 第 15 行：
```python
MPQ_ROOT = "/your/path/to/mpq"
```

### 服务器端口

默认端口：`8081`

**修改端口**：
编辑 `texture_server.py` 第 14 行：
```python
PORT = 8081  # 改为你想要的端口
```

---

## 🛠️ 工具脚本使用

### MDX 转 JSON (Node.js)
```bash
node mdx2json.mjs <input.mdx> [output.json]

# 示例
node mdx2json.mjs WaterElemental.mdx
node mdx2json.mjs WaterElemental.mdx output.json
```

### MDX 转 JSON (Python)
```bash
python3 mdx2json.py <input.mdx> [output.json]

# 示例
python3 mdx2json.py WaterElemental.mdx
```

**输出信息**：
- 版本、模型名
- Geosets、材质、纹理数量
- 粒子发射器详细参数
- 完整的 JSON 数据

---

## 📝 开发说明

### 目录结构
```
war3-model/
├── docs/
│   ├── preview/
│   │   ├── preview.html     # 预览页面
│   │   ├── preview.ts       # 前端逻辑（已修改）
│   │   └── preview.css
│   └── dist/                # 编译输出
├── renderer/
│   ├── particles.ts         # 粒子渲染器（已修复）
│   ├── ribbons.ts           # 丝带渲染器（已修复）
│   └── modelRenderer.ts
├── texture_server.py        # 纹理服务器（新增）
├── mdx2json.mjs            # 转换工具（新增）
├── mdx2json.py             # 转换工具（新增）
├── vite.config.ts          # 构建配置（已修改）
└── LOCAL_SETUP.md          # 本文档
```

### 重新编译
```bash
# 编译预览页面
npm run build-samples

# 编译库文件
npm run build-lib

# 类型检查
npm run typecheck
```

---

## 🐛 故障排除

### 问题：端口被占用
```bash
# macOS/Linux
lsof -ti :8081 | xargs kill -9

# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

### 问题：纹理无法加载
1. 检查控制台是否有 404 错误
2. 确认 MPQ_ROOT 路径正确
3. 检查纹理文件是否存在：
   ```bash
   find /Users/ruijie/Desktop/workspace/unity/war3/mpq -name "*.blp" | head -10
   ```

### 问题：拖放虚线框不显示
1. 硬刷新浏览器（Cmd+Shift+R / Ctrl+Shift+R）
2. 检查是否在 http://localhost:8081 而不是 file:// 访问
3. 重新编译：`npm run build-samples`

### 问题：WebGPU 错误
```
RenderPass expects sampleCount: 4
Pipeline has sampleCount: 1
```
确认 `particles.ts` 和 `ribbons.ts` 已包含 multisample 修复。

---

## 📚 参考资料

- [原项目 GitHub](https://github.com/4eb0da/war3-model)
- [在线演示](https://4eb0da.github.io/war3-model/dist/docs/preview/preview.html)
- [MDX 格式规范](https://www.hiveworkshop.com/threads/mdx-specifications.240487/)
- [WebGPU 文档](https://gpuweb.github.io/gpuweb/)

---

## 🤝 贡献

本地修改包括：
- ✅ WebGPU multisample bug 修复
- ✅ 自动纹理加载功能
- ✅ 本地开发服务器
- ✅ MDX 转 JSON 工具

如需将修改提交到原项目，请遵循原项目的贡献指南。

---

## 📄 许可

本项目继承原项目的 MIT License。

---

**最后更新**: 2025-10-16
**维护者**: Ruijie
