#!/usr/bin/env python3
"""
MDX to JSON Converter (Python版本)
使用war3-model的在线演示页面API将MDX转为JSON
避免了Node.js环境配置问题
"""

import sys
import json
import subprocess
import os
from pathlib import Path

def convert_mdx_to_json_via_node(input_path, output_path):
    """
    通过直接调用Node.js执行war3-model的parseMDX
    """
    print(f"[MDX2JSON] 读取文件: {input_path}")

    # 构建Node.js脚本
    node_script = f"""
const fs = require('fs');
const {{ parseMDX }} = require('./index.ts');

const buffer = fs.readFileSync('{input_path}');
const model = parseMDX(buffer.buffer);

// 输出统计
console.log('[MDX2JSON] 解析成功！');
console.log('  - 版本:', model.Version);
console.log('  - 模型名:', model.Info.Name);
console.log('  - Geosets:', model.Geosets.length);
console.log('  - 材质:', model.Materials.length);
console.log('  - 粒子发射器2:', model.ParticleEmitters2.length);

// 输出粒子详情
if (model.ParticleEmitters2.length > 0) {{
    console.log('\\n[MDX2JSON] ParticleEmitter2 详细信息:');
    model.ParticleEmitters2.forEach((p, i) => {{
        console.log(`  [${{i}}] ${{p.Name}}:`);
        console.log(`    - FilterMode: ${{p.FilterMode}}`);
        console.log(`    - FrameFlags: ${{p.FrameFlags}}`);
        console.log(`    - Time: ${{p.Time}}`);
        console.log(`    - LifeSpanUVAnim: ${{p.LifeSpanUVAnim ? Array.from(p.LifeSpanUVAnim) : 'null'}}`);
        console.log(`    - DecayUVAnim: ${{p.DecayUVAnim ? Array.from(p.DecayUVAnim) : 'null'}}`);
    }});
}}

// 转换TypedArray为普通数组
function convertTypedArrays(obj) {{
    if (obj === null || obj === undefined) return obj;
    if (ArrayBuffer.isView(obj) && !(obj instanceof DataView)) return Array.from(obj);
    if (Array.isArray(obj)) return obj.map(item => convertTypedArrays(item));
    if (typeof obj === 'object') {{
        const result = {{}};
        for (const key in obj) {{
            if (obj.hasOwnProperty(key)) result[key] = convertTypedArrays(obj[key]);
        }}
        return result;
    }}
    return obj;
}}

const jsonModel = convertTypedArrays(model);
fs.writeFileSync('{output_path}', JSON.stringify(jsonModel, null, 2), 'utf-8');
console.log('\\n[MDX2JSON] 输出JSON:', '{output_path}');
console.log('[MDX2JSON] 完成！');
"""

    # 保存临时脚本
    script_path = Path(__file__).parent / '_temp_convert.js'
    script_path.write_text(node_script, encoding='utf-8')

    try:
        # 执行Node.js
        result = subprocess.run(
            ['node', '--loader', 'ts-node/esm', str(script_path)],
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True,
            timeout=30
        )

        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)

        if result.returncode != 0:
            raise Exception(f"Node.js执行失败: {result.stderr}")

        return True

    finally:
        # 清理临时文件
        if script_path.exists():
            script_path.unlink()

def main():
    if len(sys.argv) < 2:
        print("用法: python3 mdx2json.py <input.mdx> [output.json]")
        print("")
        print("示例:")
        print("  python3 mdx2json.py WaterElemental.mdx")
        print("  python3 mdx2json.py WaterElemental.mdx output.json")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else input_path.rsplit('.', 1)[0] + '.json'

    # 转换为绝对路径
    input_path = os.path.abspath(input_path)
    output_path = os.path.abspath(output_path)

    try:
        convert_mdx_to_json_via_node(input_path, output_path)
    except Exception as e:
        print(f"[MDX2JSON] 错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
