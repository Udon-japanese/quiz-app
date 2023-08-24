"use strict";
/**
 * @description 与えられた文字列がUUIDならtrue,それ以外ならfalseを返す
 * @param {string} str 
 * @returns {boolean} UUIDかどうか
 */
export function isUUID(str) {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}