/*
search.js - Source Code for XiangQi Wizard Light, Part II

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

// 希尔排序的步长序列
var SHELL_STEP = [0, 1, 4, 13, 40, 121, 364, 1093];

// 希尔排序算法，用于对走法和对应的分值进行排序
/**
 * 使用希尔排序算法对走法和对应的分值进行排序
 * @param {Array} mvs - 走法数组
 * @param {Array} vls - 分值数组
 */
function shellSort(mvs, vls) {
  var stepLevel = 1;
  // 找到合适的希尔排序步长
  while (SHELL_STEP[stepLevel] < mvs.length) {
    stepLevel ++;
  }
  stepLevel --;
  
  // 使用不同的步长进行排序
  while (stepLevel > 0) {
    var step = SHELL_STEP[stepLevel];
    // 对每个子序列进行插入排序
    for (var i = step; i < mvs.length; i ++) {
      var mvBest = mvs[i];  // 当前走法
      var vlBest = vls[i];  // 当前分值
      var j = i - step;
      // 找到合适的位置插入
      while (j >= 0 && vlBest > vls[j]) {
        mvs[j + step] = mvs[j];
        vls[j + step] = vls[j];
        j -= step;
      }
      // 插入走法和分值
      mvs[j + step] = mvBest;
      vls[j + step] = vlBest;
    }
    stepLevel --;
  }
}

// 定义走法排序的阶段
var PHASE_HASH = 0;      // 哈希走法阶段
var PHASE_KILLER_1 = 1;  // 杀手走法1阶段
var PHASE_KILLER_2 = 2;  // 杀手走法2阶段
var PHASE_GEN_MOVES = 3; // 生成所有走法阶段
var PHASE_REST = 4;      // 剩余走法阶段

// 走法排序类
/**
 * 走法排序类，用于在搜索过程中对走法进行排序
 * @param {number} mvHash - 哈希表中存储的最佳走法
 * @param {Position} pos - 当前棋局位置对象
 * @param {Array} killerTable - 杀手走法表
 * @param {Array} historyTable - 历史启发表
 */
function MoveSort(mvHash, pos, killerTable, historyTable) {
  this.mvs = [];  // 走法数组
  this.vls = [];  // 分值数组
  this.mvHash = this.mvKiller1 = this.mvKiller2 = 0;  // 哈希走法和杀手走法
  this.pos = pos;  // 当前棋局位置
  this.historyTable = historyTable;  // 历史启发表
  this.phase = PHASE_HASH;  // 当前阶段
  this.index = 0;  // 走法索引
  this.singleReply = false;  // 是否只有唯一应着

  // 如果处于被将军状态
  if (pos.inCheck()) {
    this.phase = PHASE_REST;
    // 生成所有合法走法
    var mvsAll = pos.generateMoves(null);
    for (var i = 0; i < mvsAll.length; i ++) {
      var mv = mvsAll[i]
      // 尝试走棋并回退，确保走法合法
      if (!pos.makeMove(mv)) {
        continue;
      }
      pos.undoMakeMove();
      this.mvs.push(mv);
      // 设置分值：如果是哈希走法则最高分，否则使用历史启发值
      this.vls.push(mv == mvHash ? 0x7fffffff :
          historyTable[pos.historyIndex(mv)]);
    }
    // 对走法进行排序
    shellSort(this.mvs, this.vls);
    // 检查是否只有唯一应着
    this.singleReply = this.mvs.length == 1;
  } else {
    // 保存哈希走法和杀手走法
    this.mvHash = mvHash;
    this.mvKiller1 = killerTable[pos.distance][0];
    this.mvKiller2 = killerTable[pos.distance][1];
  }
}

// 获取下一个走法
/**
 * 获取下一个最佳走法
 * @return {number} 返回下一个要尝试的走法
 */
MoveSort.prototype.next = function() {
  switch (this.phase) {
  case PHASE_HASH:  // 哈希走法阶段
    this.phase = PHASE_KILLER_1;
    if (this.mvHash > 0) {
      return this.mvHash;
    }
    // 没有break，继续执行下一个阶段
    
  case PHASE_KILLER_1:  // 杀手走法1阶段
    this.phase = PHASE_KILLER_2;
    if (this.mvKiller1 != this.mvHash && this.mvKiller1 > 0 &&
        this.pos.legalMove(this.mvKiller1)) {
      return this.mvKiller1;
    }
    // 没有break，继续执行下一个阶段
    
  case PHASE_KILLER_2:  // 杀手走法2阶段
    this.phase = PHASE_GEN_MOVES;
    if (this.mvKiller2 != this.mvHash && this.mvKiller2 > 0 &&
        this.pos.legalMove(this.mvKiller2)) {
      return this.mvKiller2;
    }
    // 没有break，继续执行下一个阶段
    
  case PHASE_GEN_MOVES:  // 生成所有走法阶段
    this.phase = PHASE_REST;
    // 生成所有合法走法
    this.mvs = this.pos.generateMoves(null);
    this.vls = [];
    // 为每个走法设置历史启发值
    for (var i = 0; i < this.mvs.length; i ++) {
      this.vls.push(this.historyTable[this.pos.historyIndex(this.mvs[i])]);
    }
    // 对走法进行排序
    shellSort(this.mvs, this.vls);
    this.index = 0;
    // 没有break，继续执行默认阶段
    
  default:  // 剩余走法阶段
    while (this.index < this.mvs.length) {
      var mv = this.mvs[this.index];
      this.index ++;
      // 返回未被处理的走法
      if (mv != this.mvHash && mv != this.mvKiller1 && mv != this.mvKiller2) {
        return mv;
      }
    }
  }
  return 0;  // 没有更多走法
}

var LIMIT_DEPTH = 64;
var NULL_DEPTH = 2;
var RANDOMNESS = 8;

var HASH_ALPHA = 1;
var HASH_BETA = 2;
var HASH_PV = 3;

/**
 * 搜索类，实现主要的搜索算法
 * @param {Position} pos - 当前棋局位置对象
 * @param {number} hashLevel - 哈希表大小级别
 */
function Search(pos, hashLevel) {
  this.hashMask = (1 << hashLevel) - 1;
  this.pos = pos;
}

Search.prototype.getHashItem = function() {
  return this.hashTable[this.pos.zobristKey & this.hashMask];
}

Search.prototype.probeHash = function(vlAlpha, vlBeta, depth, mv) {
  var hash = this.getHashItem();
  if (hash.zobristLock != this.pos.zobristLock) {
    mv[0] = 0;
    return -MATE_VALUE;
  }
  mv[0] = hash.mv;
  var mate = false;
  if (hash.vl > WIN_VALUE) {
    if (hash.vl <= BAN_VALUE) {
      return -MATE_VALUE;
    }
    hash.vl -= this.pos.distance;
    mate = true;
  } else if (hash.vl < -WIN_VALUE) {
    if (hash.vl >= -BAN_VALUE) {
      return -MATE_VALUE;
    }
    hash.vl += this.pos.distance;
    mate = true;
  } else if (hash.vl == this.pos.drawValue()) {
    return -MATE_VALUE;
  }
  if (hash.depth < depth && !mate) {
    return -MATE_VALUE;
  }
  if (hash.flag == HASH_BETA) {
    return (hash.vl >= vlBeta ? hash.vl : -MATE_VALUE);
  }
  if (hash.flag == HASH_ALPHA) {
    return (hash.vl <= vlAlpha ? hash.vl : -MATE_VALUE);
  }
  return hash.vl;
}

Search.prototype.recordHash = function(flag, vl, depth, mv) {
  var hash = this.getHashItem();
  if (hash.depth > depth) {
    return;
  }
  hash.flag = flag;
  hash.depth = depth;
  if (vl > WIN_VALUE) {
    if (mv == 0 && vl <= BAN_VALUE) {
      return;
    }
    hash.vl = vl + this.pos.distance;
  } else if (vl < -WIN_VALUE) {
    if (mv == 0 && vl >= -BAN_VALUE) {
      return;
    }
    hash.vl = vl - this.pos.distance;
  } else if (vl == this.pos.drawValue() && mv == 0) {
    return;
  } else {
    hash.vl = vl;
  }
  hash.mv = mv;
  hash.zobristLock = this.pos.zobristLock;
}

Search.prototype.setBestMove = function(mv, depth) {
  this.historyTable[this.pos.historyIndex(mv)] += depth * depth;
  var mvsKiller = this.killerTable[this.pos.distance];
  if (mvsKiller[0] != mv) {
    mvsKiller[1] = mvsKiller[0];
    mvsKiller[0] = mv;
  }
}

/**
 * 静态搜索（Quiescence Search），用于评估静止局面
 * @param {number} vlAlpha_ - Alpha值
 * @param {number} vlBeta - Beta值
 * @return {number} 返回评估值
 */
Search.prototype.searchQuiesc = function(vlAlpha_, vlBeta) {
  var vlAlpha = vlAlpha_;
  this.allNodes ++;
  var vl = this.pos.mateValue();
  if (vl >= vlBeta) {
    return vl;
  }
  var vlRep = this.pos.repStatus(1);
  if (vlRep > 0) {
    return this.pos.repValue(vlRep);
  }
  if (this.pos.distance == LIMIT_DEPTH) {
    return this.pos.evaluate();
  }
  var vlBest = -MATE_VALUE;
  var mvs = [], vls = [];
  if (this.pos.inCheck()) {
    mvs = this.pos.generateMoves(null);
    for (var i = 0; i < mvs.length; i ++) {
      vls.push(this.historyTable[this.pos.historyIndex(mvs[i])]);
    }
    shellSort(mvs, vls);
  } else {
    vl = this.pos.evaluate();
    if (vl > vlBest) {
      if (vl >= vlBeta) {
        return vl;
      }
      vlBest = vl;
      vlAlpha = Math.max(vl, vlAlpha);
    }
    mvs = this.pos.generateMoves(vls);
    shellSort(mvs, vls);
    for (var i = 0; i < mvs.length; i ++) {
      if (vls[i] < 10 || (vls[i] < 20 && HOME_HALF(DST(mvs[i]), this.pos.sdPlayer))) {
        mvs.length = i;
        break;
      }
    }
  }
  for (var i = 0; i < mvs.length; i ++) {
    if (!this.pos.makeMove(mvs[i])) {
      continue;
    }
    vl = -this.searchQuiesc(-vlBeta, -vlAlpha);
    this.pos.undoMakeMove();
    if (vl > vlBest) {
      if (vl >= vlBeta) {
        return vl;
      }
      vlBest = vl;
      vlAlpha = Math.max(vl, vlAlpha);
    }
  }
  return vlBest == -MATE_VALUE ? this.pos.mateValue() : vlBest;
}

/**
 * 完整搜索（Full Search），实现主要的alpha-beta搜索算法
 * @param {number} vlAlpha_ - Alpha值
 * @param {number} vlBeta - Beta值
 * @param {number} depth - 当前搜索深度
 * @param {boolean} noNull - 是否禁用空着裁剪
 * @return {number} 返回评估值
 */
Search.prototype.searchFull = function(vlAlpha_, vlBeta, depth, noNull) {
  var vlAlpha = vlAlpha_;
  if (depth <= 0) {
    return this.searchQuiesc(vlAlpha, vlBeta);
  }
  this.allNodes ++;
  var vl = this.pos.mateValue();
  if (vl >= vlBeta) {
    return vl;
  }
  var vlRep = this.pos.repStatus(1);
  if (vlRep > 0) {
    return this.pos.repValue(vlRep);
  }
  var mvHash = [0];
  vl = this.probeHash(vlAlpha, vlBeta, depth, mvHash);
  if (vl > -MATE_VALUE) {
    return vl;
  }
  if (this.pos.distance == LIMIT_DEPTH) {
    return this.pos.evaluate();
  }
  if (!noNull && !this.pos.inCheck() && this.pos.nullOkay()) {
    this.pos.nullMove();
    vl = -this.searchFull(-vlBeta, 1 - vlBeta, depth - NULL_DEPTH - 1, true);
    this.pos.undoNullMove();
    if (vl >= vlBeta && (this.pos.nullSafe() ||
        this.searchFull(vlAlpha, vlBeta, depth - NULL_DEPTH, true) >= vlBeta)) {
      return vl;
    }
  }
  var hashFlag = HASH_ALPHA;
  var vlBest = -MATE_VALUE;
  var mvBest = 0;
  var sort = new MoveSort(mvHash[0], this.pos, this.killerTable, this.historyTable);
  var mv;
  while ((mv = sort.next()) > 0) {
    if (!this.pos.makeMove(mv)) {
      continue;
    }
    var newDepth = this.pos.inCheck() || sort.singleReply ? depth : depth - 1;
    if (vlBest == -MATE_VALUE) {
      vl = -this.searchFull(-vlBeta, -vlAlpha, newDepth, false);
    } else {
      vl = -this.searchFull(-vlAlpha - 1, -vlAlpha, newDepth, false);
      if (vl > vlAlpha && vl < vlBeta) {
        vl = -this.searchFull(-vlBeta, -vlAlpha, newDepth, false);
      }
    }
    this.pos.undoMakeMove();
    if (vl > vlBest) {
      vlBest = vl;
      if (vl >= vlBeta) {
        hashFlag = HASH_BETA;
        mvBest = mv;
        break;
      }
      if (vl > vlAlpha) {
        vlAlpha = vl;
        hashFlag = HASH_PV;
        mvBest = mv;
      }
    }
  }
  if (vlBest == -MATE_VALUE) {
    return this.pos.mateValue();
  }
  this.recordHash(hashFlag, vlBest, depth, mvBest);
  if (mvBest > 0) {
    this.setBestMove(mvBest, depth);
  }
  return vlBest;
}

/**
 * 根节点搜索，用于搜索的第一步
 * @param {number} depth - 搜索深度
 * @return {number} 返回最佳评估值
 */
Search.prototype.searchRoot = function(depth) {
  var vlBest = -MATE_VALUE;
  var sort = new MoveSort(this.mvResult, this.pos, this.killerTable, this.historyTable);
  var mv;
  while ((mv = sort.next()) > 0) {
    if (!this.pos.makeMove(mv)) {
      continue;
    }
    var newDepth = this.pos.inCheck() ? depth : depth - 1;
    var vl;
    if (vlBest == -MATE_VALUE) {
      vl = -this.searchFull(-MATE_VALUE, MATE_VALUE, newDepth, true);
    } else {
      vl = -this.searchFull(-vlBest - 1, -vlBest, newDepth, false);
      if (vl > vlBest) {
        vl = -this.searchFull(-MATE_VALUE, -vlBest, newDepth, true);
      }
    }
    this.pos.undoMakeMove();
    if (vl > vlBest) {
      vlBest = vl;
      this.mvResult = mv;
      if (vlBest > -WIN_VALUE && vlBest < WIN_VALUE) {
        vlBest += Math.floor(Math.random() * RANDOMNESS) -
            Math.floor(Math.random() * RANDOMNESS);
        vlBest = (vlBest == this.pos.drawValue() ? vlBest - 1 : vlBest);
      }
    }
  }
  this.setBestMove(this.mvResult, depth);
  return vlBest;
}

/**
 * 唯一走法检测，用于判断当前局面是否只有唯一应着
 * @param {number} vlBeta - Beta值
 * @param {number} depth - 搜索深度
 * @return {boolean} 返回是否只有唯一应着
 */
Search.prototype.searchUnique = function(vlBeta, depth) {
  var sort = new MoveSort(this.mvResult, this.pos, this.killerTable, this.historyTable);
  sort.next();
  var mv;
  while ((mv = sort.next()) > 0) {
    if (!this.pos.makeMove(mv)) {
      continue;
    }
    var vl = -this.searchFull(-vlBeta, 1 - vlBeta,
        this.pos.inCheck() ? depth : depth - 1, false);
    this.pos.undoMakeMove();
    if (vl >= vlBeta) {
      return false;
    }
  }
  return true;
}

/**
 * 主搜索函数，控制整个搜索过程
 * @param {number} depth - 最大搜索深度
 * @param {number} millis - 最大搜索时间（毫秒）
 * @return {number} 返回最佳走法
 */
Search.prototype.searchMain = function(depth, millis) {
  this.mvResult = this.pos.bookMove();
  if (this.mvResult > 0) {
    this.pos.makeMove(this.mvResult);
    if (this.pos.repStatus(3) == 0) {
      this.pos.undoMakeMove();
      return this.mvResult;
    }
    this.pos.undoMakeMove();
  }
  this.hashTable = [];
  for (var i = 0; i <= this.hashMask; i ++) {
    this.hashTable.push({depth: 0, flag: 0, vl: 0, mv: 0, zobristLock: 0});
  }
  this.killerTable = [];
  for (var i = 0; i < LIMIT_DEPTH; i ++) {
    this.killerTable.push([0, 0]);
  }
  this.historyTable = [];
  for (var i = 0; i < 4096; i ++) {
    this.historyTable.push(0);
  }
  this.mvResult = 0;
  this.allNodes = 0;
  this.pos.distance = 0;
  var t = new Date().getTime();
  for (var i = 1; i <= depth; i ++) {
    var vl = this.searchRoot(i);
    this.allMillis = new Date().getTime() - t;
    if (this.allMillis > millis) {
      break;
    }
    if (vl > WIN_VALUE || vl < -WIN_VALUE) {
      break;
    }
    if (this.searchUnique(1 - WIN_VALUE, i)) {
      break;
    }
  }
  return this.mvResult;
}

/**
 * 获取搜索速度（千节点/秒）
 * @return {number} 返回搜索速度
 */
Search.prototype.getKNPS = function() {
  return this.allNodes / this.allMillis;
}
