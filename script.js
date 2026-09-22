document.addEventListener('DOMContentLoaded', () => {
    // Putanje do karikatura unutar foldera images
    const politicians = [
        { name: "Milorad Dodik", img: "images/dodik.png" },
        { name: "Dragan Čović", img: "images/covic.png" },
        { name: "Bakir Izetbegović", img: "images/bakir.png" },
        { name: "Elmedin Konaković", img: "images/konakovic.png" },
        { name: "Nermin Nikšić", img: "images/niksic.png" }
    ];

    let chosenIndex = 0;
    let score = 0;
    let timeLeft = 60;
    let gameInterval;
    let moleTimer;
    let isPlaying = false;
    let lastHole = null;
    let currentLimit = 10; // Početni limit za rang listu

    // Povezivanje elemenata iz HTML-a
    const selectionScreen = document.getElementById('selection-screen');
    const gameScreen = document.getElementById('game-screen');
    const startBtn = document.getElementById('start-btn');
    
    // HUD elementi
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const chosenNameDisplay = document.getElementById('chosen-name');
    const holes = document.querySelectorAll('.hole');

    // Modal i Rang-lista
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const scoresTbody = document.getElementById('scores-tbody');
    
    // Tab dugmad za rang-listu
    const tab10Btn = document.getElementById('tab-10');
    const tab100Btn = document.getElementById('tab-100');

    // Modal za kraj igre i unos imena
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

    startBtn.addEventListener('click', startGame);

    // Otvaranje i zatvaranje modala za rang-listu
    leaderboardBtn.addEventListener('click', () => {
        leaderboardModal.classList.remove('hidden');
        fetchScores(currentLimit);
    });

    closeModalBtn.addEventListener('click', () => {
        leaderboardModal.classList.add('hidden');
    });

    // Event listeneri za tabove Top 10 / Top 100
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

    function startGame() {
        const radios = document.getElementsByName('chosen');
        for (let r of radios) {
            if (r.checked) chosenIndex = parseInt(r.value);
        }

        chosenNameDisplay.textContent = politicians[chosenIndex].name;
        
        selectionScreen.classList.add('hidden');
        saveScoreModal.classList.add('hidden');
        gameScreen.classList.remove('hidden');

        score = 0;
        timeLeft = 60;
        scoreDisplay.textContent = score;
        timerDisplay.textContent = timeLeft;
        isPlaying = true;

        // Pokreni tajmer
        gameInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            if (timeLeft <= 0) {
                endGame(false, "Vrijeme je isteklo!");
            }
        }, 1000);

        // Pokreni iskakanje likova
        runner();
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

        let timeUp = Math.random() * 600 + 600; // Vrijeme vani (0.6s - 1.2s)
        
        moleTimer = setTimeout(() => {
            hole.classList.remove('up');
            if (isPlaying) {
                setTimeout(runner, Math.random() * 400 + 200);
            }
        }, timeUp);
    }

    // Klik na lik (udaranje)
    holes.forEach(hole => {
        const mole = hole.querySelector('.mole');
        
        mole.addEventListener('mousedown', (e) => {
            if (!isPlaying || !hole.classList.contains('up')) return;
            
            const clickedPolIndex = parseInt(mole.dataset.index);

            if (clickedPolIndex === chosenIndex) {
                playSound('fail');
                hole.classList.remove('up');
                endGame(true, `Udario si svog favorita (${politicians[chosenIndex].name})!`);
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

            // Ograničeni prikaz u skladu s odabranim tabom (Top 10 ili Top 100)
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
            const response = await fetch('/api/save-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    player_name: playerName, // Sada šalje čisto uneseno ime
                    score: finalScore 
                }),
            });
            const data = await response.json();
            console.log('Uspješno spremljeno:', data);
        } catch (err) {
            console.error('Greška pri spremanju:', err);
        }
    }

    function endGame(isPenalty, message) {
        isPlaying = false;
        clearInterval(gameInterval);
        clearTimeout(moleTimer);
        holes.forEach(h => h.classList.remove('up'));

        gameScreen.classList.add('hidden');
        saveScoreModal.classList.remove('hidden');

        if (isPenalty) {
            modalGameoverTitle.textContent = "KRAJ - UHVAĆEN U PRELJETU!";
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
        
        await saveScoreToServer(name, score);
        resetToMenu();
    });

    cancelScoreBtn.addEventListener('click', () => {
        resetToMenu();
    });

    function resetToMenu() {
        saveScoreModal.classList.add('hidden');
        selectionScreen.classList.remove('hidden');
    }
});