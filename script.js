document.addEventListener('DOMContentLoaded', () => {
    const politicians = [
        { name: "Mile", img: "images/dodik.png", sound: "audio/dodik.mp3" },
        { name: "Čova", img: "images/covic.png", sound: "audio/covic.mp3" },
        { name: "Bake", img: "images/bakir.png", sound: "audio/bakir.mp3" },
        { name: "Dino", img: "images/konakovic.png", sound: "audio/konakovic.mp3" },
        { name: "Nera", img: "images/niksic.png", sound: "audio/niksic.mp3" }
        // { name: "Semir Efendić", img: "images/efendic.png", sound: "audio/efendic.mp3" }
    ];

    let chosenIndex = 0;
    let score = 0;
    let timeLeft = 60;
    let gameInterval;
    let moleTimer;
    let isPlaying = false;
    let lastHole = null;
    let currentLimit = 10;

    // Ekrani
    const welcomeScreen = document.getElementById('welcome-screen');
    const selectionScreen = document.getElementById('selection-screen');
    const gameScreen = document.getElementById('game-screen');
    
    // Dugmad menija
    const goToSelectionBtn = document.getElementById('go-to-selection-btn');
    const welcomeLeaderboardBtn = document.getElementById('welcome-leaderboard-btn');
    const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
    const startBtn = document.getElementById('start-btn');
    
    // HUD elementi
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const chosenNameDisplay = document.getElementById('chosen-name');
    const holes = document.querySelectorAll('.hole');

    // Modal i Rang-lista
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const scoresTbody = document.getElementById('scores-tbody');
    
    const tab10Btn = document.getElementById('tab-10');
    const tab100Btn = document.getElementById('tab-100');

    // Modal za unos imena
    const saveScoreModal = document.getElementById('save-score-modal');
    const modalGameoverTitle = document.getElementById('modal-gameover-title');
    const modalGameoverReason = document.getElementById('modal-gameover-reason');
    const modalFinalScore = document.getElementById('modal-final-score');
    const playerNameInput = document.getElementById('player-name-input');
    const submitScoreBtn = document.getElementById('submit-score-btn');
    const cancelScoreBtn = document.getElementById('cancel-score-btn');

    // Web Audio API zvuci
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playSound(type) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'hit') {
            osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'fail') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.4);
        }
    }

    function playPoliticianSound(soundPath, onEndedCallback) {
        if (!soundPath) {
            if (onEndedCallback) onEndedCallback();
            return;
        }
        const audio = new Audio(soundPath);
        audio.volume = 0.9;

        audio.onended = () => {
            if (onEndedCallback) onEndedCallback();
        };

        audio.play().catch(err => {
            console.log("Pretraživač je blokirao automatsku reprodukciju zvuka:", err);
            if (onEndedCallback) onEndedCallback();
        });
    }

    // Navigacija kroz menije
    goToSelectionBtn.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');
        selectionScreen.classList.remove('hidden');
    });

    if (backToWelcomeBtn) {
        backToWelcomeBtn.addEventListener('click', () => {
            selectionScreen.classList.add('hidden');
            welcomeScreen.classList.remove('hidden');
        });
    }

    welcomeLeaderboardBtn.addEventListener('click', () => {
        leaderboardModal.classList.remove('hidden');
        fetchScores(currentLimit);
    });

    closeModalBtn.addEventListener('click', () => {
        leaderboardModal.classList.add('hidden');
    });

    if (tab10Btn && tab100Btn) {
        tab10Btn.addEventListener('click', () => {
            currentLimit = 10;
            tab10Btn.classList.remove('secondary-btn');
            tab100Btn.classList.add('secondary-btn');
            fetchScores(10);
        });

        tab100Btn.addEventListener('click', () => {
            currentLimit = 100;
            tab100Btn.classList.remove('secondary-btn');
            tab10Btn.classList.add('secondary-btn');
            fetchScores(100);
        });
    }

    startBtn.addEventListener('click', startGame);

    function startGame() {
        const radios = document.getElementsByName('chosen');
        for (let r of radios) {
            if (r.checked) chosenIndex = parseInt(r.value);
        }

        chosenNameDisplay.textContent = politicians[chosenIndex].name;
        
        welcomeScreen.classList.add('hidden');
        selectionScreen.classList.add('hidden');
        saveScoreModal.classList.add('hidden');
        gameScreen.classList.remove('hidden');

        score = 0;
        timeLeft = 60;
        scoreDisplay.textContent = score;
        timerDisplay.textContent = timeLeft;

        playPoliticianSound(politicians[chosenIndex].sound, () => {
            isPlaying = true;

            gameInterval = setInterval(() => {
                timeLeft--;
                timerDisplay.textContent = timeLeft;
                if (timeLeft <= 0) {
                    checkAndEndGame(false, "Vrijeme je isteklo!");
                }
            }, 1000);

            runner();
        });
    }

    function randomHole() {
        const idx = Math.floor(Math.random() * holes.length);
        const hole = holes[idx];
        if (hole === lastHole) return randomHole();
        lastHole = hole;
        return hole;
    }

    function randomPolitician() {
        return Math.floor(Math.random() * politicians.length);
    }

    function runner() {
        if (!isPlaying) return;

        const hole = randomHole();
        const polIdx = randomPolitician();
        const mole = hole.querySelector('.mole');

        mole.src = politicians[polIdx].img;
        mole.dataset.index = polIdx;

        hole.classList.add('up');

        // Vraćeno na normalnu, ugodnu brzinu (lik stoji 700ms - 1300ms)
        //let timeUp = Math.random() * 600 + 700; 
        let timeUp = 600;
        
        moleTimer = setTimeout(() => {
            hole.classList.remove('up');
            if (isPlaying) {
                // Pauza između iskakanja (300ms - 700ms)
                //let nextDelay = Math.random() * 400 + 300;
                let nextDelay = 400;
                setTimeout(runner, nextDelay);
            }
        }, timeUp);
    }

    holes.forEach(hole => {
        const mole = hole.querySelector('.mole');
        
        mole.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            if (!isPlaying || !hole.classList.contains('up')) return;
            
            const clickedPolIndex = parseInt(mole.dataset.index);

            if (clickedPolIndex === chosenIndex) {
                playSound('fail');
                hole.classList.remove('up');
                checkAndEndGame(true, `Udario si svog favorita (${politicians[chosenIndex].name})!`);
            } else {
                playSound('hit');
                score += 10;
                scoreDisplay.textContent = score;
                hole.classList.remove('up');
            }
        });
    });

    async function fetchScores(limit = 10) {
        scoresTbody.innerHTML = `<tr><td colspan="2" style="text-align:center;">Učitavanje...</td></tr>`;
        try {
            const res = await fetch(`/api/get-scores?limit=${limit}`);
            const responseData = await res.json();

            let data = responseData;
            if (!Array.isArray(data)) {
                if (Array.isArray(data.data)) data = data.data;
                else if (Array.isArray(data.scores)) data = data.scores;
                else if (Array.isArray(data.results)) data = data.results;
            }

            if (!Array.isArray(data) || data.length === 0) {
                scoresTbody.innerHTML = `<tr><td colspan="2" style="text-align:center;">Nema rezultata još uvijek.</td></tr>`;
                return;
            }

            const limitedData = data.slice(0, limit);

            let html = '';
            limitedData.forEach((item, index) => {
                html += `
                    <tr>
                        <td>${index + 1}. ${item.player_name || item.name || 'Anonimac'}</td>
                        <td style="text-align: right;"><strong>${item.score || 0}</strong></td>
                    </tr>
                `;
            });
            scoresTbody.innerHTML = html;
        } catch (err) {
            scoresTbody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:#e74c3c;">Greška pri učitavanju.</td></tr>`;
            console.error(err);
        }
    }

    async function saveScoreToServer(playerName, finalScore) {
        try {
            await fetch('/api/save-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    player_name: playerName, 
                    score: finalScore 
                }),
            });
        } catch (err) {
            console.error('Greška pri spremanju:', err);
        }
    }

    async function checkAndEndGame(isPenalty, message) {
        isPlaying = false;
        clearInterval(gameInterval);
        clearTimeout(moleTimer);
        holes.forEach(h => h.classList.remove('up'));

        let qualifiesForLeaderboard = false;
        try {
            const res = await fetch('/api/get-scores?limit=100');
            const responseData = await res.json();
            
            let data = responseData;
            if (!Array.isArray(data)) {
                if (Array.isArray(data.data)) data = data.data;
                else if (Array.isArray(data.scores)) data = data.scores;
                else if (Array.isArray(data.results)) data = data.results;
            }

            if (!Array.isArray(data) || data.length < 100) {
                qualifiesForLeaderboard = true;
            } else {
                const lowestScoreInTop100 = data[data.length - 1].score || 0;
                if (score > lowestScoreInTop100) {
                    qualifiesForLeaderboard = true;
                }
            }
        } catch (err) {
            console.error('Greška pri provjeri rang-liste:', err);
            qualifiesForLeaderboard = true; 
        }

        if (!qualifiesForLeaderboard) {
            resetToMenu();
            return;
        }

        gameScreen.classList.add('hidden');
        saveScoreModal.classList.remove('hidden');

        if (isPenalty) {
            modalGameoverTitle.textContent = "OVO JE IZDAJA!";
            modalGameoverTitle.style.color = "#e74c3c";
        } else {
            modalGameoverTitle.textContent = "VRIJEME JE ISTEKLO!";
            modalGameoverTitle.style.color = "#f39c12";
        }

        modalGameoverReason.textContent = message;
        modalFinalScore.textContent = score;

        playerNameInput.value = "";
        playerNameInput.focus();
    }

    submitScoreBtn.addEventListener('click', async () => {
        let name = playerNameInput.value.trim();
        if (!name) name = "Anonimac";

        if (name.length > 20) {
            name = name.substring(0, 20);
        }
        
        await saveScoreToServer(name, score);
        resetToMenu();
    });

    cancelScoreBtn.addEventListener('click', () => {
        resetToMenu();
    });

    function resetToMenu() {
        saveScoreModal.classList.add('hidden');
        gameScreen.classList.add('hidden');
        selectionScreen.classList.add('hidden');
        welcomeScreen.classList.remove('hidden');
    }
});