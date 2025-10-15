#!/usr/bin/env python3
"""
War3 Model 纹理服务器
提供 docs/dist 静态文件 + MPQ 纹理文件代理
"""

import http.server
import socketserver
import os
import json
from pathlib import Path
from urllib.parse import unquote

PORT = 8081
MPQ_ROOT = "/Users/ruijie/Desktop/workspace/unity/war3/mpq"

class War3TextureHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="docs/dist", **kwargs)

    def do_GET(self):
        # API: 查找纹理文件
        if self.path.startswith('/api/find-texture/'):
            texture_name = unquote(self.path.replace('/api/find-texture/', ''))
            self.handle_find_texture(texture_name)
            return

        # 代理 MPQ 文件访问
        if self.path.startswith('/mpq/'):
            mpq_path = unquote(self.path.replace('/mpq/', ''))
            self.handle_mpq_file(mpq_path)
            return

        # 默认静态文件服务
        super().do_GET()

    def do_HEAD(self):
        # HEAD 请求也使用同样的逻辑
        if self.path.startswith('/api/find-texture/') or self.path.startswith('/mpq/'):
            # 对于 HEAD 请求，调用 do_GET 但不发送 body
            self.do_GET()
            return
        # 默认静态文件服务
        super().do_HEAD()

    def handle_find_texture(self, texture_name):
        """查找纹理文件，返回相对路径"""
        # 规范化路径：将反斜杠转为正斜杠
        texture_name = texture_name.replace('\\', '/')

        # 移除扩展名，转小写
        base_name = os.path.splitext(os.path.basename(texture_name))[0].lower()

        # 提取文件名（无扩展名）
        filename = os.path.basename(texture_name)

        # 搜索路径优先级
        search_paths = [
            f"lowercase/textures/{base_name}.blp",
            f"extract/{texture_name}",  # 先尝试完整路径
            f"extract/Textures/{filename}",  # 再尝试 Textures 目录
        ]

        # 递归搜索 extract 目录
        extract_path = os.path.join(MPQ_ROOT, "extract")
        if os.path.exists(extract_path):
            for root, dirs, files in os.walk(extract_path):
                for file in files:
                    if file.lower() == texture_name.lower():
                        rel_path = os.path.relpath(os.path.join(root, file), MPQ_ROOT)
                        search_paths.insert(0, rel_path)
                        break

        # 查找第一个存在的文件
        for rel_path in search_paths:
            full_path = os.path.join(MPQ_ROOT, rel_path)
            if os.path.exists(full_path):
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'path': rel_path}).encode())
                return

        # 未找到
        self.send_response(404)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'error': 'Not found'}).encode())

    def handle_mpq_file(self, mpq_path):
        """代理 MPQ 文件访问"""
        full_path = os.path.join(MPQ_ROOT, mpq_path)

        if not os.path.exists(full_path):
            self.send_error(404, f"File not found: {mpq_path}")
            return

        # 读取并返回文件
        try:
            with open(full_path, 'rb') as f:
                content = f.read()

            self.send_response(200)
            self.send_header('Content-Type', 'application/octet-stream')
            self.send_header('Content-Length', len(content))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'max-age=3600')
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"Error reading file: {str(e)}")

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    with socketserver.TCPServer(("", PORT), War3TextureHandler) as httpd:
        print(f"✅ War3 Model 纹理服务器启动成功")
        print(f"📁 静态文件目录: docs/dist")
        print(f"📁 MPQ 根目录: {MPQ_ROOT}")
        print(f"🌐 访问地址: http://localhost:{PORT}/docs/preview/preview.html")
        print(f"🔍 纹理查找 API: http://localhost:{PORT}/api/find-texture/<filename>")
        print(f"📦 MPQ 文件代理: http://localhost:{PORT}/mpq/<path>")
        print("\n按 Ctrl+C 停止服务器")
        httpd.serve_forever()
