"use strict";
import { isNumNotNaN } from "./isNumNotNaN.js";

const storage = localStorage;
const QUIZZES_KEY = "quizzes";
const VOLUME_KEY = "volume";
const QUIZ_DRAFTS_KEY = "quizDrafts";

/**
 * @description 複数または一つのクイズを保存する
 * @param {Object<string, Quiz>} quizzes クイズのオブジェクトが集まったオブジェクト
 * @returns {void} なし
 */
export function saveQuizzesToStorage(quizzes) {
  storage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
}

/**
 * @description 保存されているすべてのクイズを取得する
 * @returns {Object<string, Quiz> | null} クイズのオブジェクトが集まったオブジェクト(見つからなかった場合はnull)
 */
export function getQuizzesFromStorage() {
  const quizzesJson = storage.getItem(QUIZZES_KEY);
  return JSON.parse(quizzesJson) || null;
}

/**
 * @description すべてのクイズを削除する(空のオブジェクトを保存する)
 * @returns {void} なし
 */
export function removeQuizzesFromStorage() {
  storage.setItem(QUIZZES_KEY, "{}");// 空のオブジェクトを入れて、リロード時にまたデフォルトのクイズが挿入されないようにする
}

/**
 * @description 一つのクイズを取得する
 * @param {`${string}-${string}-${string}-${string}-${string}`} id クイズのid
 * @returns {Quiz | {}} クイズのオブジェクト(存在しなければ空のオブジェクト)
 */
export function getQuizFromStorage(id) {
  const quizzes = getQuizzesFromStorage();
  return quizzes[id] || {};
}

/**
 * @description 一つのクイズを保存する
 * @param {Quiz} quiz クイズのオブジェクト
 * @returns {void} なし
 */
export function addQuizToStorage(quiz) {
  const quizzes = getQuizzesFromStorage();
  const quizId = quiz.id;
  if (!quizzes) {
    const qs = {};
    qs[quizId] = quiz;
    saveQuizzesToStorage(qs);
    return;
  }
  quizzes[quizId] = quiz;
  saveQuizzesToStorage(quizzes);
}

/**
 * @description 一つのクイズを削除する
 * @param {`${string}-${string}-${string}-${string}-${string}`} id クイズのid
 * @returns {void} なし
 */
export function removeQuizFromStorage(id) {
  const quizzes = getQuizzesFromStorage();
  if (quizzes?.hasOwnProperty(id)) {
    delete quizzes[id];
    saveQuizzesToStorage(quizzes);
  }
}

/**
 * @description 一つのクイズを更新する
 * @param {Quiz} updatedQuiz プロパティが更新されたクイズのオブジェクト
 * @returns {void} なし
 */
export function updateQuizToStorage(updatedQuiz) {
  const quizzes = getQuizzesFromStorage();
  const quizId = updatedQuiz.id;
  if (quizzes?.hasOwnProperty(quizId)) {
    quizzes[quizId] = updatedQuiz;
    saveQuizzesToStorage(quizzes);
  }
}

/**
 * @description 保存している音量を取得する
 * @returns {number | null} 音量(number以外であればnull)
 */
export function getVolumeFromStorage() {
  const volume = storage.getItem(VOLUME_KEY);
  const parsedVolume = parseFloat(volume);
  if (isNumNotNaN(parsedVolume)) {
    return parsedVolume;
  } else {
    return null;
  }
}

/**
 * @description 音量を記録する
 * @param {number} volume 0~1までの数字
 * @returns {void} なし
 */
export function setVolumeToStorage(volume) {
  storage.setItem(VOLUME_KEY, volume.toString());
}

/**
 * @description クイズの下書きを複数または一つ保存する
 * @param {Object<string, Quiz>} quizDrafts クイズの下書きの集まり
 * @returns {void} なし
 */
export function saveQuizDraftsToStorage(quizDrafts) {
  storage.setItem(QUIZ_DRAFTS_KEY, JSON.stringify(quizDrafts));
}

/**
 * @description クイズの下書きの集まりを取得する
 * @returns {Object<string, Quiz> | null} 下書きの集まり(なければnull)
 */
export function getQuizDraftsFromStorage() {
  const quizDrafts = storage.getItem(QUIZ_DRAFTS_KEY);
  return JSON.parse(quizDrafts) || null;
}

/**
 * @description クイズの下書きをすべて削除する(空のオブジェクトを保存する)
 */
export function removeQuizDraftsFromStorage() {
  storage.setItem(QUIZ_DRAFTS_KEY, "{}");// 空のオブジェクトを入れて、リロード時にまたデフォルトのクイズが挿入されないようにする
}

/**
 * @description 一つのクイズの下書きを取得する
 * @param {`${string}-${string}-${string}-${string}-${string}`} id クイズの下書きのid
 * @returns {Quiz | {}} クイズの下書きのオブジェクト(存在しなければ空のオブジェクト)
 */
export function getQuizDraftFromStorage(id) {
  const quizDrafts = getQuizDraftsFromStorage();
  return quizDrafts[id] || {};
}

/**
 * @description 一つのクイズの下書きを追加する
 * @param {Quiz} quizDraft クイズの下書きのオブジェクト
 * @returns {void} なし
 */
export function addQuizDraftToStorage(quizDraft) {
  const quizDrafts = getQuizDraftsFromStorage();
  const quizDraftId = quizDraft.id;
  if (!quizDrafts) {
    const qDs = {};
    qDs[quizDraftId] = quizDraft;
    saveQuizDraftsToStorage(qDs);
    return;
  }
  quizDrafts[quizDraftId] = quizDraft;
  saveQuizDraftsToStorage(quizDrafts);
}

/**
 * @description 一つのクイズの下書きを削除する
 * @param {`${string}-${string}-${string}-${string}-${string}`} id 
 * @returns {void} なし
 */
export function removeQuizDraftFromStorage(id) {
  const quizDrafts = getQuizDraftsFromStorage();
  if (quizDrafts?.hasOwnProperty(id)) {
    delete quizDrafts[id];
    saveQuizDraftsToStorage(quizDrafts);
  }
}

/**
 * @description 一つのクイズの下書きを更新する
 * @param {Quiz} updatedQuizDraft 更新されたクイズの下書きのオブジェクト
 * @returns {void} なし
 */
export function updateQuizDraftToStorage(updatedQuizDraft) {
  const quizDrafts = getQuizDraftsFromStorage();
  const quizDraftId = updatedQuizDraft.id;
  if (quizDrafts?.hasOwnProperty(quizDraftId)) {
    quizDrafts[quizDraftId] = updatedQuizDraft;
    saveQuizDraftsToStorage(quizDrafts);
  }
}
