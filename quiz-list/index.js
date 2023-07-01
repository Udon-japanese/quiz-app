import { storage } from "../utils/storage.js";
import { isLocal, ROOT_PATH, switchURL } from "../utils/switchURL.js";

switchURL();

const animalQuizId = crypto.randomUUID();
const animalQuiz = {
  id: animalQuizId,
  name: "動物クイズ",
  description: "みんな大好き動物に関するクイズです！",
  questions: {
    1: {
      question: "パから始まってダで終わる白黒の動物は？",
      choices: ["パソコンだ", "パンケーキだ", "パイナップルだ", "パンダ"],
      correctAnswer: "パンダ",
    },
    2: {
      question: "首が長い動物は？",
      choices: ["人間", "ナマケモノ", "ゾウ", "キリン"],
      correctAnswer: "キリン",
    },
    3: {
      question: "あなたが好きな動物は？",
      choices: ["サル", "サル", "サル", "サル"],
      correctAnswer: "サル",
    },
  },
};

const humanQuizId = crypto.randomUUID();
const humanQuiz = {
  id: humanQuizId,
  name: "人間クイズ",
  description: "人間の体の構造に関するクイズです！",
  questions: {
    1: {
      question: "人間の体を構成する骨の本数は？",
      choices: ["約200本", "約2000本", "約20000本", "約200000本"],
      correctAnswer: "約200本",
    },
    2: {
      question: "高齢者の体に含まれる水分量は？",
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

console.log(quizList);

const quizListContainer = document.createElement("div");
for (const [quizId, quiz] of Object.entries(quizList)) {
  const a = document.createElement("a");
  const br = document.createElement("br");
  a.innerText = quiz.name;
  let url = "/quiz-app/quiz/";
  if (isLocal) {
    url = url.split(ROOT_PATH)[1];
  }
  a.setAttribute("href", `${url}?id=${quizId}`);
  quizListContainer.appendChild(a);
  quizListContainer.appendChild(br);
}

const container = document.getElementById("container");
container.appendChild(quizListContainer);
