# Excel SQL 批量生成工具

根据 Excel 文件快速生成批量 SQL 语句的 Web 工具。上传 Excel → 输入 SQL 模板 → 一键生成。

## 功能特点

- **Excel 解析** — 使用 openpyxl 直接读取单元格原始值，支持 .xlsx / .xls，最大 100MB
- **长数字保护** — 身份证号等长数字不会因科学计数法丢失精度
- **SQL 编辑器** — CodeMirror 语法高亮，自动适应内容高度
- **占位符系统** — `$column1$` 格式避免与真实字段冲突
- **智能复制** — 点击占位符标签复制 `'$column1$'`（带单引号），引号自由取舍
- **无自动引号** — 工具只做纯文本替换，是否加引号完全由你决定
- **一键复制结果** — 生成的 SQL 可一键复制到剪贴板
- **下载 TXT** — 生成的 SQL 可下载为文本文件
- **模板日志** — 每次生成自动保存 SQL 模板到 `sql_log/` 文件夹
- **气泡通知** — 固定悬浮顶部，淡入淡出，多个气泡不互相干扰
- **数据预览** — 表头 + 前 3 行，横向滚动，限制行高

## 快速开始

### 环境要求

- Python 3.7+

### 安装

```bash
pip install -r requirements.txt
```

### 启动

双击 `restart.bat` 或命令行运行：

```bash
python app.py
```

访问地址：
- 本地：http://127.0.0.1:5000
- 局域网：http://你的IP:5000（restart.bat 会自动显示）

## 使用步骤

### 1. 上传 Excel

点击或拖拽 .xlsx / .xls 文件到上传区域，自动解析并展示列信息。

### 2. 查看列信息

- 占位符显示格式：`$column1$ → 姓名`
- **点击标签**复制 `'$column1$'`（已带单引号）
- 数据预览展示前 3 行

### 3. 编写 SQL 模板

| 场景 | 模板写法 |
|------|---------|
| 字符串字段（要引号） | `where name = '$column1$'` |
| 数字字段（不要引号） | `set age = $column2$` |
| NULL 值自动处理 | 无需特殊处理 |

完整示例：
```sql
update user_info
set name = '$column2$', age = $column3$
where id_card = '$column1$';
```

### 4. 生成 & 下载

点击「生成SQL」→ 预览结果 → 「复制文本」或「下载TXT文件」。

## 占位符规则

| 项目 | 格式 |
|------|------|
| 界面展示 | `$column1$ → 列名` |
| 点击复制 | `'$column1$'`（带单引号） |
| SQL 模板中 | `$column1$`（无引号） |

> 引号策略：点击复制自带引号，需要字符串时直接粘贴；不需要引号时删掉 `'` 即可。工具仅做文本替换，不会自动添加引号。

## 项目结构

```
.
├── app.py              # Flask 后端服务
├── templates/
│   └── index.html      # 前端页面
├── requirements.txt    # Python 依赖
├── restart.bat         # 一键重启脚本（自动获取IP）
├── sql_log/            # SQL 模板日志（自动创建）
└── README.md
```

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Flask, openpyxl, pandas |
| 前端 | CodeMirror（SQL 高亮）, 原生 JS |
| 部署 | 单文件 Python，无需数据库 |

## 依赖

```
flask
pandas
openpyxl
xlrd
```

## 常见问题

**Q: 身份证号 / 长数字变成 0 了？**
A: 已修复。v1.0 使用 openpyxl 按单元格原始值读取，不会丢失精度。

**Q: 通过 IP 访问时复制功能失效？**
A: 已兼容。使用 `execCommand` 方案，HTTP 环境下也能正常复制。

**Q: 数据库表有 `column1` 字段会冲突吗？**
A: 不会。占位符使用 `$column1$` 格式，与真实字段名区分开。

**Q: 不想自动加引号怎么办？**
A: 从 v1.0 起，工具不再自动加引号。你可以在模板中自由选择 `'$column1$'` 或 `$column1$`。

**Q: 如何修改端口？**
编辑 `app.py` 末行：

```python
app.run(debug=False, host='0.0.0.0', port=5000)
```

## License

MIT
