const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// 配置Multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('只支持PDF文件'));
    }
  }
});

// 创建上传目录
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 静态文件服务
app.use(express.static('public'));

// 上传和解析路由
app.post('/upload', upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传PDF文件' });
    }

    const filePath = req.file.path;
    
    // 读取PDF文件
    const dataBuffer = fs.readFileSync(filePath);
    
    // 存储每页的文本内容
    let pageTexts = [];
    let currentPageIndex = 0;
    
    // 自定义页面渲染函数，用于分页解析
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
    
    // PDF解析选项
    const options = {
      // 最大解析页数，0表示解析所有页
      max: 0,
      // 使用稳定版本的PDF.js
      version: 'v1.10.100',
      // 使用自定义页面渲染函数
      pagerender: renderPageWithIndex
    };
    
    // 解析PDF
    const data = await pdf(dataBuffer, options);
    
    // 清理和格式化文本内容
    const cleanedText = data.text
      .replace(/\s+/g, ' ')  // 将多个空白字符替换为单个空格
      .replace(/\n\s*\n/g, '\n\n')  // 规范化段落间距
      .trim();  // 去除首尾空白
    
    // 过滤掉空的页面内容
    const validPageTexts = pageTexts.filter(page => page && page.content && page.content.trim().length > 0);
    
    console.log(`解析完成: 总页数=${data.numpages}, 分页内容数量=${validPageTexts.length}`);
    
    // 处理文件名编码，解决中文乱码问题
    const decodedFilename = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    
    // 返回解析结果
    res.json({
      filename: decodedFilename,
      size: req.file.size,
      pages: data.numpages,
      content: cleanedText,
      pageContents: validPageTexts, // 按页分割的内容
      metadata: {
        info: data.info,
        version: data.version,
        numrender: data.numrender
      }
    });
    
    // 删除上传的临时文件
    setTimeout(() => {
      try {
        fs.unlinkSync(filePath);
        console.log(`已删除临时文件: ${filePath}`);
      } catch (deleteErr) {
        console.warn(`删除临时文件失败: ${deleteErr.message}`);
      }
    }, 1000);
    
  } catch (err) {
    console.error('解析错误:', err);
    
    // 删除可能存在的临时文件
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteErr) {
        console.warn(`删除临时文件失败: ${deleteErr.message}`);
      }
    }
    
    // 根据错误类型返回不同的错误信息
    if (err.message.includes('Invalid PDF')) {
      res.status(400).json({ error: '无效的PDF文件格式' });
    } else if (err.message.includes('Password')) {
      res.status(400).json({ error: 'PDF文件受密码保护，无法解析' });
    } else {
      res.status(500).json({ error: '解析PDF时发生错误: ' + err.message });
    }
  }
});

// 获取PDF元数据的路由
app.post('/metadata', upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传PDF文件' });
    }

    const filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);
    
    const options = {
      max: 1, // 只解析第一页来获取元数据
      version: 'v1.10.100'
    };
    
    const data = await pdf(dataBuffer, options);
    
    // 处理文件名编码，解决中文乱码问题
    const decodedFilename = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    
    // 返回详细的元数据
    res.json({
      filename: decodedFilename,
      size: req.file.size,
      pages: data.numpages,
      info: data.info,
      metadata: data.metadata,
      version: data.version,
      preview: data.text.substring(0, 500) + (data.text.length > 500 ? '...' : '')
    });
    
    // 删除临时文件
    setTimeout(() => {
      try {
        fs.unlinkSync(filePath);
      } catch (deleteErr) {
        console.warn(`删除临时文件失败: ${deleteErr.message}`);
      }
    }, 1000);
    
  } catch (err) {
    console.error('获取元数据错误:', err);
    
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteErr) {
        console.warn(`删除临时文件失败: ${deleteErr.message}`);
      }
    }
    
    res.status(500).json({ error: '获取PDF元数据时发生错误: ' + err.message });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});