
const contentArea = document.getElementById('content');
const equationArea = document.getElementById('equation-content');
const equationMsgArea = document.getElementById('equation-msg');
const scoreArea = document.getElementById('score-pnt');
const infoWindow = document.getElementById('overlay-info');
const scoreWindow = document.getElementById('overlay-score');

const classVisited = 'visited'

let equation = '';
const startCell = document.getElementById('-1_0');
const lastCell = document.getElementById(size + '_' + (size-1));
const arrVisited = [startCell];
let isReachGoal = false;

/*** Set event listener ***/
infoWindow.addEventListener("click", function(e) {
  infoWindow.classList.remove('is-open');
})

scoreWindow.addEventListener("click", function(e) {
  scoreWindow.classList.remove('is-open');
})

contentArea.addEventListener("mousemove", function(e) {
  moveAction(e.target);
})

contentArea.addEventListener("touchmove", function(e) {
  var myLocation = e.changedTouches[0];
  var realTarget = document.elementFromPoint(myLocation.clientX, myLocation.clientY);
  moveAction(realTarget);
})


/*** init ***/
function getJson() {
  const p = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/js/data.json');
    xhr.addEventListener('load', (e) => resolve(xhr.response));
    xhr.responseType = 'json';
    xhr.send();
  });

  return p;
}

async function loadJson(today) {
  const response = await getJson();
  let data = JSON.parse(JSON.stringify(response));
  data = data[today];

  if (size == 4) {
    question = data.normal.question;
    answer = data.normal.answer;
  } else {
    question = data.hard.question;
    answer = data.hard.answer;
  }

  /* question */
  for (let i=0; i < size; i++) {
    for (let j=0; j < size; j++) {
      document.getElementById(i + '_' + j).textContent = question[i].charAt(j);
    }
  }

  /* hints */
  document.getElementById('hint1').addEventListener("click", function(e) {
    showHint(Math.trunc(size * size / 5 * 1))
  })
  document.getElementById('hint2').addEventListener("click", function(e) {
    showHint(Math.trunc(size * size / 5 * 2))
  })
  document.getElementById('hint3').addEventListener("click", function(e) {
    showHint(Math.trunc(size * size / 5 * 3))
  })

}


function init() {
  const lastdate = getCookie('lastdate');
  const today = moment().tz('Asia/Tokyo').format('YYYY.MM.DD');
  loadJson(today);

  document.getElementById('today').textContent = today;

  if (lastdate == '') infoWindow.classList.add('is-open');
  if (lastdate != today) {
    setCookie('lastdate', today, 30);
    setTodayScore(0);
    setCookie('useHint', 0);
  }
  initScore();
}

init();


/****************************************************
 * main content
 ****************************************************/
async function moveAction(elem) {
  if (elem.tagName == 'TD' && isBordering(elem)) {
    const score = arrVisited.length;
    toggleVisited(elem);
    if (!isReachGoal) {
      equationArea.textContent = equation;
      equationMsgArea.textContent = '';
      scoreArea.textContent = score;
    }

    // goal
    if (elem.id == (size-1) + '_' + (size-1)) {
      isReachGoal = true;
      addDirection(lastCell);
      const ans = calcEquation();
      equationArea.textContent = equation + ' = ' + ans;
      // When cleared
      if (ans == 10) {
        if (updateScore(score)) {
          await sleep(300);
          scoreWindow.classList.add('is-open');
        }
      }
    }
  }
}

/*** css change ***/
function toggleVisited(elem) {
  if (elem.classList.contains(classVisited)) {
    elem = arrVisited.pop();
    removeDirection(elem);
    equation = equation.substring(0, equation.length - 1);
    isReachGoal = false;
  } else if (!isReachGoal) {
    elem.classList.add(classVisited);
    addDirection(elem);
    arrVisited.push(elem);
    equation = equation + elem.textContent;
  }
}

function isBordering(elem) {
  id = elem.id.split('_').map(x => x - 0);;
  if (arrVisited.length == 0) return (id[0] == 0 && id[1] == 0)

  const preElem = arrVisited[arrVisited.length - 1];
  preId = preElem.id.split('_');
  return (Math.abs(id[0] - 0 - preId[0]) + Math.abs(id[1] - 0 - preId[1]) == 1)
}

function addDirection(elem) {
  id = elem.id.split('_').map(x => x - 0);
  if (arrVisited.length <= 1) {
    return;
  }

  const preElem = arrVisited[arrVisited.length - 1];
  const prePreElem = arrVisited[arrVisited.length - 2];
  preId = preElem.id.split('_').map(x => x - 0);
  prePreId = prePreElem.id.split('_').map(x => x - 0);
  directions = [
    // 0:L, 1:U, 3:D, 4:R
    (id[0] - preId[0]) + (id[1] - preId[1]) * 2 + 2,
    (prePreId[0] - preId[0]) + (prePreId[1] - preId[1]) * 2 + 2,
  ]
  directions.sort();
  const ret = 'LU_DR'.charAt(directions[0]) + 'LU_DR'.charAt(directions[1])

  preElem.classList.add('l-' + ret);
}

function removeDirection(elem) {
  elem.setAttribute('class', '');

  if (arrVisited.length == 0) {
    return;
  }

  const preElem = arrVisited[arrVisited.length - 1];
  preElem.setAttribute('class', '');
  preElem.classList.add(classVisited);
}


/*** score ***/
function updateScore(score) {
  /* クリア時にスコアを書き換える */
  const todayScore = getTodayScore();
  const diffMsg = getDiffMsg(score);

  /* main-content */
  document.getElementById('score-pnt').textContent = score;
  document.getElementById('equation-msg').textContent = diffMsg;

  /* overlay-score */
  if (score > todayScore) {
    document.getElementById('today-score-pnt').textContent = score;
    document.getElementById('today-score-msg').textContent = diffMsg;
    setTodayScore(score);
    setTweetText();
    return true;

  } else {
    return false;
  }
}


function initScore() {
  /* 読み込み時にスコアを読んで表示する */
  const todayScore = getTodayScore();
  const diffMsg = getDiffMsg(todayScore);

  /* main-content */
  document.getElementById('score-pnt').textContent = 0;
  document.getElementById('equation-msg').textContent = '';

  /* overlay-score */
  document.getElementById('today-score-pnt').textContent = todayScore;
  document.getElementById('today-score-msg').textContent = diffMsg;
  setTweetText();
}


function getTodayScore() {
  if (size == 5) {
    return getCookie('score-hard', 0);
  } else {
    return getCookie('score-normal', 0)
  }
}


function setTodayScore(score) {
  if (size == 5) {
    setCookie('score-hard', score);
  } else {
    setCookie('score-normal', score)
  }
}


/*** hints ***/
async function showHint(hintSize) {
  scoreWindow.classList.remove('is-open');
  restart();

  // hint表示
  for (const x of answer.slice(0, hintSize)) {
    await sleep(300);
    const i = Math.floor(x / size);
    const j = x % size;
    const elem = document.getElementById(i + '_' + j);
    moveAction(elem);
    // if (len > 0 && arrVisited.length-1 >= len) break;
  }
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));


/*** button function ***/
function restart() {
  let elem;
  while (arrVisited.length > 0) {
    elem = arrVisited.pop();
    elem.setAttribute('class', '');
  }
  arrVisited.push(startCell);
  equation = '';
  equationArea.textContent = '';
  equationMsgArea.textContent = '';
  scoreArea.textContent = 0;
  isReachGoal = false;
}


function openInfo() {
  infoWindow.classList.add('is-open');
}

function openScore() {
  scoreWindow.classList.add('is-open');
}


/*** lib ***/
function getCookie(key, defaultValue='') {
  var cookies = document.cookie;
  var cookiesArray = cookies.split(';');

  for(var c of cookiesArray){
    var cArray = c.trim().split('=');
    if( cArray[0] == key) {
      return cArray[1];
    }
  }
  return defaultValue;
}


function setCookie(key, value, maxDay=0) {
  const exp = moment().add(maxDay, 'days').tz('Asia/Tokyo').format('ddd, DD MMM YYYY') + ' 15:00:00 GMT';
  document.cookie = key + '=' + value + '; Domain=10puzzle.tk; expires=' + exp;
  // document.cookie = key + '=' + value + '; Domain=localhost; expires=' + exp;
}


function getBitFlg(diff) {
  let x = 1;
  if (diff == 'diff2') x <<= 1;
  else if (diff == 'diff3') x <<= 2;

  if (size == 5) x <<= 3;
  return x;
}


function calcEquation() {
  try {
    const ans = eval(equation.replace(/＋/g, '+').replace(/－/g, '-').replace(/×/g, '*').replace(/÷/g, '/'));
    return Math.round(ans * 1000) / 1000;
  } catch (error) {
    return ''
  }
}


function getDifficulty(score) {
  if (score == 0) return 'diff0';
  if (size == 5) {
    if (score <= 11) return 'diff1'
    else if (score <= 17) return 'diff2'
    else if (score <= 23) return 'diff3'
    else return 'diff4'
  } else if (size == 4) {
    if (score <= 7) return 'diff1'
    else if (score <= 11) return 'diff2'
    else if (score <= 13) return 'diff3'
    else return 'diff4'
  }
}


function getDiffMsg(score) {
  const diff = getDifficulty(score);
  switch (diff) {
    case 'diff0':
      return 'Try it!';
    case 'diff1':
      return 'Good!';
    case 'diff2':
      return 'Great!';
    case 'diff3':
      return 'Excellent!';
    case 'diff4':
      return 'Awesome!'
    default:
      return '';
  }
}


function setTweetText() {
  const crlf = '%0a';
  const link1 = 'https://twitter.com/intent/tweet?text=';
  const link2 = '%0ahttps%3A%2F%2F10puzzle.tk%2F%0a&hashtags=10パズル迷路';
  const link2_hard = '%0ahttps%3A%2F%2F10puzzle.tk%2Fhard%2F%0a&hashtags=10パズル迷路';

  let text;
  const score = getTodayScore();
  if (score == 0) text = '今日の問題にチャレンジ！';

  else {
    text = getCookie('lastdate') + crlf;
    if (size == 5) text += 'HARDモード' + crlf;
    text += 'Score: ' + score + ' / ' + (size == 4 ? 15 : 25);
  }

  let buttonTwitter = document.getElementById('link-twitter');
  if (size == 4) {
    buttonTwitter.setAttribute('href', link1 + text + link2);
  } else {
    buttonTwitter.setAttribute('href', link1 + text + link2_hard);
  }
}
