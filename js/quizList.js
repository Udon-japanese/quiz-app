"use strict";
import { cloneFromTemplate, initUploadBtn, navigateToPage } from "./index.js";
import {
  addQuizToStorage,
  getQuizFromStorage,
  getQuizzesFromStorage,
  removeQuizFromStorage,
} from "../utils/storage.js";
import { closeModal, openModal } from "../utils/modal.js";
import { replaceAttrVals } from "../utils/replaceAttrVals.js";
import { initQuizPage } from "./quiz.js";
import commonSenseQuiz from "../quizzes/common-sense-quiz.json" assert { type: "json" };
import commonSenseQuiz2 from "../quizzes/common-sense-quiz2.json" assert { type: "json" };
import gameQuiz from "../quizzes/game-quiz.json" assert { type: "json" };
import sportsQuiz from "../quizzes/sports-quiz.json" assert { type: "json" };
import japanQuiz from "../quizzes/japan-quiz.json" assert { type: "json" };
import wordQuiz from "../quizzes/word-quiz.json" assert { type: "json" };
import { initCrtQuizPage } from "./createQuiz.js";
import { formatTime } from "../utils/formatTime.js";
import { initTooltips } from "../utils/initTooltips.js";
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

if (!getQuizzesFromStorage()) {
  defaultQuizzes.forEach((defaultQuiz) => {
    addQuizToStorage(defaultQuiz.id, defaultQuiz);
  });
}
initTooltips();

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
      const optionTimer = delQ?.options?.timer;
      const optionExpls = Object.values(delQ.questions)
                            .map(q => q?.options?.explanation)
                            .filter(expl => expl);
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
                <div class="card-text q-info text-secondary d-flex gap-2">
                ${optionTimer ? `<i class="bi bi-stopwatch-fill fs-3"></i>` : ""}
                ${optionExpls.length ? `<i class="bi bi-book-fill fs-3"></i>` : ""}
                </div>
              </div>
            </div>
          </div>
        </div>`,
        colorClass: "bg-light",
        modalCont: qListPage,
        actionBtn: {
          text: "削除",
          color: "red",
          id: `del-quiz-${delQId}`,
          class: "del-quiz",
        },
      });
    } else if (classList.contains("play-q")) {
      const quizId = el.id.split("play-")[1];
      const quiz = getQuizFromStorage(quizId);
      initQuizPage(quiz);
    } else if (classList.contains("edit-q")) {
      const quizId = el.id.split("edit-")[1];
      const quiz = getQuizFromStorage(quizId);
      navigateToPage("createQuiz");
      initCrtQuizPage(quiz, "edit");
    } else if (classList.contains("del-quiz")) {
      const delQId = el.id.split("del-quiz-")[1];
      removeQuizFromStorage(delQId);
      closeModal();
      displayQuizList();
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
  const qListObj = searchQuizzes(query, quizListObj);
  const noneResult = !Object.keys(qListObj).length;
  noneQuizEl.classList.toggle("d-none", !noneResult);
  if (noneResult) {
    noneQuizTxtEl.innerHTML = `<div><i class="bi bi-search fs-1"></i></div>
    「${query}」に当てはまるクイズは見つかりませんでした。他のキーワードで検索するか、自分でクイズを作成、または他の人のクイズで遊んでみましょう！`;
    headerBtnCont.classList.toggle("d-none", noneResult);
    quizzesCont.innerHTML = "";
    return;
  }
  displayQuizList(qListObj, query);
});

displayQuizList();

export function displayQuizList(obj = null, highlight = "") {
  quizzesCont.innerHTML = "";

  if (!obj) {
    quizListObj = getQuizzesFromStorage() || {};
  }

  let highlightRegExp, highLightReplacement;

  if (highlight) {
    highlightRegExp = new RegExp(highlight, "g");
    highLightReplacement = `<span class="bg-warning">${highlight}</span>`;
  }

  const qListObjToUse = obj ? obj : quizListObj;
  const noneQuiz = !Object.keys(qListObjToUse).length;
  if (noneQuiz) {
    noneQuizTxtEl.innerHTML = `<div>
    <i class="bi bi-emoji-frown fs-1"></i>
    </div>まだクイズがありません。自分でクイズを作成するか、他の人のクイズで遊んでみましょう！`;
  }
  noneQuizEl.classList.toggle("d-none", !noneQuiz);
  searchQInput.classList.toggle("d-none", noneQuiz);
  headerBtnCont.classList.toggle("d-none", noneQuiz);

  Object.values(qListObjToUse).forEach((quiz) => {
    const quizItem = cloneFromTemplate("quiz-item-tem");
    const elsHasAttrQId = quizItem.querySelectorAll(
      "[id*='{quiz-id}'], [aria-labelledby*='{quiz-id}']"
    );
    replaceAttrVals(elsHasAttrQId, "{quiz-id}", quiz.id);
    const quizTitleEl = quizItem.querySelector(".q-title");
    quizTitleEl.innerText = quiz.title;
    if (highlight) {
      const quizTitleTxt = quizTitleEl.innerText;
      quizTitleEl.innerHTML = quizTitleTxt.replace(
        highlightRegExp,
        highLightReplacement
      );
    }
    const quizDescEl = quizItem.querySelector(".q-desc");
    quizDescEl.innerText = quiz.description;
    if (highlight) {
      const quizDescTxt = quizDescEl.innerText;
      quizDescEl.innerHTML = quizDescTxt.replace(
        highlightRegExp,
        highLightReplacement
      );
    }
    const hasOptions = {
      quiz: {
        timer: false,
      },
      question: {
        explanation: false,
      },
    };
    Object.values(quiz.questions).forEach((question) => {
      if (hasOptions.question.explanation) return;
      if (question?.options?.explanation) {
        hasOptions.question.explanation = true;
      }
    });
    const optionTimer = quiz?.options?.timer;
    if (optionTimer) {
      hasOptions.quiz.timer = true;
    }

    const hasAnyOption =
      hasOptions.quiz.timer || hasOptions.question.explanation;
    if (hasAnyOption) {
      const quizInfoEl = quizItem.querySelector(".q-info");
      quizInfoEl.classList.remove("d-none");
      if (hasOptions.quiz.timer) {
        const timerIcon = quizInfoEl.querySelector(".timer-icon");
        timerIcon.timer = replaceAttrVals([timerIcon], "{option-timer}", formatTime(optionTimer));
        timerIcon.classList.toggle("d-none", !hasOptions.quiz.timer);
      }
      if (hasOptions.question.explanation) {
        quizInfoEl.querySelector(".expl-icon").classList.toggle("d-none", !hasOptions.question.explanation);
      }
    }

    const qLengthEl = quizItem.querySelector(".q-length");
    qLengthEl.innerText = qLengthEl.innerText.replace("{quiz-length}", quiz.length);
    if (highlight) {
      qLengthEl.innerHTML = qLengthEl.innerText.replace(
        highlightRegExp,
        highLightReplacement
      );
    }
    quizzesCont.appendChild(quizItem);
    initTooltips();
  });
}

/**
 * @description
 * @param {string} query
 * @returns {}
 */
export function searchQuizzes(query, quizListObj) {
  const resultObj = {};

  Object.keys(quizListObj).forEach((id) => {
    const quiz = quizListObj[id];
    const title = quiz.title || "タイトルなし";
    const description = quiz.description || "説明なし";
    const quizLength = quiz.length;

    const lowercaseQuery = query.toLowerCase();
    const lowercaseTitle = title.toLowerCase();
    const lowercaseDesc = description.toLowerCase();

    if (
      lowercaseTitle.includes(lowercaseQuery) ||
      lowercaseDesc.includes(lowercaseQuery) ||
      `問題数:${quizLength}問`.includes(query)
    ) {
      resultObj[id] = quiz;
    }
  });

  return resultObj;
}
