let excelData = null;
let columns = [];
let generatedSQL = '';
let editor = null;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const columnSearch = document.getElementById('columnSearch');
const columnSearchEmpty = document.getElementById('columnSearchEmpty');

document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('sqlTemplate');
    editor = CodeMirror.fromTextArea(textarea, {
        mode: 'text/x-sql',
        theme: 'default',
        lineNumbers: false,
        lineWrapping: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        viewportMargin: Infinity
    });

    const savedLayout = localStorage.getItem('layoutMode');
    const isTwoColumn = savedLayout === 'two';
    document.body.classList.toggle('two-column', isTwoColumn);
    updateLayoutToggle(isTwoColumn);
});

function updateLayoutToggle(isTwoColumn) {
    const toggleBtn = document.getElementById('layoutToggleBtn');
    toggleBtn.textContent = isTwoColumn ? '单列布局' : '双列布局';
    toggleBtn.setAttribute('aria-pressed', isTwoColumn ? 'true' : 'false');
    setTimeout(() => {
        if (editor) {
            editor.refresh();
        }
    }, 100);
}

function toggleLayout() {
    const isTwoColumn = document.body.classList.toggle('two-column');
    localStorage.setItem('layoutMode', isTwoColumn ? 'two' : 'single');
    updateLayoutToggle(isTwoColumn);
}

function reuploadExcel() {
    const uploadSection = document.getElementById('uploadSection');
    uploadSection.style.display = 'block';
    fileInput.value = '';

    const leftColumn = document.querySelector('.layout-left');
    if (document.body.classList.contains('two-column') && leftColumn) {
        leftColumn.scrollTop = 0;
    }
    uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    fileInput.click();
}

function filterColumnTags() {
    const keyword = columnSearch.value.trim().toLowerCase();
    const tags = document.querySelectorAll('#columnsInfo .column-tag');
    let visibleCount = 0;

    tags.forEach(tag => {
        const searchText = `${tag.textContent} ${tag.getAttribute('data-copy')} ${tag.getAttribute('data-col')}`.toLowerCase();
        const shouldShow = !keyword || searchText.includes(keyword);
        tag.style.display = shouldShow ? 'inline-block' : 'none';
        if (shouldShow) {
            visibleCount++;
        }
    });

    columnSearchEmpty.style.display = visibleCount === 0 ? 'block' : 'none';
}

columnSearch.addEventListener('input', filterColumnTags);

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

let alertQueue = [];

function showAlert(message, type = 'info', duration = 5000) {
    const alertArea = document.getElementById('alertArea');
    const alertId = 'alert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const alertEl = document.createElement('div');
    alertEl.id = alertId;
    alertEl.className = `alert alert-${type}`;
    alertEl.textContent = message;
    alertEl.style.top = '20px';
    
    alertArea.appendChild(alertEl);
    
    requestAnimationFrame(() => {
        alertEl.classList.add('alert-visible');
    });
    
    const timerId = setTimeout(() => {
        removeAlert(alertId);
    }, duration);
    
    alertQueue.push({
        id: alertId,
        element: alertEl,
        timerId: timerId
    });
}

function removeAlert(alertId) {
    const alertIndex = alertQueue.findIndex(a => a.id === alertId);
    if (alertIndex === -1) return;
    
    const alertInfo = alertQueue[alertIndex];
    const alertEl = alertInfo.element;
    
    if (alertInfo.timerId) {
        clearTimeout(alertInfo.timerId);
    }
    
    alertEl.classList.remove('alert-visible');
    
    setTimeout(() => {
        if (alertEl.parentNode) {
            alertEl.remove();
        }
        if (alertIndex !== -1 && alertQueue[alertIndex] && alertQueue[alertIndex].id === alertId) {
            alertQueue.splice(alertIndex, 1);
        }
    }, 300);
}

let parseProgressAlertEl = null;

function setParseProgress(message) {
    const alertArea = document.getElementById('alertArea');
    if (!parseProgressAlertEl) {
        parseProgressAlertEl = document.createElement('div');
        parseProgressAlertEl.className = 'alert alert-info alert-visible';
        parseProgressAlertEl.style.top = '20px';
        alertArea.appendChild(parseProgressAlertEl);
    }
    parseProgressAlertEl.textContent = message;
}

function clearParseProgress() {
    if (!parseProgressAlertEl) return;
    const el = parseProgressAlertEl;
    parseProgressAlertEl = null;
    el.classList.remove('alert-visible');
    setTimeout(() => {
        if (el.parentNode) {
            el.remove();
        }
    }, 300);
}

async function handleFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.style.opacity = '0.5';
    uploadArea.style.pointerEvents = 'none';
    
    const fileSizeText = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    setParseProgress(`正在解析Excel文件 (${fileSizeText})... 0.00%`);
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok || !response.body) {
            let errorMessage = '上传失败';
            try {
                const data = await response.json();
                errorMessage = data.error || errorMessage;
            } catch (e) {}
            throw new Error(errorMessage);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let doneData = null;
        
        const processLine = (line) => {
            if (!line.trim()) return;
            const message = JSON.parse(line);
            if (message.type === 'progress') {
                const percent = message.total > 0
                    ? (message.loaded / message.total * 100).toFixed(2)
                    : (message.loaded > 0 ? '100.00' : '0.00');
                setParseProgress(`正在解析Excel文件 (${fileSizeText})... ${percent}%`);
            } else if (message.type === 'error') {
                throw new Error(message.error);
            } else if (message.type === 'done') {
                doneData = message;
            }
        };
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            lines.forEach(processLine);
        }
        buffer += decoder.decode();
        if (buffer.trim()) {
            processLine(buffer);
        }
        
        if (!doneData) {
            throw new Error('未收到解析结果');
        }
        
        excelData = doneData.data;
        columns = doneData.columns;
        columnSearch.value = '';
        showColumnsInfo();
        showDataPreview();
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('columnsSection').style.display = 'block';
        document.getElementById('templateSection').style.display = 'block';
        document.getElementById('resultSection').style.display = 'none';
        
        setTimeout(function() {
            editor.refresh();
        }, 100);
        
        clearParseProgress();
        showAlert(`成功读取 ${doneData.row_count} 行数据，${doneData.col_count} 列！`, 'success');
    } catch (error) {
        clearParseProgress();
        showAlert(error.message || '上传失败', 'error');
    } finally {
        uploadArea.style.opacity = '1';
        uploadArea.style.pointerEvents = 'auto';
    }
}

function showColumnsInfo() {
    const columnsInfo = document.getElementById('columnsInfo');
    let html = '<h4>可用占位符：</h4>';
    columns.forEach((col, index) => {
        const displayPlaceholder = `$column${index + 1}$`;
        const copyPlaceholder = `'$column${index + 1}$'`;
        html += `<span class="column-tag" data-copy="${escapeHtml(copyPlaceholder)}" data-col="${escapeHtml(col)}" title="点击复制 ${escapeHtml(copyPlaceholder)}">${escapeHtml(displayPlaceholder)} → ${escapeHtml(col)}</span>`;
    });
    columnsInfo.innerHTML = html;

    // 绑定点击事件
    columnsInfo.querySelectorAll('.column-tag').forEach(tag => {
        tag.addEventListener('click', function() {
            const placeholder = this.getAttribute('data-copy');
            const colName = this.getAttribute('data-col');
            copyPlaceholder(placeholder, colName, this);
        });
    });

    filterColumnTags();
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function markLastCopied(tagElement) {
    document.querySelectorAll('.column-tag.last-copied').forEach(tag => {
        tag.classList.remove('last-copied');
    });
    if (tagElement) {
        tagElement.classList.add('last-copied');
    }
}

function copyPlaceholder(placeholder, colName, tagElement) {
    const textarea = document.createElement('textarea');
    textarea.value = placeholder;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    textarea.style.zIndex = '-9999';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            markLastCopied(tagElement);
            showAlert(`已复制[${colName}]`, 'success', 2000);
        } else {
            showAlert('复制失败，请手动复制', 'error', 2000);
        }
    } catch (err) {
        showAlert('复制失败，请手动复制', 'error', 2000);
    }
    
    document.body.removeChild(textarea);
}

function showDataPreview() {
    const dataPreview = document.getElementById('dataPreview');
    let html = '<h4 style="margin-bottom: 10px;">数据预览（前3行）：</h4>';
    html += '<table>';
    html += '<thead><tr>';
    columns.forEach(col => {
        html += `<th title="${col}">${col}</th>`;
    });
    html += '</tr></thead>';
    html += '<tbody>';
    excelData.slice(0, 3).forEach(row => {
        html += '<tr>';
        columns.forEach(col => {
            const value = row[col] !== null && row[col] !== undefined ? row[col] : '';
            html += `<td title="${value}">${value}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody>';
    html += '</table>';
    if (excelData.length > 3) {
        html += `<p style="margin-top: 10px; color: #999; font-size: 12px;">... 还有 ${excelData.length - 3} 行数据</p>`;
    }
    dataPreview.innerHTML = html;
}

function generateSQL() {
    const template = editor.getValue();
    const generateBtn = document.getElementById('generateBtn');
    
    if (!template.trim()) {
        showAlert('请输入SQL模板', 'error');
        return;
    }
    
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="loading-spinner"></span>正在生成...';
    
    showAlert('正在生成SQL...', 'info');
    
    fetch('/generate_sql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            template: template,
            data: excelData,
            columns: columns
        })
    })
    .then(response => response.json())
    .then(data => {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '生成SQL';
        
        if (data.error) {
            showAlert(data.error, 'error');
        } else {
            generatedSQL = data.sql;
            const previewSQL = data.preview_sql !== undefined ? data.preview_sql : data.sql;
            const sqlResult = document.getElementById('sqlResult');
            sqlResult.innerHTML = '';
            CodeMirror.runMode(previewSQL, 'text/x-sql', sqlResult);
            document.getElementById('resultCount').textContent = data.count > 50
                ? `共生成 ${data.count} 条SQL语句，仅预览前 ${data.preview_count} 条；复制/下载仍为完整内容`
                : `共生成 ${data.count} 条SQL语句`;
            document.getElementById('resultSection').style.display = 'block';
            showAlert('SQL生成成功！', 'success');
        }
    })
    .catch(error => {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '生成SQL';
        showAlert('生成SQL失败: ' + error, 'error');
    });
}

function downloadSQL() {
    if (!generatedSQL) {
        showAlert('没有可下载的SQL内容', 'error');
        return;
    }
    
    fetch('/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sql: generatedSQL
        })
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated_sql.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showAlert('下载成功！', 'success');
    })
    .catch(error => {
        showAlert('下载失败: ' + error, 'error');
    });
}
function copySQLToClipboard() {
    if (!generatedSQL) {
        showAlert('没有可复制的SQL内容', 'error');
        return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = generatedSQL;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    textarea.style.zIndex = '-9999';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            const copyBtn = document.getElementById('copyBtn');
            copyBtn.textContent = '已复制!';
            copyBtn.style.opacity = '0.8';
            showAlert('SQL内容已复制到剪贴板', 'success', 2000);
            setTimeout(() => {
                copyBtn.textContent = '复制文本';
                copyBtn.style.opacity = '1';
            }, 1500);
        } else {
            showAlert('复制失败，请手动复制', 'error', 2000);
        }
    } catch (err) {
        showAlert('复制失败，请手动复制', 'error', 2000);
    }
    document.body.removeChild(textarea);
}
