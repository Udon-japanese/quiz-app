"use strict";
import { addQuizToStorage, getQuizFromStorage, getThemeFromStorage, setThemeToStorage } from "../utils/storage.js";
import { displayQuizList } from "./quizList.js";
import { showToast } from "../utils/showToast.js";
import { setCookie, getCookie } from "../utils/cookie.js";
import { endQuiz, initQuizPage } from "./quiz.js";
import { isValidQuizObj } from "../utils/isValidQuizObj.js";
import { saveQuizDraft, initCrtQuizPage } from "./createQuiz.js";
import { isUUID } from "../utils/isUUID.js";
import { toggleElem } from "../utils/elemManipulation.js";

const topPage = document.getElementById("top-page");
const navToCrtQPBtn = document.querySelector(".nav-link.to-crt-q-page"); // ナビゲーションバー上にあるクイズ作成ページへ移動するボタン
const navToQListPBtn = document.querySelector(".nav-link.to-q-list-page"); // ナビゲーションバー上にあるクイズ一覧ページへ移動するボタン
const toggleThemeBtn = document.getElementById("toggle-theme");
const navbarBtns = [navToCrtQPBtn, navToQListPBtn];
const pages = {
  top: topPage,
  createQuiz: document.getElementById("crt-quiz-page"),
  quizList: document.getElementById("quiz-list-page"),
  quiz: document.getElementById("quiz-page"),
};
const LAST_ACCESS_KEY_NAME = "lastAccess";

initUploadBtn(topPage.querySelector(".btn-cont"), 100);
loadInitialPage();
toggleBtnsByScrollability();
const savedTheme = getThemeFromStorage();
if (savedTheme === "dark" || savedTheme === "light") {
  applyTheme(savedTheme);
}

window.addEventListener("load", monitorStorageCapacity);
window.addEventListener("resize", toggleBtnsByScrollability);
window.addEventListener("beforeunload", () => {
  if (getCurrentPageName() === "createQuiz") {
    saveQuizDraft();
  }
});
document.addEventListener("click", (e) => {
  const elems = e.composedPath();
  if (!elems) return;

  Array.from(elems).forEach((elem) => {
    if (!elem.className) return;
    const classList = elem.classList;

    if (classList.contains("to-top-page")) {
      navigateToPage("top");
    } else if (classList.contains("to-crt-q-page")) {
      navigateToPage("createQuiz");
    } else if (classList.contains("to-q-list-page")) {
      navigateToPage("quizList");
    } else if (classList.contains("to-q-page")) {
      navigateToPage("quiz");
    }
  });
});
document.addEventListener("change", (e) => {
  const elems = e.composedPath();
  if (!elems) return;

  Array.from(elems).forEach((elem) => {
    if (!elem.className) return;
    const classList = elem.classList;

    if (classList.contains("upload-q")) {
      // いくつかのページでアップロードするためindex.jsに配置
      const file = elem.files[0];
      if (!file) return;
      if (file.type !== "application/json") {
        showToast("red", "JSONファイルのみアップロードできます");
        elem.value = "";
        return;
      }
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        const jsonContent = e.target.result;
        try {
          const obj = JSON.parse(jsonContent);
          if (!isValidQuizObj(obj)) {
            showToast("red", "無効なクイズデータです");
            return;
          }
          addQuizToStorage(obj);
          showToast("green", "クイズが保存されました");
          navigateToPage("quizList");
        } catch (err) {
          showToast("red", "JSONファイルの解析に失敗しました");
          return;
        }

        displayQuizList();
      };
    }
  });
});
toggleThemeBtn.addEventListener("click", toggleTheme);

/**
 * @description テーマに合わせてスタイルを変える
 * @returns {void} なし
 */
function applyTheme(theme) {
  const isDarkMode = theme === "dark";
  const body = document.body;

  // テーマに基づいてボタンやアイコンのスタイルを切り替える
  document.querySelectorAll(".choice-btn").forEach(choiceBtn => {
    choiceBtn.classList.toggle("btn-outline-dark", !isDarkMode);
    choiceBtn.classList.toggle("btn-outline-light", isDarkMode);
  });
  toggleElem(document.getElementById("dark-mode-icon"), isDarkMode);
  toggleElem(document.getElementById("light-mode-icon"), !isDarkMode);
  toggleThemeBtn.classList.toggle("btn-dark", !isDarkMode);
  toggleThemeBtn.classList.toggle("btn-light", isDarkMode);

  // テーマを切り替える
  body.setAttribute("data-bs-theme", theme);
  setThemeToStorage(theme);
}
/**
 * @description テーマをトグルする
 * @returns {void} なし
 */
function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute("data-bs-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  bootstrap.Offcanvas.getOrCreateInstance(
    document.getElementById("offcanvas")
  ).hide();

  applyTheme(newTheme); // テーマを切り替えて適用する
}
/**
 * @description 現在のページの名前を取得する
 * @returns {"quizList" | "createQuiz" | "top" | "quiz" | null} 現在のページの名前(一致するものがなければnull)
 */
function getCurrentPageName() {
  const currentPageElem = document.querySelector(".page:not(.d-none)"); // 現在のページ以外は非表示(class="d-none")のため
  for (const pageName in pages) {
    if (pages[pageName].id === currentPageElem?.id) {
      return pageName;
    }
  }
  return null;
}
/**
 * @description 指定したページに移動し、ページごとに必要な処理を行う
 * @param {"quizList" | "createQuiz" | "top" | "quiz"} pageName 移動したいページの名前
 * @returns {void} なし
 */
export function navigateToPage(pageName) {
  const currentPageName = getCurrentPageName();
  if (currentPageName === "quiz") {
    endQuiz();
  } else if (currentPageName === "createQuiz") {
    saveQuizDraft();
  }

  bootstrap.Offcanvas.getOrCreateInstance(
    document.getElementById("offcanvas")
  ).hide(); // 画面幅がsm未満の時に、ナビゲーションバー(オフキャンバス)上のページ遷移ボタンを押したら閉じるように

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
    navbarBtns.forEach((btn) => {
      const isActive = btn === navbarBtnMap[pageName];
      btn.classList.toggle("active", isActive);
    });
  } else {
    navbarBtns.forEach((btn) => {
      btn.classList.remove("active");
    });
  }

  toggleBtnsByScrollability();
}
/**
 * @description 表示するページを切り替え、そのページにアクセスしたことをクッキーに保存する
 * @param {"quizList" | "createQuiz" | "top" | "quiz"} pageName 表示したいページの名前
 * @returns {void} なし
 */
function switchToPage(pageName) {
  if (pageName == "quiz") {
    setCookie(
      LAST_ACCESS_KEY_NAME,
      `${pageName}?id=${
        document.querySelector(".has-quiz-id").id.split("quiz-")[1]
      }`
    );
  } else {
    setCookie(LAST_ACCESS_KEY_NAME, pageName, 14);
  }
  hideOtherPages(pages[pageName]);
}
/**
 * @description 見せるページ以外のページを隠す
 * @param {HTMLElement} showPage 見せたいページ
 * @returns {void} なし
 */
function hideOtherPages(showPage) {
  Object.values(pages).forEach((page) => {
    toggleElem(page, page !== showPage);
  });
}
/**
 * @description templateタグのクローンを生成する
 * @param {string} id templateタグのid名
 * @returns {DocumentFragment} 生成されたクローンの要素
 */
export function cloneFromTemplate(id) {
  const template = document.getElementById(id);
  return template.content.cloneNode(true);
}
/**
 * @description クイズをアップロードするボタンを作成、設定する
 * @param {HTMLElement} btnCont ボタンが挿入される親要素
 * @param {0 | 25 | 50 | 75 | 100} [width=0] ボタンの幅
 * @param {string} [className=""] ボタンに付与するクラス(複数渡す場合は半角スペースで区切る)
 * @returns {void} なし
 */
export function initUploadBtn(btnCont, width = 0, className = "") {
  const uploadQBtn = cloneFromTemplate("upload-quiz-tem");
  btnCont.appendChild(uploadQBtn);

  const uploadQBtnEls = btnCont.querySelectorAll(".upload-q-btn");
  uploadQBtnEls.forEach((uploadBtn) => {
    if (uploadBtn.classList.contains("initialized")) return; // 初期化済みだったらリターン
    if (width) {
      uploadBtn.classList.add(`w-${width}`);
    }
    if (className) {
      const classes = className.split(" ");
      classes.forEach((cl) => {
        uploadBtn.classList.add(cl);
      });
    }
    uploadBtn.classList.add("initialized");
  });
}
/**
 * @description ユーザが最初に訪れた時に、クッキーの値により開くページを決定し、表示する
 * @returns {void} なし
 */
function loadInitialPage() {
  const lastAccess = getCookie(LAST_ACCESS_KEY_NAME);
  if (lastAccess) {
    if (lastAccess.startsWith("quiz?")) {
      const qId = lastAccess.split("quiz?id=")[1];
      if (!isUUID(qId)) {
        navigateToPage("top");
        return;
      }
      const quiz = getQuizFromStorage(qId);
      if (!isValidQuizObj(quiz)) {
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
/**
 * @description ローカルストレージの容量がいっぱいになっていたら、データの削除を促す
 * @returns {void} なし
 */
function monitorStorageCapacity() {
  const maxLocalStorageSize = 5 * 1000 * 1000; // localStorageの最大容量である5MB
  const usedLocalStorageSpace = JSON.stringify(localStorage).length;

  if (usedLocalStorageSpace >= maxLocalStorageSize) {
    showToast(
      "yellow",
      "データをこれ以上保存できません。新しくクイズを保存したい場合は、不要なクイズを削除してください"
    );
  }
}
/**
 * @description 2つずつあるクイズ・下書き全削除ボタンを、画面幅によって最適な方のみ表示する
 * @returns {void} なし
 */
export function toggleBtnsByScrollability() {
  const body = document.body;
  const isScrollable = body.scrollHeight > body.clientHeight;
  const screenWidth = window.innerWidth;
  const isScreenSMOrWider = screenWidth > 575.98;
  document.querySelectorAll(".del-all-cont").forEach((btnCont) => {
    if (btnCont) btnCont.classList.toggle("container", isScreenSMOrWider); //クイズ・下書き全削除ボタンをsm未満では画面幅いっぱいにするため
  });
  document.querySelectorAll(".visible-on-scrollable").forEach((btn) => {
    if (btn) toggleElem(btn, !isScrollable);
  });
  document.querySelectorAll(".hidden-on-scrollable").forEach((btn) => {
    if (btn) toggleElem(btn, isScrollable);
  });
}
