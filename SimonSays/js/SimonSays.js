const colourArray = {0:"red", 1:"blue", 2:"yellow", 3:"green"}
const baseNum = 3;

let currentLevel = 1;
let pattern = [];
let playerPattern = [];
// PLAY, WIN or LOSE
let gameState = '';
let timer;
let timerInterval;

function createPattern (num) {
    num = parseInt(num) + baseNum - 1;
    pattern = [];
    playerPattern = [];
    $('#simon').empty();

    for(let i = 0; i < parseInt(num); i++) {
        let colour = colourArray[Math.floor(Math.random() * 4)];
        pattern.push(colour);
        $('#simon').append(`<div class="pattern" id=simonColour${i} style="background-color: ${colour}"> </div>`);
    }
}

function createGameBoard() {
    $('#gameboard').html('');

    let board = (() => {
        let colours = Object.keys(colourArray);
        let shuffled = [];
        while(colours.length > 0) {
            let i = Math.floor(Math.random() * colours.length);
            shuffled.push(colours[i]);
            colours.splice(i, 1);
        }
        return shuffled;
    })();

    for(let colour of board) {
        $('#gameboard').append(`<div class="pattern" id=board${colour} style="background-color: ${colourArray[colour]}"> </div>`);
    }
}

function handleBoardClick(c) {
    // Add colour to player pattern
    playerPattern.push(c);
    // Compare pattern and playerPattern
    for(let i = 0; i < playerPattern.length; i++) {
        if(i >= pattern.length) continue; // Player has entered more moves than Simon, do nothing
        if(playerPattern[i] !== pattern[i]) {
            // Pattern mismatch, game over
            return state('LOSE');
        }
    }
    if(playerPattern.length >= pattern.length) state('WIN');
}

// Creates the pattern to be followed.
// param:  level is the current level that the player is on.
function createLevel (level) {
    currentLevel = level;
    state('SIMON');
}

function startTimer(seconds) {
    timer = seconds;
    tickTimer();
}

function tickTimer() {
    timer--;
    if(timer >= 0) {
        state('PLAY');
        timerInterval = setTimeout(tickTimer, 1000);
    } else {
        // Game over
        state('LOSE');
    }
}

function state(newState) {
    let oldState = gameState;
    gameState = newState;
    // Handle state transitions
    // Not in play
    if(newState !== 'PLAY') {
        $('#gameboard').css('opacity', 0.5);

    }
    // PLAY -> !PLAY
    if(oldState === 'PLAY' && newState !== 'PLAY') {
        // Game is no longer in play, unhook event listeners
        for(let k in colourArray) $(`#board${k}`).off('click');
        $('#nextLevelBtn').css('visibility', 'visible');
        clearTimeout(timerInterval);
    }
    // !SIMON -> SIMON, new game
    if(oldState !== 'SIMON' && newState === 'SIMON') {
        createPattern(currentLevel);
        createGameBoard();
        $('#simon').css('visibility', 'visible');
        $('#nextLevelBtn').css('visibility', 'hidden');
        $('#level').text(`Level: ${currentLevel}`);
        setTimeout(() => state('PLAY'), 3000);
    }
    // SIMON -> !SIMON
    if(oldState === 'SIMON' && newState !== 'SIMON') {
        $('#simon').css('visibility', 'hidden');
    }
    // !PLAY -> PLAY, entering play
    if(oldState !== 'PLAY' && newState === 'PLAY') {
        // Create board event listeners
        for(let k in colourArray) {
            $(`#board${k}`).on('click', function() {
                $(this).css('opacity', 0.5);
                $(this).animate({opacity: 1}, 250);
                handleBoardClick(colourArray[k])
            });
        }
        // Make game board opaque
        $('#gameboard').css('opacity', 1);
        // Start timer
        startTimer(currentLevel + baseNum - 1);
        // Hide Simon
        $('#simon').css('visibility', 'hidden');
    }
    
    // Render new state
    switch(newState) {
        case 'SIMON':
            $('#state').text('Pay attention!');
            break;
        case 'PLAY':
            $('#state').text(`Time remaining: ${timer} second${timer !== 1 ? 's' : ''}`)
            break;
        case 'WIN':
            $('#state').text('You win!');
            break;
        case 'LOSE':
            $('#state').text('Game over!');
            break;
    }
}

$('#playAgainBtn').on('click', () => {
    if(gameState === 'WIN') {
        // Advance level
        createLevel(currentLevel + 1);
    } else {
        // Reset game
        createLevel(1);
    }
})