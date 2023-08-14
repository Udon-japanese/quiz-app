"use strict";
import { storage } from "../utils/storage.js";
import { createElement } from "../utils/createElement.js";
import { displayQuizList } from "./quizList.js";
import { closeModal } from "../utils/modal.js";
import { showToast } from "../utils/showToast.js";
import { setCookie, getCookie } from "../utils/cookie.js";
import { initQuizPage } from "./quiz.js";

const topPage = document.getElementById("top-page");
const crtQPage = document.getElementById("crt-quiz-page");
const qListPage = document.getElementById("quiz-list-page");
const qPage = document.getElementById("quiz-page");
const pages = [topPage, crtQPage, qListPage, qPage];

const navToCrtQPBtn = document.querySelector(".nav-link.to-crt-q-page");
const navToQListPBtn = document.querySelector(".nav-link.to-q-list-page");
const navbarBtns = [navToCrtQPBtn, navToQListPBtn];
initUploadBtn(topPage.querySelector(".btn-cont"), 100);
loadInitialPage();

document.addEventListener("click", (e) => {
  const els = e.composedPath();
  if (!els) return;

  Array.from(els).forEach((el) => {
    const classList = el.classList;
    if (!el.className) return;

    if (classList.contains("to-top-page")) {
      navigateToPage("top");
    } else if (classList.contains("to-crt-q-page")) {
      navigateToPage("createQuiz");
    } else if (classList.contains("to-q-list-page")) {
      navigateToPage("quizList");
    } else if (classList.contains("to-q-page")) {
      navigateToPage("quiz");
    } else if (classList.contains("share-q")) {
      const qId = el.id.split("share-")[1];
      const quiz = storage.getItem(qId);
      const blob = new Blob([quiz], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const dlLink = createElement("a", {
        href: url,
        download: `quiz_${qId}.json`,
        class: "d-none",
      });
      dlLink.click();
      dlLink.remove();
      URL.revokeObjectURL(url);
      navigateToPage("quizList");
    } else if (classList.contains("del-quiz")) {
      const delQId = el.id.split("del-")[1];
      storage.removeItem(delQId);
      closeModal();
      displayQuizList();
    }
  });
});
document.addEventListener("change", (e) => {
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

function getCurrentPage() {
  const pages = document.querySelectorAll(".page");
  const currentPage = Array.from(pages).filter(p => !p.classList.contains("d-none"));
  return currentPage;
}

/**
 * @description
 * @param {"quizList" | "createQuiz" | "top" | "quiz"} pageName
 */
export function navigateToPage(pageName) {
  switchToPage(pageName);

  const navbarBtnMap = {
    quizList: navToQListPBtn,
    createQuiz: navToCrtQPBtn,
  };

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
  const pageMap = {
    top: topPage,
    quiz: qPage,
    createQuiz: crtQPage,
    quizList: qListPage,
  };
  if (pageName == "quiz") {
    setCookie("lastAccess", `${pageName}?${document.querySelector(".has-quiz-id").id.split("quiz-")[1]}`, 14);
  } else {
    setCookie("lastAccess", pageName, 14);  
  }
  hideOtherPages(pageMap[pageName]);
}

/**
 * @description
 * @param {HTMLElement} showPage
 */
function hideOtherPages(showPage) {
  pages.forEach((p) => {
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
 * @param {25 | 50 | 75 | 100} width
 * @param {string} className
 */
export function initUploadBtn(btnCont, width = 0, className = "") {
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

/**
 *
 * @param {object} obj
 * @returns {boolean}
 */
function isValidQuizObj(obj) {
  const requiredKeys = ["id", "title", "description", "questions"];
  if (
    !requiredKeys.every(
      (key) =>
        key === "questions" || (key in obj && typeof obj[key] === "string")
    )
  ) {
    return false;
  }

  const { questions } = obj;
  if (typeof questions !== "object") {
    return false;
  }

  for (const questionKey in questions) {
    const question = questions[questionKey];
    if (!isValidQuestionObj(question)) {
      return false;
    }
  }

  return true;
}

function isValidQuestionObj(question) {
  const requiredKeys = ["answerType", "statement"];
  if (
    !requiredKeys.every(
      (key) => key in question && typeof question[key] === "string"
    )
  ) {
    return false;
  }

  const validAnswerTypes = ["select", "select-all", "type-text"];
  if (!validAnswerTypes.includes(question.answerType)) {
    return false;
  }

  if (
    question.answerType === "select" ||
    question.answerType === "select-all"
  ) {
    if (
      !("choices" in question) ||
      !(question.answerType === "select-all"
        ? "correctAnswers" in question
        : "correctAnswer" in question)
    ) {
      return false;
    }
    if (
      Array.isArray(question.choices) &&
      question.choices.length > 0 &&
      question.choices.every((choice) => typeof choice === "string") &&
      ((question.answerType === "select" &&
        typeof question.correctAnswer === "string") ||
        (question.answerType === "select-all" &&
          Array.isArray(question.correctAnswers) &&
          question.correctAnswers.length > 0 &&
          question.correctAnswers.every(
            (answer) => typeof answer === "string"
          )))
    ) {
      return true;
    }
  } else if (question.answerType === "type-text") {
    if (typeof question.correctAnswer === "string") {
      return true;
    }
  }

  return false;
}

function isUUID(input) {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(input);
}

function loadInitialPage() {
  const lastAccess = getCookie("lastAccess");
  if (lastAccess) {
    if (lastAccess.startsWith("quiz?")) {
      const qId = lastAccess.split("quiz?")[1];
      if (!isUUID(qId)) {
        navigateToPage("top");
        return;
      }; 
      const quiz = JSON.parse(storage.getItem(qId));
      if (!quiz) {
        navigateToPage("top");
        return
      };
      initQuizPage(quiz);
    } else {
      navigateToPage(lastAccess);
    }
  } else {
    navigateToPage("top");
  }
}
