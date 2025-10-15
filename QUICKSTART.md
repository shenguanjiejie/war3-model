# 🚀 快速启动指南

一行命令启动 War3 模型预览器（带自动纹理加载）

## 启动服务器
```bash
python3 texture_server.py
```

## 访问预览页面
```
http://localhost:8081/docs/preview/preview.html
```

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
```bash
# MDX 转 JSON
node mdx2json.mjs WaterElemental.mdx

# 或使用 Python 版本
python3 mdx2json.py WaterElemental.mdx
```

---

**Happy Modeling! 🎨**
