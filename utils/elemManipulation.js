"use strict";
/**
 * @description 引数に基づいて要素を作成し、返す
 * @param {keyof HTMLElementTagNameMap} tagName タグの名前
 * @param {Object<string, any>} HTMLAttributes 要素に設定する属性のオブジェクト
 * @param {string} content 要素内に挿入したいコンテンツ
 * @returns {Element} 作成した要素
 */
export function createElement(tagName, HTMLAttributes = {}, content = "") {
  const elem = document.createElement(tagName);

  Object.keys(HTMLAttributes).forEach((attrName) => {
    const value = HTMLAttributes[attrName];

    if (attrName === "class") {
      const classes = value.split(" ");
      classes.forEach((cl) => {
        elem.classList.add(cl);
      });
    } else if (attrName === "onclick") {
      elem.onclick = value;
    } else if (attrName === "style") {
      const styleObj = value;
      Object.keys(styleObj).forEach((styleKey) => {
        elem.style[styleKey] = styleObj[styleKey];
      });
    } else {
      elem.setAttribute(attrName, value);
    }
  });

  if (isHTMLElement(content)) {
    elem.innerHTML = content;
  } else {
    elem.innerText = content;
  }

  return elem;
}
/**
 * @description 文字列がHTML要素を含んでいるかどうかを判別する関数
 * @param {string} str 判別したい文字列
 * @returns {boolean} HTML要素を含んでいるかどうか
 */
function isHTMLElement(str) {
  const tmpElem = document.createElement("div");
  tmpElem.innerHTML = str;

  const isHTMLElement = Array.from(tmpElem.children).some(
    (child) => child instanceof HTMLElement
  );
  tmpElem.remove(); // 一時的な要素のため削除する

  return isHTMLElement;
}
/**
 * @description 属性の値に含まれるプレースホルダーを引数replacementの値に置き換える
 * @param {NodeListOf<Element>} elems HTML要素の集まり
 * @param {string} placeholder プレースホルダー(置き換え前の値)
 * @param {string} replacement 置き換え後の値
 */
export function replaceAttrVals(elems, placeholder, replacement) {
  elems.forEach((elem) => {
    Array.from(elem.attributes).forEach((attr) => {
      const attrVal = attr.value;
      if (attrVal.includes(placeholder)) {
        attr.value = attrVal.replace(placeholder, replacement);
      }
    });
  });
}
/**
 * @description 要素を表示する
 * @param {HTMLElement | Element | ParentNode} elem 要素
 * @returns {void} なし
 */
export function showElem(elem) {
  elem.classList.remove("d-none");
}
/**
 * @description 要素を非表示にする
 * @param {HTMLElement | Element | ParentNode} elem 要素
 * @returns {void} なし
 */
export function hideElem(elem) {
  elem.classList.add("d-none");
}
/**
 * @description 要素をトグルして表示または非表示にする
 * @param {HTMLElement | Element | ParentNode} elem 要素
 * @param {boolean} [force=undefined] toggle関数の第二引数に渡す値
 */
export function toggleElem(elem, force = undefined) {
  if (typeof force === "undefined") {
    elem.classList.toggle("d-none");
  } else {
    elem.classList.toggle("d-none", force);
  }
}
