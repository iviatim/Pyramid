let playerName = '';
let currentLevel = { level: 1 };
let timeLeft = 40;
let totalTimeSpent = 0;
let score = 0;
let rings = [];
let stickRings = [];

// параметры уровней
const levels = {
    1: { rings: 5, colors: ['#00FFFF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'] },
    2: { rings: 6, colors: ['#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'] },
    3: { rings: 7, colors: ['#8B00FF', '#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'] },
};

// перемешивание массива
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// страница игры
if (window.location.pathname.includes('game.html'))
{
    playerName = localStorage.getItem('playerName');

    const leftBlock = document.getElementById('leftBlock');
    const stick = document.getElementById('stick');
    const levelInfo = document.getElementById('level');
    const timerDisplay = document.getElementById('timer');
    let interval;
    let spawnInterval;
    let activeRings = new Set();
    let draggedRing = null;


    // обновление отображения очков
    const updateScoreDisplay = () =>
    {
        const scoreDisplay = document.getElementById('score');
        scoreDisplay.textContent = `Очки: ${score}`;
    };

    // инициализация уровня
    const initLevel = () => {
        const levelConfig = levels[currentLevel.level];
        const colors = levelConfig.colors;

        rings = colors.map((color, index) => ({
            color,
            size: index + 1,
        }));

        activeRings.clear();
        stickRings = [];
        leftBlock.innerHTML = '';
        stick.innerHTML = '';

        // высота палочки
        const stickHeight = getStickHeight(currentLevel.level);
        stick.style.height = `${stickHeight}px`;

        levelInfo.textContent = `Уровень: ${currentLevel.level}`;
        totalTimeSpent += (40 - timeLeft);
        timeLeft = 40;
        timerDisplay.textContent = `Осталось: ${timeLeft} сек`;

        startTimer();
        spawnRings();
        updateScoreDisplay();
    };

    const getStickHeight = (level, subLevel) =>
    {
        if (level === 1) return 132;
        if (level === 2) return 154;
        if (level === 3) return 176;
        return 110;
    };
        

    // таймер
    const startTimer = () =>
    {
        clearInterval(interval);
        interval = setInterval(() =>
        {
            timeLeft--;
            timerDisplay.textContent = `Осталось: ${timeLeft} сек`;
            if (timeLeft <= 0)
            {
                clearInterval(interval);
                handleLevelEnd();
            }
        }, 1000);
    };
    
    const handleLevelEnd = () => {
        setTimeout(() => {
            alert(`Время вышло! Ваш счёт: ${score}`);

            const results = JSON.parse(localStorage.getItem('results')) || [];
            const playerName = localStorage.getItem('playerName');

            const existingPlayerIndex = results.findIndex(result => result.playerName === playerName);

            if (existingPlayerIndex === -1) {
                results.push({ playerName, score });
            } else {
                if (score > results[existingPlayerIndex].score) {
                    results[existingPlayerIndex].score = score;
                }
            }

            localStorage.setItem('results', JSON.stringify(results));

            window.location.href = '../results.html';
        }, 1000);
    };
    

    // создание колец
    const spawnRings = () =>
    {
        clearInterval(spawnInterval);
        spawnInterval = setInterval(() =>
        {
            shuffleArray(rings);
            for (const ring of rings) {
                if (!activeRings.has(ring.size))
                {
                    dropRing(ring);
                    break;
                }
            }
        }, 1000);
    };

    const dropRing = (ring) => {
        if (activeRings.has(ring.size)) return;
        activeRings.add(ring.size);

        const ringEl = document.createElement('div');
        ringEl.classList.add('ring');
        ringEl.style.backgroundColor = ring.color;
        ringEl.style.width = `${40 + ring.size * 10}px`;
        ringEl.style.height = '22px';
        ringEl.dataset.size = ring.size;

        const randomX = Math.random() * 300;
        ringEl.style.position = 'absolute';
        ringEl.style.left = `${randomX}px`;
        ringEl.style.top = '0px';

        leftBlock.appendChild(ringEl);

        let topPos = 0;
        const fallInterval = setInterval(() => {
            if (!ringEl.isBeingDragged)
            {
                topPos += 2 + currentLevel.level;
                ringEl.style.top = `${topPos}px`;

                if (topPos > 400) {
                    clearInterval(fallInterval);
                    leftBlock.removeChild(ringEl);
                    activeRings.delete(ring.size);
                }
            }
        }, 30);

        ringEl.addEventListener('mousedown', (e) =>
        {
            e.preventDefault();
            clearInterval(fallInterval);
            leftBlock.removeChild(ringEl);
            ringEl.isBeingDragged = true;

            ringEl.style.position = 'fixed';
            ringEl.style.zIndex = '1000';
            ringEl.style.cursor = 'grabbing';
            ringEl.style.left = `${e.pageX - ringEl.offsetWidth / 2}px`;
            ringEl.style.top = `${e.pageY - ringEl.offsetHeight / 2}px`;
            document.body.appendChild(ringEl);

            draggedRing = ringEl;
        });

        document.addEventListener('mousemove', (e) =>
        {
            if (draggedRing)
            {
                draggedRing.style.left = `${e.pageX - draggedRing.offsetWidth / 2}px`;
                draggedRing.style.top = `${e.pageY - draggedRing.offsetHeight / 2}px`;
            }
        });

        document.addEventListener('mouseup', (e) =>
        {
            if (draggedRing)
            {
                const stickRect = stick.getBoundingClientRect();
                const ringRect = draggedRing.getBoundingClientRect();
                const ringSize = parseInt(draggedRing.dataset.size, 10);

                const isOnStick =
                    ringRect.right > stickRect.left &&
                    ringRect.left < stickRect.right &&
                    ringRect.bottom > stickRect.top &&
                    ringRect.top < stickRect.bottom;

                if (isOnStick)
                {
                    const ringColor = draggedRing.style.backgroundColor;

                    if( (stickRings.length === 0 && ringSize === levels[currentLevel.level].rings) ||
                    (stickRings.length > 0 && stickRings[stickRings.length - 1].size - 1 === ringSize))
                    {
                        const newRing = document.createElement('div');
                        newRing.classList.add('ring');
                        newRing.style.backgroundColor = ringColor;
                        newRing.style.width = `${40 + ringSize * 10}px`;
                        newRing.style.height = '22px';
                        newRing.style.position = 'absolute';
                        newRing.style.bottom = `${stickRings.length * 23}px`;
                        newRing.style.left = `${(stick.offsetWidth - (40 + ringSize * 10)) / 2}px`;

                        stick.appendChild(newRing);
                        stickRings.push({ size: ringSize, color: ringColor });

                        score += 100;
                        updateScoreDisplay();

                        document.body.removeChild(draggedRing);
                        rings = rings.filter((ring) => ring.size !== ringSize);

                        if (stickRings[stickRings.length - 1].size === 1)
                        {
                            addRedBall();
                            setTimeout(() =>
                            {                                
                                clearInterval(interval);
                                nextLevel();
                            }, 1000);
                        }
                    }
                    else
                    {
                        alert('Кольца нужно насаживать в правильном порядке.');
                        score = score > 30 ? score - 30 : score = 0;
                        updateScoreDisplay();
                        returnRingToLeftContainer();
                    }
                }
                else
                {
                    score = score > 20 ? score - 20 : score = 0;
                    updateScoreDisplay();
                    draggedRing.style.visibility = 'hidden';
                    returnRingToLeftContainer();
                }

                draggedRing.style.zIndex = '';
                draggedRing.style.cursor = 'grab';
                draggedRing = null;

                function returnRingToLeftContainer()
                {
                    if (draggedRing)
                    {
                        document.body.removeChild(draggedRing);
                        activeRings.delete(parseInt(draggedRing.dataset.size, 10));
                        leftBlock.appendChild(draggedRing);
                    }
                }
            }
        });
    };

    const nextLevel = () =>
    {
        if (currentLevel.level < 3) {
            currentLevel.level++;
        } else {
            finishGame();
        }

        stickRings = [];
        leftBlock.innerHTML = '';
        stick.innerHTML = '';
        initLevel();
    };

    const addRedBall = () =>
    {
        const redBall = document.createElement('div');
        redBall.classList.add('ball');
        redBall.style.backgroundColor = 'red';
        redBall.style.width = '30px';
        redBall.style.height = '30px';
        redBall.style.position = 'absolute';
        redBall.style.bottom = `${stickRings.length * 23 }px`;
        redBall.style.left = `${(stick.offsetWidth - 30) / 2}px`;
    
        stick.appendChild(redBall);
    };
    

    const finishGame = () => {
        totalTimeSpent += (40 - timeLeft);
        const timeBonus = Math.max(120 - totalTimeSpent, 0) * 10;
        score += timeBonus;

        setTimeout(() => {
            alert(`Поздравляем! Вы завершили игру!\nВаш счёт: ${score}`);
            const results = JSON.parse(localStorage.getItem('results')) || [];

            const existingPlayerIndex = results.findIndex(result => result.playerName === playerName);

            if (existingPlayerIndex === -1) {
                results.push({ playerName, score });
            } else {
                if (score > results[existingPlayerIndex].score) {
                    results[existingPlayerIndex].score = score;
                }
            }

            localStorage.setItem('results', JSON.stringify(results));

            window.location.href = '../results.html';
        }, 1000);
    };
    

    initLevel();

    
    let gamePaused = false;
    let pauseMenu = document.getElementById('pauseMenu');
    let pauseButton = document.getElementById('pauseButton');
    let continueButton = document.getElementById('continueGame');
    let goToMenuButton = document.getElementById('goToMenu');
    let saveAndShowResultButton = document.getElementById('saveAndShowResult');
    let helpButton = document.getElementById('helpButton');
    let helpMenu = document.getElementById('helpMenu');

    // пауза
    const pauseGame = () =>
    {
        clearInterval(interval); 
        clearInterval(spawnInterval);
        gamePaused = true;
        pauseMenu.style.display = 'flex';
    };

    // продолжить игру
    const continueGame = () =>
    {
        gamePaused = false;
        pauseMenu.style.display = 'none';
        startTimer();
        spawnRings();
    };

    // в главное меню
    const goToMenu = () =>
    {
        if (confirm("Данные игры не сохранятся, вы уверены?"))
        {
            window.location.href = '../index.html';
        }
    };

    // сохранить и выйти
    const saveAndShowResult = () => {
        const results = JSON.parse(localStorage.getItem('results')) || [];
        const playerName = localStorage.getItem('playerName');
        const existingPlayerIndex = results.findIndex(result => result.playerName === playerName);

        if (existingPlayerIndex !== -1)
        {
            const existingPlayer = results[existingPlayerIndex];
            if (score > existingPlayer.score)
            {
                results[existingPlayerIndex].score = score;
            }
        }
        else
        {
            results.push({ playerName, score });
        }

        localStorage.setItem('results', JSON.stringify(results));

        window.location.href = '../results.html';
    };

    //Правила игры
    const showRules = () =>
    {
        clearInterval(interval); 
        clearInterval(spawnInterval);
        gamePaused = true;
        helpMenu.style.display = 'flex';
        document.addEventListener('keydown', handleKeyPress);
    }

    function closeHelpMenu()
    {
        if (helpMenu)
        {
            helpMenu.style.display = 'none';
            document.removeEventListener('keydown', handleKeyPress);
        }
    }

    function handleKeyPress(event)
    {
        event.preventDefault();
        closeHelpMenu();
    }
    
    helpButton.addEventListener('click', showRules);
    pauseButton.addEventListener('click', pauseGame);
    continueButton.addEventListener('click', continueGame);
    goToMenuButton.addEventListener('click', goToMenu);
    saveAndShowResultButton.addEventListener('click', saveAndShowResult);
    document.addEventListener('keydown', (e) =>
    {
        if (e.key === 'Escape' && !gamePaused)
        {
            pauseGame();
        }
        else
        {
            continueGame();
        }
    });
    }