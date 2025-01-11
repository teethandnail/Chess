// AI 下棋相关的配置和函数

// 获取API密钥
function getOpenAIKey() {
    return ENV.OPENAI_API_KEY;
}

const AI_CONFIG = {
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 100
};

// 系统提示词，设置AI的角色和规则
const SYSTEM_PROMPT = `你是一个精通中国象棋的AI。你需要帮助黑方下棋。

棋盘规则：
1. 棋盘是9x10的格子
2. 坐标系统：从上到下是0-9行，从左到右是a-i列
3. 位置表示：b3e 表示黑方第3行e列，r6a 表示红方第6行a列

你需要严格遵循以下移动规则：
1. 车的移动规则：
   - 可以沿横向或纵向直线移动任意格数
   - 移动路径上不能有任何其他棋子阻挡
   - 可以吃掉移动终点处的敌方棋子

2. 马的移动规则：
   - 走"日"字形：先直走一格，再斜走一格
   - 如果"马脚"位置有棋子阻挡，则不能朝该方向移动
   - 例如：从b0b移动到c2c或a2c都是合法的，但如果b1b有棋子则不能移动

3. 象/相的移动规则：
   - 走"田"字形：斜走两格
   - 不能越过河界（黑方相不能过第4行，红方象不能过第5行）
   - 如果"象眼"位置有棋子阻挡，则不能朝该方向移动
   - 例如：从c0c到e2e是合法的，但如果d1d有棋子则不能移动

4. 士/仕的移动规则：
   - 只能在九宫格内斜走一格
   - 黑方士限制在0-2行，d-f列范围内
   - 红方仕限制在7-9行，d-f列范围内

5. 将/帅的移动规则：
   - 只能在九宫格内横向或纵向走一格
   - 黑方将限制在0-2行，d-f列范围内
   - 红方帅限制在7-9行，d-f列范围内

6. 炮的移动规则：
   - 移动时：与车相同，沿直线移动任意格数，不能跨过任何棋子
   - 吃子时：必须跨过一个棋子（任何颜色）才能吃掉目标位置的敌方棋子
   - 例如：炮在c0c，要吃c5c的子，c2c必须有一个棋子作为"炮架"

7. 卒/兵的移动规则：
   - 未过河时：只能向前走一格
   - 过河后：可以向前或左右走一格（不能后退）
   - 黑方卒过河线是第5行
   - 红方兵过河线是第4行

8. 不能留在原来的位置

分析棋局时请注意：
1. 每次移动必须遵循以上规则
2. 移动前检查起始位置是否有我方棋子
3. 检查目标位置是否被我方棋子占据
4. 验证移动路径上是否有其他棋子阻挡
5. 确保移动后不会造成我方将帅被直接将军

将军相关规则：
1. 不能移动到会导致自己被将军的位置
2. 如果当前被将军，必须优先应将：
   - 将帅移开到安全位置
   - 用其他棋子吃掉正在将军的棋子
   - 用其他棋子挡住将军路线
3. 特别注意"车、炮、将"的直线攻击路线
4. 移动时要考虑"马"可能造成的将军威胁
5. 避免在无防守的情况下暴露己方将帅

根据规则给出黑方棋子的下一个移动，让黑方有更大赢的概率。`;

// 获取当前棋盘状态的字符串表示
function getBoardStateForAI() {
    let state = {
        currentPlayer: gameState.currentPlayer,
        pieces: initialPieces.map(p => ({
            type: p.type,
            color: p.color,
            position: p.position
        }))
    };
    // 创建一个10x9的空棋盘用于日志显示
    let boardLog = Array(10).fill().map(() => Array(9).fill('   '));
    
    // 遍历所有棋子填充到日志棋盘中
    state.pieces.forEach(p => {
        const row = parseInt(p.position.charAt(1));
        const col = p.position.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
        const colorText = p.color === 'red' ? '红' : '黑';
        boardLog[row][col] = colorText + p.type;
    });

    // 输出棋盘状态日志
    console.log('\n当前棋盘状态:');
    console.log('  a   b   c   d   e   f   g   h   i');
    console.log(' ─────────────────────────────────');
    for(let i = 0; i < 10; i++) {
        console.log(`${i}│${boardLog[i].join('│')}│`);
        if(i < 9) {
            console.log(' ─────────────────────────────────');
        }
    }
    console.log(' ─────────────────────────────────\n');

    return JSON.stringify(state, null, 2);
}

// 验证AI的移动是否合法
function validateAIMove(piece, toPos) {
    if (!piece) {
        showMessage(`找不到指定的棋子`);
        return false;
    }

    // 使用现有的移动规则验证
    return isValidMove(piece, piece.position, toPos);
}

// 执行AI的移动
function executeAIMove(piece, toPos) {
    if (piece) {
        return tryMovePiece(piece, toPos);
    }
    return false;
}

// 调用OpenAI API
async function callOpenAI(prompt) {
    try {
        const apiKey = getOpenAIKey();
        console.log("API密钥:", apiKey);
        if (!apiKey) {
            throw new Error('OpenAI API key not found');
        }

        const functions = [
            {
                name: "makeMove",
                description: "移动一个棋子到新的位置",
                parameters: {
                    type: "object",
                    properties: {
                        pieceId: {
                            type: "string",
                            description: "要移动的棋子的唯一标识，格式为：'类型_颜色_当前位置'，例如：'馬_black_b0b'"
                        },
                        targetPosition: {
                            type: "string",
                            description: "目标位置的坐标，例如：'b2c'"
                        }
                    },
                    required: ["pieceId", "targetPosition"]
                }
            }
        ];
        console.log("AI model:", AI_CONFIG.model);
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: SYSTEM_PROMPT
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                functions: functions,
                function_call: { name: "makeMove" }
            })
        });

        const data = await response.json();
        console.log('AI API响应:', data);

        if (data.choices[0].message.function_call) {
            const functionCall = data.choices[0].message.function_call;
            const args = JSON.parse(functionCall.arguments);
            console.log('AI移动args:', args);
            return args;
        }

        return null;
    } catch (error) {
        console.error('调用OpenAI API失败:', error);
        return null;
    }
}

// AI下棋的主函数
window.makeAIMove = async function() {
    if (gameState.currentPlayer !== 'black') {
        return;
    }

    // 获取当前棋盘状态
    const boardState = getBoardStateForAI();
    
    // 构建提示词
    const prompt = `当前棋盘状态：
${boardState}

请为黑方选择一个合法的移动。`;

    // 调用OpenAI
    console.log("发起AI请求");
    // console.log("AI Request Prompt:", prompt);
    const move = await callOpenAI(prompt);
    if (!move) {
        showMessage('AI思考出现问题，请重试');
        return;
    }
    console.log('解析AI移动move:', move);
    // 解析pieceId
    const [pieceType, color, currentPos] = move.pieceId.split('_');
    
    // 找到要移动的棋子
    const piece = initialPieces.find(p => 
        p.position === currentPos && 
        p.type === pieceType && 
        p.color === color
    );

    // 验证移动是否合法
    if (!validateAIMove(piece, move.targetPosition)) {
        showMessage('AI提出的移动不符合规则');
        console.log('AI提出的移动不符合规则');
        return;
    }
    
    console.log("execute AI移动:", piece, move.targetPosition);
    // 执行移动
    if (!executeAIMove(piece, move.targetPosition)) {
        showMessage('执行AI的移动时出现错误');
        console.log('执行AI的移动时出现错误');
        return;
    }

    console.log('AI移动成功:', move);
    
    // 切换回合
    gameState.currentPlayer = 'red';
    updateGameStatus();
} 