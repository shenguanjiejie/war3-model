#!/usr/bin/env node

/**
 * MDX to JSON Converter (ES Module)
 * 使用war3-model将War3的MDX/MDL文件转换为完整的JSON格式
 * 用于Unity导入时获取100%完整的War3粒子数据
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

// 使用CommonJS require加载编译后的dist
const require = createRequire(import.meta.url);
const { parseMDX, parseMDL } = require('./dist/war3-model.cjs');

function convertMdxToJson(inputPath, outputPath) {
    console.log(`[MDX2JSON] 读取文件: ${inputPath}`);

    // 读取文件
    const buffer = fs.readFileSync(inputPath);

    // 判断文件类型
    const ext = path.extname(inputPath).toLowerCase();
    let model;

    if (ext === '.mdx') {
        console.log('[MDX2JSON] 解析MDX格式...');
        model = parseMDX(buffer.buffer);
    } else if (ext === '.mdl') {
        console.log('[MDX2JSON] 解析MDL格式...');
        const text = buffer.toString('utf-8');
        model = parseMDL(text);
    } else {
        throw new Error(`不支持的文件格式: ${ext}`);
    }

    // 输出统计信息
    console.log(`[MDX2JSON] 解析成功！`);
    console.log(`  - 版本: ${model.Version}`);
    console.log(`  - 模型名: ${model.Info.Name}`);
    console.log(`  - Geosets: ${model.Geosets.length}`);
    console.log(`  - 材质: ${model.Materials.length}`);
    console.log(`  - 纹理: ${model.Textures.length}`);
    console.log(`  - 粒子发射器2: ${model.ParticleEmitters2.length}`);
    console.log(`  - 动画序列: ${model.Sequences.length}`);

    // 输出粒子发射器详情
    if (model.ParticleEmitters2.length > 0) {
        console.log(`\n[MDX2JSON] ParticleEmitter2 详细信息:`);
        model.ParticleEmitters2.forEach((p, i) => {
            console.log(`  [${i}] ${p.Name}:`);
            console.log(`    - FilterMode: ${p.FilterMode}`);
            console.log(`    - FrameFlags: ${p.FrameFlags} (${getFrameFlagsName(p.FrameFlags)})`);
            console.log(`    - Rows x Columns: ${p.Rows} x ${p.Columns}`);
            console.log(`    - Time: ${p.Time}`);
            console.log(`    - LifeSpan: ${p.LifeSpan}`);
            console.log(`    - TailLength: ${p.TailLength}`);
            console.log(`    - SegmentColor: ${p.SegmentColor ? p.SegmentColor.length : 0} 段`);
            console.log(`    - Alpha: ${p.Alpha ? Array.from(p.Alpha) : 'null'}`);
            console.log(`    - ParticleScaling: ${p.ParticleScaling ? Array.from(p.ParticleScaling) : 'null'}`);
            console.log(`    - LifeSpanUVAnim: ${p.LifeSpanUVAnim ? Array.from(p.LifeSpanUVAnim) : 'null'}`);
            console.log(`    - DecayUVAnim: ${p.DecayUVAnim ? Array.from(p.DecayUVAnim) : 'null'}`);
            console.log(`    - TailUVAnim: ${p.TailUVAnim ? Array.from(p.TailUVAnim) : 'null'}`);
            console.log(`    - TailDecayUVAnim: ${p.TailDecayUVAnim ? Array.from(p.TailDecayUVAnim) : 'null'}`);
        });
    }

    // 转换TypedArray为普通数组（JSON兼容）
    const jsonModel = convertTypedArrays(model);

    // 输出JSON
    const json = JSON.stringify(jsonModel, null, 2);
    fs.writeFileSync(outputPath, json, 'utf-8');

    console.log(`\n[MDX2JSON] 输出JSON: ${outputPath}`);
    console.log(`[MDX2JSON] 文件大小: ${(json.length / 1024).toFixed(2)} KB`);
    console.log('[MDX2JSON] 完成！');
}

function getFrameFlagsName(flags) {
    if (flags === 0) return 'None';
    if (flags === 1) return 'Head';
    if (flags === 2) return 'Tail';
    if (flags === 3) return 'Both';
    return `Unknown(${flags})`;
}

/**
 * 递归转换TypedArray为普通数组（JSON序列化兼容）
 */
function convertTypedArrays(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }

    // TypedArray转换
    if (ArrayBuffer.isView(obj) && !(obj instanceof DataView)) {
        return Array.from(obj);
    }

    // 数组递归
    if (Array.isArray(obj)) {
        return obj.map(item => convertTypedArrays(item));
    }

    // 对象递归
    if (typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                result[key] = convertTypedArrays(obj[key]);
            }
        }
        return result;
    }

    return obj;
}

// CLI 入口
const args = process.argv.slice(2);

if (args.length < 1) {
    console.log('用法: node mdx2json.mjs <input.mdx> [output.json]');
    console.log('');
    console.log('示例:');
    console.log('  node mdx2json.mjs WaterElemental.mdx');
    console.log('  node mdx2json.mjs WaterElemental.mdx output.json');
    process.exit(1);
}

const inputPath = args[0];
const outputPath = args[1] || inputPath.replace(/\.(mdx|mdl)$/i, '.json');

try {
    convertMdxToJson(inputPath, outputPath);
} catch (error) {
    console.error('[MDX2JSON] 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
}

export { convertMdxToJson };
