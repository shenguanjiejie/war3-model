# 🚀 快速启动指南

两种方式启动 War3 模型预览器（带自动纹理加载）

## 方式 1: 使用 Vite 开发服务器（推荐）

```bash
# 启动 vite 开发服务器
npm run dev
```

访问预览页面：
```
http://localhost:5173/docs/preview/preview.html
```

**优点：**
- ✨ 热重载，修改代码立即生效
- ⚡️ 更快的启动速度
- 🔧 TypeScript 支持

## 方式 2: 使用 Python 静态服务器

```bash
# 先构建项目
npm run build-samples

# 启动静态服务器
python3 texture_server.py
```

访问预览页面：
```
http://localhost:8081/docs/preview/preview.html
```

**优点：**
- 📦 无需 Node.js 环境
- 🚀 生产环境构建

## 使用方法
1. 拖入 `.mdx` 或 `.mdl` 文件
2. 纹理会自动从 MPQ 目录加载
3. 无需手动拖入 `.blp` 纹理文件 ✨

---

## 首次使用

### 1. 安装依赖
```bash
npm install
```

### 2. 构建项目
```bash
npm run build-samples
```

### 3. 配置 MPQ 路径（可选）
编辑 `texture_server.py` 第 15 行：
```python
MPQ_ROOT = "/Users/ruijie/Desktop/workspace/unity/war3/mpq"
```

---

## 详细文档
查看 [LOCAL_SETUP.md](./LOCAL_SETUP.md) 获取完整文档。

## 工具脚本

### MDX/MDL 转 JSON
将War3模型文件转换为JSON格式（用于Unity等引擎导入）：

```bash
# 转换MDX文件
node mdx2json.mjs WaterElemental.mdx

# 指定输出文件
node mdx2json.mjs WaterElemental.mdx output.json

# 也支持MDL文件
node mdx2json.mjs WaterElemental.mdl
```

**输出信息：**
- 模型基本信息（版本、名称、Geosets、材质、纹理等）
- ParticleEmitter2详细信息（FilterMode、FrameFlags、SegmentColor等）
- 自动转换TypedArray为JSON兼容的普通数组

---

**Happy Modeling! 🎨**
