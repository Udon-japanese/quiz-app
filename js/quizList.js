"use strict";
import { cloneFromTemplate, initUploadBtn } from "./index.js";
import { storage } from "../utils/storage.js";
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
if (!storage.length) {
  defaultQuizzes.forEach(q => {
    storage.setItem(q.id, JSON.stringify(q));
  })
}

const qListPage = document.getElementById("quiz-list-page");
const quizzesCont = document.getElementById("quizzes");
const searchQInput = document.getElementById("search-q");
const headerCont = document.getElementById("header-cont");

/**@type {Object.<string, Quiz>} */
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
    } else if (classList.contains("ellipsis-btn")) {
      el.classList.add("ellipsis-bg");
    } else if (classList.contains("play-q")) {
      const quizId = el.id.split("play-")[1];
      const quiz = JSON.parse(storage.getItem(quizId));
      initQuizPage(quiz);
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
  }
  displayQuizList(qListObj);
});

qListPage.addEventListener("hidden.bs.dropdown", (e) => {
  e.relatedTarget.classList.remove("ellipsis-bg");
});

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
