"use strict";
import {
  addQuizToStorage,
  getQuizFromStorage,
} from "../utils/storage.js";
import { createElement } from "../utils/createElement.js";
import { displayQuizList } from "./quizList.js";
import { showToast } from "../utils/showToast.js";
import { setCookie, getCookie } from "../utils/cookie.js";
import { endQuiz, initQuizPage } from "./quiz.js";
import { isValidQuizObj } from "../utils/isValidQuizObj.js";
import { saveQuizDraft, initCrtQuizPage } from "./createQuiz.js";
import { isUUID } from "../utils/isUUID.js";

const topPage = document.getElementById("top-page");
const pages = {
  top: topPage,
  createQuiz: document.getElementById("crt-quiz-page"),
  quizList: document.getElementById("quiz-list-page"),
  quiz: document.getElementById("quiz-page"),
};

const navToCrtQPBtn = document.querySelector(".nav-link.to-crt-q-page");
const navToQListPBtn = document.querySelector(".nav-link.to-q-list-page");
const navbarBtns = [navToCrtQPBtn, navToQListPBtn];
initUploadBtn(topPage.querySelector(".btn-cont"), 100);
loadInitialPage();

// ページがロードされたときに容量不足を監視
window.addEventListener("load", monitorStorageCapacity);
document.addEventListener("click", (e) => {
  const els = e.composedPath();
  if (!els) return;

  Array.from(els).forEach((el) => {
    if (!el.className) return;
    const classList = el.classList;

    if (classList.contains("to-top-page")) {
      navigateToPage("top");
    } else if (classList.contains("to-crt-q-page")) {
      navigateToPage("createQuiz");
    } else if (classList.contains("to-q-list-page")) {
      navigateToPage("quizList");
    } else if (classList.contains("to-q-page")) {
      navigateToPage("quiz");
    } else if (classList.contains("share-q")) {
      const quizId = el.id.split("share-")[1];
      const quiz = getQuizFromStorage(quizId);
      const blob = new Blob([JSON.stringify(quiz)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const dlLink = createElement("a", {
        href: url,
        download: `quiz_${quizId}.json`,
        class: "d-none",
      });
      dlLink.click();
      dlLink.remove();
      URL.revokeObjectURL(url);
      navigateToPage("quizList");
    }
  });
});
document.addEventListener("change", (e) => {
  const els = e.composedPath();
  if (!els) return;

  Array.from(els).forEach((el) => {
    if (!el.className) return;
    const classList = el.classList;

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
            addQuizToStorage(obj);
            showToast("green", "クイズが保存されました");
            navigateToPage("quizList");
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
    }
  });
});

/**
 *
 * @returns {"quizList" | "createQuiz" | "top" | "quiz"}
 */
function getCurrentPageName() {
  const currentPageEl = document.querySelector(".page:not(.d-none)");
  for (const pageName in pages) {
    if (pages[pageName].id === currentPageEl?.id) {
      return pageName;
    }
  }
  return null;
}

/**
 * @description
 * @param {"quizList" | "createQuiz" | "top" | "quiz"} pageName
 */
export function navigateToPage(pageName) {
  const currentPageName = getCurrentPageName();
  if (currentPageName === "quiz") {
    endQuiz();
  } else if (currentPageName === "createQuiz") {
    saveQuizDraft();
  }

  const offcanvasInstance = bootstrap.Offcanvas.getOrCreateInstance(
    document.getElementById("offcanvas")
  );
  offcanvasInstance.hide();

  switchToPage(pageName);

  const navbarBtnMap = {
    quizList: navToQListPBtn,
    createQuiz: navToCrtQPBtn,
  };

  if (pageName === "quizList") {
    displayQuizList();
  } else if (pageName === "createQuiz") {
    initCrtQuizPage();
  }

  if (pageName === "quizList" || pageName === "createQuiz") {
    navbarBtns.forEach((b) => {
      const isActive = b === navbarBtnMap[pageName];
      b.classList.toggle("active", isActive);
    });
  } else {
    navbarBtns.forEach((b) => {
      b.classList.remove("active");
    });
  }
}

/**
 * @description
 * @param {"quizList" | "createQuiz" | "top" | "quiz"} pageName
 */
function switchToPage(pageName) {
  if (pageName == "quiz") {
    setCookie(
      "lastAccess",
      `${pageName}?id=${
        document.querySelector(".has-quiz-id").id.split("quiz-")[1]
      }`
    );
  } else {
    setCookie("lastAccess", pageName, 14);
  }
  hideOtherPages(pages[pageName]);
}

/**
 * @description
 * @param {HTMLElement} showPage
 */
function hideOtherPages(showPage) {
  Object.values(pages).forEach((p) => {
    const isShowPage = p === showPage;
    p.classList.toggle("d-none", !isShowPage);
  });
}

/**
 * @description templateタグのクローンを生成する
 * @param {string} id templateタグのid名
 * @returns {DocumentFragment} cloneされた要素
 */
export function cloneFromTemplate(id) {
  const template = document.getElementById(id);
  const clone = template.content.cloneNode(true);
  return clone;
}

/**
 * @description
 * @param {HTMLElement} btnCont
 * @param {0 | 25 | 50 | 75 | 100} width
 * @param {string} className
 */
export function initUploadBtn(btnCont, width, className = "") {
  const uploadQBtn = cloneFromTemplate("upload-quiz-tem");
  btnCont.appendChild(uploadQBtn);
  const uploadQBtnEls = btnCont.querySelectorAll(".upload-q-btn");
  uploadQBtnEls.forEach((b) => {
    if (b.classList.contains("initialized")) return;
    if (width) {
      b.classList.add(`w-${width}`);
    }
    if (className) {
      const classes = className.split(" ");
      classes.forEach((c) => {
        b.classList.add(c);
      });
    }
    b.classList.add("initialized");
  });
}

function loadInitialPage() {
  const lastAccess = getCookie("lastAccess");
  if (lastAccess) {
    if (lastAccess.startsWith("quiz?")) {
      const qId = lastAccess.split("quiz?id=")[1];
      if (!isUUID(qId)) {
        navigateToPage("top");
        return;
      }
      const quiz = getQuizFromStorage(qId);
      if (!Object.keys(quiz).length) {
        navigateToPage("top");
        return;
      }
      initQuizPage(quiz);
    } else {
      navigateToPage(lastAccess);
    }
  } else {
    navigateToPage("top");
  }
}

function monitorStorageCapacity() {
  const maxLocalStorageSize = 5 * 1000 * 1000; // 5MB
  const usedLocalStorageSpace = JSON.stringify(localStorage).length;

  if (usedLocalStorageSpace >= maxLocalStorageSize) {
    showToast(
      "yellow",
      "データをこれ以上保存できません。新しくクイズを保存したい場合は、不要なクイズを削除してください"
    );
  }
}
