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
    lastRemovedPiece: null // 记录最后一次被吃掉的棋子
};

// 初始化棋子位置
let initialPieces = [
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

// 坐标转换函数：位置编码转为像素坐标
function positionToCoordinates(position) {
    // 位置格式：[r|b][0-9][a-i]
    // r/b: red/black, 0-9: 行号, a-i: 列号
    const row = parseInt(position.charAt(1));
    const col = position.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
    
    // 每个格子50px，加上25px的padding和棋子半径的偏移
    return {
        x: col * 50 + 25,
        y: row * 50 + 25
    };
}

// 像素坐标转为位置编码
function coordinatesToPosition(x, y) {
    const col = Math.round((x) / 50);
    const row = Math.round((y) / 50);
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

    startButton.addEventListener('click', startGame);
    undoButton.addEventListener('click', undoLastMove);
}

// 开始游戏
function startGame() {
    // 重置棋子到初始位置
    initialPieces = [
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

    // 重置游戏状态
    gameState.isGameStarted = true;
    gameState.currentPlayer = 'red';
    gameState.selectedPiece = null;
    gameState.lastMovedRedPiece = null;
    gameState.lastMovedBlackPiece = null;
    
    // 清空消息
    gameMessageDisplay.textContent = '';
    
    // 禁用开始按钮
    startButton.disabled = true;
    
    // 清空移动历史
    gameState.moveHistory = [];
    gameState.lastRemovedPiece = null;
    
    // 禁用后退按钮
    undoButton.disabled = true;
    
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

    // 自动选中逻辑
    if (gameState.currentPlayer === 'red') {
        // 如果红方有上一次移动的棋子且该棋子还在棋盘上，选中它
        if (gameState.lastMovedRedPiece && initialPieces.includes(gameState.lastMovedRedPiece)) {
            selectPiece(gameState.lastMovedRedPiece);
        } else {
            // 如果没有上一次移动的棋子或者该棋子已被吃掉
            // 先尝试选择一个炮
            const redCannon = initialPieces.find(p => p.color === 'red' && p.type === '炮');
            if (redCannon) {
                selectPiece(redCannon);
            } else {
                // 如果没有炮，随机选择一个红方棋子
                const redPieces = initialPieces.filter(p => p.color === 'red');
                if (redPieces.length > 0) {
                    const randomPiece = redPieces[Math.floor(Math.random() * redPieces.length)];
                    selectPiece(randomPiece);
                }
            }
        }
    } else {
        // 如果黑方有上一次移动的棋子且该棋子还在棋盘上，选中它
        if (gameState.lastMovedBlackPiece && initialPieces.includes(gameState.lastMovedBlackPiece)) {
            selectPiece(gameState.lastMovedBlackPiece);
        } else {
            // 如果没有上一次移动的棋子或者该棋子已被吃掉
            // 先尝试选择一个砲
            const blackCannon = initialPieces.find(p => p.color === 'black' && p.type === '砲');
            if (blackCannon) {
                selectPiece(blackCannon);
            } else {
                // 如果没有砲，随机选择一个黑方棋子
                const blackPieces = initialPieces.filter(p => p.color === 'black');
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
        
        // 添加点击事件
        pieceElement.addEventListener('click', (e) => {
            e.stopPropagation();
            if (gameState.isGameStarted) {
                handlePieceClick(piece);
            }
        });
        
        piecesContainer.appendChild(pieceElement);
    });
    
    // 移除之前可能存在的点击事件监听器
    chessboard.removeEventListener('click', onBoardClick);
    
    // 添加棋盘点击事件
    chessboard.addEventListener('click', onBoardClick);
    
    // 初始化棋盘状态
    updateGameState();
}

// 检查移动是否合法
function isValidMove(piece, fromPos, toPos) {
    const fromRow = parseInt(fromPos.charAt(1));
    const fromCol = fromPos.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
    const toRow = parseInt(toPos.charAt(1));
    const toCol = toPos.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
    // console.log("检查",piece.type, "的移动是否合法:", "from [行, 列]:", fromRow, fromCol, "to:", toRow, toCol);

    // 根据不同棋子类型检查移动规则
    switch (piece.type) {
        case '车':
        case '車':
            return checkRookMove(fromRow, fromCol, toRow, toCol);
        case '马':
        case '馬':
            return checkKnightMove(fromRow, fromCol, toRow, toCol);
        case '相':
        case '象':
            return checkElephantMove(piece.color, fromRow, fromCol, toRow, toCol);
        case '仕':
        case '士':
            return checkAdvisorMove(piece.color, fromRow, fromCol, toRow, toCol);
        case '帅':
        case '将':
            return checkKingMove(piece.color, fromRow, fromCol, toRow, toCol);
        case '炮':
        case '砲':
            return checkCannonMove(fromRow, fromCol, toRow, toCol);
        case '兵':
        case '卒':
            return checkPawnMove(piece.color, fromRow, fromCol, toRow, toCol);
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

// 车的移动规则
function checkRookMove(fromRow, fromCol, toRow, toCol) {
    // console.log('Checking 车 move from [行, 列]:', fromRow, fromCol, 'to [行, 列]:', toRow, toCol);

    if (fromRow !== toRow && fromCol !== toCol) {
        showMessage('车只能直线移动！');
        return false;
    }
    
    // 检查路径上是否有其他棋子
    if (fromRow === toRow) {
        const minCol = Math.min(fromCol, toCol);
        const maxCol = Math.max(fromCol, toCol);
        for (let col = minCol + 1; col < maxCol; col++) {
            if (gameState.board[fromRow][col]) {
                showMessage('移动路径上有其他棋子！');
                return false;
            }
        }
    } else {
        const minRow = Math.min(fromRow, toRow);
        const maxRow = Math.max(fromRow, toRow);
        for (let row = minRow + 1; row < maxRow; row++) {
            if (gameState.board[row][fromCol]) {
                showMessage('移动路径上有其他棋子！');
                return false;
            }
        }
    }
    return true;
}

// 马的移动规则
function checkKnightMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    if (!((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2))) {
        showMessage('马只能走"日"字！');
        return false;
    }
    
    // 检查马脚
    if (rowDiff === 2) {
        const checkRow = fromRow + (toRow > fromRow ? 1 : -1);
        if (gameState.board[checkRow][fromCol]) {
            showMessage('马脚被蹩住了！');
            return false;
        }
    } else {
        const checkCol = fromCol + (toCol > fromCol ? 1 : -1);
        if (gameState.board[fromRow][checkCol]) {
            showMessage('马脚被蹩住了！');
            return false;
        }
    }
    return true;
}

// 相/象的移动规则
function checkElephantMove(color, fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    if (rowDiff !== 2 || colDiff !== 2) {
        showMessage('相/象只能走"田"字！');
        return false;
    }
    
    // 检查相心
    const centerRow = (fromRow + toRow) / 2;
    const centerCol = (fromCol + toCol) / 2;
    if (gameState.board[centerRow][centerCol]) {
        showMessage('相心被蹩住了！');
        return false;
    }
    
    // 不能过河
    if (color === 'red' && toRow < 5 || color === 'black' && toRow > 4) {
        showMessage('相/象不能过河！');
        return false;
    }
    
    return true;
}

// 仕/士的移动规则
function checkAdvisorMove(color, fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    if (rowDiff !== 1 || colDiff !== 1) {
        showMessage('仕/士只能斜走一格！');
        return false;
    }
    
    // 检查是否在九宫格内
    if (color === 'red') {
        if (toRow < 7 || toRow > 9 || toCol < 3 || toCol > 5) {
            showMessage('仕/士必须在九宫格内！');
            return false;
        }
    } else {
        if (toRow > 2 || toRow < 0 || toCol < 3 || toCol > 5) {
            showMessage('仕/士必须在九宫格内！');
            return false;
        }
    }
    
    return true;
}

// 帅/将的移动规则
function checkKingMove(color, fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    if (rowDiff + colDiff !== 1) {
        showMessage('帅/将只能走一格！');
        return false;
    }
    
    // 检查是否在九宫格内
    if (color === 'red') {
        if (toRow < 7 || toRow > 9 || toCol < 3 || toCol > 5) {
            showMessage('帅/将必须在九宫格内！');
            return false;
        }
    } else {
        if (toRow > 2 || toRow < 0 || toCol < 3 || toCol > 5) {
            showMessage('帅/将必须在九宫格内！');
            return false;
        }
    }
    
    return true;
}

// 炮的移动规则
function checkCannonMove(fromRow, fromCol, toRow, toCol) {
    console.log('=== 检查炮的移动 ===', fromRow, fromCol, "到", toRow, toCol);

    if (fromRow !== toRow && fromCol !== toCol) {
        showMessage('炮只能直线移动！');
        return false;
    }
    
    let pieceCount = 0;
    const targetPiece = gameState.board[toRow][toCol];
    
    // 计算路径上的棋子数量
    if (fromRow === toRow) {
        const minCol = Math.min(fromCol, toCol);
        const maxCol = Math.max(fromCol, toCol);
        for (let col = minCol + 1; col < maxCol; col++) {
            if (gameState.board[fromRow][col]) {
                pieceCount++;
                console.log('发现中间棋子，位置:', fromRow, col);
            }
        }
    } else {
        const minRow = Math.min(fromRow, toRow);
        const maxRow = Math.max(fromRow, toRow);
        for (let row = minRow + 1; row < maxRow; row++) {
            if (gameState.board[row][fromCol]) {
                pieceCount++;
                console.log('发现中间棋子，位置:', row, fromCol);
            }
        }
    }
    
    console.log('目标位置棋子:', targetPiece ? targetPiece : '空');
    console.log('中间棋子数量:', pieceCount);
    
    // 吃子时必须隔一个棋子
    if (targetPiece) {
        if (pieceCount !== 1) {
            showMessage('炮吃子必须隔一个棋子！');
            return false;
        }
    } else {
        // 移动时路径上不能有棋子
        if (pieceCount !== 0) {
            showMessage('炮移动路径上不能有棋子！');
            return false;
        }
    }
    
    return true;
}

// 兵/卒的移动规则
function checkPawnMove(color, fromRow, fromCol, toRow, toCol) {
    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);
    
    if (color === 'red') {
        // 红方兵
        if (fromRow > 4) {
            // 未过河
            if (rowDiff !== -1 || colDiff !== 0) {
                showMessage('未过河的兵只能向前走！');
                return false;
            }
        } else {
            // 已过河
            if (rowDiff > 0 || (rowDiff === 0 && colDiff > 1) || Math.abs(rowDiff) + colDiff > 1) {
                showMessage('过河的兵只能向前或左右走一步！');
                return false;
            }
        }
    } else {
        // 黑方卒
        if (fromRow < 5) {
            // 未过河
            if (rowDiff !== 1 || colDiff !== 0) {
                showMessage('未过河的卒只能向前走！');
                return false;
            }
        } else {
            // 已过河
            if (rowDiff < 0 || (rowDiff === 0 && colDiff > 1) || Math.abs(rowDiff) + colDiff > 1) {
                showMessage('过河的卒只能向前或左右走一步！');
                return false;
            }
        }
    }
    
    return true;
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
    const x = event.clientX - boardRect.left - 25; // 减去padding
    const y = event.clientY - boardRect.top - 25;
    
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

// 打印剩余棋子信息
function printRemainingPieces() {
    console.log('=== 当前剩余棋子 ===');
    console.log('红方棋子:');
    initialPieces.filter(p => p.color === 'red').forEach(p => {
        console.log(`${p.type} - 位置: ${p.position}`);
    });
    console.log('黑方棋子:');
    initialPieces.filter(p => p.color === 'black').forEach(p => {
        console.log(`${p.type} - 位置: ${p.position}`);
    });
    console.log('总计剩余棋子数量:', initialPieces.length);
}

// 检查是否将军
function checkCheck(piece) {
    // 获取对方主帅的位置
    const targetKingType = piece.color === 'red' ? '将' : '帅';
    const targetKing = initialPieces.find(p => p.type === targetKingType);
    
    if (!targetKing) {
        return false;
    }
    
    // 获取移动方所有的棋子
    const attackingPieces = initialPieces.filter(p => p.color === piece.color);
    
    // 检查每个棋子是否可以攻击到对方主帅
    for (const attackingPiece of attackingPieces) {
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

    console.log('目标位置棋子:', targetPiece ? targetPiece : '空');

    // 只有当目标位置确实有棋子，且是己方棋子时，才禁止移动
    if (targetPiece !== null && targetPiece !== undefined && targetPiece.color === piece.color) {
        showMessage('不能吃自己的棋子！');
        return false;
    }

    if (isValidMove(piece, piece.position, targetPosition)) {
        console.log('移动合法，准备执行移动');
        
        const fromPosition = piece.position;
        let removedPiece = null;
        
        // 更新棋子在棋盘状态中的位置
        const fromRow = parseInt(piece.position.charAt(1));
        const fromCol = piece.position.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
        gameState.board[fromRow][fromCol] = null;
        
        // 如果目标位置有对方棋子，先从棋盘状态中移除它
        if (targetPiece) {
            console.log('发现目标位置有对方棋子，准备移除');
            removedPiece = targetPiece;
            
            // 检查是否吃掉了对方的将/帅
            if (targetPiece.type === '将' || targetPiece.type === '帅') {
                // 移除被吃的棋子
                targetPiece.element.remove();
                initialPieces = initialPieces.filter(p => p !== targetPiece);
                
                // 更新棋子位置
                gameState.board[targetRow][targetCol] = piece;
                piece.position = targetPosition;

                // 移动棋子到新位置
                const coords = positionToCoordinates(targetPosition);
                requestAnimationFrame(() => {
                    piece.element.style.left = `${coords.x}px`;
                    piece.element.style.top = `${coords.y}px`;
                });
                
                // 播放游戏结束音效
                if (piece.color === 'red') {
                    window.audioManager.playRedWinSound();
                } else {
                    window.audioManager.playBlackWinSound();
                }
                
                // 显示游戏结束信息
                const winner = piece.color === 'red' ? '红方' : '黑方';
                gameMessageDisplay.textContent = `游戏结束！${winner}获胜！`;
                gameState.isGameStarted = false;
                startButton.disabled = false; // 允许重新开始游戏
                
                // 记录这一步移动
                recordMove(piece, fromPosition, targetPosition, removedPiece);
                return true;
            }
            // 移除被吃的棋子
            targetPiece.element.remove();
            initialPieces = initialPieces.filter(p => p !== targetPiece);
        }

        // 更新棋子位置
        gameState.board[targetRow][targetCol] = piece;
        piece.position = targetPosition;

        // 记录这一步移动
        recordMove(piece, fromPosition, targetPosition, removedPiece);

        // 计算新位置的坐标并移动棋子
        const coords = positionToCoordinates(targetPosition);
        requestAnimationFrame(() => {
            piece.element.style.left = `${coords.x}px`;
            piece.element.style.top = `${coords.y}px`;
            
            // 在动画完成后执行后续操作
            setTimeout(() => {
                // 播放移动音效
                window.audioManager.playMoveSound();
                
                console.log('移动完成，新位置:', piece.position);
                printBoardState();
                
                // 记录这一步移动的棋子
                if (piece.color === 'red') {
                    gameState.lastMovedRedPiece = piece;
                } else {
                    gameState.lastMovedBlackPiece = piece;
                }
                
                // 检查是否将军
                if (checkCheck(piece)) {
                    showMessage('将军！');
                    window.audioManager.playCheckSound();
                }
                
                // 检查移动后是否被对方将军
                if (isInCheck(gameState.currentPlayer)) {
                    // 撤销这步移动
                    showMessage('这步棋会被将军！');
                    window.audioManager.playIncheckSound();
                }
                
                // 取消选中状态
                selectPiece(null);
                
                // 切换回合
                gameState.currentPlayer = piece.color === 'red' ? 'black' : 'red';
                updateGameStatus();
                
                // // 如果切换到黑方回合，让AI下棋
                // if (gameState.currentPlayer === 'black') {
                //     setTimeout(makeAIMove, 1000); // 延迟1秒，让玩家能看清楚红方的移动
                // }
            }, 0);
        });
        
        // 立即返回 true，防止事件冒泡
        return true;
    }
    console.log('移动不合法');
    return false;
}

// 更新棋盘状态
function updateGameState() {
    // 清空棋盘状态
    gameState.board = new Array(10).fill(null).map(() => new Array(9).fill(null));
    
    // 只更新还在棋盘上的棋子
    initialPieces.forEach(piece => {
        const pos = piece.position;
        const row = parseInt(pos.charAt(1));
        const col = pos.charAt(2).charCodeAt(0) - 'a'.charCodeAt(0);
        if (row >= 0 && row < 10 && col >= 0 && col < 9) {
            gameState.board[row][col] = piece;
        }
    });
}

// AI移动
async function makeAIMove() {
    if (!gameState.isGameStarted || gameState.currentPlayer !== 'black') {
        console.log('AI移动失败，游戏未开始或不是黑方回合');
        return;
    }
    
    // 使用ai.js中实现的AI逻辑
    await window.makeAIMove();
}

// 移动棋子
function movePiece(piece, newPosition) {
    const coords = positionToCoordinates(newPosition);
    piece.position = newPosition;
    piece.element.style.left = coords.x + 'px';
    piece.element.style.top = coords.y + 'px';
    
    // 更新棋盘状态
    updateGameState();
}

// 打印棋盘状态
function printBoardState() {
    // 创建一个10x9的空棋盘用于日志显示
    let boardLog = Array(10).fill().map(() => Array(9).fill('   '));
    
    // 遍历所有棋子填充到日志棋盘中
    initialPieces.forEach(p => {
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
        initialPieces.push(lastMove.removedPiece);
        const removedCoords = positionToCoordinates(lastMove.to);
        lastMove.removedPiece.element.style.left = `${removedCoords.x}px`;
        lastMove.removedPiece.element.style.top = `${removedCoords.y}px`;
        document.getElementById('pieces').appendChild(lastMove.removedPiece.element);
    }

    // 更新最后移动的棋子记录
    if (piece.color === 'red') {
        const previousMove = gameState.moveHistory.findLast(move => move.piece.color === 'red');
        gameState.lastMovedRedPiece = previousMove ? previousMove.piece : null;
    } else {
        const previousMove = gameState.moveHistory.findLast(move => move.piece.color === 'black');
        gameState.lastMovedBlackPiece = previousMove ? previousMove.piece : null;
    }

    // 切换回合
    gameState.currentPlayer = piece.color;
    
    // 如果没有更多历史记录，禁用后退按钮
    if (gameState.moveHistory.length === 0) {
        undoButton.disabled = true;
    }

    // 更新游戏状态
    updateGameState();
    updateGameStatus();
}

// 新增函数：检查指定颜色方是否被将军
function isInCheck(color) {
    // 获取己方主帅
    const kingType = color === 'red' ? '帅' : '将';
    const king = initialPieces.find(p => p.type === kingType && p.color === color);
    
    if (!king) {
        return false;
    }
    
    // 获取对方所有棋子
    const opponentPieces = initialPieces.filter(p => p.color !== color);
    
    // 检查每个对方棋子是否可以攻击到己方主帅
    for (const attackingPiece of opponentPieces) {
        // 如果是炮，需要特殊处理跳吃规则
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeBoard();
    initializeGameControls();
}); 