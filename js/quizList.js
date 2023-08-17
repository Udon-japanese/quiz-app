"use strict";
import { cloneFromTemplate, initUploadBtn } from "./index.js";
import {
  addQuizToStorage,
  getQuizFromStorage,
  getQuizzesFromStorage,
} from "../utils/storage.js";
import { openModal } from "../utils/modal.js";
import { replaceAttrVals } from "../utils/replaceAttrVals.js";
import { initQuizPage } from "./quiz.js";
import commonSenseQuiz from "../quizzes/common-sense-quiz.json" assert { type: "json" };
import commonSenseQuiz2 from "../quizzes/common-sense-quiz2.json" assert { type: "json" };
import gameQuiz from "../quizzes/game-quiz.json" assert { type: "json" };
import sportsQuiz from "../quizzes/sports-quiz.json" assert { type: "json" };
import japanQuiz from "../quizzes/japan-quiz.json" assert { type: "json" };
import wordQuiz from "../quizzes/word-quiz.json" assert { type: "json" };
/**
 * @type {Quiz[]}
 */
const defaultQuizzes = [
  commonSenseQuiz,
  commonSenseQuiz2,
  gameQuiz,
  sportsQuiz,
  japanQuiz,
  wordQuiz,
];

// if (!getQuizzesFromStorage()) {
//   defaultQuizzes.forEach((defaultQuiz) => {
//     addQuizToStorage(defaultQuiz.id, defaultQuiz);
//   });
// }

const qListPage = document.getElementById("quiz-list-page");
const quizzesCont = document.getElementById("quizzes");
const searchQInput = document.getElementById("search-q");
const headerBtnCont = document.getElementById("header-btn-cont");
const noneQuizEl = document.getElementById("none-quiz");
const noneQuizTxtEl = document.getElementById("none-quiz-txt");

/**@type {Object<string, Quiz>} */
let quizListObj = {};
initUploadBtn(headerBtnCont, 0, "d-none d-sm-inline-block");
initUploadBtn(headerBtnCont, 100, "d-sm-none");
const noneQuizBtnCont = noneQuizEl.querySelector(".btn-cont");
initUploadBtn(noneQuizBtnCont, 100);

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
                  問題数: ${delQ.length}問
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
    } else if (classList.contains("play-q")) {
      const quizId = el.id.split("play-")[1];
      const quiz = getQuizFromStorage(quizId);
      initQuizPage(quiz);
    }
  });
});
qListPage.addEventListener("hidden.bs.dropdown", (e) => {
  e.relatedTarget.classList.toggle(
    "ellipsis-bg",
    e.relatedTarget.classList.contains("show")
  );
});
qListPage.addEventListener("shown.bs.dropdown", (e) => {
  e.relatedTarget.classList.toggle(
    "ellipsis-bg",
    e.relatedTarget.classList.contains("show")
  );
});
searchQInput.addEventListener("input", (e) => {
  const query = e.target.value;
  if (!query) {
    displayQuizList();
    return;
  }
  const qListObj = searchQuizzes(query);
  const noneResult = !Object.keys(qListObj).length;
  noneQuizEl.classList.toggle("d-none", !noneResult);
  if (noneResult) {
    noneQuizTxtEl.innerHTML = `<div class="mb-2 mb-sm-0">「${query}」に当てはまるクイズは見つかりませんでした</div>
    他のキーワードで検索するか、自分でクイズを作成、
    <div class="d-sm-inline-block">または他の人のクイズで遊んでみましょう！</div>`
    headerBtnCont.classList.toggle("d-none", noneResult);
    quizzesCont.innerHTML = "";
    return;
  }
  displayQuizList(qListObj);
});

displayQuizList();

export function displayQuizList(obj = null) {
  quizzesCont.innerHTML = "";

  if (!obj) {
    quizListObj = getQuizzesFromStorage();
  }

  const qListObjToUse = obj ? obj : quizListObj;
  const noneQuiz = !Object.keys(qListObjToUse).length;
  if (noneQuiz) {
    noneQuizTxtEl.innerHTML = `<div class="mb-2 mb-sm-0">まだクイズがありません</div>
    自分でクイズを作成するか、
    <div class="d-sm-inline-block">他の人のクイズで遊んでみましょう！</div>`;
  }
  noneQuizEl.classList.toggle("d-none", !noneQuiz);
  searchQInput.classList.toggle("d-none", noneQuiz);
  headerBtnCont.classList.toggle("d-none", noneQuiz);

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
    qLengthEl.innerText = qLengthElTxt.replace("{quiz-length}", quiz.length);
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
    const { title, description } = quiz;
    const quizLength = quiz.length;

    const lowercaseQuery = query.toLowerCase();
    const lowercaseTitle = title.toLowerCase();
    const lowercaseDesc = description.toLowerCase();

    if (
      lowercaseTitle.includes(lowercaseQuery) ||
      lowercaseDesc.includes(lowercaseQuery) ||
      (`問題数: ${quizLength}問`.includes(query) && query !== " ") ||
      `問題数:${quizLength}問`.includes(query)
    ) {
      resultObj[id] = quiz;
    }
  });

  return resultObj;
}
