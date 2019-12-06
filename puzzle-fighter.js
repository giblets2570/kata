//need help with debugging?
//uncomment the line below to see the game state for each Gem pair
seeStates = true;
let logging = true;
function puzzleFighter(arr){
  console.log(arr);
	//your code goes here. you can do it!
  let gameState = {
    board: Array(12).fill().map(() => Array(6).fill(' ')),
    blank: Array(12).fill().map(() => Array(6).fill(' ')),
    pair: null,
    gems: {
      B: [],
      G: [],
      R: [],
      Y: [],
    },
  };
  let pairIndex = 0;
  for (let [pair, moves] of arr) {
    pairIndex += 1;
    addPair(gameState, pair);

    moves.split('').forEach(function(move){
      // console.log(gameState.pair)
      makeMove(gameState, move);
    });
    try {
      checkNewPos(gameState, gameState.pair.newPos, 'board');
    } catch (e) {
      break;
    }

    updateBoard(gameState, gameState.pair.newPos, 'board');
    // remove pair
    gameState.blank = Array(12).fill().map(() => Array(6).fill(' '));
    gameState.pair = null;
    let checker = 0;
    while(true) {
      let dropped = drop(gameState);
      // check for collisions
      // console.log(`gameState.gems:`, gameState.gems)
      findPowerGems(gameState);
      let collisions = checkForCollisions(gameState);
      for (let collision of collisions) {
        applyCollision(gameState, collision);
      }
      // console.log(`gameState.gems2:`, gameState.gems)
      if (!dropped) break;
    }
    if (logging) console.log('\n')
    if (logging) console.log(`PAIR ${pairIndex}: ${pair} | MOVE: ${moves}`)
    if (logging) console.log(gameState.gems)
    if (logging) printState(gameState);
  }
  // printState(gameState);
  return gameState.board.map((row) => row.join('')).join('\n');
}

function testPowerGems() {
  let gameState = {
    board: [
      [' ',' ',' ',' ',' ',' '],
      [' ',' ',' ',' ',' ',' '],
      [' ',' ',' ',' ',' ',' '],
      [' ',' ',' ',' ',' ',' '],
      [' ',' ',' ',' ',' ',' '],
      [' ',' ',' ',' ',' ',' '],
      [' ',' ',' ',' ',' ',' '],
      [' ',' ',' ',' ',' ',' '],
      [' ',' ',' ',' ',' ',' '],
      [' ','R','R',' ',' ',' '],
      [' ','R','R','R',' ',' '],
      ['B','B','R','R',' ',' '],
    ],
    pair: null
  };
  findPowerGems(gameState);
  console.log(gameState.gems)
}

function contains(bigger, smaller) {
  let [row1, col1, height1, width1] = bigger;
  let [row2, col2, height2, width2] = smaller;
  if (row1 > row2) return false;
  if (col1 > col2) return false;

  if (row1 === row2) {
    if (col1 === col2) {
      if (
        (height1 > height2 && width1 >= width2) ||
        (height1 >= height2 && width1 > width2)
      ) {
        return true;
      }
      return false;
    } else if (col1 < col2) {
      let diff = col2 - col1;
      if (
        (height1 >= height2 && width1 >= width2+diff)
      ) {
        return true;
      }
      return false;
    }
  } else if (row1 < row2) {
    let diffrow = row2 - row1;
    if (col1 === col2) {
      if (
        (height1 >= height2+diffrow && width1 >= width2)
      ) {
        return true;
      }
      return false;
    } else if (col1 < col2) {
      let diffcol = col2 - col1;
      if (
        (height1 >= height2+diffrow && width1 >= width2+diffcol)
      ) {
        return true;
      }
      return false;
    }
  }
}

function findPowerGems(gs) {
  let colors = Array.from(gs.board.reduce((c, row) => {
    for (let ele of row) {
      if (ele !== ' ') {
        c.add(ele);
      }
    }
    return c;
  }, new Set()));
  for (let color of colors) {
    // get horizontal lines
    let lines = []
    for (let row = 0; row < 12; row++) {
      lines.push([]);
      for (let colStart = 0; colStart < 6; colStart++) {
        if (gs.board[row][colStart] !== color) continue;
        for (let colEnd = colStart+1; colEnd < 6; colEnd++) {
          if (gs.board[row][colEnd] !== color) break;
          if (colEnd - colStart >= 1) lines[row].push([colStart, colEnd+1]);
        }
      }
    }
    // Join horizontal lines
    let gems = [];
    for (let rowStart = 0; rowStart < 12; rowStart++) {
      for (let line of lines[rowStart]) {
        let currentHeight = 1;
        for (let rowEnd = rowStart+1; rowEnd < 12; rowEnd++) {
          if (!lines[rowEnd].find((l) => l[0] === line[0] && l[1] === line[1])) {
            break;
          }
          currentHeight += 1;
          if (currentHeight > 1) {
            // row, col, height, width
            gems.push([rowStart, line[0], currentHeight, line[1] - line[0]]);
          }
        }
      }
    }
    // Any gems that dont overlap the current gems, add to the current gems
    let rGems = gems.slice().reverse();
    for (let i = rGems.length - 1; i >= 0; i--) {
      let overlap = false;
      for(let gem of gs.gems[color]) {

      }
      if (!overlap) {
        gs.gems[color].push(rGems.splice(i, 1)[0]);
      }
    }
  }
  return {};
}

function makeMove(gs, move) {
  switch (move) {
    case 'L':
      moveDirection(gs, -1);
      break;
    case 'R':
      moveDirection(gs, +1);
      break;
    case 'A':
      rotate(gs, -1);
      break;
    case 'B':
      rotate(gs, +1);
      break;
    default:
      console.log(`${move} has no action`)
  }
}

function printState(gs) {
  // console.log(util.inspect(gs, { showHidden: true, depth: null, colors: true }));
  // console.log(gs.board);
  console.log(gs.board.map((row) => '|'+row.join('')+'|').join('\n'));
}

function addPair(gs, pair) {
  if (gs.pair) throw new Error('Already active pair');
  gs.blank[0][3] = pair[0];
  gs.blank[1][3] = pair[1];
  gs.pair = {
    str: pair,
    align: 0,
    pos: [[0, 3],[1, 3]],
    newPos: [[0, 3],[1, 3]],
  };
}

function checkForCollisions(gs) {
  let collisions = [];
  for (let i = gs.board.length - 1; i >= 0; i--) {
    for (let j = 0; j < gs.board[i].length; j++) {
      if (gs.board[i][j] === '0') {
        collisions.push([i, j]);
      } else if (gs.board[i][j] > 'Z') { // lowercase
        // Check if there are any touching
        let color = gs.board[i][j].toUpperCase();
        if (
          (i > 0 && gs.board[i-1][j] === color) ||
          (i < 11 && gs.board[i+1][j] === color) ||
          (j > 0 && gs.board[i][j-1] === color) ||
          (j < 5 && gs.board[i][j+1] === color)
        ) {
          collisions.push([i, j]);
        }
      }
    }
  }
  return collisions;
}

function applyCollision(gs, collision) {
  let collider = gs.board[collision[0]][collision[1]];
  let toRemove = [collision];
  let toCheck = [collision];
  let checked = [];
  if (collider === '0') {
    // TODO: case with rainbow
    let [i, j] = toCheck.shift();
    if (i !== 11) {
      // it is not on the floor
      let color = gs.board[i+1][j];
      for (let row = 0; row < 12; row++) {
        for (var col = 0; col < 6; col++) {
          if (gs.board[row][col].toUpperCase() === color) {
            toRemove.push([row, col]);
          }
        }
      }
    }
  } else {
    let color = collider.toUpperCase();
    while (toCheck.length) {
      let [i, j] = toCheck.shift();
      checked.push([i, j]);
      if (i > 0 && gs.board[i-1][j] === color) {
        if(!checked.find(t => t[0] === i-1 && t[1] === j)) {
          toRemove.push([i-1, j]);
          toCheck.push([i-1, j]);
        }
      }
      if(i < 11 && gs.board[i+1][j] === color) {
        if(!checked.find(t => t[0] === i+1 && t[1] === j)) {
          toRemove.push([i+1, j]);
          toCheck.push([i+1, j]);
        }
      }
      if(j > 0 && gs.board[i][j-1] === color) {
        if(!checked.find(t => t[0] === i && t[1] === j-1)) {
          toRemove.push([i, j-1]);
          toCheck.push([i, j-1]);
        }
      }
      if(j < 5 && gs.board[i][j+1] === color) {
        if(!checked.find(t => t[0] === i && t[1] === j+1)) {
          toRemove.push([i, j+1]);
          toCheck.push([i, j+1]);
        }
      }
    }
  }
  for (let [i, j] of toRemove) {
    gs.board[i][j] = ' ';
  }
}

function drop(gs) {
  let toDrop = [];
  for (let i = gs.board.length - 2; i >= 0; i--) {
    for (let j = gs.board[i].length-1; j >= 0; j--) {
      if (gs.board[i][j] !== ' ' && gs.board[i+1][j] === ' ') {

        // Need to check if in a gem and can move
        if(gs.board[i][j] <= 'Z') {
          let color = gs.board[i][j];
          let gems = gs.gems[color];
          if (gems) {
            let gem = gems.find(function(gem) {
              // row, col, height, width
              let [row, col, height, width] = gem;
              if (i < row) return false;
              if (i >= row + height) return false;
              if (j < col) return false;
              if (j >= col + width) return false;
              return true;
            });
            if (gem) {
              // console.log(gem)
              let [row, col, height, width] = gem;
              let newRow = 11;
              for (let k = col; k < col + width; k++) {
                let _newRow = row;
                while(_newRow + height <= 11 && gs.board[_newRow + height][k] === ' ') {
                  _newRow += 1;
                }
                newRow = Math.min(_newRow, newRow);
              }
              // console.log(gem, newRow)
              if (newRow === row) continue;
              toDrop.push(gem);
              // Add new gem
              for (let k = col; k < col + width; k++) {
                for (let r = row; r < row + height; r++) {
                  gs.board[r][k] = ' ';
                }
                for (let r = newRow; r < newRow + height; r++) {
                  // console.log(r, k)
                  gs.board[r][k] = color;
                }
              }

              continue;
            }
          }
        }

        toDrop.push([i, j]);
        let index = i;
        while (index < 11) {
          if (gs.board[index+1][j] !== ' ') break;
          let value = gs.board[index][j];
          gs.board[index][j] = ' ';
          gs.board[index+1][j] = value;
          index += 1;
        }
      }
    }
  }
  return toDrop.length > 0;
}

function rotate(gs, rotation) {
  if (!gs.pair) throw new Error('No active pair');
  // -1, anticlock +1 clock
  let newPos = [[...gs.pair.newPos[0]],[...gs.pair.newPos[1]]];
  let newAlign = (gs.pair.align + rotation + 4) % 4;
  switch (newAlign) {
    case 0:
      newPos[1] = [newPos[0][0]+1,newPos[0][1]];
      break;
    case 1:
      newPos[1] = [newPos[0][0],newPos[0][1]-1];
      if (newPos[1][1] < 0) {
        newPos[0][1] += 1;
        newPos[1][1] += 1;
      }
      break;
    case 2:
      newPos[1] = [newPos[0][0]-1,newPos[0][1]];
      if (newPos[1][0] < 0) {
        newPos[0][0] += 1;
        newPos[1][0] += 1;
      }
      break;
    case 3:
      newPos[1] = [newPos[0][0],newPos[0][1]+1];
      if (newPos[1][1] > 5) {
        newPos[0][1] -= 1;
        newPos[1][1] -= 1;
      }
      break;
    default: break
  }
  checkNewPos(gs, newPos);
  updateBoard(gs, newPos);
  gs.pair.newPos = newPos;
  gs.pair.align = newAlign;
}

function moveDirection(gs, direction) {
  // -1 left, +1 right
  if (!gs.pair) throw new Error('No active pair');
  if (direction === -1) {
    if (gs.pair.newPos[0][1] === 0 || gs.pair.newPos[1][1] === 0) {
      // throw new Error(`Can't move left`)
      return `Can't move left`
    }
  } else {
    if (gs.pair.newPos[0][1] === 5 || gs.pair.newPos[1][1] === 5) {
      // throw new Error(`Can't move right`)
      return `Can't move right`
    }
  }
  let newPos = [[...gs.pair.newPos[0]],[...gs.pair.newPos[1]]];
  newPos[0][1] += direction;
  newPos[1][1] += direction;
  checkNewPos(gs, newPos);
  updateBoard(gs, newPos);
  gs.pair.newPos = newPos;
}

function checkNewPos(gs, newPos, board='blank') {
  if (newPos[0][0] < 0 || newPos[1][0] < 0) {
    throw new Error(`Can't move to new pos`)
  }
  let cantMove = false;
  if (board === 'blank') {
    gs.blank[gs.pair.newPos[0][0]][gs.pair.newPos[0][1]] = ' ';
    gs.blank[gs.pair.newPos[1][0]][gs.pair.newPos[1][1]] = ' ';
    // console.log(gs.blank)
    cantMove = (
      gs.blank[newPos[0][0]][newPos[0][1]] !== ' ' ||
      gs.blank[newPos[1][0]][newPos[1][1]] !== ' '
    );
    gs.blank[gs.pair.newPos[0][0]][gs.pair.newPos[0][1]] = gs.pair.str[0];
    gs.blank[gs.pair.newPos[1][0]][gs.pair.newPos[1][1]] = gs.pair.str[1];
  } else {
    cantMove = (
      gs.board[gs.pair.newPos[0][0]][gs.pair.newPos[0][1]] !== ' ' ||
      gs.board[gs.pair.newPos[1][0]][gs.pair.newPos[1][1]] !== ' '
    );
  }
  if (cantMove) {
    throw new Error(`Can't move to new pos`)
  }
}

function updateBoard(gs, newPos, board='blank') {
  if (board === 'blank') {
    gs.blank[gs.pair.newPos[0][0]][gs.pair.newPos[0][1]] = ' ';
    gs.blank[gs.pair.newPos[1][0]][gs.pair.newPos[1][1]] = ' ';
  } else {
    gs.board[gs.pair.pos[0][0]][gs.pair.pos[0][1]] = ' ';
    gs.board[gs.pair.pos[1][0]][gs.pair.pos[1][1]] = ' ';
  }
  gs[board][newPos[0][0]][newPos[0][1]] = gs.pair.str[0];
  gs[board][newPos[1][0]][newPos[1][1]] = gs.pair.str[1];
}

let tests = [
  [ [ 'BB', 'LLLL' ],
  [ 'BB', 'LL' ],
  [ 'BB', 'L' ],
  [ 'BB', 'LLL' ],
  [ 'BB', 'LL' ],
  [ 'BG', 'L' ],
  [ 'BB', '' ],
  [ 'BB', 'R' ],
  [ 'RB', 'BBRRR' ],
  [ 'RR', 'LLL' ],
  [ 'RR', 'BALL' ],
  [ 'RR', '' ],
  [ 'RR', 'R' ],
  [ 'RR', 'L' ],
  [ 'RR', 'B' ],
  [ 'RR', 'LLL' ],
  [ 'RR', 'LL' ],
  [ 'RR', 'BLLL' ],
  [ 'RR', 'B' ],
  [ 'YR', 'ALL' ],
  [ 'GR', 'AL' ],
  [ 'Rb', 'RRRR' ] ]
]

for (let test of tests) {
  let result = puzzleFighter(test);
  // console.log(result.split('\n').map((r) => '|' + r + '|').join('\n'))
}
