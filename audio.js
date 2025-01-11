// 音效管理
const audioManager = {
    moveSound: new Audio('sounds/move.mp3'),
    redWinSound: new Audio('sounds/redwin.mp3'),
    blackWinSound: new Audio('sounds/blackwin.mp3'),
    checkSound: new Audio('sounds/check.mp3'),

    // 播放移动音效
    playMoveSound() {
        this.moveSound.currentTime = 0;
        this.moveSound.play().catch(error => console.log('播放移动音效失败:', error));
    },

    // 播放回合切换音效
    playRedWinSound() {
        this.redWinSound.currentTime = 0;
        this.redWinSound.play().catch(error => console.log('游戏结束音效失败:', error));
    },

    // 播放回合切换音效
    playBlackWinSound() {
        this.blackWinSound.currentTime = 0;
        this.blackWinSound.play().catch(error => console.log('游戏结束音效失败:', error));
    },

    // 播放将军音效
    playCheckSound() {
        this.checkSound.currentTime = 0;
        this.checkSound.play().catch(error => console.log('将军音效失败:', error));
    }
};

// 导出音频管理器
window.audioManager = audioManager; 