#!/usr/bin/env node

/**
 * SYLK (SLK) Format Parser
 * 解析War3的真正SLK文件（Excel SYLK格式）
 *
 * SYLK格式说明：
 * - ID;PWXL;N;E  文件头
 * - B;X32;Y837   定义表格大小（32列，837行）
 * - C;X1;Y1;K"value"  单元格数据（列X，行Y，内容K）
 */

import fs from 'fs';
import path from 'path';

/**
 * 解析SYLK格式的SLK文件
 */
function parseSYLK(filePath) {
    console.log(`[SLK-Parser] 读取文件: ${filePath}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // 解析单元格数据
    const cells = {};
    let maxX = 0, maxY = 0;
    let currentY = 1; // SYLK格式：如果C行没有指定Y，使用上一个Y值

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//')) continue;

        // 解析C行（单元格）
        // 格式: C;X1;Y2;K"value" 或 C;Y2;X1;K123 或 C;X2;K"value"（省略Y，使用currentY）
        if (trimmed.startsWith('C;')) {
            const cell = parseCellLine(trimmed, currentY);
            if (cell) {
                const key = `${cell.x},${cell.y}`;
                cells[key] = cell.value;
                maxX = Math.max(maxX, cell.x);
                maxY = Math.max(maxY, cell.y);
                currentY = cell.y; // 更新当前行号
            }
        }
        // 解析B行（表格大小）
        else if (trimmed.startsWith('B;')) {
            const sizeMatch = trimmed.match(/X(\d+);Y(\d+)/);
            if (sizeMatch) {
                maxX = parseInt(sizeMatch[1]);
                maxY = parseInt(sizeMatch[2]);
            }
        }
    }

    console.log(`[SLK-Parser] 表格大小: ${maxX}列 x ${maxY}行`);

    // 转换为对象数组
    // 第一行是字段名（headers）
    const headers = [];
    for (let x = 1; x <= maxX; x++) {
        const header = cells[`${x},1`];
        if (header) {
            headers.push(header);
        }
    }

    console.log(`[SLK-Parser] 字段: ${headers.slice(0, 10).join(', ')}...`);

    // 解析数据行
    const rows = [];
    for (let y = 2; y <= maxY; y++) {
        const row = {};
        let hasData = false;

        for (let x = 1; x <= headers.length; x++) {
            const value = cells[`${x},${y}`];
            if (value !== undefined && value !== null && value !== '') {
                row[headers[x - 1]] = parseValue(value);
                hasData = true;
            }
        }

        if (hasData) {
            rows.push(row);
        }
    }

    console.log(`[SLK-Parser] 解析成功！共${rows.length}行数据`);

    return {
        sourceFile: path.basename(filePath),
        headers: headers,
        data: rows
    };
}

/**
 * 解析单元格行
 * 格式: C;X1;Y2;K"value" 或 C;Y2;X1;K123 或 C;X2;K"value"（省略Y）
 */
function parseCellLine(line, defaultY) {
    const parts = line.split(';');
    let x = null, y = defaultY, value = null; // Y默认使用传入的defaultY

    for (const part of parts) {
        if (part.startsWith('X')) {
            x = parseInt(part.substring(1));
        } else if (part.startsWith('Y')) {
            y = parseInt(part.substring(1));
        } else if (part.startsWith('K')) {
            // K后面是值，可能是字符串（带引号）或数字
            let val = part.substring(1);

            // 去除引号
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1);
            }

            value = val;
        }
    }

    if (x !== null && y !== null && value !== null) {
        return { x, y, value };
    }

    return null;
}

/**
 * 智能类型转换
 */
function parseValue(value) {
    if (typeof value !== 'string') return value;

    value = value.trim();

    // 空值
    if (value === '' || value === '_' || value === '-') {
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
 * 转换SLK为JSON
 */
function convertSLKToJSON(inputPath, outputPath) {
    const data = parseSYLK(inputPath);

    // 输出统计信息
    if (data.data.length > 0) {
        const firstRow = data.data[0];
        const fieldCount = Object.keys(firstRow).length;
        console.log(`  - 示例数据: ${JSON.stringify(firstRow).substring(0, 100)}...`);
        console.log(`  - 字段数: ${fieldCount}`);
    }

    // 写入JSON
    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(outputPath, json, 'utf-8');

    console.log(`[SLK-Parser] 输出: ${outputPath} (${(json.length / 1024).toFixed(2)} KB)\n`);
}

/**
 * 批量转换目录下的所有SLK文件
 */
function convertDirectory(inputDir, outputDir) {
    console.log(`[SLK-Parser] 扫描目录: ${inputDir}`);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = fs.readdirSync(inputDir);
    const slkFiles = files.filter(f => f.endsWith('.slk'));

    console.log(`[SLK-Parser] 找到${slkFiles.length}个SLK文件\n`);

    for (const file of slkFiles) {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file.replace(/\.slk$/i, '.json'));

        try {
            convertSLKToJSON(inputPath, outputPath);
        } catch (error) {
            console.error(`[SLK-Parser] 处理${file}失败:`, error.message);
        }
    }

    console.log(`[SLK-Parser] 批量转换完成！`);
}

// CLI 入口
const args = process.argv.slice(2);

if (args.length < 1) {
    console.log('用法: node slk-parser.mjs <input.slk> [output.json]');
    console.log('      node slk-parser.mjs --dir <input_dir> <output_dir>');
    console.log('');
    console.log('示例:');
    console.log('  node slk-parser.mjs unitdata.slk');
    console.log('  node slk-parser.mjs unitdata.slk UnitData.json');
    console.log('  node slk-parser.mjs --dir ./war3/units ./war3data/slk');
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
        const outputPath = args[1] || inputPath.replace(/\.slk$/i, '.json');
        convertSLKToJSON(inputPath, outputPath);
    }
} catch (error) {
    console.error('[SLK-Parser] 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
}

export { parseSYLK, convertSLKToJSON, convertDirectory };
