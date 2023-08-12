"use strict";
import { cloneFromTemplate, initUploadBtn } from "./index.js";
import { storage } from "../utils/storage.js";
import { isValidQuizObj } from "../utils/isValidQuizObj.js";
import { showToast } from "../utils/showToast.js";
import { openModal } from "../utils/modal.js";
import { replaceAttrVals } from "../utils/replaceAttrVals.js";

const qListPage = document.getElementById("quiz-list-page");
const quizzesCont = document.getElementById("quizzes");
const searchQInput = document.getElementById("search-q");
const headerCont = document.getElementById("header-cont");
let quizListObj = {};
initUploadBtn(headerCont, 0, "d-sm-block d-none");
initUploadBtn(headerCont, 100, "d-sm-none");

qListPage.addEventListener("click", (e) => {
  const els = e.composedPath();
  if (!els) return;

  Array.from(els).forEach((el) => {
    const classList = el.classList;
    if (!el.className) return;

    if (classList.contains("upload-q")) {
      el.value = "";
    } else if (classList.contains("open-del-q-m")) {
      const delQId = el.id.split("del-")[1];
      const delQ = quizListObj[delQId];
      openModal({
        title: "クイズを削除",
        body: `このクイズを削除します。よろしいですか？
        <div class="card mt-3">
          <div class="card-body gap-3">
            <div class="d-flex flex-row">
              <div>
                <h5 class="card-title">${delQ.title}</h5>
                <p class="card-text">${delQ.description}</p>
                <span class="card-text text-primary">
                  問題数: ${Object.keys(delQ.questions).length}問
                </span>
              </div>
            </div>
          </div>
        </div>`,
        colorClass: "bg-light",
        actionBtn: {
          text: "削除",
          color: "red",
          id: `del-${delQId}`,
          class: "del-quiz",
        },
      });
    } else if (classList.contains("ellipsis-btn")) {
      el.classList.add("ellipsis-bg");
    }
  });
});
qListPage.addEventListener("change", (e) => {
  const els = e.composedPath();
  if (!els) return;

  Array.from(els).forEach((el) => {
    const classList = el.classList;
    if (!el.className) return;

    if (classList.contains("upload-q")) {
      const file = el.files[0];
      if (!file) return;
      if (file.type !== "application/json") {
        showToast("red", "JSONファイルのみアップロードできます");
        el.value = "";
        return;
      }
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        const jsonContent = e.target.result;
        try {
          const obj = JSON.parse(jsonContent);

          if (isValidQuizObj(obj)) {
            storage.setItem(obj.id, JSON.stringify(obj));
            showToast("green", "クイズが保存されました");
          } else {
            showToast("red", "無効なクイズデータです");
            return;
          }
        } catch (err) {
          showToast("red", "JSONファイルの解析に失敗しました");
          return;
        }
        displayQuizList();
      };
    } else if (classList.contains("")) {
    }
  });
});

searchQInput.addEventListener("input", (e) => {
    const query = e.target.value;
    if (!query) {
      displayQuizList();
      return;
    }
    const qListObj = searchQuizzes(query);
    if (!Object.keys(qListObj).length) {
      quizzesCont.innerHTML = "";
      let noneResult = document.getElementById("none-result");
      if (!noneResult) {
        noneResult = cloneFromTemplate("none-result-tem");
        const uploadQBtnCont = noneResult.querySelector(".btn-cont");
        initUploadBtn(uploadQBtnCont, 100);
        quizzesCont.appendChild(noneResult);
        noneResult = document.getElementById("none-result");
      }
      const noneRBody = noneResult.querySelector(".card-text");
      const noneRTxt = noneRBody.innerText;
      noneRBody.innerText = noneRTxt.replace("{query}", query);
      return;
    };
    displayQuizList(qListObj);
});

qListPage.addEventListener("hidden.bs.dropdown", (e) => {
  e.relatedTarget.classList.remove("ellipsis-bg");
});

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
storage.setItem(crypto.randomUUID(), JSON.stringify(animalQuiz));
// storage.setItem(crypto.randomUUID(), JSON.stringify(animalQuiz));
// storage.setItem(crypto.randomUUID(), JSON.stringify(animalQuiz));
// storage.setItem(crypto.randomUUID(), JSON.stringify(animalQuiz));
// storage.setItem(crypto.randomUUID(), JSON.stringify(humanQuiz));
// storage.setItem(crypto.randomUUID(), JSON.stringify(humanQuiz));
// storage.setItem(crypto.randomUUID(), JSON.stringify(humanQuiz));
displayQuizList();

export function displayQuizList(obj) {
  quizzesCont.innerHTML = "";

  if (!obj) {
    quizListObj = {};
    for (const [id, quiz] of Object.entries(storage)) {
      quizListObj[id] = JSON.parse(quiz);
    }
  }

  const qListObjToUse = obj ? obj : quizListObj;
  const noneQuiz = !Object.keys(qListObjToUse).length;
  if (noneQuiz) {
    const noneQuiz = cloneFromTemplate("none-quiz-tem");
    const uploadQBtnCont = noneQuiz.querySelector(".btn-cont");
    initUploadBtn(uploadQBtnCont, 100);
    quizzesCont.appendChild(noneQuiz);
    
  }
  searchQInput.classList.toggle("d-none", noneQuiz);

  Object.entries(qListObjToUse).forEach(([id, quiz]) => {
    const quizItem = cloneFromTemplate("quiz-item-tem");
    const elsHasAttrQId = quizItem.querySelectorAll(
      "[id*='{quiz-id}'], [aria-labelledby*='{quiz-id}']"
    );
    replaceAttrVals(elsHasAttrQId, "{quiz-id}", id);
    quizItem.querySelector(".q-title").innerText = quiz.title;
    quizItem.querySelector(".q-desc").innerText = quiz.description;
    const qLengthEl = quizItem.querySelector(".q-length");
    const qLengthElTxt = qLengthEl.innerText;
    qLengthEl.innerText = qLengthElTxt.replace("{quiz-length}", Object.keys(quiz.questions).length);
    quizzesCont.appendChild(quizItem);
  });
}

/**
 * @description
 * @param {string} query
 * @returns {}
 */
function searchQuizzes(query) {
  const resultObj = {};

  Object.keys(quizListObj).forEach((id) => {
    const quiz = quizListObj[id];
    const { title, description, questions } = quiz;
    const quizLength = Object.keys(questions).length;
    if (
      title.includes(query) ||
      description.includes(query) ||
      `問題数: ${quizLength}問`.includes(query) && query !== " " ||
      `問題数:${quizLength}問`.includes(query)
    ) {
      resultObj[id] = quiz;
    }
  });

  return resultObj;
}
