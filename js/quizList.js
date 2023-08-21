"use strict";
import { cloneFromTemplate, initUploadBtn, navigateToPage } from "./index.js";
import {
  addQuizToStorage,
  getQuizFromStorage,
  getQuizzesFromStorage,
  removeQuizFromStorage,
  removeQuizzesFromStorage,
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
    addQuizToStorage(defaultQuiz);
  });
}

const qListPage = document.getElementById("quiz-list-page");
const quizzesCont = document.getElementById("quizzes");
const searchQInput = document.getElementById("search-q");
const headerBtnCont = document.getElementById("header-btn-cont");
const noneQuizEl = document.getElementById("none-quiz");
const noneQuizTxtEl = document.getElementById("none-quiz-txt");
const delAllQuizzesBtn = document.getElementById("del-all-quizzes");

/**@type {Object<string, Quiz>} */
let quizListObj = {};
initUploadBtn(headerBtnCont, 0, "d-none d-sm-inline-block");
initUploadBtn(headerBtnCont, 100, "d-sm-none");
const noneQuizBtnCont = noneQuizEl.querySelector(".btn-cont");
let delQsWaitTImeout;
initUploadBtn(noneQuizBtnCont, 100);

qListPage.addEventListener("click", (e) => {
  const els = e.composedPath();
  if (!els) return;

  Array.from(els).forEach(async (el) => {
    const classList = el.classList;
    if (!el.className) return;

    if (classList.contains("upload-q")) {
      el.value = "";
    } else if (classList.contains("open-del-q-m")) {
      const delQId = el.id.split("del-")[1];
      const delQ = quizListObj[delQId];
      const optionTimer = delQ?.options?.timer;
      const optionExpls = Object.values(delQ.questions)
        .map((q) => q?.options?.explanation)
        .filter((expl) => expl);
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
                ${
                  optionTimer ? `<i class="bi bi-stopwatch-fill fs-3"></i>` : ""
                }
                ${
                  optionExpls.length
                    ? `<i class="bi bi-book-fill fs-3"></i>`
                    : ""
                }
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
          HTMLAttributes: {
            id: `del-quiz-${delQId}`,
            class: "del-quiz",
          },
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
    } else if (classList.contains("open-del-all-qs-m")) {
      openModal({
        title: "クイズをすべて削除",
        body: "クイズをすべて削除します。よろしいですか？",
        modalCont: qListPage,
        actionBtn: {
          text: "削除",
          color: "red",
          HTMLAttributes: {
            class: "open-del-all-qs-m-again",
          },
        },
      });
    } else if (classList.contains("open-del-all-qs-m-again")) {
      document.querySelector(".modal-body").innerHTML = `
      <div class="text-center fw-bold">
        <div class="text-bg-danger d-inline-block p-4 rounded-circle">
          <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
          </svg>
        </div>
        <div class="mt-4">この操作は取り消せません。本当にクイズをすべて削除しますか？</div>
      </div>
      `;
      const actionBtn = document.querySelector(".action-btn");
      actionBtn.innerText = "本当に削除する";
      actionBtn.classList.remove("open-del-all-qs-m-again");
      actionBtn.classList.add("del-all-quizzes");
      actionBtn.disabled = true;
      await new Promise((resolve) => {
        delQsWaitTImeout = setTimeout(() => {
          resolve();
        }, 3000);
      });
      actionBtn.disabled = false;
    } else if (classList.contains("del-all-quizzes")) {
      removeQuizzesFromStorage();
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
  delAllQuizzesBtn.classList.toggle("d-none", query); // 検索バーが空でないときは隠す

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

export function clearDelQsWaitTimeout() {
  clearTimeout(delQsWaitTImeout);
}

export function displayQuizList(obj = null, highlight = "") {
  quizzesCont.innerHTML = "";

  if (!obj) {
    quizListObj = getQuizzesFromStorage() || {};
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
  delAllQuizzesBtn.classList.toggle("d-none", noneQuiz || highlight); // 検索バーを使用していない(検索バーが空)のときのみ表示

  Object.values(qListObjToUse).forEach((quiz) => {
    const quizItem = cloneFromTemplate("quiz-item-tem");
    const elsHasAttrQId = quizItem.querySelectorAll(
      "[id*='{quiz-id}'], [aria-labelledby*='{quiz-id}']"
    );
    replaceAttrVals(elsHasAttrQId, "{quiz-id}", quiz.id);
    const quizTitleEl = quizItem.querySelector(".q-title");
    quizTitleEl.innerText = quiz.title;
    highLightText(highlight, quizTitleEl);
    const quizDescEl = quizItem.querySelector(".q-desc");
    quizDescEl.innerText = quiz.description;
    highLightText(highlight, quizDescEl);
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
        timerIcon.timer = replaceAttrVals(
          [timerIcon],
          "{option-timer}",
          formatTime(optionTimer)
        );
        timerIcon.classList.toggle("d-none", !hasOptions.quiz.timer);
      }
      if (hasOptions.question.explanation) {
        quizInfoEl
          .querySelector(".expl-icon")
          .classList.toggle("d-none", !hasOptions.question.explanation);
      }
    }

    const qLengthEl = quizItem.querySelector(".q-length");
    qLengthEl.innerText = qLengthEl.innerText.replace(
      "{quiz-length}",
      quiz.length
    );
    highLightText(highlight, qLengthEl);
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

    const lowercaseQuery = query.toUpperCase();
    const lowercaseTitle = title.toUpperCase();
    const lowercaseDesc = description.toUpperCase();

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

export function highLightText(highlight, textEl) {
  if (!highlight) return;

  const upperHighlight = highlight.toUpperCase();
  const text = textEl.innerText;
  const upperText = text.toUpperCase();

  if (upperText.includes(upperHighlight)) {
    const highlightI = upperText.indexOf(upperHighlight);
    const replacement = text.substring(
      highlightI,
      highlightI + upperHighlight.length
    );
    const escapedRepl = replacement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hlRegExp = new RegExp(escapedRepl, "g");
    const hlRepl = `<span class="bg-warning">${replacement}</span>`;

    textEl.innerHTML = text.replace(hlRegExp, hlRepl);
  }
}
