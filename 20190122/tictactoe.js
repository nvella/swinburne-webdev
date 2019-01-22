class TicTacToe {
    constructor(idPrefix, gameStatus) {
        this._squares = [];
        this._gridWidth = 3;
        this._gridHeight = 3;

        for(let x = 0; x < this._gridWidth; x++) {
            this._squares[x] = [];
            for(let y = 0; y < this._gridHeight; y++) {
                this._squares[x][y] = $(`#${idPrefix}_${x}_${y}`)[0];
            }
        }

        this._gameStatus = gameStatus;
        this._gameWon = false;
        this._aiGameInt = null;

        this.resetBoard();
    }

    resetBoard() {
        this._board = [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ];
    }

    draw() {
        for (let x = 0; x < this._gridWidth; x++) {
            for (let y = 0; y < this._gridHeight; y++) {
                if (this._board[x][y] !== null) {
                    if($(this._squares[x][y]).html().length < 2) $(this._squares[x][y]).html(`<span>${this._board[x][y]}</span>`);
                } else {
                    $(this._squares[x][y]).html('');
                }
            }
        }

        if (this._gameWon) {
            $(this._gameStatus).html("Game over!");
        }
    }

    onClick(boxX, boxY) {
        if (this._gameWon) return;

        this.playerTurn(boxX, boxY);
        this.aiTurn('O', 'X');

        // Check game over
        this._gameWon = this.gameWon();

        this.draw();
    }

    run() {
        console.log(this._squares);
        for(let x = 0; x < this._gridWidth; x++) { 
            for(let y = 0; y < this._gridHeight; y++) { 
                $(this._squares[x][y]).on('click', () => this.onClick(x, y));
            }
        }
        this.draw();
    }

    playerTurn(x, y) {
        if (this._board[x][y] === null) {
            this._board[x][y] = 'X';
        }
    }

    getMarkerCountsInLine(x, y, deltaX, deltaY) {
        let markerCounts = { 'X': 0, 'O': 0 };
        for (let i = 0; i < this._gridWidth; i++) {
            let checkX = x + (deltaX * i);
            let checkY = y + (deltaY * i);
            let marker = this._board[checkX][checkY];
            if (marker !== null) markerCounts[marker] += 1;
        }
        return markerCounts;
    };

    aiTurn(me, op) {
        // Line [x, y, dx, dy]
        // 

        let checkLines = [
            [0, 0, 1, 1], //
            [this._gridWidth - 1, 0, -1, 1]
        ]; // Start with diagonals

        for (let x = 0; x < this._gridWidth; x++) checkLines.push([x, 0, 0, 1]);
        for (let y = 0; y < this._gridHeight; y++) checkLines.push([0, y, 1, 0]);
        console.log(checkLines);
        
        for (let line of checkLines) {
            let markerCounts = this.getMarkerCountsInLine(line[0], line[1], line[2], line[3]);
            if (markerCounts[op] === this._gridWidth - 1 && markerCounts[me] === 0) {
                // Nearly won
                // Find where the gap is
                for (let i = 0; i < this._gridWidth; i++) {
                    let checkX = line[0] + (line[2] * i);
                    let checkY = line[1] + (line[3] * i);
                    let marker = this._board[checkX][checkY];
                    if (marker === null) {
                        // Found it. Place our marker
                        this._board[checkX][checkY] = me;
                        return; // Our turn is done
                    }
                }
            }
        }

        // Have not won yet, place somewhere around player
        for (let line of checkLines) {
            let markerCounts = this.getMarkerCountsInLine(line[0], line[1], line[2], line[3]);
            if (markerCounts[op] < this._gridWidth - 1) {
                for (let i = 0; i < this._gridWidth; i++) {
                    let checkX = line[0] + (line[2] * i);
                    let checkY = line[1] + (line[3] * i);
                    let marker = this._board[checkX][checkY];
                    if (marker === null) {
                        // Found it. Place our marker
                        this._board[checkX][checkY] = me;
                        return; // Our turn is done
                    }
                }
            }
        }
    }

    gameWon() {
        let lines = this.findLines();
        for (let line of lines) {
            if (line[5] === this._gridWidth) return line[4];
        }
        return false;
    }

    markersForLine(line) {
        // For a specified line, return an array containing the coordinates of all the markers
        let markers = [];
        for (let i = 0; i < line[5]; i++) {
            markers.push([line[0] + (line[2] * i), line[1] + (line[3] * i)]);
        }
        return markers;
    }

    findLines() {
        const LINE_DIRECTIONS = [
            ['-1,-1', '1,1'],
            ['1,-1', '-1,1'],
            ['0,-1', '0,1'],
            ['-1,0', '1,0']
        ];

        // Return a list of all lines on the game grid
        // Find all markers on grid
        // [0, 0, X]
        // [0, 1, O]
        let markers = [];
        for (let x = 0; x < this._gridWidth; x++) {
            for (let y = 0; y < this._gridHeight; y++) {
                if (this._board[x][y] !== null) markers.push([x, y, this._board[x][y]]);
            }
        }

        // For each marker, get a list of lines
        // Line = [x, y, xDir, yDir, marker, length]
        let lines = [];
        let checkLine = (x, y, deltaX, deltaY, marker, count) => {
            if ((x + deltaX) < 0 || (x + deltaX) >= this._gridWidth || (y + deltaY) < 0 || (y + deltaY) >= this._gridHeight) {
                return count; // Hit end of grid
            } else if (this._board[x + deltaX][y + deltaY] !== marker) {
                return count; // No marker in this direction, line done
            } else {
                return checkLine(x + deltaX, y + deltaY, deltaX, deltaY, marker, count + 1);
            }
        };
        for (let marker of markers) {
            if (marker === undefined) continue;

            // Check all directions around marker and tally up consecutive markers ('sublines') in that direction
            let sublines = {}; // deltaX,deltaY => x, y, deltaX, deltaY, marker, count in that direction
            for (let deltaX = -1; deltaX < 2; deltaX++) {
                for (let deltaY = -1; deltaY < 2; deltaY++) {
                    if (deltaX === 0 && deltaY === 0) continue;
                    // Check all spaces around marker
                    let count = checkLine(marker[0], marker[1], deltaX, deltaY, marker[2], 0);
                    if(count > 0) sublines[deltaX + ',' + deltaY] = ([marker[0], marker[1], deltaX, deltaY, marker[2], count + 1]);
                }
            }
            let linesFromHere = []; // Merge sublines into lines from here
            for (let dirs of LINE_DIRECTIONS) {
                let sublinesResolved = [];
                if (sublines[dirs[0]] !== undefined) sublinesResolved.push(sublines[dirs[0]]);
                if (sublines[dirs[1]] !== undefined) sublinesResolved.push(sublines[dirs[1]]);

                if (sublinesResolved.length === 1) {
                    // We're at the start or end of the line
                    linesFromHere.push(sublinesResolved[0]);
                } else if(sublinesResolved.length === 2) {
                    // We're in the middle of the line
                    // Reconcile the two sublines
                    let newCount = sublinesResolved[0][5] + sublinesResolved[1][5] - 1;
                    // Multiply the delta by the subline length
                    let deltaXMul = sublinesResolved[0][2] * sublinesResolved[0][5];
                    let deltaYMul = sublinesResolved[0][3] * sublinesResolved[0][5];
                    // Crawl back to the start of the line
                    let newX = sublinesResolved[0][0] + deltaXMul;
                    let newY = sublinesResolved[0][1] + deltaYMul;
                    // Create the new line
                    linesFromHere.push([newX, newY, -sublinesResolved[0][2], -sublinesResolved[0][3], sublinesResolved[0][4], newCount]);
                }
            }

            lines = lines.concat(linesFromHere);
        }

        return lines;
    }

    aiGame() {
        if(this._aiGameInt) return;

        let rx = Math.floor(Math.random() * this._gridWidth);
        let ry = Math.floor(Math.random() * this._gridHeight);
        this._board[rx][ry] = 'X';
        this.draw();

        let turn = false;

        this._aiGameInt = setInterval(() => {
            if (turn) {
                this.aiTurn('X', 'O');
            } else {
                this.aiTurn('O', 'X');
            }
            turn = !turn;
            // Check game over
            this._gameWon = this.gameWon();
            this.draw();
            if (this._gameWon) clearInterval(this._aiGameInt);
        }, 250); 
    }

    reset() {
        this._gameWon = false;
        $(this._gameStatus).html('');
        clearInterval(this._aiGameInt);
        this._aiGameInt = null;
        this.resetBoard();
        this.draw();
    }
}

let tictactoe = new TicTacToe('game', $('#gameStatus')[0]);
tictactoe.run();

function aiGame() {
    tictactoe.aiGame();
}

function reset() {
    tictactoe.reset();
}