"use strict";
import { isNumNotNaN } from "./isNumNotNaN.js";
/**
 * @description 秒の単位で与えられた数字を、読みやすくフォーマットする
 * @param {number} seconds フォーマットしたい数字(単位:秒)
 * @returns {string} フォーマット後の文字列(分、秒を含む)
 */
export function formatTime(seconds) {
  if (!isNumNotNaN(seconds)) {// 数字でない場合
    return null;
  }

  if (seconds < 60) {// 1分未満のとき
    return `${seconds}秒`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes}分`;
    } else {
      return `${minutes}分${remainingSeconds}秒`;
    }
  }
}
