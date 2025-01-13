// 音频管理器
window.audioManager = {
    moveSound: './sounds/move.mp3',
    checkSound: './sounds/check.mp3',
    checkingSound: './sounds/checking.mp3',
    incheckSound: './sounds/incheck.mp3',
    redWinSound: './sounds/redwin.mp3',
    blackWinSound: './sounds/blackwin.mp3',

    // 音频实例池
    audioPool: {},
    
    // 初始化音频池
    initAudioPool() {
        // 为每种音效预先创建音频实例
        this.audioPool.move = new Audio(this.moveSound);
        this.audioPool.check = new Audio(this.checkSound);
        this.audioPool.checking = new Audio(this.checkingSound);
        this.audioPool.incheck = new Audio(this.incheckSound);
        this.audioPool.redWin = new Audio(this.redWinSound);
        this.audioPool.blackWin = new Audio(this.blackWinSound);

        // 在iOS上预加载
        const playPromises = Object.values(this.audioPool).map(audio => {
            audio.preload = 'auto';
            audio.load();
            // iOS要求必须有用户交互才能播放
            const playAttempt = audio.play();
            if (playAttempt) {
                playAttempt.catch(() => {});
            }
            audio.pause();
            audio.currentTime = 0;
            return audio;
        });

        return Promise.all(playPromises).catch(() => {});
    },

    playSound(type) {
        const audio = this.audioPool[type];
        if (!audio) return;

        // 重置音频
        audio.currentTime = 0;
        
        // 尝试播放
        const playPromise = audio.play();
        if (playPromise) {
            playPromise.catch(e => {
                console.log('播放音效失败:', e);
                // 如果播放失败，可能是因为用户还没有交互
                // 在移动端，我们可以选择静默失败
            });
        }
    },

    playMoveSound() {
        this.playSound('move');
    },

    playCheckSound() {
        this.playSound('check');
    },

    playCheckingSound() {
        this.playSound('checking');
    },

    playIncheckSound() {
        this.playSound('incheck');
    },

    playRedWinSound() {
        this.playSound('redWin');
    },

    playBlackWinSound() {
        this.playSound('blackWin');
    }
};

// 页面加载完成后初始化音频池
document.addEventListener('DOMContentLoaded', () => {
    window.audioManager.initAudioPool();
}); 