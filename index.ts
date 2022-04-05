let activeGameId = null;
let lastGameIds = [];
let lastRecievedData = null;
let radioOpen = false;

// The first call seems to not get the voices. Pre-load them.
window.speechSynthesis.getVoices();

const msg = new SpeechSynthesisUtterance();

const handleMessage = message => {
  const data = JSON.parse(message.data);
  lastRecievedData = data;

  updateRadioUI(data);

  if (activeGameId) {
    playLatestMessage(data, activeGameId);
  }
};

const toggleRadioOpen = () => radioOpen = !radioOpen;

const getLiveGames = data => data.value.games.schedule.filter(game => !game.gameComplete);

const findGame = (data, gameId) => data.value.games.schedule.find(game => game.id === gameId);

const playLatestMessage = (data, gameId) => {
  const message = findGame(data, gameId).lastUpdate;

  msg.voice = window.speechSynthesis.getVoices()[0];
  msg.text = message;
  window.speechSynthesis.speak(msg);
}

const setactiveGameId = gameId => {
  activeGameId = gameId;
  rebuildGameUI(getLiveGames(lastRecievedData));
  playLatestMessage(lastRecievedData, gameId);
}

// UI

const updateRadioUI = data => {
  const liveGames = getLiveGames(data);
  const gameIds = liveGames.map(game => game.id);

  if (lastGameIds.sort().join(',') !== gameIds.sort().join(',')) {
    rebuildGameUI(liveGames);
    lastGameIds = gameIds;
  }
}

const rebuildGameUI = games => {
  const radioElement = document.createElement('div');
  radioElement.className = radioOpen ? '' : 'closed';

  radioElement.id = 'radio';
  radioElement.innerHTML = `
    <h4 id="radio-title">Blaseball radio</h4>
    ${renderGames(games)}
  `;

  const radioEl = document.getElementById('radio');
  if (radioEl) {
    radioEl.remove();
  }

  document.getElementsByClassName('Main')[0].after(radioElement);

  document.getElementById('radio-title').addEventListener('click', e => {
    toggleRadioOpen();
    rebuildGameUI(getLiveGames(lastRecievedData));
  });

  document.getElementById('radio').addEventListener('click', e => {
    if (![...e.target.classList].includes('radio-game-button')) {
      return;
    }

    setactiveGameId(e.target.dataset.gameId);
  });
}

const renderGames = games => {
  if (games.length === 0) {
    return (`
      <p>No live games</div>
    `)
  }

  return games.map(game => {
    let classname = 'radio-game-button';
    if (game.id === activeGameId) {
      classname += ' active';
    }

    return (`
      <div class="${classname}" data-game-id="${game.id}">
        ${game.homeTeamNickname} vs. ${game.awayTeamNickname}
      </div>
    `)
  }).join('');
}

// Ui

var source = new EventSource('https://www.blaseball.com/events/streamData');
source.onmessage = handleMessage;

