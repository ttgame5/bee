document.addEventListener('DOMContentLoaded', () => {
	// DOM Elements
	const setupContainer = document.getElementById('setup-container');
	const mainGameContainer = document.getElementById('main-game');
	const resultsContainer = document.getElementById('results-container');
	const timerInput = document.getElementById('timer-input');
	const startSetupBtn = document.getElementById('start-setup-btn');
	const timerDisplay = document.getElementById('timer-display');
	const keywordsDisplay = document.getElementById('keywords-display');
	const resultsDisplay = document.getElementById('results-display');
	const pauseBtn = document.getElementById('pause-btn');
	const stopBtn = document.getElementById('stop-btn');
	const continueBtn = document.getElementById('continue-btn');
	const newGameBtn = document.getElementById('new-game-btn');
	const controlsDiv = document.querySelector('.main-game .controls');
	
	// Disable start button until words are loaded to prevent a race condition
	startSetupBtn.disabled = true;
	startSetupBtn.textContent = 'வார்த்தைகளை ஏற்றுகிறது...';
	
	
	// Game State
	let allWords = [];
	let gameWords = [];
	let availableWords = [];
	let timerId = null;
	let timeLeft = 0;
	let isPaused = false;
	let originalTime = 0;
	let clueButton;
	const countdownSound = new Audio('timer_tick.mp3');
	
	/**
	 * Fetches and parses word data from the CSV file.
	 */
	async function loadWords() {
	    try {
		const response = await fetch('tamil_word_game_combined-upd.csv');
		if (!response.ok) {
		    throw new Error('Network response was not ok.');
		}
		const csvText = await response.text();
		allWords = csvText.trim().split('\n').slice(1).map(line => {
		    const columns = line.split(',');
		    return {
			category: columns.length > 0 ? columns.shift() : '',
			keyword: columns.length > 0 ? columns.shift() : '',
			clues: columns
		    };
		});
		if (allWords.length === 0) throw new Error("CSV file is empty or could not be parsed.");
	
	
		// Re-enable the start button now that words are loaded
		startSetupBtn.disabled = false;
		startSetupBtn.textContent = 'விளையாட்டைத் தொடங்கு';
	
	    } catch (error) {
		console.error('Error loading or parsing CSV file:', error);
		document.body.innerHTML = `<div style="text-align: center; padding: 2rem;"><h1>Error</h1><p>வார்த்தை கோப்பை ஏற்றுவதில் பிழை. 'tamil_word_game_combined-upd.csv' கோப்பு இதே போல்டரில் உள்ளதா என சரிபார்க்கவும்.</p></div>`;
	    }
	}
	
	/**
	 * Shuffles an array in place using the Fisher-Yates algorithm.
	 */
	function shuffleArray(array) {
	    for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	    }
	}
	
	/**
	 * Set up and start a new round
	 */
	function startNewRound() {
	    timeLeft = originalTime;
	    isPaused = false;
	    pauseBtn.textContent = 'இடைநிறுத்து';
	    pauseBtn.style.display = 'inline-block';
	    stopBtn.style.display = 'inline-block';
	
	    if (availableWords.length < 5) {
		console.log("Not enough unique words remaining. Reshuffling master list.");
		availableWords = [...allWords];
		shuffleArray(availableWords);
	    }
	    gameWords = availableWords.splice(0, 5);
	
	    keywordsDisplay.innerHTML = '';
	    gameWords.forEach(({ keyword }) => {
		const card = document.createElement('div');
		card.className = 'keyword-card';
		card.textContent = keyword;
		keywordsDisplay.appendChild(card);
	    });
	
	    updateTimer();
	    setupContainer.style.display = 'none';
	    resultsContainer.style.display = 'none';
	    mainGameContainer.style.display = 'block';
	
	    if (!clueButton) {
		clueButton = document.createElement('button');
		clueButton.id = 'show-clues-btn';
		clueButton.textContent = 'குறிப்புகள் / பதில்களைக் காட்டு';
		clueButton.addEventListener('click', showResults);
		controlsDiv.appendChild(clueButton);
	    }
	    clueButton.style.display = 'none';
	    startTimer();
	}
	
	function updateTimer() {
	    const minutes = Math.floor(timeLeft / 60);
	    const seconds = timeLeft % 60;
	    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	    if (timeLeft <= 5 && timeLeft > 0 && !isPaused) {
		countdownSound.play().catch(error => console.error("Error playing sound:", error));
	    } else if (timeLeft == 0) {
		countdownSound.pause();
		countdownSound.currentTime = 0;
	    }
	}
	
	function startTimer() {
	    if (timerId) clearInterval(timerId);
	    timerId = setInterval(() => {
		if (!isPaused) {
		    timeLeft--;
		    updateTimer();
		    if (timeLeft <= 0) {
			endGame();
		    }
		}
	    }, 1000);
	}
	
	function showResults() {
	    clearInterval(timerId);
	    timerId = null;
	    resultsDisplay.innerHTML = '';
	    gameWords.forEach(({ keyword, clues }) => {
		const item = document.createElement('div');
		item.className = 'result-item';
		item.innerHTML = `<p class="keyword">வார்த்தை: ${keyword}</p><p class="clues">குறிப்புகள்: ${clues.join(', ')}</p>`;
		resultsDisplay.appendChild(item);
	    });
	    mainGameContainer.style.display = 'none';
	    resultsContainer.style.display = 'block';
	}
	
	function endGame() {
	    clearInterval(timerId);
	    timerId = null;
	    timeLeft = 0;
	    updateTimer();
	    pauseBtn.style.display = 'none';
	    stopBtn.style.display = 'none';
	    if (clueButton) {
		clueButton.style.display = 'inline-block';
	    }
	}
	
	// Event Listeners
	startSetupBtn.addEventListener('click', () => {
	    originalTime = parseInt(timerInput.value, 10);
	    if (isNaN(originalTime) || originalTime <= 0) {
		alert('தயவுசெய்து சரியான நேரத்தை உள்ளிடவும்.');
		return;
	    }
	    availableWords = [...allWords];
	    shuffleArray(availableWords);
	    startNewRound();
	});
	
	pauseBtn.addEventListener('click', () => {
	    isPaused = !isPaused;
	    pauseBtn.textContent = isPaused ? 'தொடரவும்' : 'இடைநிறுத்து';
	});
	
	stopBtn.addEventListener('click', () => {
	    endGame();
	});
	
	continueBtn.addEventListener('click', () => {
	    startNewRound();
	});
	
	newGameBtn.addEventListener('click', () => {
	    resultsContainer.style.display = 'none';
	    mainGameContainer.style.display = 'none';
	    setupContainer.style.display = 'flex';
	});
	
	// Initial load
	loadWords();
});

// A robust way to ensure the script runs after the DOM is loaded.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        document.dispatchEvent(new Event('documentReady'));
    });
} else {
    document.dispatchEvent(new Event('documentReady'));
}
