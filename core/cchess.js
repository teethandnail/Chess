"use strict";  // 启用严格模式

// 将ASCII码转换为字符
// n: ASCII码值
// 返回值: 对应的字符
function CHR(n) {
  return String.fromCharCode(n);
}

// 将字符转换为ASCII码
// c: 单个字符
// 返回值: 对应的ASCII码值
function ASC(c) {
  return c.charCodeAt(0);
}

// 将内部走法表示转换为ICCS格式
// mv: 内部走法表示
// 返回值: ICCS格式的走法字符串（如"A2-A3"）
function move2Iccs(mv) {
  var sqSrc = SRC(mv);  // 获取起始位置
  var sqDst = DST(mv);  // 获取目标位置
  return CHR(ASC("A") + FILE_X(sqSrc) - FILE_LEFT) +  // 起始列（A-I）
      CHR(ASC("9") - RANK_Y(sqSrc) + RANK_TOP) + "-" +  // 起始行（0-9）
      CHR(ASC("A") + FILE_X(sqDst) - FILE_LEFT) +  // 目标列（A-I）
      CHR(ASC("9") - RANK_Y(sqDst) + RANK_TOP);  // 目标行（0-9）
}
