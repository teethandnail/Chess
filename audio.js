// 音频管理器
window.audioManager = {
    // Howl可以解决iPhone浏览器延迟播放音频问题
    moveSound: new Howl({
        src: ['sounds/move.mp3']
      }),
    checkSound: new Howl({
        src: ['sounds/check.mp3']
      }),
    checkingSound: new Howl({
        src: ['sounds/checking.mp3']
      }),
    incheckSound: new Howl({
        src: ['sounds/incheck.mp3']
      }),
    redWinSound: new Howl({
        src: ['sounds/redwin.mp3']
      }),
    blackWinSound: new Howl({
        src: ['sounds/blackwin.mp3']
      }),

    test2MoveSound: new Howl({
        src: ['sounds/move.mp3']
      }),


    // 播放移动音效
    playTest2MoveSound() {
        this.test2MoveSound.play();
    },


    playMoveSound() {
        this.moveSound.play();
    },

    playCheckSound() {
        this.checkSound.play();
    },

    playCheckingSound() {
        this.checkingSound.play();
    },

    playIncheckSound() {
        this.incheckSound.play();
    },

    playRedWinSound() {
        this.redWinSound.play();
    },

    playBlackWinSound() {
        this.blackWinSound.play();
    }
};