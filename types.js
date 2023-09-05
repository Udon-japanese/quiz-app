"use strict";
// 型情報
/**
 * @typedef {Object} QuizOption
 * @property {number} [timer] クイズのタイマー設定（秒）
 * @property {string[]} [tf] マルバツクイズ(True or False quiz)の選択肢
 */
/**
 * @typedef {Object} QuestionOption
 * @property {string} [explanation] 問題の解説
 */
/**
 * @typedef {Object} Question
 * @property {"select" | "select-all" | "type-text"} answerType - 回答形式
 * @property {string} statement 質問文
 * @property {Array<Object<string, string>>} [choices] 選択肢（select/select-all の場合, 選択肢のuUIDをキー、選択肢のテキストを値に持つオブジェクトの配列）
 * @property {string} [correctAnswer] 正解の回答(selectの場合は選択肢のUUID, type-textの場合は正解のテキスト)
 * @property {string[]} [correctAnswers] 正解の回答（select-all の場合、選択肢のUUIDの配列）
 * @property {QuestionOption} options 問題のオプション
 */
/**
 * @typedef {Object} Quiz
 * @property {string} id クイズのid
 * @property {string} title クイズのタイトル
 * @property {string} description クイズの説明
 * @property {string} length 問題数
 * @property {QuizOption} options クイズのオプション
 * @property {Object<string, Question>} questions クイズの質問
 */

/**
 * @typedef {"quizList" | "createQuiz" | "top" | "quiz"} Page
 */