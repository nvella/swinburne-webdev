class TicTacToe {
    constructor(canvas, gameStatus) {
        this._canvas = canvas;
        this._ctx = this._canvas.getContext('2d');
        this._gridWidth = 3;
        this._gridHeight = 3;
        this._gameStatus = gameStatus;

        this._gameWon = false;

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
        let boxWidth = this._canvas.width / this._gridWidth;
        let boxHeight = this._canvas.height / this._gridHeight;

        for (let x = 0; x < this._gridWidth; x++) {
            for (let y = 0; y < this._gridHeight; y++) {
                let boxLeft = boxWidth * x;
                let boxTop = boxHeight * y;

                if (x < this._gridWidth - 1) {
                    // Draw right border
                    this._ctx.beginPath();
                    this._ctx.moveTo(boxLeft + boxWidth, boxTop);    
                    this._ctx.lineTo(boxLeft + boxWidth, boxTop + boxHeight);
                    this._ctx.stroke();
                }

                if (y < this._gridHeight - 1) {
                    // Draw bottom border
                    this._ctx.beginPath();
                    this._ctx.moveTo(boxLeft, boxTop + boxHeight);
                    this._ctx.lineTo(boxLeft + boxWidth, boxTop + boxHeight);
                    this._ctx.stroke();
                }

                if (this._board[x][y] !== null) {
                    this._ctx.font = boxHeight + "px Arial";
                    this._ctx.fillText(this._board[x][y], boxLeft + 10, boxTop + boxHeight - 10);
                }
            }
        }

        if (this._gameWon) {
            this._gameStatus.innerHTML = "Game over!";
        }
    }

    onClick(event) {
        if (this._gameWon) return;

        let x = event.pageX - this._canvas.offsetLeft;
        let y = event.pageY - this._canvas.offsetTop;
        let boxWidth = this._canvas.width / this._gridWidth;
        let boxHeight = this._canvas.height / this._gridHeight;

        let boxX = Math.floor(x / boxWidth);
        let boxY = Math.floor(y / boxHeight);

        this.playerTurn(boxX, boxY);
        this.aiTurn('O', 'X');

        // Check game over
        this._gameWon = this.gameWon();

        this.draw();
    }

    run() {
        this._canvas.addEventListener('click', this.onClick.bind(this));
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
            /*
            // Remove all the markers specified in the linesFromHere from the current working set of markers
            for (let line of linesFromHere) {
                let markersInLine = this.markersForLine(line);
                for (let marker of markersInLine) {
                    for (let i in markers) {
                        if (markers[i][0] === marker[0] && markers[i][1] === marker[1]) {
                            
                            delete markers[i];
                        }
                    }
                }
            }
            */
            lines = lines.concat(linesFromHere);
        }

        //console.log(lines);
        return lines;
    }

    aiGame() {
        let rx = Math.floor(Math.random() * this._gridWidth);
        let ry = Math.floor(Math.random() * this._gridHeight);
        this._board[rx][ry] = 'X';
        this.draw();

        let turn = false;

        let interval = setInterval(() => {
            if (turn) {
                this.aiTurn('X', 'O');
            } else {
                this.aiTurn('O', 'X');
            }
            turn = !turn;
            // Check game over
            this._gameWon = this.gameWon();
            this.draw();
            if (this._gameWon) clearInterval(interval);
        }, 250); 
    }
}

let tictactoe = new TicTacToe(document.getElementById("c"), document.getElementById("gameStatus"));
tictactoe.run();

function aiGame() {
    tictactoe.aiGame();
}