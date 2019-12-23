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
    if (logging) console.log('\n')
    if (logging) console.log(`PAIR ${pairIndex}: ${pair} | MOVE: ${moves}`)
    pairIndex += 1;
    addPair(gameState, pair);

    moves.split('').forEach(function(move){
      // console.log(gameState.pair)
      makeMove(gameState, move);
    });
    // move newpos to top of board
    while (Math.min(gameState.pair.newPos[0][0], gameState.pair.newPos[1][0])) {
      gameState.pair.newPos[0][0] -= 1;
      gameState.pair.newPos[1][0] -= 1;
    }
    try {
      checkNewPos(gameState, gameState.pair.newPos, 'board');
    } catch (e) {
      console.log(gameState.pair.newPos)
      break;
    }
    // console.log('old board')
    // printState(gameState)
    updateBoard(gameState, gameState.pair.newPos, 'board');
    // console.log('new board')
    // printState(gameState)
    // remove pair
    gameState.blank = Array(12).fill().map(() => Array(6).fill(' '));
    gameState.pair = null;
    while(true) {
      let dropped = drop(gameState);
      // console.log(`gameState.gems:`, gameState.gems)
      let collisions = checkForCollisions(gameState);
      let lastCollision;
      for (let collision of collisions) {
        lastCollision = applyCollision(gameState, collision);
      }
      // if (collisions.length) continue;
      // check for collisions
      // console.log(lastCollision, gameState.gems)
      // printState(gameState)
      if (lastCollision === '0') {
        // seems like there is a glitch here
        let oldState = gameState.board.slice();
        drop(gameState);
        let moreCollisions = checkForCollisions(gameState);
        if (!moreCollisions.length) {
          gameState.board = oldState;
          findPowerGems(gameState);
        } else {
          for (let collision of moreCollisions) {
            lastCollision = applyCollision(gameState, collision);
          }
          printState(gameState)
        }
      } else {
        findPowerGems(gameState);
      }
      // console.log(`gameState.gems2:`, gameState.gems)
      if (!dropped && !collisions.length) break;
    }
    // findPowerGems(gameState);
    if (logging) console.log(gameState.gems)
    if (logging) printState(gameState);
  }
  // printState(gameState);
  return gameState.board.map((row) => row.join('')).join('\n');
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
      if (ele !== ' ' && ele !== '0') {
        c.add(ele.toUpperCase());
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
        if (doOverlap(rGems[i], gem)) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        gs.gems[color].push(rGems.splice(i, 1)[0]);
      }
    }
    // Any gems that contain the current gems, and doesnt overlap another current gem, replace
    for (let i = rGems.length - 1; i >= 0; i--) {
      for (let j = 0; j < gs.gems[color].length; j++) {
        if (contains(rGems[i], gs.gems[color][j])) {
          let overlap = false;
          for (let k = 0; k < gs.gems[color].length; k++) {
            if (k === j) continue;
            if (doOverlap(rGems[i], gs.gems[color][k])) {
              overlap = true;
              break;
            }
          }
          if (!overlap) {
            gs.gems[color].splice(j, 1, rGems.splice(i, 1)[0]);
          }
        }
      }
    }
    while(combineGems(gs, color)) {
      // console.log('is combine')
    }
  }
}

function combineGems(gs, color) {
  // find all the gems with the same col
  // if they have the same width, then if the row1 + height1 === row2,
  // They can be combined as [row1, col, height1 + height2, width]
  // find all the gems with the same row
  // if they have the same height, then if the col1 + width1 === col2,
  // They can be combined as [row1, col, height1, width1 + width2]
  for (let i = 0; i < gs.gems[color].length; i++) {
    for (let j = i + 1; j < gs.gems[color].length; j++) {
      if (
        gs.gems[color][i][1] === gs.gems[color][j][1] &&
        gs.gems[color][i][3] === gs.gems[color][j][3]
      ) {
        let gem1;
        let gem2;
        if (gs.gems[color][i][0] < gs.gems[color][j][0]) {
          gem1 = gs.gems[color][i];
          gem2 = gs.gems[color][j];
        } else {
          gem1 = gs.gems[color][j];
          gem2 = gs.gems[color][i];
        }
        let [row1, col1, height1, width1] = gem1;
        // console.log([row1, col1, height1, width1]);
        let [row2, col2, height2, width2] = gem2;
        // console.log([row2, col2, height2, width2]);
        if (row1 + height1 === row2) {
          let newGem = [row1, col1, height1 + height2, width1];
          gs.gems[color].splice(j, 1);
          gs.gems[color].splice(i, 1, newGem);
          return true;
        }
      }
      if (
        gs.gems[color][i][0] === gs.gems[color][j][0] &&
        gs.gems[color][i][2] === gs.gems[color][j][2]
      ) {
        let gem1;
        let gem2;
        if (gs.gems[color][i][1] < gs.gems[color][j][1]) {
          gem1 = gs.gems[color][i];
          gem2 = gs.gems[color][j];
        } else {
          gem1 = gs.gems[color][j];
          gem2 = gs.gems[color][i];
        }
        let [row1, col1, height1, width1] = gem1;
        let [row2, col2, height2, width2] = gem2
        if (col1 + width1 === col2) {
          let newGem = [row1, col1, height1, width1 + width2];
          gs.gems[color].splice(j, 1);
          gs.gems[color].splice(i, 1, newGem);
          return true;
        }
      }
    }
  }
  return false;
}

function doOverlap(gem1, gem2) {
  // two gems overlap if
  let [row1, col1, height1, width1] = gem1;
  let [row2, col2, height2, width2] = gem2
  return (
    (
      row1 <= row2 && row2 < (row1 + height1) &&
      col1 <= col2 && col2 < (col1 + width1)
    ) || (
      row2 <= row1 && row1 < (row2 + height2) &&
      col2 <= col1 && col1 < (col2 + width2)
    ) || (
      row1 <= row2 && row2 < (row1 + height1) &&
      col2 <= col1 && col1 < (col2 + width2)
    ) || (
      row2 <= row1 && row1 < (row2 + height2) &&
      col1 <= col2 && col2 < (col1 + width1)
    )
  )
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
          (i > 0 && gs.board[i-1][j].toUpperCase() === color) ||
          (i < 11 && gs.board[i+1][j].toUpperCase() === color) ||
          (j > 0 && gs.board[i][j-1].toUpperCase() === color) ||
          (j < 5 && gs.board[i][j+1].toUpperCase() === color)
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
      let color = gs.board[i+1][j].toUpperCase();
      gs.gems[color] = [];
      if (['R','Y','G','B'].includes(color)) {
        for (let row = 0; row < 12; row++) {
          for (var col = 0; col < 6; col++) {
            if (gs.board[row][col].toUpperCase() === color) {
              toRemove.push([row, col]);
            }
          }
        }
      }
    }
  } else {
    let color = collider.toUpperCase();

    while (toCheck.length) {
      let [i, j] = toCheck.shift();
      checked.push([i, j]);
      if (i > 0 && gs.board[i-1][j].toUpperCase() === color) {
        if(!checked.find(t => t[0] === i-1 && t[1] === j)) {
          toRemove.push([i-1, j]);
          toCheck.push([i-1, j]);
        }
      }
      if(i < 11 && gs.board[i+1][j].toUpperCase() === color) {
        if(!checked.find(t => t[0] === i+1 && t[1] === j)) {
          toRemove.push([i+1, j]);
          toCheck.push([i+1, j]);
        }
      }
      if(j > 0 && gs.board[i][j-1].toUpperCase() === color) {
        if(!checked.find(t => t[0] === i && t[1] === j-1)) {
          toRemove.push([i, j-1]);
          toCheck.push([i, j-1]);
        }
      }
      if(j < 5 && gs.board[i][j+1].toUpperCase() === color) {
        if(!checked.find(t => t[0] === i && t[1] === j+1)) {
          toRemove.push([i, j+1]);
          toCheck.push([i, j+1]);
        }
      }
    }
    // Remove any gems
    if (gs.gems[color]) {
      gs.gems[color] = gs.gems[color].filter(function(gem) {
        // row, col, height, width
        let [row, col, height, width] = gem;

        for (let [i, j] of toRemove) {
          // console.log([i, j])
          if (i < row) return false;
          if (i >= row + height) return false;
          if (j < col) return false;
          if (j >= col + width) return false;
        }

        return true;
      });
    }
  }
  for (let [i, j] of toRemove) {
    // console.log([i, j])
    gs.board[i][j] = ' ';
  }
  return collider;
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
              // console.log('\n')
              // printState(gs)
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
              // Need to update the state of the gem
              gs.gems[color] = gs.gems[color].map((g) => {
                if (
                  g[0] === row &&
                  g[1] === col &&
                  g[2] === height &&
                  g[3] === width
                ) {
                  g[0] = newRow;
                  return g;
                }
                return g;
              })
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
    // gs.board[gs.pair.pos[0][0]][gs.pair.pos[0][1]] = ' ';
    // gs.board[gs.pair.pos[1][0]][gs.pair.pos[1][1]] = ' ';
  }
  gs[board][newPos[0][0]][newPos[0][1]] = gs.pair.str[0];
  gs[board][newPos[1][0]][newPos[1][1]] = gs.pair.str[1];
}

let tests = [
  [ [ 'BB', 'B' ],
  [ 'YY', 'R' ],
  [ 'RB', 'AALL' ],
  [ 'YG', 'BBRR' ],
  [ 'GR', 'AA' ],
  [ 'YG', 'BBBRR' ],
  [ 'YG', 'ALLL' ],
  [ 'Bb', 'BBRRR' ],
  [ 'RB', 'BBBLLL' ],
  [ 'GG', 'BB' ],
  [ 'YR', 'RR' ],
  [ 'yb', 'R' ],
  [ 'BB', '' ],
  [ 'YG', '' ],
  [ 'YB', 'B' ],
  [ 'YG', 'AAAL' ],
  [ 'RG', 'BRRR' ],
  [ 'G0', 'RRR' ],
  [ 'BB', 'BBL' ],
  [ 'Gb', 'BBRR' ],
  [ 'RG', 'L' ],
  [ 'BG', 'BBR' ],
  [ 'BG', 'BL' ],
  [ 'GR', 'AR' ],
  [ 'BG', 'BBRRR' ],
  [ 'bY', 'BBLL' ],
  [ 'RG', 'A' ],
  [ 'G0', 'LL' ],
  [ 'GY', 'BBBLLL' ],
  [ 'YR', 'BBB' ],
  [ 'Gg', 'BLLL' ],
  [ 'YB', '' ],
  [ 'YG', 'RR' ],
  [ 'BY', 'AAR' ],
  [ 'RG', 'B' ],
  [ 'YG', 'AAL' ],
  [ 'RG', 'B' ],
  [ 'GB', 'R' ],
  [ 'YY', 'AAARR' ],
  [ 'GG', 'BBBR' ],
  [ 'YR', 'BR' ],
  [ 'RY', 'RR' ],
  [ 'BY', 'BBLL' ],
  [ 'RY', 'A' ],
  [ 'YG', 'AAA' ],
  [ 'GB', 'AARR' ],
  [ 'BB', 'BBL' ],
  [ 'RG', 'RRR' ],
  [ 'GG', 'AAARR' ],
  [ 'RG', 'BBBL' ],
  [ 'YR', 'AAA' ],
  [ 'GB', 'ALLL' ],
  [ 'GG', '' ],
  [ 'RR', 'L' ],
  [ 'RG', '' ],
  [ 'BG', 'BBRR' ],
  [ 'bY', 'LL' ],
  [ 'RY', 'BB' ],
  [ 'YY', 'AAAL' ],
  [ 'GB', 'BBR' ],
  [ 'Rb', 'BLLL' ],
  [ 'Yb', '' ] ]
]

for (let test of tests) {
  let result = puzzleFighter(test);
  // console.log(result.split('\n').map((r) => '|' + r + '|').join('\n'))
}
// [ [ 10, 0, 2, 3 ], [ 8, 0, 4, 2 ] ]

//  [ 9, 1, 2, 2 ], [ 8, 2, 2, 2 ]

// console.log(doOverlap([ 9, 1, 2, 2 ], [ 8, 2, 2, 2 ]))
