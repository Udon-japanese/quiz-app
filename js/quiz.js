"use strict";
/**
 * @description 選択肢の順番をランダムに並び替える関数
 * @param {string[]} choices 選択肢の配列
 * @returns {string[]} ランダムに並び替えた配列
 */
function shuffleChoices(choices) {
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}
