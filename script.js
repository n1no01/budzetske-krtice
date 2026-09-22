document.addEventListener('DOMContentLoaded', () => {
    // Putanje do vaših karikatura unutar foldera images
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

    const selectionScreen = document.getElementById('selection-screen');
    const gameScreen = document.getElementById('game-screen');
    const gameoverScreen = document.getElementById('gameover-screen');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const finalScoreDisplay = document.getElementById('final-score');
    const chosenNameDisplay = document.getElementById('chosen-name');
    const gameoverTitle = document.getElementById('gameover-title');
    const gameoverReason = document.getElementById('gameover-reason');
    const holes = document.querySelectorAll('.hole');

    // Elementi za rang listu i modal iz tvog HTML-a
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const scoresTbody = document.getElementById('scores-tbody');

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
    restartBtn.addEventListener('click', resetToMenu);

    // Otvaranje i zatvaranje modala za rang-listu sa početnog ekrana
    leaderboardBtn.addEventListener('click', () => {
        leaderboardModal.classList.remove('hidden');
        fetchScores();
    });

    closeModalBtn.addEventListener('click', () => {
        leaderboardModal.classList.add('hidden');
    });

    function startGame() {
        const radios = document.getElementsByName('chosen');
        for (let r of radios) {
            if (r.checked) chosenIndex = parseInt(r.value);
        }

        chosenNameDisplay.textContent = politicians[chosenIndex].name;
        
        selectionScreen.classList.add('hidden');
        gameoverScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');

        score = 0;
        timeLeft = 60;
        scoreDisplay.textContent = score;
        timerDisplay.textContent = timeLeft;
        isPlaying = true;

        // Pokreni tajmer sekunde
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

    // Klik na lik (udaranje čekićem)
    holes.forEach(hole => {
        const mole = hole.querySelector('.mole');
        
        mole.addEventListener('mousedown', (e) => {
            if (!isPlaying || !hole.classList.contains('up')) return;
            
            const clickedPolIndex = parseInt(mole.dataset.index);

            if (clickedPolIndex === chosenIndex) {
                // UDARIO SI SVOG! KRAJ IGRE!
                playSound('fail');
                hole.classList.remove('up');
                endGame(true, `Udario si svog favorita (${politicians[chosenIndex].name})!`);
            } else {
                // POGODAK
                playSound('hit');
                score += 10;
                scoreDisplay.textContent = score;
                hole.classList.remove('up');
            }
        });
    });

    // Funkcija za dohvatanje rezultata sa servera (za rang listu)
    async function fetchScores() {
        scoresTbody.innerHTML = `<tr><td colspan="2" style="text-align:center;">Učitavanje...</td></tr>`;
        try {
            const res = await fetch('/api/get-scores');
            const data = await res.json();

            if (!data || data.length === 0) {
                scoresTbody.innerHTML = `<tr><td colspan="2" style="text-align:center;">Nema rezultata još uvijek.</td></tr>`;
                return;
            }

            let html = '';
            data.forEach((item, index) => {
                html += `
                    <tr>
                        <td>${index + 1}. ${item.player_name}</td>
                        <td style="text-align: right;"><strong>${item.score}</strong></td>
                    </tr>
                `;
            });
            scoresTbody.innerHTML = html;
        } catch (err) {
            scoresTbody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:#e74c3c;">Greška pri učitavanju.</td></tr>`;
            console.error(err);
        }
    }

    // Funkcija za slanje rezultata na serverless API rutu
    async function saveScoreToServer(playerName, finalScore) {
        try {
            const response = await fetch('/api/save-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    player_name: playerName, 
                    score: finalScore 
                }),
            });
            const data = await response.json();
            console.log('Uspješno spremljeno u bazu:', data);
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
        gameoverScreen.classList.remove('hidden');

        if (isPenalty) {
            gameoverTitle.textContent = "KRAJ - UHVAĆEN U PRELJETU!";
            gameoverTitle.style.color = "#e74c3c";
        } else {
            gameoverTitle.textContent = "VRIJEME JE ISTEKLO!";
            gameoverTitle.style.color = "#f39c12";
        }

        gameoverReason.textContent = message;
        finalScoreDisplay.textContent = score;

        let playerName = prompt("Igra je završena! Unesi svoje ime za rang listu:", "Igrač");
        if (!playerName || playerName.trim() === "") {
            playerName = "Anonimni";
        }

        let fullName = `${playerName.trim()} (${politicians[chosenIndex].name})`;
        saveScoreToServer(fullName, score);
    }

    function resetToMenu() {
        gameoverScreen.classList.add('hidden');
        selectionScreen.classList.remove('hidden');
    }
});