if (window.location.pathname.includes('index.html')) {
    const startGameButton = document.getElementById('startGame');
    const playerNameInput = document.getElementById('playerName');
    const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
    let selectedDifficulty = null;

    const updateButtonState = () => {
        const playerName = playerNameInput.value.trim();
        selectedDifficulty = Array.from(difficultyRadios).find(radio => radio.checked)?.value;

        startGameButton.disabled = !(playerName && selectedDifficulty);
    };

    playerNameInput.addEventListener('input', updateButtonState);
    difficultyRadios.forEach(radio => {
        radio.addEventListener('change', updateButtonState);
    });

    startGameButton.addEventListener('click', function () {
        const playerName = playerNameInput.value.trim();

        if (!playerName || !selectedDifficulty) {
            alert('Пожалуйста, введите имя и выберите уровень сложности!');
        } else {
            localStorage.setItem('playerName', playerName);
            localStorage.setItem('difficulty', selectedDifficulty);

            const difficultyPath = {
                easy: 'easy/game.html',
                medium: 'middle/game.html',
                hard: 'hard/game.html'
            };
            window.location.href = difficultyPath[selectedDifficulty];
        }
    });
}



// результаты
if (window.location.pathname.includes('results.html'))
    {
        const resetLeaderboard = () =>
        {
            if (confirm('Вы уверены, что хотите сбросить рейтинг?'))
            {
                localStorage.removeItem('results');
                updateLeaderboard();
            }
        };

    // обновление рейтинга
    const updateLeaderboard = () =>
    {
        const leaderboard = document.getElementById('leaderboard');
        leaderboard.innerHTML = '';

        const results = JSON.parse(localStorage.getItem('results')) || [];

        results.sort((a, b) => b.score - a.score);

        results.forEach(result =>
        {
            const listItem = document.createElement('li');
            
            const playerName = document.createElement('span');
            playerName.classList.add('player-name');
            playerName.textContent = result.playerName;
            
            const playerScore = document.createElement('span');
            playerScore.classList.add('player-score');
            playerScore.textContent = `${result.score} очков`;
            
            listItem.appendChild(playerName);
            listItem.appendChild(playerScore);
            
            leaderboard.appendChild(listItem);
        });
    };

    const playAgainButton = document.getElementById('playAgain');
    playAgainButton.addEventListener('click', () =>
    {
        window.location.href = 'index.html';
    });

    const resetButton = document.getElementById('resetLeaderboard');
    resetButton.addEventListener('click', resetLeaderboard);

    updateLeaderboard();

}





