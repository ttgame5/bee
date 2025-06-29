let currentWordList = [];
let currentIndex = 0;
const wordsPerPage = 5;

let timerInterval;
let timeLeft;
let initialTimerDuration;

// DOM Elements
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const wordDisplay = document.getElementById('word-display');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const csvSelect = document.getElementById('csv-select');
const timerDurationInput = document.getElementById('timer-duration');
const startGameBtn = document.getElementById('start-game-btn');
const stopGameBtn = document.getElementById('stop-game-btn');
const timerDisplay = document.getElementById('timer-display');

// Alarm sound placeholder
const alarmSound = new Audio();
// IMPORTANT: Update this path to your actual sound file (e.g., 'alarm.mp3', 'alarm.wav')
// Make sure the audio file is in the same directory as your HTML/JS, or provide a full path.
// If you don't have an audio file, you can comment out the alarm related lines or set alarmSound.src = '';
alarmSound.src = 'timer_tick.mp3'; // <--- CHANGE THIS TO YOUR SOUND FILE

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ASYNC function to load words from CSV
async function loadAndShuffleWords(fileName) {
    try {
        wordDisplay.innerHTML = '<p>Loading words...</p>'; // Show loading message
        const response = await fetch(fileName);
        if (!response.ok) {
            throw new Error(`Network response was not ok. Status: ${response.status}. Ensure '${fileName}' is in the same folder and served by a web server.`);
        }
        const csvText = await response.text();

        // Assuming single column CSV, one word per line.
        // Split by newline, trim whitespace, filter empty lines.
        let words = csvText.split('\n').map(word => word.trim()).filter(word => word.length > 0);

        // Check if the first word matches a common header "wordlist" (case-insensitive)
        // If your CSV does not have a header or has a different one, adjust this logic.
        if (words.length > 0 && words[0].toLowerCase() === 'wordlist') {
            words = words.slice(1); // Remove the header
        }

        currentWordList = [...words];
        if (currentWordList.length === 0) {
            wordDisplay.innerHTML = '<p>No words found in the selected file. Check CSV format.</p>';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            stopGame(); // Go back to setup if no words loaded
            return;
        }
        shuffleArray(currentWordList);
        currentIndex = 0; // Reset index when new list is loaded
        displayWords();
    } catch (error) {
        console.error("Failed to load words:", error);
        wordDisplay.innerHTML = `<p style="color: red;">Error loading word list: ${error.message}.</p><p>Please ensure files are served by a local web server.</p>`;
        currentWordList = [];
        stopGame(); // Go back to setup on error
    }
}

function displayWords() {
    wordDisplay.innerHTML = ''; // Clear previous words
    const startIndex = currentIndex;
    const endIndex = Math.min(currentIndex + wordsPerPage, currentWordList.length);

    if (currentWordList.length === 0) {
        wordDisplay.innerHTML = '<p>No words to display. Select a list and start game.</p>';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    for (let i = startIndex; i < endIndex; i++) {
        const p = document.createElement('p');
        p.textContent = currentWordList[i];
        wordDisplay.appendChild(p);
    }

    // Enable/disable navigation buttons
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex + wordsPerPage >= currentWordList.length;
}

function startTimer() {
    clearInterval(timerInterval); // Clear any existing timer
    initialTimerDuration = parseInt(timerDurationInput.value);
    if (isNaN(initialTimerDuration) || initialTimerDuration < 5) {
        initialTimerDuration = 10; // Default to 10 if invalid
        timerDurationInput.value = 10;
    }
    timeLeft = initialTimerDuration;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft === 5) { // Alarm 5 seconds before end
            playAlarmSound();
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.textContent = "Time's Up! Click Next for new words."; // Indicate time is up, prompt for next
            // DO NOT CALL moveToNextWords() here
        }
    }, 1000); // Update every second
}

function resetTimer() {
    clearInterval(timerInterval);
    timeLeft = parseInt(timerDurationInput.value); // Reset to initial duration
    updateTimerDisplay();
}

function updateTimerDisplay() {
    timerDisplay.textContent = `Time: ${timeLeft}s`;
}

function playAlarmSound() {
    // Only play if a valid sound source is set (not the placeholder)
    if (alarmSound.src && alarmSound.src.includes('timer_tick.mp3') === false) {
        alarmSound.currentTime = 0; // Rewind to start if already playing
        alarmSound.play().catch(e => console.error("Error playing sound:", e));
    } else {
        console.warn("Alarm sound not configured or file 'timer_tick.mp3' missing. Please update alarmSound.src in script.js.");
    }
}

function moveToNextWords() {
    if (currentIndex + wordsPerPage < currentWordList.length) {
        currentIndex += wordsPerPage;
        displayWords();
        startTimer(); // Restart timer for new words
    } else {
        timerDisplay.textContent = "End of list! No more words.";
        clearInterval(timerInterval);
        nextBtn.disabled = true; // Disable next button permanently
    }
}

function moveToPreviousWords() {
    if (currentIndex > 0) {
        currentIndex -= wordsPerPage;
        displayWords();
        startTimer(); // Restart timer for new words
    }
}

async function startGame() {
    setupScreen.style.display = 'none';
    gameScreen.style.display = 'flex'; // Use flex to maintain column layout
    await loadAndShuffleWords(csvSelect.value); // Await word loading
    if (currentWordList.length > 0) { // Only start timer if words were loaded successfully
        startTimer();
    }
}

function stopGame() {
    clearInterval(timerInterval);
    setupScreen.style.display = 'flex'; // Show setup screen
    gameScreen.style.display = 'none'; // Hide game screen
    currentIndex = 0; // Reset game state
    wordDisplay.innerHTML = '';
    timerDisplay.textContent = "Ready!";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
}


// Event Listeners
startGameBtn.addEventListener('click', startGame);
stopGameBtn.addEventListener('click', stopGame);

nextBtn.addEventListener('click', () => {
    // This will now only advance words if clicked, and will restart the timer
    // if there are new words to show.
    moveToNextWords();
});

prevBtn.addEventListener('click', () => {
    // This will advance to previous words if clicked, and will restart the timer.
    moveToPreviousWords();
});

// Initial setup on page load
stopGame(); // Ensure only setup screen is visible initially
