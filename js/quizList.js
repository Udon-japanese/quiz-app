"use strict";
import {
  cloneFromTemplate,
  initUploadBtn,
  navigateToPage,
  toggleBtnsByScrollability,
} from "./index.js";
import {
  addQuizToStorage,
  getQuizFromStorage,
  getQuizzesFromStorage,
  removeQuizFromStorage,
  removeQuizzesFromStorage,
} from "../utils/storage.js";
import { closeModal, openModal } from "../utils/modal.js";
import { replaceAttrVals } from "../utils/elemManipulation.js";
import { initQuizPage } from "./quiz.js";
import { initCrtQuizPage } from "./createQuiz.js";
import { formatTime } from "../utils/formatTime.js";
import { initTooltips } from "../utils/initTooltips.js";
import { createElement } from "../utils/elemManipulation.js";
import { isValidQuizObj } from "../utils/isValidQuizObj.js";
import { showToast } from "../utils/showToast.js";
import { toggleElem, showElem } from "../utils/elemManipulation.js";

const { default: commonSenseQuiz } = await import(
  "../quizzes/common-sense-quiz.json",
  { assert: { type: "json" } }
); // webkit系ブラウザで動的インポートしか使用できないため
const { default: commonSenseQuiz2 } = await import(
  "../quizzes/common-sense-quiz2.json",
  { assert: { type: "json" } }
);
const { default: gameQuiz } = await import("../quizzes/game-quiz.json", {
  assert: { type: "json" },
});
const { default: sportsQuiz } = await import("../quizzes/sports-quiz.json", {
  assert: { type: "json" },
});
const { default: japanQuiz } = await import("../quizzes/japan-quiz.json", {
  assert: { type: "json" },
});
const { default: wordQuiz } = await import("../quizzes/word-quiz.json", {
  assert: { type: "json" },
});
const { default: animeQuiz } = await import("../quizzes/anime-quiz.json", {
  assert: { type: "json" },
});
const { default: mangaQuiz } = await import("../quizzes/manga-quiz.json", {
  assert: { type: "json" },
});
const { default: difficultSportsQuiz } = await import(
  "../quizzes/difficult-sports-quiz.json",
  {
    assert: { type: "json" },
  }
);
const { default: trueOrFalseQuiz } = await import(
  "../quizzes/true-or-false-quiz.json",
  { assert: { type: "json" } }
);
const { default: tryYourLuck } = await import("../quizzes/try-your-luck.json", {
  assert: { type: "json" },
});
const qListPage = document.getElementById("quiz-list-page");
const crtQPage = document.getElementById("crt-quiz-page");
const quizzesCont = document.getElementById("quizzes");
const searchQInput = document.getElementById("search-q");
const headerBtnCont = document.getElementById("header-btn-cont");
const noneQuizElem = document.getElementById("none-quiz");
const noneQuizTxtElem = document.getElementById("none-quiz-txt");
const delAllQuizzesCont = qListPage.querySelector(".del-all-cont");
/** @type {Quiz[]} */
const defaultQuizzes = [
  commonSenseQuiz,
  commonSenseQuiz2,
  gameQuiz,
  sportsQuiz,
  japanQuiz,
  wordQuiz,
  animeQuiz,
  mangaQuiz,
  difficultSportsQuiz,
  trueOrFalseQuiz,
  tryYourLuck,
];
const qListObj = {
  /**@type {Object<string, Quiz> | {}} */
  quizList: {},
  delQsWaitTImeout: null,
};
const INVALID_QUIZ_DATA_MESSAGE = "無効なクイズデータです";

if (!getQuizzesFromStorage()) {
  // 初めてページに訪れたとき、デフォルトのクイズを追加する
  defaultQuizzes.forEach((defaultQuiz) => {
    addQuizToStorage(defaultQuiz);
  });
}
initUploadBtn(headerBtnCont, 0, "d-none d-sm-inline-block");
initUploadBtn(headerBtnCont, 100, "d-sm-none");
initUploadBtn(noneQuizElem.querySelector(".btn-cont"), 100);

qListPage.addEventListener("click", (e) => {
  const elems = e.composedPath();
  if (!elems) return;

  Array.from(elems).forEach(async (elem) => {
    const classList = elem.classList;
    if (!elem.className) return;

    if (classList.contains("upload-q")) {
      elem.value = "";
    } else if (classList.contains("open-del-q-m")) {
      const delQId = elem.id.split("del-")[1];
      const delQ = getQuizFromStorage(delQId);
      openDelQuizModal(delQ, "quiz");
    } else if (classList.contains("play-q")) {
      const quizId = elem.id.split("play-")[1];
      const quiz = getQuizFromStorage(quizId);
      if (!isValidQuizObj(quiz)) {
        showToast("red", INVALID_QUIZ_DATA_MESSAGE);
        return;
      }
      initQuizPage(quiz);
      navigateToPage("quiz");
    } else if (classList.contains("edit-q")) {
      const quizId = elem.id.split("edit-")[1];
      const quiz = getQuizFromStorage(quizId);
      if (!isValidQuizObj(quiz)) {
        showToast("red", INVALID_QUIZ_DATA_MESSAGE);
        return;
      }
      navigateToPage("createQuiz");
      initCrtQuizPage(quiz, "edit");
    } else if (classList.contains("share-q")) {
      const quizId = elem.id.split("share-")[1];
      const quiz = getQuizFromStorage(quizId);
      if (!isValidQuizObj(quiz)) {
        showToast("red", INVALID_QUIZ_DATA_MESSAGE);
        return;
      }
      // クイズデータ(json)のダウンロードを実行する
      const blob = new Blob([JSON.stringify(quiz)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const dlLink = createElement("a", {
        href: url,
        download: `quiz_${quizId}.json`,
        class: "d-none",
      });
      dlLink.click();
      dlLink.remove();
      URL.revokeObjectURL(url);
    } else if (classList.contains("del-quiz")) {
      const delQId = elem.id.split("del-quiz-")[1];
      removeQuizFromStorage(delQId);
      closeModal();
      if (searchQInput.value) {
        handleSearchQuizzes(); // 検索バーを使用している場合は、その結果を維持する
      } else {
        displayQuizList();
      }
    } else if (classList.contains("open-del-all-qs-m")) {
      openDelAllQuizModal("quiz");
    } else if (classList.contains("open-del-all-qs-m-again")) {
      // ミスによりクイズがすべて削除されないように、削除承認モーダルを2回表示する
      showConfirmDelAllQuizzes("quiz");
    } else if (classList.contains("del-all-quizzes")) {
      removeQuizzesFromStorage();
      closeModal();
      displayQuizList();
    }
  });
});
qListPage.addEventListener("shown.bs.dropdown", (e) => {
  // ドロップダウンが表示されている間、3点リーダーに背景色をつける
  e.relatedTarget.classList.toggle(
    "ellipsis-bg",
    e.relatedTarget.classList.contains("show")
  );
});
qListPage.addEventListener("hidden.bs.dropdown", (e) => {
  // ドロップダウンが隠れたとき、3点リーダーの背景色をなくす
  e.relatedTarget.classList.toggle(
    "ellipsis-bg",
    e.relatedTarget.classList.contains("show")
  );
});
searchQInput.addEventListener("input", handleSearchQuizzes);
/**
 * @description クイズ検索バーのハンドリングをする
 * @returns {void} なし
 */
function handleSearchQuizzes() {
  const query = searchQInput.value;
  delAllQuizzesCont.classList.toggle("hidden-del-all-cont", query); // 検索バーが空のときのみ表示する

  if (!query) {
    displayQuizList();
    return;
  }

  qListObj.quizList = getQuizzesFromStorage(); // 削除後、更新するため
  const quizList = searchQuizzes(query, qListObj.quizList);
  const noneResult = !Object.keys(quizList).length;
  toggleElem(noneQuizElem, !noneResult);
  if (noneResult) {
    noneQuizTxtElem.innerHTML = `
    <div>
      <i class="bi bi-search fs-1"></i>
    </div>
    「${query}」に当てはまるクイズは見つかりませんでした。他のキーワードで検索するか、自分でクイズを作成、または他の人のクイズで遊んでみましょう！`;
    toggleElem(headerBtnCont, noneResult);
    quizzesCont.innerHTML = "";
    toggleBtnsByScrollability("quizList");
    return;
  }
  displayQuizList(quizList, query);
}
/**
 * @description クイズ全削除ボタンのタイムアウトを解除する
 * @returns {void} なし
 */
export function clearDelQsWaitTimeout() {
  clearTimeout(qListObj.delQsWaitTImeout);
}
/**
 * @description クイズ一覧を表示する
 * @param {Quiz} [obj=null] 一覧表示させるオブジェクト(デフォルトでは保存されているすべてのクイズを一覧表示する)
 * @param {string} [highlight=""] ハイライトをつける時に使用するテキスト
 * @returns {void} なし
 */
export function displayQuizList(obj = null, highlight = "") {
  quizzesCont.innerHTML = "";

  if (!obj) {
    searchQInput.value = ""; // ページ間を移動してきたときに空にする
    qListObj.quizList = getQuizzesFromStorage() || {};
  }

  const qListObjToUse = obj ? obj : qListObj.quizList;
  const noneQuiz = !Object.keys(qListObjToUse).length || !qListObjToUse;
  if (noneQuiz) {
    noneQuizTxtElem.innerHTML = `
    <div>
      <i class="bi bi-emoji-frown fs-1"></i>
    </div>
    まだクイズがありません。自分でクイズを作成するか、他の人のクイズで遊んでみましょう！`;
  }
  toggleElem(noneQuizElem, !noneQuiz);
  toggleElem(searchQInput, noneQuiz);
  toggleElem(headerBtnCont, noneQuiz);
  delAllQuizzesCont.classList.toggle(
    "hidden-del-all-cont",
    noneQuiz || highlight
  ); // 検索バーを使用していなく(検索バーが空)、クイズが1つ以上あるときのみ表示

  populateQuizItems("quiz", qListObjToUse, quizzesCont, highlight);
}
/**
 * @description クイズ一覧のオブジェクトから、クエリを含むプロパティを持つオブジェクトを返す
 * @param {string} query 検索する文字列(searchQInputのvalue)
 * @param {Object<string, Quiz>} クイズ一覧のオブジェクト
 * @returns {Object<string, Quiz> | {}} ヒットしたクイズのオブジェクト(何もヒットしなければ空のオブジェクト)
 */
export function searchQuizzes(query, quizListObj) {
  const resultObj = {};

  Object.keys(quizListObj).forEach((id) => {
    const quiz = quizListObj[id];
    const title = quiz.title || "タイトルなし";
    const description = quiz.description || "説明なし";
    const quizLength = quiz.length;

    // 小文字大文字関係なく一致させるため、大文字に統一する
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
/**
 * @description 要素のテキストに、ハイライトの文字列をもとに背景色を付ける
 * @param {string} highlight ハイライトの文字列
 * @param {Element} textElem ハイライトを当てたい要素
 * @returns {void} なし
 */
function highlightText(highlight, textElem) {
  if (!highlight) return;

  // ハイライトと要素のテキストを大文字に統一・比較することで、大文字小文字関係なく文字が一致していれば背景色を変える
  const upperHighlight = highlight.toUpperCase();
  const text = textElem.innerText;
  const upperText = text.toUpperCase();

  if (upperText.includes(upperHighlight)) {
    const highlightI = upperText.indexOf(upperHighlight);
    const replacement = text.substring(
      highlightI,
      highlightI + upperHighlight.length
    );
    const escapedRepl = replacement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // 特殊文字を文字列に変換する
    const hlRegExp = new RegExp(escapedRepl, "g");
    const hlRepl = `<span class="bg-warning highlight">${replacement}</span>`;

    textElem.innerHTML = text.replace(hlRegExp, hlRepl);
  }
}
/**
 * @description クイズリストのデータをクイズのアイテムの要素に設定し、それをコンテナに挿入する
 * @param {"draft" | "quiz"} quizType クイズの種類
 * @param {Object<string, Quiz>} quizListObj クイズリストのオブジェクト
 * @param {HTMLElement} quizzesCont クイズの一覧を挿入するコンテナ要素
 * @param {string} highlight ハイライトをつける文字列
 * @returns {void} なし
 */
export function populateQuizItems(
  quizType,
  quizListObj,
  quizzesCont,
  highlight
) {
  const isDraft = quizType === "draft";
  Object.values(quizListObj).forEach((quiz) => {
    // テンプレートの中身をクイズのデータで置き換え手表示する
    if (!isValidQuizObj(quiz)) return;
    const quizItemTemId = isDraft ? "quiz-draft-tem" : "quiz-item-tem";
    const quizItem = cloneFromTemplate(quizItemTemId);

    const placeholder = isDraft ? "{quiz-draft-id}" : "{quiz-id}";
    const elemsHasAttrQId = quizItem.querySelectorAll(
      `[id*='${placeholder}'], [aria-labelledby*='${placeholder}']`
    );
    replaceAttrVals(elemsHasAttrQId, placeholder, quiz.id);

    const quizTitleElem = quizItem.querySelector(".q-title");
    quizTitleElem.innerText = quiz.title || "タイトルなし";
    highlightText(highlight, quizTitleElem);

    const quizDescElem = quizItem.querySelector(".q-desc");
    quizDescElem.innerText = quiz.description || "説明なし";
    highlightText(highlight, quizDescElem);

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
      if (question.options?.explanation) {
        hasOptions.question.explanation = true;
      }
    });
    const optionTimer = quiz.options?.timer;
    if (optionTimer) {
      hasOptions.quiz.timer = true;
    }

    const hasAnyOption =
      hasOptions.quiz.timer || hasOptions.question.explanation;
    if (hasAnyOption) {
      const quizInfoElem = quizItem.querySelector(".q-info");
      showElem(quizInfoElem);
      if (hasOptions.quiz.timer) {
        const timerIcon = quizInfoElem.querySelector(".timer-icon");
        replaceAttrVals([timerIcon], "{option-timer}", formatTime(optionTimer));
        toggleElem(timerIcon, !hasOptions.quiz.timer);
      }
      if (hasOptions.question.explanation) {
        toggleElem(
          quizInfoElem.querySelector(".expl-icon"),
          !hasOptions.question.explanation
        );
      }
    }

    const qLengthElem = quizItem.querySelector(".q-length");
    qLengthElem.innerText = qLengthElem.innerText.replace(
      "{quiz-length}",
      quiz.length
    );
    highlightText(highlight, qLengthElem);

    quizzesCont.appendChild(quizItem);
  });

  initTooltips();
  toggleBtnsByScrollability(isDraft ? "createQuiz" : "quizList");
}
/**
 * @description クイズを削除するモーダルを表示する
 * @param {Quiz} delQuiz 削除するクイズ
 * @param {"draft" | "quiz"} quizType クイズの種類
 * @returns {void} なし
 */
export function openDelQuizModal(delQuiz, quizType) {
  const optionTimer = delQuiz.options?.timer;
  const optionExpls = Object.values(delQuiz.questions)
    .map((q) => q.options?.explanation)
    .filter((expl) => expl);
  const isDraft = quizType === "draft";
  const quizTypeTxt = isDraft ? "下書き" : "クイズ";
  openModal({
    title: `${quizTypeTxt}を削除`,
    body: `この${quizTypeTxt}を削除します。よろしいですか？
    <div class="card mt-3">
      <div class="card-body gap-3">
        <div class="d-flex flex-row">
          <div>
            <h5 class="card-title">${delQuiz.title || "タイトルなし"}</h5>
            <p class="card-text">${delQuiz.description || "説明なし"}</p>
            <span class="card-text text-primary">
              問題数: ${delQuiz.length}問
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
    modalCont: isDraft ? crtQPage : qListPage,
    actionBtn: {
      text: "削除",
      color: "red",
      HTMLAttributes: {
        id: `del-quiz${isDraft ? "-draft" : ""}-${delQuiz.id}`,
        class: `del-quiz${isDraft ? "-draft" : ""}`,
      },
    },
  });
}
/**
 * @description クイズ・下書きをすべて削除する時のモーダルを表示する
 * @param {"quiz" | "draft"} quizType
 */
export function openDelAllQuizModal(quizType) {
  const isDraft = quizType === "draft";
  const quizTypeTxt = isDraft ? "下書き" : "クイズ";
  openModal({
    title: `${quizTypeTxt}をすべて削除`,
    body: `${quizTypeTxt}をすべて削除します。よろしいですか？`,
    modalCont: isDraft ? crtQPage : qListPage,
    actionBtn: {
      text: "削除",
      color: "red",
      HTMLAttributes: {
        class: `open-del-all-${isDraft ? "qds" : "qs"}-m-again`, // qds: quiz drafts(複数の下書き), qs: quizzes(複数のクイズ)
      },
    },
  });
}
/**
 * @description クイズ全削除モーダルの中身を書き換え、本当に削除していいのかを再度ユーザに確認してもらう
 * @param {"draft" | "quiz"} quizType クイズの種類
 * @returns {Promise<void>} プロミス
 */
export async function showConfirmDelAllQuizzes(quizType) {
  const isDraft = quizType === "draft";
  document.querySelector(".modal-body").innerHTML = `
  <div class="text-center fw-bold">
    <div class="text-bg-danger d-inline-block p-4 rounded-circle">
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
      </svg>
    </div>
    <div class="mt-4">この操作は取り消せません。本当に${
      isDraft ? "下書き" : "クイズ"
    }をすべて削除しますか？</div>
  </div>
  `;
  const actionBtn = document.querySelector(".action-btn");
  actionBtn.innerText = "本当に削除する";
  actionBtn.classList.remove(`open-del-all-${isDraft ? "qds" : "qs"}-m-again`);
  actionBtn.classList.add(`del-all-${isDraft ? "quiz-drafts" : "quizzes"}`);
  actionBtn.disabled = true;
  await new Promise((resolve) => {
    // 誤って削除ボタンを押さないように、3秒待たないと押せない仕様
    qListObj.delQsWaitTImeout = setTimeout(() => {
      resolve();
    }, 3000);
  });

  actionBtn.disabled = false;
}
