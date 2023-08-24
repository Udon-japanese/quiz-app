"use strict";
/**
 * @description 引数の値が数字かつNaNでない場合true,それ以外はfalseを返す
 * @param {any} value 数字かどうか調べたい値
 * @returns {boolean} 数字かどうか
 */
export function isNumNotNaN(value) {
  return typeof value === "number" && !Number.isNaN(value);
}