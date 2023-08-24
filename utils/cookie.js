"use strict";
/**
 * @description クッキーを設定する
 * @param {string} name キー名
 * @param {string} value 値
 * @param {number} [daysToExpire=14] 有効期限(単位:日、デフォルトは2週間)
 * @returns {void} なし
 */
export function setCookie(name, value, daysToExpire = 14) {
  const expires = new Date();
  expires.setDate(expires.getDate() + daysToExpire);
  const cookieValue = `${encodeURIComponent(value)}${
    daysToExpire ? `; expires=${expires.toUTCString()}` : ""
  }`;
  document.cookie = `${name}=${cookieValue}; path=/`;
}
/**
 * @description キー名でクッキーを取得する
 * @param {string} name 保存しているクッキーのキー名
 * @returns {string | null} 取得したクッキーの値
 */
export function getCookie(name) {
  const cookieName = `${name}=`;
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.indexOf(cookieName) === 0) {
      try {
        return decodeURIComponent(cookie.substring(cookieName.length));// 値を取り出し、デコードして返す
      } catch (err) {
        return null; // エラーが発生した場合
      }
    }
  }
  return null; // 該当するクッキーが見つからない場合
}
/**
 * @description キー名でクッキーを削除する
 * @param {string} name キー名
 * @returns {void} なし
 */
export function deleteCookie(name) {
  setCookie(name, "", -1); // 過去の日付で上書きして削除
}
