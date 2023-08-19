"use strict";
const storage = localStorage;
const QUIZZES_KEY = "quizzes";
const VOLUME_KEY = "volume";
const QUIZ_DRAFTS_KEY = "quizDrafts";

export function saveQuizzesToStorage(quizzes) {
  storage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
}

/**
 *
 * @returns {Object<string, Quiz> | null} クイズのオブジェクト(見つからなかった場合はnull)
 */
export function getQuizzesFromStorage() {
  const quizzesJson = storage.getItem(QUIZZES_KEY);
  return JSON.parse(quizzesJson) || null;
}

export function removeQuizzes() {
  storage.removeItem(QUIZZES_KEY);
}

/**
 *
 * @returns {Quiz | null}
 */
export function getQuizFromStorage(id) {
  const quizzes = getQuizzesFromStorage();
  return quizzes[id] || null;
}

export function addQuizToStorage(id, quiz) {
  const quizzes = getQuizzesFromStorage();
  if (!quizzes) {
    const qs = {};
    qs[id] = quiz;
    saveQuizzesToStorage(qs);
    return;
  }
  quizzes[id] = quiz;
  saveQuizzesToStorage(quizzes);
}

export function removeQuizFromStorage(id) {
  const quizzes = getQuizzesFromStorage();
  if (quizzes?.hasOwnProperty(id)) {
    delete quizzes[id];
    saveQuizzesToStorage(quizzes);
  }
}

export function updateQuizToStorage(id, updatedQuiz) {
  const quizzes = getQuizzesFromStorage();

  if (quizzes.hasOwnProperty(id)) {
    quizzes[id] = updatedQuiz;
    saveQuizzesToStorage(quizzes);
  }
}

export function getVolumeFromStorage() {
  const volume = storage.getItem(VOLUME_KEY);
  return parseFloat(volume) ?? null;
}

/**
 *
 * @param {number} volume 0~1までの数字
 */
export function setVolumeToStorage(volume) {
  storage.setItem(VOLUME_KEY, volume.toString());
}

export function saveQuizDraftsToStorage(quizDrafts) {
  storage.setItem(QUIZ_DRAFTS_KEY, JSON.stringify(quizDrafts));
}

/**
 *
 * @returns {Object<string, Quiz> | null}
 */
export function getQuizDraftsFromStorage() {
  const quizDrafts = storage.getItem(QUIZ_DRAFTS_KEY);
  return JSON.parse(quizDrafts) || null;
}

export function removeQuizDraftsFromStorage() {
  storage.removeItem(QUIZ_DRAFTS_KEY);
}

/**
 *
 * @param {string} id
 * @returns {Quiz | null}
 */
export function getQuizDraftFromStorage(id) {
  const quizDrafts = getQuizDraftsFromStorage();
  return quizDrafts[id] || null;
}

export function addQuizDraftToStorage(id, quiz) {
  const quizDrafts = getQuizDraftsFromStorage();
  if (!quizDrafts) {
    const qDs = {};
    qDs[id] = quiz;
    saveQuizDraftsToStorage(qDs);
    return;
  }
  quizDrafts[id] = quiz;
  saveQuizDraftsToStorage(quizDrafts);
}

export function removeQuizDraftFromStorage(id) {
  const quizDrafts = getQuizDraftsFromStorage();
  if (quizDrafts?.hasOwnProperty(id)) {
    delete quizDrafts[id];
    saveQuizDraftsToStorage(quizDrafts);
  }
}

export function updateQuizDraftToStorage(id, updatedQuizDraft) {
  const quizDrafts = getQuizDraftsFromStorage();

  if (quizDrafts.hasOwnProperty(id)) {
    quizDrafts[id] = updatedQuizDraft;
    saveQuizDraftsToStorage(quizDrafts);
  }
}
