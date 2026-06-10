let width = 10;
let height = 10;
let mines = 20;
let active = false;
let tiles = [];
let debug = true;

document.getElementById("submit").addEventListener("click", submit);
document.getElementById("reset").addEventListener("click", submit);
function submit(event) {
    active = false;
    if (event && event.target && event.target.id == "submit") {
        width = parseInt(document.getElementById("widthInput").value);
        height = parseInt(document.getElementById("heightInput").value);

        if (document.getElementById("minesInput").value.includes("%")) {
            mines = Math.floor(document.getElementById("minesInput").value.slice(0, document.getElementById("minesInput").value.indexOf("%")) / 100 * (width * height));
        } else {
            mines = parseInt(document.getElementById("minesInput").value);
        }
    }
    
    if (width <= 3 || height <= 3) {
        if (debug) console.log("ERROR: Board must be at least 4x4! Fixing...");
        if (width <= 3) width = 4;
        if (height <= 3) height = 4;
        if (debug) console.log(`Width set to ${width}, Height set to ${height}`);
    }
    drawGrid(width, height);
    statusBar();
}

function drawGrid(width, height) {
    // Clears old board
    document.getElementById("game").innerHTML = "";
    tiles = [];

    document.getElementById("game").style.gridTemplateColumns = `repeat(${width}, 1fr)`;
    document.getElementById("game").style.gridTemplateRows = `repeat(${height}, 1fr)`;
    for (let h = 0; h < height; h++) {
        for (let w = 0; w < width; w++) {
            let div = document.createElement("div");
            div.id = `${w},${h}`;
            let span = document.createElement("span");
            span.id = `${w},${h}.span`;
            div.classList.add(`x${w}`);
            div.classList.add(`y${h}`);
            div.classList.add("tile");
            div.addEventListener("click", lClickTile);
            div.addEventListener('contextmenu', rClickTile);
            tiles.push(div);
            document.getElementById("game").appendChild(div);
            document.getElementById(`${w},${h}`).appendChild(span);
        }
    }
}

function lClickTile(event) {
    if (debug) console.log(`Clicked: ${event.target.id}`);
    if (!event.target.classList.contains("locked")) {
        if (!active) {
            startGame(event.target);
            detectMines(event.target);
        }

        if (event.target.classList.contains("mine")) {
            if (debug) console.log("***Game Over***");
            active = false;
            Array.from(document.getElementsByClassName("tile")).forEach(t => {
                t.classList.add("locked");
                if (t.classList.contains("mine")) t.classList.add("lose");
            });
            statusBar();
        } else if (!event.target.classList.contains("revealed") && event.target.classList.contains("tile")) {
            event.target.classList.add("revealed");
            detectMines(event.target);
            winCheck();
        } else if (event.target.classList.contains("revealed")) {
            if (sweep(event.target)) {
                getSurroundingTiles(event.target).forEach(t => {
                    if (!t.classList.contains("flag") && !t.classList.contains("revealed")) {
                        if (!t.classList.contains("flag") && t.classList.contains("mine")) {
                            if (debug) console.log("***Game Over***");
                            active = false;
                            Array.from(document.getElementsByClassName("tile")).forEach(t => {
                                t.classList.add("locked");
                                if (t.classList.contains("mine")) t.classList.add("lose");
                            });
                            statusBar();
                        } else {
                            t.classList.add("revealed");
                            detectMines(t);
                            winCheck();
                        }
                    }
                });
            }
        }
    }
}

function rClickTile(event) {
    event.preventDefault(); // Prevents the default browser context menu (I had to look this up to figure out how to get it working)
    if (active) {
        if (!event.target.classList.contains("flag") && !event.target.classList.contains("revealed") && !event.target.classList.contains("locked")) {
            event.target.classList.add("flag");
            event.target.classList.add("locked");
            if (debug) console.log(`Flagged ${event.target.id}`);

            let x = 0;
            let y = 0;
            for (let c of event.target.classList) {
                if (c.startsWith("x")) x = Number(c.slice(1));
                if (c.startsWith("y")) y = Number(c.slice(1));
            }
            document.getElementById(`${x},${y}.span`).innerHTML = "F";

            winCheck();
        } else if (event.target.classList.contains("flag")) {
            event.target.classList.remove("flag");
            event.target.classList.remove("locked");
            if (debug) console.log(`Unflagged ${event.target.id}`);

            for (let c of event.target.classList) {
                if (c.startsWith("x")) x = Number(c.slice(1));
                if (c.startsWith("y")) y = Number(c.slice(1));
            }
            document.getElementById(`${x},${y}.span`).innerHTML = "";
        }
    }
}

function detectMines(tile) {
    let x = 0;
    let y = 0;
    for (let c of tile.classList) {
        if (c.startsWith("x")) x = Number(c.slice(1));
        if (c.startsWith("y")) y = Number(c.slice(1));
    }

    let surroundingTiles = getSurroundingTiles(tile);

    // Surrounding mine count
    let m = 0;
    surroundingTiles.forEach(t => {
        if (t.classList.contains("mine")) m++;
    });
    tile.classList.add(`sm${m}`);

    // Adds the text to each tile
    Array.from(document.getElementsByClassName("tile")).forEach(t => {
        if (t) for (let c of t.classList) {
            if (c.startsWith("sm")) {
                let x1 = 0;
                let y1 = 0;
                for (let e of t.classList) {
                    if (e.startsWith("x")) x1 = Number(e.slice(1));
                    if (e.startsWith("y")) y1 = Number(e.slice(1));
                }
                document.getElementById(`${x1},${y1}.span`).innerHTML = c.slice(2);
                textColor(document.getElementById(`${x1},${y1}.span`));
            }
        }
    });

    // Reveals adjacent empty tiles
    if (tile.classList.contains("sm0")) {
        surroundingTiles.forEach(t => {
            if (!t.classList.contains("revealed")) {
                t.classList.add("revealed");
                detectMines(t);
                winCheck();
            }
        });
    }
}

function textColor(span) {
    if (span.innerHTML === "0") span.classList.add("zero");
    if (span.innerHTML === "1") span.classList.add("one");
    if (span.innerHTML === "2") span.classList.add("two");
    if (span.innerHTML === "3") span.classList.add("three");
    if (span.innerHTML === "4") span.classList.add("four");
    if (span.innerHTML === "5") span.classList.add("five");
    if (span.innerHTML === "6") span.classList.add("six");
    if (span.innerHTML === "7") span.classList.add("seven");
    if (span.innerHTML === "8") span.classList.add("eight");
}

function getSurroundingTiles(tile) {
    let x = 0;
    let y = 0;
    for (let c of tile.classList) {
        if (c.startsWith("x")) x = Number(c.slice(1));
        if (c.startsWith("y")) y = Number(c.slice(1));
    }

    let surroundingTiles = [];

    let candidates = [
        document.getElementById(`${x - 1},${y}`),
        document.getElementById(`${x + 1},${y}`),
        document.getElementById(`${x},${y - 1}`),
        document.getElementById(`${x},${y + 1}`),
        document.getElementById(`${x - 1},${y - 1}`),
        document.getElementById(`${x + 1},${y - 1}`),
        document.getElementById(`${x - 1},${y + 1}`),
        document.getElementById(`${x + 1},${y + 1}`)
    ];

    candidates.forEach(t => {
        if (t) surroundingTiles.push(t);
    });
    
    return surroundingTiles;
}

function startGame(tile) {
    if (mines >= width * height) {
        if (debug) console.log("ERROR: At least nine tiles must be safe! Fixing...");
        mines = width * height - 9;
        if (debug) console.log(`Mines now set to ${mines}`);
    }
    if (debug) console.log("---Game Started---");
    active = true;
    populateBoard(tile);
}

let num = 0;
function populateBoard(tile) {
    let minePool = Array.from(tiles);
    let minesToPlace = mines;

    minePool.splice(minePool.indexOf(tile), 1); // This makes sure the first tile and the you click and the 8 tiles around it will always be safe
    let f = getSurroundingTiles(tile);
    f.forEach(t => {
        minePool.splice(minePool.indexOf(t), 1);
    });

    while (minesToPlace > 0) {
        if (minePool.length === 0) break;

        num = Math.floor(Math.random() * minePool.length);
        minePool[num].classList.add("mine");
        minePool.splice(num, 1);
        minesToPlace--;
    }
}

function statusBar() {
    allFlags = document.getElementsByClassName("flag").length;
    document.getElementById("status").innerHTML = `Flagged: ${allFlags}/${Math.floor(mines)}`;

    if (document.getElementsByClassName("win").length) document.getElementById("status").innerHTML = "You Win!";
    if (document.getElementsByClassName("lose").length) document.getElementById("status").innerHTML = "You Lose!";
}

function winCheck() {
    let allTiles = Array.from(document.getElementsByClassName("tile"));

    let allMinesCount = 0;
    allTiles.forEach(t => {
        if (t.classList.contains("mine") && t.classList.contains("flag")) allMinesCount++;
    });
    if (allMinesCount == mines) win(); // Checks if all mines are flagged
    
    let notMines = [];
    allTiles.forEach(t => {
        if (!t.classList.contains("mine")) notMines.push(t);
    });
    let notMinesCount = 0;
    notMines.forEach(t => {
        if (t.classList.contains("revealed")) notMinesCount++;
    });
    if (notMinesCount == notMines.length) win(); // Checks if all non-mines are revealed

    statusBar();
} // (Both are win conditions)

function win() {
    active = false;
    Array.from(document.getElementsByClassName("tile")).forEach(t => {
        t.classList.add("locked");
        if (t.classList.contains("mine")) {
            t.classList.add("win");
        }
    });
    if (debug) console.log("***You Win!***");
}

// Reveals rest of surrounding tiles when clicked if all mines in vicinity are flagged
function sweep(tile) {
    let surroundingTiles = getSurroundingTiles(tile);
    let flagCount = 0;
    surroundingTiles.forEach(t => {
        if (t.classList.contains("flag")) flagCount++;
    });

    let x = 0;
    let y = 0;
    for (let c of tile.classList) {
        if (c.startsWith("x")) x = Number(c.slice(1));
        if (c.startsWith("y")) y = Number(c.slice(1));
    }

    if (flagCount == Number(document.getElementById(`${x},${y}.span`).innerHTML)) return true;
    return false;
}

drawGrid(width, height);