let playerName = '';
let currentLevel = { level: 1 };
let timeLeft = 80;
let totalTimeSpent = 0;
let score = 0;
let rings = [];
let stickRings = [];
let targetSequence = [];

// параметры уровней
const levels =
{
    1: { rings: 20, sizes: 5, arrows: 5, colors: ['#00FFFF', '#00FF00', '#FFF202', '#FF7F00', '#FF0000']},
    2: { rings: 24, sizes: 6, arrows: 6, colors: ['#0000FF', '#00FFFF', '#00FF00', '#FFF202', '#FF7F00', '#FF0000']},
    3: { rings: 28, sizes: 7, arrows: 7, colors: ['#8B00FF', '#0000FF', '#00FFFF', '#00FF00', '#FFF202', '#FF7F00', '#FF0000']},
};

function shuffleArray(array)
{
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


const directions = ['←', '→', '↑', '↓'];

// генерация случайных стрелок
function generateRandomArrows(count)
{
    return Array.from({ length: count }, () =>
        directions[Math.floor(Math.random() * directions.length)]
    );
}

function generateRings(level)
{
    const levelConfig = levels[level];
    const ringsArray = [];
    const numSizes = levelConfig.sizes;
    console.log(numSizes);
    for (let size = 1; size <= numSizes; size++)
    {
        for (let i = 0; i < 4; i++)
        {
            const arrow = directions[i];
            const color = levelConfig.colors[size-1];
            ringsArray.push({size, color, arrow});
        }
    }
    return ringsArray;
}

// страница игры
if (window.location.pathname.includes('game.html'))
{
    playerName = localStorage.getItem('playerName');

    const leftBlock = document.getElementById('leftBlock');
    const stick = document.getElementById('stick');
    const levelInfo = document.getElementById('level');
    const timerDisplay = document.getElementById('timer');
    const messageDisplay = document.getElementById('message');
    let interval;
    let spawnInterval;
    let draggedRing = null;

    let usedRings = [];

    // обновление отображения очков
    const updateScoreDisplay = () => {
        const scoreDisplay = document.getElementById('score');
        scoreDisplay.textContent = `Очки: ${score}`;
    };

    // инициализация уровня
    const initLevel = () =>
    {
        const levelConfig = levels[currentLevel.level];
        rings = generateRings(currentLevel.level);
     
        stickRings = [];
        leftBlock.innerHTML = '';
        stick.innerHTML = '';

        // Высота палочки
        const stickHeight = getStickHeight(currentLevel.level);
        stick.style.height = `${stickHeight}px`;

        levelInfo.textContent = `Уровень: ${currentLevel.level}`;
        totalTimeSpent += 80 - timeLeft;
        timeLeft = 80;
        timerDisplay.textContent = `Осталось: ${timeLeft} сек`;

        // Генерация последовательности стрелок
        targetSequence = generateRandomArrows(levelConfig.arrows);
        messageDisplay.textContent = `Собери кольца в последовательности: ${targetSequence.join(' ')}`;

        startTimer();
        spawnRings();
        updateScoreDisplay();
    };

    const getStickHeight = (level) =>
    {
        if (level === 1) return 132;
        if (level === 2) return 154;
        if (level === 3) return 176;
        return 110;
    };

    // таймер
    const startTimer = () => {
        clearInterval(interval);
        interval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `Осталось: ${timeLeft} сек`;
            if (timeLeft <= 0) {
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
    
            let spawnTime;
    
            if (currentLevel.level === 1) {spawnTime = 1000;}
            else if (currentLevel.level === 2) {spawnTime = 750;}
            else if (currentLevel.level === 3) {spawnTime = 600;}
    
            spawnInterval = setInterval(() =>
            {
                shuffleArray(rings);
                for (const ring of rings)
                {
                    if (usedRings.includes(ring))
                    {
                        continue;
                    }
                    dropRing(ring);
                    usedRings.push(ring);
                    break;
                }
            }, spawnTime);
        };


    const dropRing = (ring) =>
    {
        const ringEl = document.createElement('div');
        ringEl.classList.add('ring');
        ringEl.style.backgroundColor = ring.color;
        ringEl.style.width = `${40 + ring.size * 10}px`;
        
        console.log(ringEl.style.width);
        ringEl.style.height = '22px';
        ringEl.dataset.size = ring.size;
        ringEl.dataset.color = ring.color;
        ringEl.dataset.arrow = ring.arrow;

        const arrowEl = document.createElement('span');
        arrowEl.classList.add('arrow');
        arrowEl.textContent = ring.arrow;
        ringEl.appendChild(arrowEl);

        const randomX = Math.random() * 300;
        ringEl.style.position = 'absolute';
        ringEl.style.left = `${randomX}px`;
        ringEl.style.top = '0px';

        leftBlock.appendChild(ringEl);

        let topPos = 0;
        const fallInterval = setInterval(() => {
            if (!ringEl.isBeingDragged) {
                topPos += 2 + currentLevel.level;
                ringEl.style.top = `${topPos}px`;

                if (topPos > 400)
                {
                    clearInterval(fallInterval);
                    leftBlock.removeChild(ringEl);
                    usedRings = usedRings.filter(r => r !== ring);
                }
            }
        }, 30);

        ringEl.addEventListener('mousedown', (e) => {
            e.preventDefault();
            ringEl.isBeingDragged = true;
            clearInterval(fallInterval);
            leftBlock.removeChild(ringEl);
            

            ringEl.style.position = 'fixed';
            ringEl.style.zIndex = '1000';
            ringEl.style.cursor = 'grabbing';
            ringEl.style.left = `${e.pageX - ringEl.offsetWidth / 2}px`;
            ringEl.style.top = `${e.pageY - ringEl.offsetHeight / 2}px`;
            document.body.appendChild(ringEl);

            draggedRing = ringEl;

            const arrowEl = ringEl.querySelector('.arrow');
            arrowEl.style.position = 'absolute';
            arrowEl.style.top = '50%';
            arrowEl.style.left = '50%';
            arrowEl.style.transform = 'translate(-50%, -50%)';
        });

        document.addEventListener('mousemove', (e) =>
        {
            if (draggedRing)
            {
                draggedRing.style.left = `${e.pageX - draggedRing.offsetWidth / 2}px`;
                draggedRing.style.top = `${e.pageY - draggedRing.offsetHeight / 2}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (draggedRing) {
                const stickRect = stick.getBoundingClientRect();
                const ringRect = draggedRing.getBoundingClientRect();
                const ringSize = parseInt(draggedRing.dataset.size, 10);
                const ringArrow = draggedRing.dataset.arrow;

                const isOnStick =
                    ringRect.right > stickRect.left &&
                    ringRect.left < stickRect.right &&
                    ringRect.bottom > stickRect.top &&
                    ringRect.top < stickRect.bottom;

                if (isOnStick) {                    

                    if (ringArrow === targetSequence[stickRings.length] && (stickRings.length === 0 && ringSize === levels[currentLevel.level].sizes ||
                        stickRings.length > 0 && stickRings[stickRings.length - 1].size - 1 === ringSize))
                    {
                        const newRing = document.createElement('div');
                        newRing.classList.add('ring');
                        newRing.style.backgroundColor = draggedRing.style.backgroundColor;
                        newRing.style.width = `${40 + ringSize * 10}px`;
                        newRing.style.height = '22px';
                        newRing.style.position = 'absolute';
                        newRing.style.bottom = `${stickRings.length * 23}px`;
                        newRing.style.left = `${(stick.offsetWidth - (40 + ringSize * 10)) / 2}px`;

                        const arrowEl = document.createElement('span');
                        arrowEl.classList.add('arrow');
                        arrowEl.textContent = ringArrow;
                        newRing.appendChild(arrowEl);

                        stick.appendChild(newRing);
                        stickRings.push({ size: ringSize, arrow: ringArrow });

                        score += 200;
                        updateScoreDisplay();

                        document.body.removeChild(draggedRing);
                        rings = rings.filter((ring) => !(ring.size === ringSize));

                        if (stickRings.length === targetSequence.length)
                        {
                            addRedBall();
                            setTimeout(nextLevel, 1000);
                        }

                    }
                    else
                    {
                        alert('Кольца нужно насаживать в правильном порядке и с нужной стрелкой.');
                        score = score > 50 ? score - 50 : score = 0;
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
                        const ringColor = draggedRing.dataset.color;
                        const ringSize = parseInt(draggedRing.dataset.size, 10);

                        const index = usedRings.findIndex(ring => ring.color === ringColor && ring.size === ringSize);

                        if (index !== -1)
                        {
                            usedRings.splice(index, 1);
                        }
                        document.body.removeChild(draggedRing);
                        leftBlock.appendChild(draggedRing);
                    }
                }
            }
        });
    };

    const addRedBall = () =>
    {
        const redBall = document.createElement('div');
        redBall.classList.add('ball');
        redBall.style.backgroundColor = 'red';
        redBall.style.width = '30px';
        redBall.style.height = '30px';
        redBall.style.position = 'absolute';
        redBall.style.bottom = `${stickRings.length * 23}px`;
        redBall.style.left = `${(stick.offsetWidth - 30) / 2}px`;
    
        stick.appendChild(redBall);
    };

    const nextLevel = () =>
    {
        if (currentLevel.level < 3)
        {
            currentLevel.level++;
        }
        else
        {
            finishGame();
        }
        initLevel();
    };

    const finishGame = () => {
        totalTimeSpent += (80 - timeLeft);
        const timeBonus = Math.max(240 - totalTimeSpent, 0) * 30;
        score += timeBonus;

        setTimeout(() =>
        {
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

    const saveResults = () => {
        const results = JSON.parse(localStorage.getItem('results')) || [];
        const playerName = localStorage.getItem('playerName');
        const existingPlayerIndex = results.findIndex((result) => result.playerName === playerName);

        if (existingPlayerIndex === -1) {
            results.push({ playerName, score });
        } else {
            if (score > results[existingPlayerIndex].score) {
                results[existingPlayerIndex].score = score;
            }
        }

        localStorage.setItem('results', JSON.stringify(results));
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
