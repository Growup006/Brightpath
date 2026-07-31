// ─── DATA LOADER ───
// The curriculum content (chapters, notes, quizzes, practice questions, tests)
// used to be embedded directly inside the single HTML file. It now lives in
// separate JSON files under data/ so it's easier to find, edit, and version.
//
// This loads them with a *synchronous* XHR request, on purpose: every other
// script in this app was written assuming NCERT_CHAPTERS, QUIZ_BANK, etc.
// already exist as soon as the page's scripts start running (nothing here
// awaits a promise). Loading them synchronously, right at the top, keeps
// that assumption true without having to rewire the rest of the app.
// This only works when the site is served over http(s):// (e.g. through
// your Express server) — opening index.html directly as a file:// URL will
// block these requests.
function loadJSONSync(path) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', path, false); // false = synchronous
  xhr.send(null);
  if (xhr.status !== 200 && xhr.status !== 0) {
    console.error('BrightPath: failed to load ' + path + ' (status ' + xhr.status + ')');
    return {};
  }
  return JSON.parse(xhr.responseText);
}

var NCERT_CHAPTERS = loadJSONSync('data/ncert-chapters.json');
var CBSE_TEST_BANK = loadJSONSync('data/cbse-test-bank.json');
var WORD_PROBLEMS = loadJSONSync('data/word-problems.json');
var CHAPTER_NOTES = loadJSONSync('data/chapter-notes.json');
var GAMIFIED_NOTES = loadJSONSync('data/gamified-notes.json');
var QUIZ_BANK = loadJSONSync('data/quiz-bank.json');
var PRACTICE_BANK = loadJSONSync('data/practice-bank.json');
