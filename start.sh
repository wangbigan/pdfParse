#!/bin/bash

# PDF解析服务启动脚本
echo "正在启动PDF解析服务..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    echo "访问 https://nodejs.org/ 下载安装"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: 未找到npm，请先安装npm"
    exit 1
fi

# 安装依赖
echo "正在安装依赖包..."
npm install

if [ $? -ne 0 ]; then
    echo "错误: 依赖安装失败"
    exit 1
fi

# 启动服务器
echo "启动服务器..."
echo "服务将运行在 http://localhost:3001"
echo "按 Ctrl+C 停止服务"
node server.js