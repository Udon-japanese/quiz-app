"use strict";
/**
 * @description 属性の値に含まれるプレースホルダーを引数replacementの値に置き換える
 * @param {NodeListOf<Element>} els HTML要素の集まり
 * @param {string} placeholder プレースホルダー(置き換え前の値)
 * @param {string} replacement 置き換え後の値
 */
export function replaceAttrVals(els, placeholder, replacement) {
  els.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const attrVal = attr.value;
      if (attrVal.includes(placeholder)) {
        attr.value = attrVal.replace(placeholder, replacement);
      }
    });
  });
}
