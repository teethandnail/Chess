// 棋盘状态
let gameState = {
    isGameStarted: false,
    currentPlayer: 'red', // 当前回合，红方先手
    selectedPiece: null,  // 当前选中的棋子
    board: new Array(10).fill(null).map(() => new Array(9).fill(null)), // 9x10的棋盘
    lastClickedPosition: null, // 记录上次点击的位置
    lastMovedRedPiece: null,  // 记录红方上一次移动的棋子
    lastMovedBlackPiece: null, // 记录黑方上一次移动的棋子
    moveHistory: [], // 记录移动历史
    lastRemovedPiece: null, // 记录最后一次被吃掉的棋子
    aiMoveTimer: null // AI移动定时器
};

// 初始化棋子位置
const INITIAL_PIECES = [
    // 红方（下方）- 从左到右，从下到上
    { type: '车', color: 'red', position: 'r9a' },
    { type: '马', color: 'red', position: 'r9b' },
    { type: '相', color: 'red', position: 'r9c' },
    { type: '仕', color: 'red', position: 'r9d' },
    { type: '帅', color: 'red', position: 'r9e' },
    { type: '仕', color: 'red', position: 'r9f' },
    { type: '相', color: 'red', position: 'r9g' },
    { type: '马', color: 'red', position: 'r9h' },
    { type: '车', color: 'red', position: 'r9i' },
    { type: '炮', color: 'red', position: 'r7b' },
    { type: '炮', color: 'red', position: 'r7h' },
    { type: '兵', color: 'red', position: 'r6a' },
    { type: '兵', color: 'red', position: 'r6c' },
    { type: '兵', color: 'red', position: 'r6e' },
    { type: '兵', color: 'red', position: 'r6g' },
    { type: '兵', color: 'red', position: 'r6i' },

    // 黑方（上方）- 从左到右，从上到下
    { type: '車', color: 'black', position: 'b0a' },
    { type: '馬', color: 'black', position: 'b0b' },
    { type: '象', color: 'black', position: 'b0c' },
    { type: '士', color: 'black', position: 'b0d' },
    { type: '将', color: 'black', position: 'b0e' },
    { type: '士', color: 'black', position: 'b0f' },
    { type: '象', color: 'black', position: 'b0g' },
    { type: '馬', color: 'black', position: 'b0h' },
    { type: '車', color: 'black', position: 'b0i' },
    { type: '砲', color: 'black', position: 'b2b' },
    { type: '砲', color: 'black', position: 'b2h' },
    { type: '卒', color: 'black', position: 'b3a' },
    { type: '卒', color: 'black', position: 'b3c' },
    { type: '卒', color: 'black', position: 'b3e' },
    { type: '卒', color: 'black', position: 'b3g' },
    { type: '卒', color: 'black', position: 'b3i' }
];

// DOM元素引用
let startButton;
let undoButton;
let currentPlayerDisplay;
let gameMessageDisplay;

// AI相关变量
let searchEngine = null;
let aiBoard = null;

// AI难度设置
let AI_LEVEL = {
    EASY: { hashLevel: 1, millis: 100 },
    MEDIUM: { hashLevel: 5, millis: 300 },
    HARD: { hashLevel: 16, millis: 1000 }
};

let currentAILevel = AI_LEVEL.MEDIUM;

// 设置AI难度
function setAILevel(level) {
    currentAILevel = AI_LEVEL[level];
    if (aiBoard) {
        aiBoard.setSearch(currentAILevel.hashLevel);
        aiBoard.millis = currentAILevel.millis;
    }
    // 设置完难度后自动隐藏下拉框
    const dropdown = document.querySelector('.ai-level-dropdown');
    dropdown.style.display = 'none';
}

// 初始化AI
function initializeAI() {
    // 创建AI棋盘对象
    aiBoard = new Board(document.createElement('div'), './core/images/', './core/sounds/');
    // 设置搜索引擎
    // aiBoard.setSearch(currentAILevel.hashLevel);
    aiBoard.millis = currentAILevel.millis;
    aiBoard.setSearch(3);
    aiBoard.millis = 10;
    aiBoard.computer = 1;
    searchEngine = aiBoard.search;
    
    // 设置初始局面
    const startupFen = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w";
    aiBoard.pos.fromFen(startupFen);
}

// 将我们的坐标格式转换为AI使用的格式
function convertToAIPosition(position) {
    // 只取position的后两位，忽略颜色标识
    // 例如：'r9a' 或 'b9a' 都只取 '9a'
    const coord = position.slice(-2);
    // 检查输入格式
    if (typeof coord !== 'string' || coord.length !== 2) {
        return -1;
    }
    
    // 获取纵坐标（0-9）
    const row = parseInt(coord[0]);
    // 获取横坐标（a-i转换为0-8）
    const col = coord.charCodeAt(1) - 'a'.charCodeAt(0);
    
    // 检查坐标是否有效
    if (col < 0 || col > 8 || row < 0 || row > 9) {
        return -1;
    }
    
    // 转换为sq_坐标
    return (row + 3) * 16 + (col + 3);
}

// 将AI的坐标格式转换为我们的格式
function convertFromAIPosition(aiPosition) {
    // 计算行和列
    const row = Math.floor(aiPosition / 16) - 3;  // 减去偏移量3
    const col = (aiPosition % 16) - 3;            // 减去偏移量3
    
    // 转换为传统坐标格式（数字在前，字母在后）
    return 'r' + row + String.fromCharCode('a'.charCodeAt(0) + col);
}

// 更新AI的棋盘状态
function updateAIBoard() {
    // 重置AI棋盘
    aiBoard.pos.clearBoard();
    
    // 将二维数组扁平化并过滤出所有棋子
    gameState.board.flat()
        .filter(piece => piece !== null)
        .forEach(piece => {
            const aiPos = convertToAIPosition(piece.position);
            const pieceType = getPieceType(piece);
            if (pieceType) {
                aiBoard.pos.addPiece(aiPos, pieceType);
            }
        });
    
    // 设置当前行动方
    aiBoard.pos.sdPlayer = gameState.currentPlayer === 'red' ? 0 : 1;
}

// 获取AI使用的棋子类型值
function getPieceType(piece) {
    const pieceTypes = {
        red: {
            '帅': 0x08, '仕': 0x09, '相': 0x0A, '马': 0x0B,
            '车': 0x0C, '炮': 0x0D, '兵': 0x0E
        },
        black: {
            '将': 0x10, '士': 0x11, '象': 0x12, '馬': 0x13,
            '車': 0x14, '砲': 0x15, '卒': 0x16
        }
    };
    return pieceTypes[piece.color][piece.type];
}

// AI移动实现
function makeAIMove() {
    if (!gameState.isGameStarted || gameState.currentPlayer !== 'black') {
        return;
    }
    
    // 更新AI的棋盘状态
    updateAIBoard();
    
    // 让AI思考下一步
    if (searchEngine) {
        aiBoard.thinking = true;
        try {
            // 使用searchEngine进行搜索
            let vl = 0;
            vl = searchEngine.searchMain(currentAILevel.millis, vl);
            let mv = searchEngine.mvResult;
            
            if (mv) {
                const srcPos = convertFromAIPosition(SRC(mv));
                const dstPos = convertFromAIPosition(DST(mv));
                
                // 从当前棋盘状态中查找棋子
                const srcRow = parseInt(srcPos.charAt(1));
                const srcCol = srcPos.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
                const piece = gameState.board[srcRow][srcCol];
                
                if (piece) {
                    console.log("AI try move piece", piece, "to Pos", dstPos);
                    tryMovePiece(piece, dstPos);
                }
            }
        } catch (error) {
            console.error('AI移动出错:', error);
        } finally {
            aiBoard.thinking = false;
        }
    }
}

// 坐标转换函数：位置编码转为像素坐标
function positionToCoordinates(position) {
    // 位置格式：[r|b][0-9][a-i]
    // r/b: red/black, 0-9: 行号, a-i: 列号
    const row = parseInt(position.charAt(1));
    const col = position.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
    
    return {
        x: col * 50 + 25,  // 加上边距25px
        y: row * 50 + 25   // 加上边距25px
    };
}

// 像素坐标转为位置编码
function coordinatesToPosition(x, y) {
    // 确保坐标在有效范围内，并考虑边距
    const col = Math.min(Math.max(Math.round((x - 25) / 50), 0), 8);  // 减去边距25px
    const row = Math.min(Math.max(Math.round((y - 25) / 50), 0), 9);  // 减去边距25px
    const color = row >= 5 ? 'r' : 'b';
    return `${color}${row}${String.fromCharCode('a'.charCodeAt(0) + col)}`;
}

// 获取棋盘状态的字符串表示（用于AI）
function getBoardState() {
    return {
        currentPlayer: gameState.currentPlayer,
        board: gameState.board.map(row => 
            row.map(cell => 
                cell ? `${cell.color[0]}${cell.type}` : '--'
            )
        )
    };
}

// 初始化游戏控制
function initializeGameControls() {
    startButton = document.getElementById('startButton');
    undoButton = document.getElementById('undoButton');
    currentPlayerDisplay = document.getElementById('currentPlayer');
    gameMessageDisplay = document.getElementById('gameMessage');

    // 修改开始按钮的文本为"再来一局"
    startButton.textContent = '再来一局';
    startButton.addEventListener('click', startGame);
    undoButton.addEventListener('click', undoLastMove);
}

// 开始游戏
function startGame() {
    
    // 清理之前的定时器
    if (gameState.aiMoveTimer) {
        clearTimeout(gameState.aiMoveTimer);
        gameState.aiMoveTimer = null;
    }
    
    // 重置游戏状态
    gameState.isGameStarted = true;
    gameState.currentPlayer = 'red';
    gameState.selectedPiece = null;
    gameState.lastMovedRedPiece = null;
    gameState.lastMovedBlackPiece = null;
    
    // 清空消息
    gameMessageDisplay.textContent = '';
    
    // 清空移动历史
    gameState.moveHistory = [];
    gameState.lastRemovedPiece = null;
    
    // 启用AI难度按钮（因为是新游戏）
    document.getElementById('aiSettingButton').disabled = false;
    document.getElementById('aiSettingButton').style.backgroundColor = '';
    
    // 禁用后退按钮(因为新游戏没有移动历史)
    undoButton.disabled = true;
    undoButton.style.backgroundColor = ''; // 恢复按钮原始颜色
    
    // 重新初始化棋盘
    initializeBoard();
    
    // 更新游戏状态显示
    updateGameStatus();
}

// 选中棋子
function selectPiece(piece) {
    if (gameState.selectedPiece) {
        gameState.selectedPiece.element.classList.remove('selected');
    }
    if (piece) {
        gameState.selectedPiece = piece;
        piece.element.classList.add('selected');
    } else {
        gameState.selectedPiece = null;
    }
}

// 更新游戏状态显示
function updateGameStatus() {
    if (!gameState.isGameStarted) {
        currentPlayerDisplay.textContent = '等待开始...';
        return;
    }

    const currentPlayerText = gameState.currentPlayer === 'red' ? '红方' : '黑方';
    currentPlayerDisplay.textContent = `当前回合：${currentPlayerText}`;
    console.log('Game status updated:', currentPlayerText);

    // 获取当前棋盘上所有棋子
    const currentPieces = [];
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 9; col++) {
            if (gameState.board[row][col]) {
                currentPieces.push(gameState.board[row][col]);
            }
        }
    }

    // 自动选中逻辑
    if (gameState.currentPlayer === 'red') {
        // 如果红方有上一次移动的棋子且该棋子还在棋盘上
        if (gameState.lastMovedRedPiece && currentPieces.includes(gameState.lastMovedRedPiece)) {
            selectPiece(gameState.lastMovedRedPiece);
        } else {
            // 先尝试选择一个炮
            const redCannon = currentPieces.find(p => p.color === 'red' && p.type === '炮');
            if (redCannon) {
                selectPiece(redCannon);
            } else {
                // 如果没有炮，随机选择一个红方棋子
                const redPieces = currentPieces.filter(p => p.color === 'red');
                if (redPieces.length > 0) {
                    const randomPiece = redPieces[Math.floor(Math.random() * redPieces.length)];
                    selectPiece(randomPiece);
                }
            }
        }
    } else {
        // 如果黑方有上一次移动的棋子且该棋子还在棋盘上
        if (gameState.lastMovedBlackPiece && currentPieces.includes(gameState.lastMovedBlackPiece)) {
            selectPiece(gameState.lastMovedBlackPiece);
        } else {
            // 先尝试选择一个砲
            const blackCannon = currentPieces.find(p => p.color === 'black' && p.type === '砲');
            if (blackCannon) {
                selectPiece(blackCannon);
            } else {
                // 如果没有砲，随机选择一个黑方棋子
                const blackPieces = currentPieces.filter(p => p.color === 'black');
                if (blackPieces.length > 0) {
                    const randomPiece = blackPieces[Math.floor(Math.random() * blackPieces.length)];
                    selectPiece(randomPiece);
                }
            }
        }
    }
}

// 棋盘点击事件处理函数
function onBoardClick(e) {
    e.stopPropagation();
    if (gameState.isGameStarted) {
        handleBoardClick(e);
    }
}

// 初始化棋盘
function initializeBoard() {
    const piecesContainer = document.getElementById('pieces');
    const chessboard = document.querySelector('.chessboard');
    
    // 清空之前的棋子
    piecesContainer.innerHTML = '';
    // 初始化棋盘状态
    gameState.board = new Array(10).fill(null).map(() => new Array(9).fill(null));
    
    let initialPieces = JSON.parse(JSON.stringify(INITIAL_PIECES));
    // 初始化所有棋子
    initialPieces.forEach(piece => {
        const pieceElement = document.createElement('div');
        pieceElement.className = `piece ${piece.color}`;
        pieceElement.textContent = piece.type;
        piece.element = pieceElement;
        
        // 计算并设置棋子位置
        const coords = positionToCoordinates(piece.position);
        pieceElement.style.left = `${coords.x}px`;
        pieceElement.style.top = `${coords.y}px`;
        
        // 添加点击和触摸事件
        const handlePieceInteraction = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (gameState.isGameStarted) {
                handlePieceClick(piece);
            }
        };
        
        pieceElement.addEventListener('click', handlePieceInteraction);
        pieceElement.addEventListener('touchstart', handlePieceInteraction);
        
        piecesContainer.appendChild(pieceElement);

        // 显示棋盘上的棋子
        const pos = piece.position;
        const row = parseInt(pos.charAt(1));
        const col = pos.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
        if (row >= 0 && row < 10 && col >= 0 && col < 9) {
            gameState.board[row][col] = piece;
        }
    });
    
    // 移除之前可能存在的事件监听器
    chessboard.removeEventListener('click', handleBoardClick);
    chessboard.removeEventListener('touchend', handleBoardClick);
    
    // 添加棋盘点击和触摸事件
    chessboard.addEventListener('click', handleBoardClick);
    chessboard.addEventListener('touchend', handleBoardClick);
}

// 检查移动是否合法
function isValidMove(piece, fromPos, toPos) {
    const fromRow = parseInt(fromPos.charAt(1));
    const fromCol = fromPos.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
    const toRow = parseInt(toPos.charAt(1));
    const toCol = toPos.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);

    // 根据不同棋子类型检查移动规则
    switch (piece.type) {
        case '车':
        case '車':
            return checkRookMove(gameState, fromRow, fromCol, toRow, toCol);
        case '马':
        case '馬':
            return checkKnightMove(gameState, fromRow, fromCol, toRow, toCol);
        case '相':
        case '象':
            return checkElephantMove(gameState, piece.color, fromRow, fromCol, toRow, toCol);
        case '仕':
        case '士':
            return checkAdvisorMove(gameState, piece.color, fromRow, fromCol, toRow, toCol);
        case '帅':
        case '将':
            return checkKingMove(gameState, piece.color, fromRow, fromCol, toRow, toCol);
        case '炮':
        case '砲':
            return checkCannonMove(gameState, fromRow, fromCol, toRow, toCol);
        case '兵':
        case '卒':
            return checkPawnMove(gameState, piece.color, fromRow, fromCol, toRow, toCol);
        default:
            return false;
    }
}

// 显示错误消息
function showMessage(message) {
    gameMessageDisplay.textContent = message;
    setTimeout(() => {
        gameMessageDisplay.textContent = '';
    }, 2000);
}

// 处理棋子点击
function handlePieceClick(piece) {
    if (!gameState.isGameStarted) {
        return;
    }

    console.log('handlePieceClick');

    console.log('Piece clicked:', piece.type, piece.color);
    console.log('Current player:', gameState.currentPlayer);

    if (piece.color === gameState.currentPlayer) {
        // 如果点击的是自己的棋子，选中它
        if (gameState.selectedPiece === piece) {
            // 如果点击的是已选中的棋子，取消选中
            selectPiece(null);
        } else {
            // 选中新的棋子
            selectPiece(piece);
        }
    } else if (gameState.selectedPiece) {
        // 如果已经选中了棋子，并且点击的是对方的棋子，尝试吃子
        tryMovePiece(gameState.selectedPiece, piece.position);
    }
}

// 处理棋盘点击
function handleBoardClick(event) {
    if (!gameState.isGameStarted || !gameState.selectedPiece) {
        return;
    }

    console.log('Board clicked');   

    const boardRect = document.querySelector('.chessboard').getBoundingClientRect();
    // 获取实际点击/触摸位置
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);
    
    // 考虑页面缩放比例
    const scale = window.innerWidth <= 380 ? 0.7 : 
                 window.innerWidth <= 480 ? 0.8 : 1.2;
                 
    // 计算相对坐标时考虑缩放
    const x = (clientX - boardRect.left) / scale - 25;
    const y = (clientY - boardRect.top) / scale - 25;
    
    // 计算网格位置
    const col = Math.round(x / 50);
    const row = Math.round(y / 50);
    
    // 检查是否在有效范围内
    if (row >= 0 && row < 10 && col >= 0 && col < 9) {
        const color = row >= 5 ? 'r' : 'b';
        const targetPosition = `${color}${row}${String.fromCharCode('a'.charCodeAt(0) + col)}`;
        
        console.log('Board clicked:', targetPosition);
        tryMovePiece(gameState.selectedPiece, targetPosition);
    }
}

// 检查是否将军
function checkCheck(piece) {
    // 获取对方主帅的位置
    const targetKingType = piece.color === 'red' ? '将' : '帅';
    let targetKing = null;
    
    // 从棋盘状态中查找对方主帅
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 9; col++) {
            const p = gameState.board[row][col];
            if (p && p.type === targetKingType) {
                targetKing = p;
                break;
            }
        }
        if (targetKing) break;
    }
    
    if (!targetKing) {
        return false;
    }
    
    // 从棋盘状态中获取移动方所有的棋子
    const attackingPieces = [];
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 9; col++) {
            const p = gameState.board[row][col];
            if (p && p.color === piece.color) {
                attackingPieces.push(p);
            }
        }
    }
    
    // 检查每个棋子是否可以攻击到对方主帅
    for (const attackingPiece of attackingPieces) {
        // 如果是帅或将，检查是否直面对方主帅
        if (attackingPiece.type === '帅' || attackingPiece.type === '将') {
            const attackerCol = attackingPiece.position.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
            const targetCol = targetKing.position.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
            
            // 如果在同一列
            if (attackerCol === targetCol) {
                const attackerRow = parseInt(attackingPiece.position.charAt(1));
                const targetRow = parseInt(targetKing.position.charAt(1));
                let hasPieceBetween = false;
                
                // 检查两个棋子之间是否有其他棋子
                const minRow = Math.min(attackerRow, targetRow);
                const maxRow = Math.max(attackerRow, targetRow);
                for (let row = minRow + 1; row < maxRow; row++) {
                    if (gameState.board[row][attackerCol]) {
                        hasPieceBetween = true;
                        break;
                    }
                }
                
                // 如果没有棋子阻挡，则形成将军
                if (!hasPieceBetween) {
                    return true;
                }
            }
            continue;
        }
        
        // 如果是炮,需要特殊处理跳吃规则
        if (attackingPiece.type === '炮' || attackingPiece.type === '砲') {
            if (checkCannonAttackKing(attackingPiece, targetKing)) {
                return true;
            }
            continue;
        }
        
        // 其他棋子检查是否可以直接移动到主帅位置
        if (isValidMove(attackingPiece, attackingPiece.position, targetKing.position)) {
            return true;
        }
    }
    
    return false;
}

// 检查炮是否可以攻击到对方主帅
function checkCannonAttackKing(cannon, targetKing) {
    const fromRow = parseInt(cannon.position.charAt(1));
    const fromCol = cannon.position.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
    const toRow = parseInt(targetKing.position.charAt(1));
    const toCol = targetKing.position.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
    
    // 必须在同一直线上
    if (fromRow !== toRow && fromCol !== toCol) {
        return false;
    }
    
    let pieceCount = 0;
    
    // 计算路径上的棋子数量
    if (fromRow === toRow) {
        const minCol = Math.min(fromCol, toCol);
        const maxCol = Math.max(fromCol, toCol);
        for (let col = minCol + 1; col < maxCol; col++) {
            if (gameState.board[fromRow][col]) {
                pieceCount++;
            }
        }
    } else {
        const minRow = Math.min(fromRow, toRow);
        const maxRow = Math.max(fromRow, toRow);
        for (let row = minRow + 1; row < maxRow; row++) {
            if (gameState.board[row][fromCol]) {
                pieceCount++;
            }
        }
    }
    
    // 炮攻击主帅必须正好隔一个棋子
    return pieceCount === 1;
}

// 尝试移动棋子
function tryMovePiece(piece, targetPosition) {
    console.log('=== 尝试移动棋子 ===', piece.type, piece.color, "从", piece.position, "到", targetPosition);
    
    // 获取目标位置的行列
    const targetRow = parseInt(targetPosition.charAt(1));
    const targetCol = targetPosition.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
    const targetPiece = gameState.board[targetRow][targetCol];

    if (targetPiece !== null && targetPiece !== undefined && targetPiece.color === piece.color) {
        showMessage('不能吃自己的棋子！');
        return false;
    }

    if (isValidMove(piece, piece.position, targetPosition)) {
        // 在确认移动合法后立即播放音效
        window.audioManager.playMoveSound();

        const inCheck = withTemporaryMove(piece, targetPosition, () => {
            return isInCheck(gameState.currentPlayer);
        });

        if (inCheck) {
            showMessage('将军中！');
            window.audioManager.playCheckingSound();
            return false;
        }

        const fromPosition = piece.position;
        let removedPiece = null;
        
        // 更新棋子在棋盘状态中的位置
        const fromRow = parseInt(piece.position.charAt(1));
        const fromCol = piece.position.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
        gameState.board[fromRow][fromCol] = null;
        
        // 如果目标位置有对方棋子，先从棋盘状态中移除它
        if (targetPiece) {
            removedPiece = targetPiece;
            
            if (targetPiece.type === '将' || targetPiece.type === '帅') {
                // 移除被吃的棋子
                targetPiece.element.remove();
                
                // 更新棋子位置
                gameState.board[targetRow][targetCol] = piece;
                piece.position = targetPosition;

                // 移动棋子到新位置
                const coords = positionToCoordinates(targetPosition);
                piece.element.style.left = `${coords.x}px`;
                piece.element.style.top = `${coords.y}px`;
                
                // 播放游戏结束音效
                if (piece.color === 'red') {
                    window.audioManager.playRedWinSound();
                } else {
                    window.audioManager.playBlackWinSound();
                }
                
                // 调用游戏结束处理函数并立即返回
                endGame(piece.color === 'red' ? '红方' : '黑方');
                return true;
            }
            targetPiece.element.remove();
        }

        // 更新棋子位置
        gameState.board[targetRow][targetCol] = piece;
        piece.position = targetPosition;

        // 记录这一步移动
        recordMove(piece, fromPosition, targetPosition, removedPiece);

        // 计算新位置的坐标并移动棋子
        const coords = positionToCoordinates(targetPosition);
        piece.element.style.left = `${coords.x}px`;
        piece.element.style.top = `${coords.y}px`;
        
        // 直接执行后续操作，不使用setTimeout
        console.log('移动完成，新位置:', piece.position);
        printBoardState();
        
        if (piece.color === 'red') {
            gameState.lastMovedRedPiece = piece;
        } else {
            gameState.lastMovedBlackPiece = piece;
        }
        
        // 移动后无论是否触发将军，对方无棋可走，游戏结束
        if (isCheckmate(gameState.currentPlayer === 'red' ? 'black' : 'red')) {
            // 将军后导致对方无棋可走
            let msg = gameState.currentPlayer === 'red' ? '将死！你赢了！' : '将军！你输了！';
            showMessage(msg);
            gameState.isGameStarted = false;
            startButton.disabled = false;

            if (piece.color === 'red') {
                window.audioManager.playRedWinSound();
            } else {
                window.audioManager.playBlackWinSound();
            }
            
            // 调用游戏结束处理函数并立即返回
            endGame(piece.color === 'red' ? '红方' : '黑方');
            return true;
        } 

        if (checkCheck(piece)) {
            showMessage('将军！');
            window.audioManager.playCheckSound();
        } 
        
        if (isInCheck(gameState.currentPlayer)) {
            showMessage('这步棋会被将军！');
            window.audioManager.playIncheckSound();
        }
        
        selectPiece(null);
        gameState.currentPlayer = piece.color === 'red' ? 'black' : 'red';
        updateGameStatus();
        
        if (gameState.currentPlayer === 'black') {
            // 清理之前的定时器
            if (gameState.aiMoveTimer) {
                clearTimeout(gameState.aiMoveTimer);
            }
            // 等待一段时间后再让AI移动，确保用户能看清楚移动结果
            gameState.aiMoveTimer = setTimeout(makeAIMove, 700);
        }
        
        return true;
    }
    console.log('移动不合法');
    return false;
}

// 临时移动棋子并执行操作的通用方法
function withTemporaryMove(piece, targetPosition, operation) {
    // 保存当前状态
    const fromRow = parseInt(piece.position.charAt(1));
    const fromCol = piece.position.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
    const originalPosition = piece.position;
    const targetRow = parseInt(targetPosition.charAt(1));
    const targetCol = targetPosition.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
    const originalTargetPiece = gameState.board[targetRow][targetCol];

    // 临时移动棋子
    gameState.board[fromRow][fromCol] = null;
    piece.position = targetPosition;
    gameState.board[targetRow][targetCol] = piece;

    // 执行传入的操作
    const result = operation();

    // 恢复原状态
    piece.position = originalPosition;
    gameState.board[fromRow][fromCol] = piece;
    gameState.board[targetRow][targetCol] = originalTargetPiece;

    return result;
}

// 新增函数：检查指定颜色方是否被将军
function isInCheck(color) {
    // 获取己方主帅
    const kingType = color === 'red' ? '帅' : '将';
    let king = null;
    
    // 从棋盘状态中查找主帅
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 9; col++) {
            const piece = gameState.board[row][col];
            if (piece && piece.type === kingType && piece.color === color) {
                king = piece;
                break;
            }
        }
        if (king) break;
    }
    
    if (!king) {
        return false;
    }
    
    // 获取对方所有棋子
    const opponentPieces = [];
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 9; col++) {
            const piece = gameState.board[row][col];
            if (piece && piece.color !== color) {
                opponentPieces.push(piece);
            }
        }
    }
    
    // 检查每个对方棋子是否可以攻击到己方主帅
    for (const attackingPiece of opponentPieces) {
        // 如果是帅或将，检查是否直面对方主帅
        if (attackingPiece.type === '帅' || attackingPiece.type === '将') {
            const attackerCol = attackingPiece.position.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
            const targetCol = king.position.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
            
            // 如果在同一列
            if (attackerCol === targetCol) {
                const attackerRow = parseInt(attackingPiece.position.charAt(1));
                const targetRow = parseInt(king.position.charAt(1));
                let hasPieceBetween = false;
                
                // 检查两个棋子之间是否有其他棋子
                const minRow = Math.min(attackerRow, targetRow);
                const maxRow = Math.max(attackerRow, targetRow);
                for (let row = minRow + 1; row < maxRow; row++) {
                    if (gameState.board[row][attackerCol]) {
                        hasPieceBetween = true;
                        break;
                    }
                }
                
                // 如果没有棋子阻挡，则形成将军
                if (!hasPieceBetween) {
                    return true;
                }
            }
            continue;
        }
        
        // 如果是炮,需要特殊处理跳吃规则
        if (attackingPiece.type === '炮' || attackingPiece.type === '砲') {
            if (checkCannonAttackKing(attackingPiece, king)) {
                return true;
            }
            continue;
        }
        
        // 其他棋子检查是否可以直接移动到主帅位置
        if (isValidMove(attackingPiece, attackingPiece.position, king.position)) {
            return true;
        }
    }
    
    return false;
}

// 打印棋盘状态
function printBoardState() {
    // 创建一个10x9的空棋盘用于日志显示
    let boardLog = Array(10).fill().map(() => Array(9).fill('   '));
    
    // 遍历棋盘状态填充到日志棋盘中
    for(let row = 0; row < 10; row++) {
        for(let col = 0; col < 9; col++) {
            const piece = gameState.board[row][col];
            if(piece) {
                const colorText = piece.color === 'red' ? '红' : '黑';
                boardLog[row][col] = colorText + piece.type;
            }
        }
    }

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
}

// 记录移动
function recordMove(piece, fromPosition, toPosition, removedPiece = null) {
    gameState.moveHistory.push({
        piece: piece,
        from: fromPosition,
        to: toPosition,
        removedPiece: removedPiece
    });
    // 启用后退按钮
    undoButton.disabled = false;
    // 禁用AI难度按钮
    document.getElementById('aiSettingButton').disabled = true;
    document.getElementById('aiSettingButton').style.backgroundColor = '#cccccc';
}

// 后退一步
function undoLastMove() {
    if (!gameState.isGameStarted || gameState.moveHistory.length === 0) {
        return;
    }

    const lastMove = gameState.moveHistory.pop();
    
    // 移动棋子回到原位置
    const piece = lastMove.piece;
    piece.position = lastMove.from;
    const coords = positionToCoordinates(lastMove.from);
    
    // 更新棋盘状态
    const fromRow = parseInt(lastMove.from.charAt(1));
    const fromCol = lastMove.from.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
    const toRow = parseInt(lastMove.to.charAt(1));
    const toCol = lastMove.to.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
    
    // 清除目标位置的棋子状态
    gameState.board[toRow][toCol] = null;
    // 将棋子放回原位置
    gameState.board[fromRow][fromCol] = piece;
    
    // 使用requestAnimationFrame来确保动画和音效的同步
    requestAnimationFrame(() => {
        piece.element.style.left = `${coords.x}px`;
        piece.element.style.top = `${coords.y}px`;
        
        // 在动画完成后播放音效
        setTimeout(() => {
            window.audioManager.playMoveSound();
        }, 0);
    });

    // 如果有被吃掉的棋子，恢复它
    if (lastMove.removedPiece) {
        const removedCoords = positionToCoordinates(lastMove.to);
        lastMove.removedPiece.element.style.left = `${removedCoords.x}px`;
        lastMove.removedPiece.element.style.top = `${removedCoords.y}px`;
        document.getElementById('pieces').appendChild(lastMove.removedPiece.element);
        // 在棋盘状态中恢复被吃掉的棋子
        gameState.board[toRow][toCol] = lastMove.removedPiece;
    }

    // 更新最后移动的棋子记录
    if (piece.color === 'red') {
        const redMoves = gameState.moveHistory.filter(move => move.piece.color === 'red');
        const previousMove = redMoves.length > 0 ? redMoves[redMoves.length - 1] : null;
        gameState.lastMovedRedPiece = previousMove ? previousMove.piece : null;
    } else {
        const blackMoves = gameState.moveHistory.filter(move => move.piece.color === 'black');
        const previousMove = blackMoves.length > 0 ? blackMoves[blackMoves.length - 1] : null;
        gameState.lastMovedBlackPiece = previousMove ? previousMove.piece : null;
    }

    // 切换回合
    gameState.currentPlayer = piece.color;
    
    // 如果没有更多历史记录，启用AI难度按钮并禁用后退按钮
    if (gameState.moveHistory.length === 0) {
        undoButton.disabled = true;
        document.getElementById('aiSettingButton').disabled = false;
        document.getElementById('aiSettingButton').style.backgroundColor = '';
    }

    // 更新游戏状态
    updateGameStatus();
}

// 新增函数：检查color方是否将死
function isCheckmate(color) {
    // 从当前棋盘状态获取所有己方棋子
    const ownPieces = [];
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 9; col++) {
            const piece = gameState.board[row][col];
            if (piece && piece.color === color) {
                ownPieces.push(piece);
            }
        }
    }
    
    // 遍历每个己方棋子
    for (const piece of ownPieces) {
        const fromRow = parseInt(piece.position.charAt(1));
        const fromCol = piece.position.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
        
        // 遍历棋盘上的每个位置
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                // 检查目标位置是否已经有己方棋子
                const targetPiece = gameState.board[row][col];
                if (targetPiece && targetPiece.color === color) {
                    continue; // 如果目标位置有己方棋子，跳过这个位置
                }

                const targetColor = row >= 5 ? 'r' : 'b';
                const targetPosition = `${targetColor}${row}${String.fromCharCode('a'.charCodeAt(0) + col)}`;
                
                // 如果这步移动合法
                if (isValidMove(piece, piece.position, targetPosition)) {
                    // 保存当前状态
                    const originalPosition = piece.position;
                    
                    // 临时移动棋子
                    gameState.board[fromRow][fromCol] = null;
                    piece.position = targetPosition;
                    gameState.board[row][col] = piece;
                    
                    // 检查移动后是否仍然被将军
                    const stillInCheck = isInCheck(color);
                    
                    // 恢复原状态
                    piece.position = originalPosition;
                    gameState.board[fromRow][fromCol] = piece;
                    gameState.board[row][col] = targetPiece; // 这里targetPiece可能是null，这是正确的
                    
                    // 如果找到一步可以解救的移动，说明没有将死
                    if (!stillInCheck) {
                        return false;
                    }
                }
            }
        }
    }
    
    // 如果所有可能的移动都无法解救将军，说明已经将死
    return true;
}

// AI难度按钮点击事件
document.getElementById('aiSettingButton').addEventListener('click', function(event) {
    event.stopPropagation(); // 阻止事件冒泡
    const dropdown = document.querySelector('.ai-level-dropdown');
    if (dropdown.style.display === 'none') {
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
});

// 给下拉框本身添加点击事件处理
document.querySelector('.ai-level-dropdown').addEventListener('click', function(event) {
    event.stopPropagation(); // 阻止事件冒泡
});

// 点击其他地方时隐藏AI难度下拉框
document.addEventListener('click', function(event) {
    if (!event.target.matches('#aiSettingButton')) {
        const dropdown = document.querySelector('.ai-level-dropdown');
        dropdown.style.display = 'none';
    }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeBoard();
    initializeGameControls();
    initializeAI();
    
    // 自动开始游戏
    startGame();
});

// 游戏结束时的处理
function endGame(winner) {
    // 清理定时器
    if (gameState.aiMoveTimer) {
        clearTimeout(gameState.aiMoveTimer);
        gameState.aiMoveTimer = null;
    }
    
    gameState.isGameStarted = false;
    startButton.disabled = false;
    undoButton.disabled = true;
    undoButton.style.backgroundColor = '#ccc';
    
    // 启用AI难度按钮
    document.getElementById('aiSettingButton').disabled = false;
    document.getElementById('aiSettingButton').style.backgroundColor = '';
    
    // 显示游戏结束信息
    gameMessageDisplay.textContent = `游戏结束！${winner}获胜！`;
}