"use strict";
import { navigateToPage } from "./index.js";
import { showToast } from "../utils/showToast.js";

const qPage = document.getElementById("quiz-page");

// Proxyオブジェクトを作成
const proxy = new Proxy({}, {
  set: (target, key, value) => {
    target[key] = value;
    return true;
  }
});

export function initQuizPage(quizObj) {
  setQuiz(quizObj);
  const { quiz } = proxy;
  if (!quiz) {
    showToast("red", "クイズが見つかりませんでした");
    navigateToPage("quizList");
    return;
  }
  document.querySelector(".has-quiz-id").id = `quiz-${quiz.id}`;
  document.getElementById("quiz-title").innerText = quiz.title;
  document.getElementById("quiz-description").innerText = quiz.description;
  navigateToPage("quiz");
}

/**
 * @description
 * @param {object} quizObj 
 */
function setQuiz(quizObj) {
  proxy.quiz = quizObj;
}

/**
 * @description 選択肢の順番をランダムに並び替える
 * @param {string[]} choices 選択肢の配列
 * @returns {string[]} 選択肢をランダムに並び替えた配列
 */
function shuffleChoices(choices) {
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}
