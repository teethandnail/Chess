/*
board.js - Source Code for XiangQi Wizard Light, Part IV

XiangQi Wizard Light - a Chinese Chess Program for JavaScript
Designed by Morning Yellow, Version: 1.0, Last Modified: Sep. 2012
Copyright (C) 2004-2012 www.xqbase.com

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

"use strict";

// 游戏结果常量
var RESULT_UNKNOWN = 0;  // 未知结果
var RESULT_WIN = 1;      // 胜利
var RESULT_DRAW = 2;     // 和棋
var RESULT_LOSS = 3;     // 失败

// 棋盘尺寸相关常量
var BOARD_WIDTH = 521;   // 棋盘宽度
var BOARD_HEIGHT = 577;  // 棋盘高度
var SQUARE_SIZE = 57;    // 每个格子的大小
var SQUARE_LEFT = (BOARD_WIDTH - SQUARE_SIZE * 9) >> 1;  // 棋盘左边距
var SQUARE_TOP = (BOARD_HEIGHT - SQUARE_SIZE * 10) >> 1; // 棋盘上边距

// 思考动画相关常量
var THINKING_SIZE = 32;  // 思考动画大小
var THINKING_LEFT = (BOARD_WIDTH - THINKING_SIZE) >> 1;  // 思考动画水平位置
var THINKING_TOP = (BOARD_HEIGHT - THINKING_SIZE) >> 1;  // 思考动画垂直位置

// 棋子移动动画相关
var MAX_STEP = 8;  // 移动动画的最大步数

// 棋子名称数组，索引对应棋子类型
var PIECE_NAME = [
  "oo", null, null, null, null, null, null, null,  // 0-7: 未使用
  "rk", "ra", "rb", "rn", "rr", "rc", "rp", null,  // 8-15: 红方棋子
  "bk", "ba", "bb", "bn", "br", "bc", "bp", null,  // 16-23: 黑方棋子
];

// 计算棋子在棋盘上的水平位置
function SQ_X(sq) {
  return SQUARE_LEFT + (FILE_X(sq) - 3) * SQUARE_SIZE;
}

// 计算棋子在棋盘上的垂直位置
function SQ_Y(sq) {
  return SQUARE_TOP + (RANK_Y(sq) - 3) * SQUARE_SIZE;
}

// 计算棋子移动动画的中间位置
// src: 起始位置
// dst: 目标位置
// step: 当前动画步数
function MOVE_PX(src, dst, step) {
  return Math.floor((src * step + dst * (MAX_STEP - step)) / MAX_STEP + .5) + "px";
}

// 延迟显示提示信息
// message: 要显示的信息
// delay: 250ms
function alertDelay(message) {
  setTimeout(function() {
    alert(message);
  }, 250);
}

// Board类 - 象棋棋盘核心类
// container: 包含棋盘的DOM元素
// images: 图片资源路径
// sounds: 音效资源路径
function Board(container, images, sounds) {
  this.images = images;  // 图片资源路径
  this.sounds = sounds;  // 音效资源路径
  this.pos = new Position();  // 棋局位置对象
  this.pos.fromFen("rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1");  // 初始化棋局
  this.animated = true;  // 是否启用动画
  this.sound = true;     // 是否启用音效
  this.search = null;    // 搜索对象
  this.imgSquares = [];  // 棋盘格子图片数组
  this.sqSelected = 0;   // 当前选中的格子
  this.mvLast = 0;       // 上一步走法
  this.millis = 0;       // 计时器
  this.computer = -1;    // 电脑执棋方 (-1表示未设置)
  this.result = RESULT_UNKNOWN;  // 当前棋局结果
  this.busy = false;     // 是否处于忙碌状态

  // 设置棋盘容器样式
  var style = container.style;
  style.position = "relative";
  style.width = BOARD_WIDTH + "px";
  style.height = BOARD_HEIGHT + "px";
  style.background = "url(" + images + "board.jpg)";

  // 初始化棋盘格子
  var this_ = this;
  for (var sq = 0; sq < 256; sq ++) {
    if (!IN_BOARD(sq)) {
      this.imgSquares.push(null);
      continue;
    }
    var img = document.createElement("img");
    var style = img.style;
    style.position = "absolute";
    style.left = SQ_X(sq);
    style.top = SQ_Y(sq);
    style.width = SQUARE_SIZE;
    style.height = SQUARE_SIZE;
    style.zIndex = 0;
    img.onmousedown = function(sq_) {
      return function() {
        this_.clickSquare(sq_);
      }
    } (sq);
    container.appendChild(img);
    this.imgSquares.push(img);
  }

  // 初始化思考动画
  // this.thinking = document.createElement("img");
  // this.thinking.src = images + "thinking.gif";
  // style = this.thinking.style;
  // style.visibility = "hidden";
  // style.position = "absolute";
  // style.left = THINKING_LEFT + "px";
  // style.top = THINKING_TOP + "px";
  // container.appendChild(this.thinking);

  // // 初始化音效播放器
  // this.dummy = document.createElement("div");
  // this.dummy.style.position = "absolute";
  // container.appendChild(this.dummy);

  // 刷新棋盘显示
  this.flushBoard();
}

// 播放音效
// soundFile: 音效文件名（不带.wav扩展名）
Board.prototype.playSound = function(soundFile) {
  if (!this.sound) {  // 如果音效被禁用则直接返回
    return;
  }
  try {
    // 使用HTML5 Audio API播放音效
    new Audio(this.sounds + soundFile + ".wav").play();
  } catch (e) {
    // 如果HTML5 Audio失败，则回退到embed方式播放
    this.dummy.innerHTML= "<embed src=\"" + this.sounds + soundFile +
        ".wav\" hidden=\"true\" autostart=\"true\" loop=\"false\" />";
  }
}

// 设置搜索算法
// hashLevel: 哈希表大小级别（0表示禁用搜索）
Board.prototype.setSearch = function(hashLevel) {
  // 根据hashLevel创建或销毁搜索对象
  this.search = hashLevel == 0 ? null : new Search(this.pos, hashLevel);
}

// 获取翻转后的棋盘位置
// sq: 原始棋盘位置
// 返回值: 如果电脑执红方则返回翻转后的位置，否则返回原位置
Board.prototype.flipped = function(sq) {
  return this.computer == 0 ? SQUARE_FLIP(sq) : sq;
}

// 判断当前是否是电脑走棋
// 返回值: true表示当前是电脑走棋，false表示玩家走棋
Board.prototype.computerMove = function() {
  return this.pos.sdPlayer == this.computer;
}

// 判断上一步是否是电脑走棋
// 返回值: true表示上一步是电脑走棋，false表示上一步是玩家走棋
Board.prototype.computerLastMove = function() {
  return 1 - this.pos.sdPlayer == this.computer;
}

// 添加一步走法到棋盘
// mv: 走法
// computerMove: 是否是电脑走棋
Board.prototype.addMove = function(mv, computerMove) {
  if (!this.pos.legalMove(mv)) {
    return;
  }
  if (!this.pos.makeMove(mv)) {
    this.playSound("illegal");
    return;
  }
  this.busy = true;
  if (!this.animated) {
    this.postAddMove(mv, computerMove);
    return;
  }

  var sqSrc = this.flipped(SRC(mv));
  var xSrc = SQ_X(sqSrc);
  var ySrc = SQ_Y(sqSrc);
  var sqDst = this.flipped(DST(mv));
  var xDst = SQ_X(sqDst);
  var yDst = SQ_Y(sqDst);
  var style = this.imgSquares[sqSrc].style;
  style.zIndex = 256;
  var step = MAX_STEP - 1;
  var this_ = this;
  var timer = setInterval(function() {
    if (step == 0) {
      clearInterval(timer);
      style.left = xSrc + "px";
      style.top = ySrc + "px";
      style.zIndex = 0;
      this_.postAddMove(mv, computerMove);
    } else {
      style.left = MOVE_PX(xSrc, xDst, step);
      style.top = MOVE_PX(ySrc, yDst, step);
      step --;
    }
  }, 16);
}

// 处理走法添加后的逻辑
// mv: 走法
// computerMove: 是否是电脑走棋
Board.prototype.postAddMove = function(mv, computerMove) {
  if (this.mvLast > 0) {
    this.drawSquare(SRC(this.mvLast), false);
    this.drawSquare(DST(this.mvLast), false);
  }
  this.drawSquare(SRC(mv), true);
  this.drawSquare(DST(mv), true);
  this.sqSelected = 0;
  this.mvLast = mv;

  if (this.pos.isMate()) {
    this.playSound(computerMove ? "loss" : "win");
    this.result = computerMove ? RESULT_LOSS : RESULT_WIN;

    var pc = SIDE_TAG(this.pos.sdPlayer) + PIECE_KING;
    var sqMate = 0;
    for (var sq = 0; sq < 256; sq ++) {
      if (this.pos.squares[sq] == pc) {
        sqMate = sq;
        break;
      }
    }
    if (!this.animated || sqMate == 0) {
      this.postMate(computerMove);
      return;
    }

    sqMate = this.flipped(sqMate);
    var style = this.imgSquares[sqMate].style;
    style.zIndex = 256;
    var xMate = SQ_X(sqMate);
    var step = MAX_STEP;
    var this_ = this;
    var timer = setInterval(function() {
      if (step == 0) {
        clearInterval(timer);
        style.left = xMate + "px";
        style.zIndex = 0;
        this_.imgSquares[sqMate].src = this_.images +
            (this_.pos.sdPlayer == 0 ? "r" : "b") + "km.gif";
        this_.postMate(computerMove);
      } else {
        style.left = (xMate + ((step & 1) == 0 ? step : -step) * 2) + "px";
        step --;
      }
    }, 50);
    return;
  }

  var vlRep = this.pos.repStatus(3);
  if (vlRep > 0) {
    vlRep = this.pos.repValue(vlRep);
    if (vlRep > -WIN_VALUE && vlRep < WIN_VALUE) {
      this.playSound("draw");
      this.result = RESULT_DRAW;
      alertDelay("双方不变作和，辛苦了！");
    } else if (computerMove == (vlRep < 0)) {
      this.playSound("loss");
      this.result = RESULT_LOSS;
      alertDelay("长打作负，请不要重复！");
    } else {
      this.playSound("win");
      this.result = RESULT_WIN;
      alertDelay("长打作负，祝贺你取得胜利！");
    }
    this.postAddMove2();
    this.busy = false;
    return;
  }

  if (this.pos.captured()) {
    var hasMaterial = false;
    for (var sq = 0; sq < 256; sq ++) {
      if (IN_BOARD(sq) && (this.pos.squares[sq] & 7) > 2) {
        hasMaterial = true;
        break;
      }
    }
    if (!hasMaterial) {
      this.playSound("draw");
      this.result = RESULT_DRAW;
      alertDelay("双方都没有进攻棋子，和棋！");
      this.postAddMove2();
      this.busy = false;
      return;
    }
  } else if (this.pos.pcList.length > 100) {
    var captured = false;
    for (var i = 2; i <= 100; i ++) {
      if (this.pos.pcList[this.pos.pcList.length - i] > 0) {
        captured = true;
        break;
      }
    }
    if (!captured) {
      this.playSound("draw");
      this.result = RESULT_DRAW;
      alertDelay("超过自然限着作和，辛苦了！");
      this.postAddMove2();
      this.busy = false;
      return;
    }
  }

  if (this.pos.inCheck()) {
    this.playSound(computerMove ? "check2" : "check");
  } else if (this.pos.captured()) {
    this.playSound(computerMove ? "capture2" : "capture");
  } else {
    this.playSound(computerMove ? "move2" : "move");
  }

  this.postAddMove2();
  this.response();
}

// 走法添加后的回调函数
Board.prototype.postAddMove2 = function() {
  if (typeof this.onAddMove == "function") {
    this.onAddMove();
  }
}

// 处理将死后的逻辑
// computerMove: 是否是电脑走棋
Board.prototype.postMate = function(computerMove) {
  alertDelay(computerMove ? "请再接再厉！" : "祝贺你取得胜利！");
  this.postAddMove2();
  this.busy = false;
}

// 电脑响应走法
Board.prototype.response = function() {
  if (this.search == null || !this.computerMove()) {
    this.busy = false;
    return;
  }
  this.thinking.style.visibility = "visible";
  var this_ = this;
  this.busy = true;
  setTimeout(function() {
    this_.addMove(board.search.searchMain(LIMIT_DEPTH, board.millis), true);
    this_.thinking.style.visibility = "hidden";
  }, 250);
}

// 处理棋盘格点击事件
// sq_: 被点击的棋盘格位置
Board.prototype.clickSquare = function(sq_) {
  if (this.busy || this.result != RESULT_UNKNOWN) {
    return;
  }
  var sq = this.flipped(sq_);
  var pc = this.pos.squares[sq];
  if ((pc & SIDE_TAG(this.pos.sdPlayer)) != 0) {
    this.playSound("click");
    if (this.mvLast != 0) {
      this.drawSquare(SRC(this.mvLast), false);
      this.drawSquare(DST(this.mvLast), false);
    }
    if (this.sqSelected) {
      this.drawSquare(this.sqSelected, false);
    }
    this.drawSquare(sq, true);
    this.sqSelected = sq;
  } else if (this.sqSelected > 0) {
    this.addMove(MOVE(this.sqSelected, sq), false);
  }
}

// 绘制棋盘格
// sq: 棋盘格位置
// selected: 是否被选中
Board.prototype.drawSquare = function(sq, selected) {
  // var img = this.imgSquares[this.flipped(sq)];
  // img.src = this.images + PIECE_NAME[this.pos.squares[sq]] + ".gif";
  // img.style.backgroundImage = selected ? "url(" + this.images + "oos.gif)" : "";
}

// 刷新整个棋盘显示
Board.prototype.flushBoard = function() {
  this.mvLast = this.pos.mvList[this.pos.mvList.length - 1];
  for (var sq = 0; sq < 256; sq ++) {
    if (IN_BOARD(sq)) {
      this.drawSquare(sq, sq == SRC(this.mvLast) || sq == DST(this.mvLast));
    }
  }
}

// 重新开始游戏
// fen: 棋局FEN字符串
Board.prototype.restart = function(fen) {
  if (this.busy) {
    return;
  }
  this.result = RESULT_UNKNOWN;
  this.pos.fromFen(fen);
  this.flushBoard();
  this.playSound("newgame");
  this.response();
}

// 悔棋操作
Board.prototype.retract = function() {
  if (this.busy) {
    return;
  }
  this.result = RESULT_UNKNOWN;
  if (this.pos.mvList.length > 1) {
    this.pos.undoMakeMove();
  }
  if (this.pos.mvList.length > 1 && this.computerMove()) {
    this.pos.undoMakeMove();
  }
  this.flushBoard();
  this.response();
}

// 设置音效开关
// sound: true开启音效，false关闭音效
Board.prototype.setSound = function(sound) {
  this.sound = sound;
  if (sound) {
    this.playSound("click");
  }
}
