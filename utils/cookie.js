"use strict";
// クッキーの設定
/**
 * @description
 * @param {string} name
 * @param {string} value
 * @param {number} daysToExpire
 */
export function setCookie(name, value, daysToExpire = 14) {
  const expires = new Date();
  expires.setDate(expires.getDate() + daysToExpire);
  const cookieValue = `${encodeURIComponent(value)}${
    daysToExpire ? "; expires=" + expires.toUTCString() : ""
  }`;
  document.cookie = `${name}=${cookieValue}; path=/`;
}

// クッキーの取得
/**
 * @description
 * @param {string} name
 * @returns
 */
export function getCookie(name) {
  const cookieName = `${name}=`;
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(cookieName) === 0) {
      try {
        return decodeURIComponent(cookie.substring(cookieName.length));
      } catch (error) {
        console.error("Error decoding cookie value:", error);
        return null; // エラーが発生した場合はnullを返す
      }
    }
  }
  return null; // 該当するクッキーが見つからない場合
}

// クッキーの削除
/**
 * @description
 * @param {string} name
 */
export function deleteCookie(name) {
  setCookie(name, "", -1); // 過去の日付で上書きして削除
}
