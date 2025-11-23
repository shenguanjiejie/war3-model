#!/usr/bin/env node

/**
 * SLK to JSON Converter
 * 将War3的SLK/TXT文件转换为JSON格式
 * 用于Unity运行时加载游戏数据
 */

import fs from 'fs';
import path from 'path';

/**
 * 解析SLK/TXT文件为JSON
 * War3的单位文件格式：第一行是字段名，后续行是数据，用tab分隔
 */
function parseSLK(filePath) {
    console.log(`[SLK2JSON] 读取文件: ${filePath}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) {
        throw new Error('SLK文件格式错误：至少需要2行（字段名+数据）');
    }

    // 第一行：字段名
    const headers = lines[0].split('\t').map(h => h.trim());
    console.log(`[SLK2JSON] 找到${headers.length}个字段: ${headers.slice(0, 5).join(', ')}...`);

    const units = [];
    let currentUnit = null;
    let currentSection = null; // 用于处理[Misc]这种全局配置节

    // 从第二行开始解析数据
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();

        // 跳过注释和空行
        if (line.startsWith('//') || line === '') {
            continue;
        }

        // [sectionName] 表示新节开始
        const sectionMatch = line.match(/^\[(\w+)\]$/);
        if (sectionMatch) {
            const sectionName = sectionMatch[1];

            // 保存之前的单位
            if (currentUnit) {
                units.push(currentUnit);
            }

            // 创建新单位/节
            currentUnit = {
                unitId: sectionName
            };
            currentSection = sectionName;
            continue;
        }

        // 解析键值对：key=value
        const kvMatch = line.match(/^(\w+)=(.*)$/);
        if (kvMatch) {
            const key = kvMatch[1];
            let value = kvMatch[2];

            // 如果还没有currentUnit（文件开头直接是key=value），创建一个默认的
            if (!currentUnit) {
                currentUnit = {
                    unitId: "default"
                };
            }

            // 类型转换
            currentUnit[key] = parseValue(value);
        }
    }

    // 添加最后一个单位
    if (currentUnit) {
        units.push(currentUnit);
    }

    console.log(`[SLK2JSON] 解析成功！共${units.length}个单位`);

    return {
        sourceFile: path.basename(filePath),
        units: units
    };
}

/**
 * 智能类型转换
 */
function parseValue(value) {
    value = value.trim();

    // 空值
    if (value === '' || value === '_') {
        return null;
    }

    // 布尔值
    if (value === '1' || value.toLowerCase() === 'true') {
        return true;
    }
    if (value === '0' || value.toLowerCase() === 'false') {
        return false;
    }

    // 数字（整数或浮点数）
    if (/^-?\d+$/.test(value)) {
        return parseInt(value, 10);
    }
    if (/^-?\d*\.\d+$/.test(value)) {
        return parseFloat(value);
    }

    // 字符串
    return value;
}

/**
 * 批量转换目录下的所有SLK文件
 */
function convertDirectory(inputDir, outputDir) {
    console.log(`[SLK2JSON] 扫描目录: ${inputDir}`);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = fs.readdirSync(inputDir);
    const slkFiles = files.filter(f => f.endsWith('.txt') || f.endsWith('.slk'));

    console.log(`[SLK2JSON] 找到${slkFiles.length}个SLK文件`);

    for (const file of slkFiles) {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file.replace(/\.(txt|slk)$/i, '.json'));

        try {
            convertSLKToJSON(inputPath, outputPath);
        } catch (error) {
            console.error(`[SLK2JSON] 处理${file}失败:`, error.message);
        }
    }

    console.log(`[SLK2JSON] 批量转换完成！`);
}

/**
 * 转换单个SLK文件为JSON
 */
function convertSLKToJSON(inputPath, outputPath) {
    const data = parseSLK(inputPath);

    // 输出统计信息
    if (data.units.length > 0) {
        const firstUnit = data.units[0];
        const fieldCount = Object.keys(firstUnit).length;
        console.log(`  - 示例单位: ${firstUnit.unitId}`);
        console.log(`  - 字段数: ${fieldCount}`);

        // 显示弹道相关字段
        const missileFields = ['Missileart', 'Missilearc', 'Missilespeed'];
        const hasMissile = missileFields.some(f => firstUnit[f] !== undefined);
        if (hasMissile) {
            console.log(`  - 弹道数据: Missileart=${firstUnit.Missileart}, arc=${firstUnit.Missilearc}, speed=${firstUnit.Missilespeed}`);
        }
    }

    // 写入JSON
    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(outputPath, json, 'utf-8');

    console.log(`[SLK2JSON] 输出: ${outputPath} (${(json.length / 1024).toFixed(2)} KB)\n`);
}

// CLI 入口
const args = process.argv.slice(2);

if (args.length < 1) {
    console.log('用法: node slk2json.mjs <input.txt> [output.json]');
    console.log('      node slk2json.mjs --dir <input_dir> <output_dir>');
    console.log('');
    console.log('示例:');
    console.log('  node slk2json.mjs humanunitfunc.txt');
    console.log('  node slk2json.mjs humanunitfunc.txt HumanUnits.json');
    console.log('  node slk2json.mjs --dir ./war3/units ./war3data/units');
    process.exit(1);
}

try {
    if (args[0] === '--dir') {
        // 批量转换模式
        const inputDir = args[1] || '.';
        const outputDir = args[2] || './output';
        convertDirectory(inputDir, outputDir);
    } else {
        // 单文件转换模式
        const inputPath = args[0];
        const outputPath = args[1] || inputPath.replace(/\.(txt|slk)$/i, '.json');
        convertSLKToJSON(inputPath, outputPath);
    }
} catch (error) {
    console.error('[SLK2JSON] 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
}

export { parseSLK, convertSLKToJSON, convertDirectory };
