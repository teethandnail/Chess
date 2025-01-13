// 中国象棋移动规则检查模块

// 车的移动规则
function checkRookMove(gameState, fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) {
        return false;
    }
    
    // 检查路径上是否有其他棋子
    if (fromRow === toRow) {
        const minCol = Math.min(fromCol, toCol);
        const maxCol = Math.max(fromCol, toCol);
        for (let col = minCol + 1; col < maxCol; col++) {
            if (gameState.board[fromRow][col]) {
                return false;
            }
        }
    } else {
        const minRow = Math.min(fromRow, toRow);
        const maxRow = Math.max(fromRow, toRow);
        for (let row = minRow + 1; row < maxRow; row++) {
            if (gameState.board[row][fromCol]) {
                return false;
            }
        }
    }
    return true;
}

// 马的移动规则
function checkKnightMove(gameState, fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    if (!((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2))) {
        return false;
    }
    
    // 检查马脚
    if (rowDiff === 2) {
        const checkRow = fromRow + (toRow > fromRow ? 1 : -1);
        if (gameState.board[checkRow][fromCol]) {
            return false;
        }
    } else {
        const checkCol = fromCol + (toCol > fromCol ? 1 : -1);
        if (gameState.board[fromRow][checkCol]) {
            return false;
        }
    }
    return true;
}

// 相/象的移动规则
function checkElephantMove(gameState, color, fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    if (rowDiff !== 2 || colDiff !== 2) {
        return false;
    }
    
    // 检查相心
    const centerRow = (fromRow + toRow) / 2;
    const centerCol = (fromCol + toCol) / 2;
    if (gameState.board[centerRow][centerCol]) {
        return false;
    }
    
    // 不能过河
    if (color === 'red' && toRow < 5 || color === 'black' && toRow > 4) {
        return false;
    }
    
    return true;
}

// 仕/士的移动规则
function checkAdvisorMove(gameState, color, fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    if (rowDiff !== 1 || colDiff !== 1) {
        return false;
    }
    
    // 检查是否在九宫格内
    if (color === 'red') {
        if (toRow < 7 || toRow > 9 || toCol < 3 || toCol > 5) {
            return false;
        }
    } else {
        if (toRow > 2 || toRow < 0 || toCol < 3 || toCol > 5) {
            return false;
        }
    }
    
    return true;
}

// 帅/将的移动规则
function checkKingMove(gameState, color, fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    if (rowDiff + colDiff !== 1) {
        return false;
    }
    
    // 检查是否在九宫格内
    if (color === 'red') {
        if (toRow < 7 || toRow > 9 || toCol < 3 || toCol > 5) {
            return false;
        }
    } else {
        if (toRow > 2 || toRow < 0 || toCol < 3 || toCol > 5) {
            return false;
        }
    }
    
    return true;
}

// 炮的移动规则
function checkCannonMove(gameState, fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) {
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
    
    // 吃子时必须隔一个棋子
    if (targetPiece) {
        if (pieceCount !== 1) {
            return false;
        }
    } else {
        // 移动时路径上不能有棋子
        if (pieceCount !== 0) {
            return false;
        }
    }
    
    return true;
}

// 兵/卒的移动规则
function checkPawnMove(gameState, color, fromRow, fromCol, toRow, toCol) {
    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);
    
    if (color === 'red') {
        // 红方兵
        if (fromRow > 4) {
            // 未过河
            if (rowDiff !== -1 || colDiff !== 0) {
                return false;
            }
        } else {
            // 已过河
            if (rowDiff > 0 || (rowDiff === 0 && colDiff > 1) || Math.abs(rowDiff) + colDiff > 1) {
                return false;
            }
        }
    } else {
        // 黑方卒
        if (fromRow < 5) {
            // 未过河
            if (rowDiff !== 1 || colDiff !== 0) {
                return false;
            }
        } else {
            // 已过河
            if (rowDiff < 0 || (rowDiff === 0 && colDiff > 1) || Math.abs(rowDiff) + colDiff > 1) {
                return false;
            }
        }
    }
    
    return true;
} 