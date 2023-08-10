import { storage } from "../../utils/storage.js";
import { createElement } from "../../utils/createElement.js";

const animalQuizId = crypto.randomUUID();
const animalQuiz = {
  id: animalQuizId,
  title: "動物クイズ",
  description: "みんな大好き動物に関するクイズです！",
  questions: {
    q1: {
      answerType: "select",
      statement: "パから始まってダで終わる白黒の動物は？",
      choices: ["パソコンだ", "パンケーキだ", "パイナップルだ", "パンダ"],
      correctAnswer: "パンダ",
    },
    q2: {
      answerType: "select-all",
      statement: "首が長い動物は？",
      choices: ["首長族", "ナマケモノ", "ゾウ", "キリン"],
      correctAnswers: ["キリン", "首長族"],
    },
    q3: {
      answerType: "type-text",
      statement: "あなたが好きな動物は？",
      correctAnswer: "サル",
    },
  },
};

const humanQuizId = crypto.randomUUID();
const humanQuiz = {
  id: humanQuizId,
  title: "人間クイズ",
  description: "人間の体に関するクイズです！",
  questions: {
    q1: {
      answerType: "select",
      statement: "人間の体を構成する骨の本数は？",
      choices: ["約200本", "約2000本", "約20000本", "約200000本"],
      correctAnswer: "約200本",
    },
    q2: {
      answerType: "select",
      statement: "高齢者の体に含まれる水分量は？",
      choices: ["20%", "50%", "80%", "2%"],
      correctAnswer: "50%",
    },
  },
};

storage.clear();
storage.setItem(animalQuizId, JSON.stringify(animalQuiz));
storage.setItem(humanQuizId, JSON.stringify(humanQuiz));

const quizList = {};
for (let i = 0; i < storage.length; i++) {
  const key = storage.key(i);
  const item = storage.getItem(key);
  quizList[key] = JSON.parse(item);
}

const quizListContainer = document.createElement("div");
for (const [quizId, quiz] of Object.entries(quizList)) {
  let url = "/quiz-app/quiz-list/quiz/";

  const a = createElement(
    "a",
    { style: { paddingRight: "1rem" }, href: `${url}?id=${quizId}` },
    quiz.title
  );
  const p = document.createElement("p");
  const span = createElement(
    "span",
    {},
    `${quiz.description} 問題数: ${Object.keys(quiz.questions).length}問`
  );
  p.append(a, span);
  quizListContainer.appendChild(p);
}

const container = document.getElementById("quiz-list");
container.appendChild(quizListContainer);
