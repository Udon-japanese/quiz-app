"use strict";
/**
 * @description 引数で指定したタグネーム、属性、テキストコンテンツを持つ要素を作成し、返す
 * @param {string} tagName タグの名前
 * @param {Object} attributes 要素に設定する属性のオブジェクト
 * @param {string} textContent 要素のテキストコンテンツ
 * @returns {HTMLElement} 作成した要素
 */
export function createElement(tagName, attributes = {}, textContent = "") {
  const element = document.createElement(tagName);
  Object.keys(attributes).forEach((key) => {
    const val = attributes[key];

    if (key === "class") {
      const classes = val.split(" ");
      classes.forEach((c) => {
        element.classList.add(c);
      });
    } else if (key === "onclick") {
      element.onclick = val;
    } else if (key === "style") {
      const styleObj = val;
      Object.keys(styleObj).forEach((styleKey) => {
        element.style[styleKey] = styleObj[styleKey];
      });
    } else {
      element.setAttribute(key, val);
    }
  });
  if (isHTMLElement(textContent)) {
    element.innerHTML = textContent;
  } else {
    element.textContent = textContent;
  }

  return element;
}

/**
 * @description 文字列がHTML要素かどうかを判別する関数
 * @param {string} str 判別したい文字列
 * @returns {boolean} HTML要素かどうか
 */
function isHTMLElement(str) {
  const tmpElement = document.createElement("div");
  tmpElement.innerHTML = str;
  return Array.from(tmpElement.children).some(child => child instanceof HTMLElement);
}
