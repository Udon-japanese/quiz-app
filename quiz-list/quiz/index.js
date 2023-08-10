import { renderTemplate } from "../../utils/renderTemplate.js";
import { storage } from "../../utils/storage.js";
import { createElement } from "../../utils/createElement.js";

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");

const quiz = JSON.parse(storage.getItem(id));
if (!quiz) {
  alert("クイズが見つかりません！");
}

const headerTemplate = `
  <h1>{{title}}</h1>
    <p>
      <h3>{{description}}</h3>
    </p>
  <p>問題</p>`;
const headerData = { title: quiz.title, description: quiz.description };
const header = renderTemplate(headerTemplate, headerData);

const quizContainer = createElement("div");
for (const [key, question] of Object.entries(quiz.questions)) {
  if (question.answerType !== "type-text") {
    const shuffledChoices = shuffleChoices(question.choices);
    const choices = renderChoices(shuffledChoices);
    const qTemplate = `
    <p>{{question}}
      <br>
      ${choices}
      <p>正解：{{correctAnswer}}</p>
    </p>`;
    const qData = {
      question: question.statement,
      correctAnswer: question.answerType === "select" ? question.correctAnswer : question.correctAnswers,
    };
    const q = renderTemplate(qTemplate, qData);
    quizContainer.innerHTML += q;
  } else {
    const qTemplate = `
    <p>{{question}}
      <br>
      入力してください
      <p>正解：{{correctAnswer}}</p>
    </p>`;
    const qData = {
      question: question.statement,
      correctAnswer: question.correctAnswer,
    };
    const q = renderTemplate(qTemplate, qData);
    quizContainer.innerHTML += q;
  }
}

const container = document.getElementById("container");
container.innerHTML = header;
container.appendChild(quizContainer);

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

/**
 * @description 選択肢を選択肢の数だけ描画する関数
 * @param {string[]} choices ランダムに並び替えた選択肢
 * @returns {string} 選択肢のHTML文字列
 */
function renderChoices(choices) {
  let result = "";
  for (let i = 0; i < choices.length; i++) {
    const choicesTemplate = "<li>{{c}}</li>";
    const choicesData = { c: choices[i] };
    const choice = renderTemplate(choicesTemplate, choicesData);
    result += choice;
  }

  return `<ul>${result}</ul>`;
}
