"use strict";
import {
  addQuizToStorage,
  getIsFirstVisitFromStorage,
  getQuizDraftFromStorage,
  getQuizFromStorage,
  getQuizzesFromStorage,
  getThemeFromStorage,
  setIsFirstVisitToStorage,
  setThemeToStorage,
} from "../utils/storage.js";
import { displayQuizList } from "./quizList.js";
import { showToast } from "../utils/showToast.js";
import { setCookie, getCookie } from "../utils/cookie.js";
import { endQuiz, initQuizPage } from "./quiz.js";
import { isValidQuizObj } from "../utils/isValidQuizObj.js";
import { saveQuizDraft, initCrtQuizPage, randomUUID } from "./createQuiz.js";
import { hideElem, showElem, toggleElem } from "../utils/elemManipulation.js";
import { openModal } from "../utils/modal.js";

const topPage = document.getElementById("top-page");
const navToCrtQPBtn = document.querySelector(".nav-link.to-crt-q-page"); // ナビゲーションバー上にあるクイズ作成ページへ移動するボタン
const navToQListPBtn = document.querySelector(".nav-link.to-q-list-page"); // ナビゲーションバー上にあるクイズ一覧ページへ移動するボタン
const toggleThemeBtn = document.getElementById("toggle-theme");
const loadingElem = document.getElementById("loading");
const navbarBtns = [navToCrtQPBtn, navToQListPBtn];
const pages = {
  top: topPage,
  createQuiz: document.getElementById("crt-quiz-page"),
  quizList: document.getElementById("quiz-list-page"),
  quiz: document.getElementById("quiz-page"),
};
export const LAST_ACCESS_KEY_NAME = "lastAccess";
const welcomeTourMap = new Map([
  [
    "createQuiz",
    {
      "3つの回答形式の中から、それぞれの問題に最適なものを選んで使えます":
        "./images/carousel/create-quiz1.png",
      "オプションで、クイズ作成時にマルバツクイズ(2択クイズ)にできます":
        "./images/carousel/create-quiz2.png",
      "下書きを複数保存することができ、後からいつでも続きから再開できます":
        "./images/carousel/create-quiz3.png",
    },
  ],
  [
    "quizList",
    {
      "三点リーダーをクリックすると、クイズの共有・編集・削除ができます":
        "./images/carousel/quiz-list1.png",
      "検索バーを使うと、クイズを絞り込めます":
        "./images/carousel/quiz-list2.png",
      "クイズを読み込むボタンで、ほかの人が作成したクイズを保存できます。また、ほかの人のクイズを編集することもできます":
        "./images/carousel/quiz-list3.png",
    },
  ],
  [
    "quiz",
    {
      "3つの回答形式があり、択一なら一つ選び、複数回答なら1つ以上選び、入力なら答えを入力します":
        "./images/carousel/quiz1.png",
      "タイマーが設定されている問題もあります。時間内に間に合うように頑張りましょう！":
        "./images/carousel/quiz2.png",
      "クイズ終了後のリザルト画面では、正答率のグラフ、正答数、メッセージが見られます。全問正解時には特別な演出もあります！":
        "./images/carousel/quiz3.png",
    },
  ],
]);

showElem(loadingElem);
initUploadBtn(topPage.querySelector(".btn-cont"), 100);
loadInitialPage();
showElem(document.getElementById("navbar"));
const savedTheme = getThemeFromStorage();
if (savedTheme === "dark" || savedTheme === "light") {
  applyTheme(savedTheme);
}
hideElem(loadingElem);

window.addEventListener("load", monitorStorageCapacity);
window.addEventListener("resize", () => {
  const currentPageName = getCurrentPageName();
  if (currentPageName === "createQuiz" || currentPageName === "quizList") {
    toggleBtnsByScrollability(currentPageName);
  }
});
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
          const quizzes = getQuizzesFromStorage();
          if (Object.keys(quizzes).includes(obj.id)) {
            obj.id = randomUUID();
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
 * @description 初回のみ使い方を表示する
 * @param {Object<string, string>} imageMap 画像代替テキストをキー、画像urlを値とするオブジェクト
 * @param {"quizList" | "createQuiz" | "top" | "quiz"} pageName ページの名前
 * @returns {void} なし
 */
function showWelcomeTour(imageMap, pageName) {
  const alts = Object.keys(imageMap);
  const images = Object.values(imageMap);
  openModal({
    title: "説明",
    body: `
<div class="d-flex justify-content-center">
  <div id="welcome-tour-carousel" class="carousel slide col-lg-9" data-bs-interval="0" data-bs-touch="true">
    <div class="carousel-indicators">
      <button type="button" data-bs-target="#welcome-tour-carousel" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
      <button type="button" data-bs-target="#welcome-tour-carousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
      <button type="button" data-bs-target="#welcome-tour-carousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
    </div>
    <div class="carousel-inner">
      <div class="carousel-item active">
        <img src="${images[0]}" class="d-block w-100" alt="${alts[0]}">
      </div>
      <div class="carousel-item">
        <img src="${images[1]}" class="d-block w-100" alt="${alts[1]}">
      </div>
      <div class="carousel-item">
        <img src="${images[2]}" class="d-block w-100" alt="${alts[2]}">
      </div>
    </div>
  </div>
</div>`,
    colorClass: "bg-light",
    modalCont: pages[pageName],
    header: {
      HTMLAttributes: {
        class: "d-none",
      },
    },
    cancelBtn: {
      HTMLAttributes: {
        class: "d-none",
      },
    },
    actionBtn: {
      text: "始める",
      color: "blue",
      HTMLAttributes: {
        "data-bs-dismiss": "modal",
      },
    },
  });
  setIsFirstVisitToStorage(pageName);
}
/**
 * @description テーマに合わせてスタイルを変える
 * @returns {void} なし
 */
function applyTheme(theme) {
  const isDarkMode = theme === "dark";
  const body = document.body;

  // テーマに基づいてボタンやアイコンのスタイルを切り替える
  document.querySelectorAll(".choice-btn").forEach((choiceBtn) => {
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

    toggleBtnsByScrollability(pageName);
  } else {
    navbarBtns.forEach((btn) => {
      btn.classList.remove("active");
    });
  }

  const imageMap = welcomeTourMap.get(pageName);
  const isFirstVisit = getIsFirstVisitFromStorage(pageName);
  if (imageMap && isFirstVisit) {
    showWelcomeTour(imageMap, pageName);
  }
}
/**
 * @description 表示するページを切り替え、そのページにアクセスしたことをクッキーに保存する
 * @param {"quizList" | "createQuiz" | "top" | "quiz"} pageName 表示したいページの名前
 * @returns {void} なし
 */
function switchToPage(pageName) {
  if (pageName == "quiz") {
    const quizId = document.querySelector(".has-quiz-id").id.split("quiz-")[1];
    setCookie(LAST_ACCESS_KEY_NAME, `${pageName}?id=${quizId}`);
  } else {
    setCookie(LAST_ACCESS_KEY_NAME, pageName);
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

  const uploadQBtnElems = btnCont.querySelectorAll(".upload-q-btn");
  uploadQBtnElems.forEach((uploadBtn) => {
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
    if (lastAccess.startsWith("quiz?id=")) {
      const quizId = lastAccess.split("quiz?id=")[1];
      const quiz = getQuizFromStorage(quizId);

      if (!isValidQuizObj(quiz)) {
        navigateToPage("top");
        return;
      }

      initQuizPage(quiz);
      navigateToPage("quiz");
    } else if (lastAccess.startsWith("createQuiz?draftId=")) {
      const quizDraftId = lastAccess.split("createQuiz?draftId=")[1];
      const quizDraft = getQuizDraftFromStorage(quizDraftId);

      if (!isValidQuizObj(quizDraft)) {
        navigateToPage("top");
        return;
      }

      navigateToPage("createQuiz");
      initCrtQuizPage(quizDraft, "draft");
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
 * @description 2つずつあるクイズ・下書き全削除ボタンを、ページごとに、画面幅によって最適な方のみ表示する
 * @param {"quizList" | "createQuiz"} [pageName=null] ページの名前(そのページでこの関数を実行する際に使用する)
 * @returns {void} なし
 */
export function toggleBtnsByScrollability(pageName) {
  const delAllConts = document.querySelectorAll(".del-all-cont");

  delAllConts.forEach((btnCont) => {
    showElem(btnCont); // ボタンの高さを含めてスクロール可能かどうか判断したいため
  });
  showElem(pages[pageName].querySelector(".visible-on-scrollable")); // ボタンの高さを含めてスクロール可能かどうか判断したいため

  const body = document.body;
  const isScrollable = body.scrollHeight > body.clientHeight;
  const screenWidth = window.innerWidth;
  const isScreenSMOrWider = screenWidth > 575.98;

  let hasHiddenContClass = false;
  delAllConts.forEach((btnCont) => {
    if (btnCont) {
      btnCont.classList.toggle("container", isScreenSMOrWider); //クイズ・下書き全削除ボタンをsm未満では画面幅いっぱいにするため
      hasHiddenContClass = btnCont.classList.contains("hidden-del-all-cont");
      toggleElem(btnCont, hasHiddenContClass);
    }
  });
  if (hasHiddenContClass) return;

  const delAllBtnClass =
    pageName === "createQuiz"
      ? ".del-all-quiz-drafts-btn"
      : ".del-all-quizzes-btn";
  const delAllBtns = document.querySelectorAll(delAllBtnClass);

  delAllBtns.forEach((delAllBtn) => {
    if (delAllBtn.classList.contains("visible-on-scrollable")) {
      toggleElem(delAllBtn, !isScrollable);
    } else if (delAllBtn.classList.contains("hidden-on-scrollable")) {
      toggleElem(delAllBtn, isScrollable);
    }
  });
}
