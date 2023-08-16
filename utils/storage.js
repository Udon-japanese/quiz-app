"use strict";
const storage = localStorage;

export function saveQuizzesToStorage(quizzes) {
  storage.setItem("quizzes", JSON.stringify(quizzes));
}

/**
 * 
 * @returns {Object<string, Quiz> | {}} クイズのオブジェクト(見つからなかった場合は空のオブジェクト)
 */
export function getQuizzesFromStorage() {
  const quizzesJson = storage.getItem("quizzes");
  return JSON.parse(quizzesJson) || {};
}

export function addQuizToStorage(id, quiz) {
  const quizzes = getQuizzesFromStorage();
  quizzes[id]  = quiz;
  saveQuizzesToStorage(quizzes);
}

export function getQuizFromStorage(id) {
  const quizzes = getQuizzesFromStorage();
  return quizzes[id] || {};
}

export function removeQuiz(id) {
  const quizzes = getQuizzesFromStorage();
  if (quizzes.hasOwnProperty(id)) {
    delete quizzes[id];
    saveQuizzesToStorage(quizzes);
  }
}

export function removeQuizzes() {
  storage.removeItem("quizzes");
}

function updateQuizToStorage(id, updatedQuiz) {
  const quizzes = getQuizzesFromStorage();
  
  if (quizzes.hasOwnProperty(id)) {
    quizzes[id] = updatedQuiz;
    saveQuizzesToStorage(quizzes);
  }
}
