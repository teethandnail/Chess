# 中国象棋

一个基于Web的中国象棋游戏，支持人机对战。

## 环境配置

1. 初次拉取代码后，需要配置环境变量：
```bash
# 复制环境变量示例文件
cp env_example.js env.js
```

2. 在 `env.js` 中填入你的 OpenAI API Key：
```javascript
const ENV = {
    OPENAI_API_KEY: 'your-openai-api-key-here' // 替换为你的 OpenAI API Key
};
```

## 运行游戏

直接在浏览器中打开 `index.html` 即可开始游戏。

## 游戏规则