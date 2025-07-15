# PDF文档解析工具

一个基于Node.js和pdf-parse库的PDF文档解析工具，支持上传PDF文件并提取其中的文本内容，具备分页显示功能。

## 功能特性

- 📄 **PDF文件上传**: 支持拖拽和点击上传PDF文件
- 🔍 **文本提取**: 使用pdf-parse库精确提取PDF中的文本内容
- 📖 **分页显示**: 按页面分割显示解析结果，支持页面导航
- 🎨 **现代UI**: 美观的渐变背景和毛玻璃效果界面
- 📱 **响应式设计**: 支持移动端和桌面端访问
- ⚡ **实时解析**: 上传后立即解析并显示结果
- 🛡️ **错误处理**: 完善的错误处理和用户提示

## 技术栈

### 后端
- **Node.js**: 服务器运行环境
- **Express**: Web框架
- **Multer**: 文件上传中间件
- **pdf-parse**: PDF解析库

### 前端
- **HTML5**: 页面结构
- **CSS3**: 样式和动画效果
- **JavaScript**: 交互逻辑
- **Fetch API**: 异步请求

## 安装和运行

### 方法一：使用启动脚本（推荐）

```bash
# 给脚本添加执行权限（如果还没有）
chmod +x start.sh

# 运行启动脚本
./start.sh
```

### 方法二：手动安装

1. **安装依赖**
```bash
npm install
```

2. **启动服务器**
```bash
node server.js
```

3. **访问应用**
打开浏览器访问: http://localhost:3001

## 使用说明

1. **上传PDF文件**
   - 点击"选择文件"按钮或直接拖拽PDF文件到上传区域
   - 支持的文件格式：PDF (.pdf)

2. **解析文档**
   - 选择文件后点击"解析文档"按钮
   - 系统会自动解析PDF并提取文本内容

3. **查看结果**
   - **分页查看**: 逐页浏览解析结果，使用导航按钮切换页面
   - **完整查看**: 一次性显示所有页面的内容

## API接口

### 1. 上传并解析PDF
- **URL**: `POST /upload`
- **参数**: `pdfFile` (文件)
- **返回**:
```json
{
  "filename": "文件名.pdf",
  "size": 文件大小,
  "pages": 页数,
  "content": "完整文本内容",
  "pageContents": [
    {
      "pageNumber": 1,
      "content": "第一页内容"
    }
  ],
  "metadata": {
    "info": {},
    "version": "pdf.js版本",
    "numrender": 渲染页数
  }
}
```

### 2. 获取PDF元数据
- **URL**: `POST /metadata`
- **参数**: `pdfFile` (文件)
- **返回**: PDF的基本信息和元数据

## 项目结构

```
pdfParse/
├── server.js          # 服务器主文件
├── package.json       # 项目依赖配置
├── start.sh          # 启动脚本
├── README.md         # 项目说明
├── public/           # 静态文件目录
│   └── index.html    # 前端页面
└── uploads/          # 文件上传目录（自动创建）
```

## 核心功能实现

### 分页解析
使用自定义的页面渲染回调函数实现分页解析：

```javascript
function renderPageWithIndex(pageData) {
  const render_options = {
    normalizeWhitespace: true,
    disableCombineTextItems: false
  };
  
  return pageData.getTextContent(render_options)
    .then(function(textContent) {
      let lastY, text = '';
      for (let item of textContent.items) {
        if (lastY == item.transform[5] || !lastY) {
          text += item.str;
        } else {
          text += '\n' + item.str;
        }
        lastY = item.transform[5];
      }
      
      // 存储当前页的文本
      pageTexts[currentPageIndex] = {
        pageNumber: currentPageIndex + 1,
        content: text.trim()
      };
      
      currentPageIndex++;
      return text;
    });
}
```

### 错误处理
- 文件类型验证
- PDF格式检查
- 密码保护文件检测
- 网络错误处理

## 注意事项

1. **文件大小限制**: 建议上传文件不超过50MB
2. **支持格式**: 仅支持PDF格式文件
3. **密码保护**: 不支持解析密码保护的PDF文件
4. **临时文件**: 上传的文件会在解析完成后自动删除

## 开发和扩展

### 添加新功能
- 支持更多文件格式（Word、Excel等）
- 添加OCR功能处理扫描版PDF
- 实现文本搜索和高亮
- 添加文档摘要生成

### 性能优化
- 大文件分块上传
- 解析结果缓存
- 并发处理优化

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！