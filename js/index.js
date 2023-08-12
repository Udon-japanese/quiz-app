"use strict";
import { storage } from "../utils/storage.js";
import { createElement } from "../utils/createElement.js";
import { displayQuizList } from "./quizList.js";
import { closeModal } from "../utils/modal.js";

const topPage = document.getElementById("top-page");
const crtQPage = document.getElementById("crt-quiz-page");
const qListPage = document.getElementById("quiz-list-page");
const qPage = document.getElementById("quiz-page");
const pages = [topPage, crtQPage, qListPage, qPage];

const navToCrtQPBtn = document.querySelector(".nav-link.to-crt-q-page");
const navToQListPBtn = document.querySelector(".nav-link.to-q-list-page");
const navbarBtns = [navToCrtQPBtn, navToQListPBtn];
initUploadBtn(topPage.querySelector(".btn-cont"), 100);

navigateToPage("quizList", "quizList");

document.addEventListener("click", (e) => {
  const els = e.composedPath();
  if (!els) return;

  Array.from(els).forEach((el) => {
    const classList = el.classList;
    if (!el.className) return;

    if (classList.contains("to-top-page")) {
      navigateToPage("top");
    } else if (classList.contains("to-crt-q-page")) {
      navigateToPage("createQuiz", "createQuiz");
    } else if (classList.contains("to-q-list-page")) {
      navigateToPage("quizList", "quizList");
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
      navigateToPage("quizList", "quizList");
    } else if (classList.contains("del-quiz")) {
      const delQId = el.id.split("del-")[1];
      storage.removeItem(delQId);
      closeModal();
      displayQuizList();
    } else if (classList.contains("upload-q")) {
    }
  });
});

/**
 * @description
 * @param {"quizList" | "createQuiz" | "top" | "quiz"} pageName
 * @param {"quizList" | "createQuiz"} activePageName
 */
export function navigateToPage(pageName, activePageName = null) {
  switchToPage(pageName);

  const navbarBtnsObj = {
    quizList: navToQListPBtn,
    createQuiz: navToCrtQPBtn,
  };
  const activeBtn = navbarBtnsObj[activePageName];
  navbarBtns.forEach((b) => {
    if (activePageName === null) {
      b.classList.remove("active");
    } else {
      b.classList.toggle("active", b === activeBtn);
    }
  });

  /**
   * @description
   * @param {"quizList" | "createQuiz" | "top" | "quiz"} pageName
   */
  function switchToPage(pageName) {
    switch (pageName) {
      case "top":
        hideOtherPages(topPage);
        break;
      case "quiz":
        hideOtherPages(qPage);
        break;
      case "createQuiz":
        hideOtherPages(crtQPage);
        break;
      case "quizList":
        hideOtherPages(qListPage);
        break;
    }
  }

  /**
   * @description
   * @param {HTMLElement} showPage
   */
  function hideOtherPages(showPage) {
    pages.forEach((p) => {
      p.classList.toggle("d-none", showPage !== p);
    });
  }
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
