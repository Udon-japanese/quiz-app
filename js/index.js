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

document.addEventListener("click", (e) => {
  const els = e.composedPath();
  if (!els) return;

  Array.from(els).forEach((el) => {
    const classList = el.classList;
    if (!el.className) return;

    if (classList.contains("to-top-page")) {
      hideOtherPages(topPage);
      navbarBtns.forEach((b) => {
        b.classList.remove("active");
      });
    } else if (classList.contains("to-crt-q-page")) {
      hideOtherPages(crtQPage);
      navbarBtns.forEach((b) => {
        b.classList.toggle("active", b === navToCrtQPBtn);
      });
    } else if (classList.contains("to-q-list-page")) {
      hideOtherPages(qListPage);
      navbarBtns.forEach((b) => {
        b.classList.toggle("active", b === navToQListPBtn);
      });
    } else if (classList.contains("to-q-page")) {
      hideOtherPages(qPage);
      navbarBtns.forEach((b) => {
        b.classList.remove("active");
      });
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
    } else if (classList.contains("del-quiz")) {
      const delQId = el.id.split("del-")[1];
      storage.removeItem(delQId);
      closeModal();
      displayQuizList();
    } else if (classList.contains("upload-q")) {
    }
  });
});

export function hideOtherPages(showPage) {
  pages.forEach((p) => {
    p.classList.toggle("d-none", showPage !== p);
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

    if (width !== 100) {
      b.classList.remove("w-100");
    }
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
