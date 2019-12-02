//need help with debugging?
//uncomment the line below to see the game state for each Gem pair
seeStates = true;
function puzzleFighter(arr){
	//your code goes here. you can do it!
  let gameState = {
    board: Array(12).fill().map(() => Array(6).fill(' ')),
    blank: Array(12).fill().map(() => Array(6).fill(' ')),
    pair: null,
    gems: {},
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

    // console.log(`PAIR ${pairIndex}: ${pair} | MOVE: ${moves}`)

    updateBoard(gameState, gameState.pair.newPos, 'board');
    // remove pair
    gameState.blank = Array(12).fill().map(() => Array(6).fill(' '));
    gameState.pair = null;
    let checker = 0;
    while(true) {
      let dropped = drop(gameState);
      if (!dropped) break;
      // check for collisions
      let collisions = checkForCollisions(gameState);
      for (let collision of collisions) {
        applyCollision(gameState, collision);
      }
      gameState.gems = findPowerGems(gameState);
    }
    // printState(gameState);
    // console.log('\n')
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
  gameState.gems = findPowerGems(gameState);
  // console.log(gameState.gems)
}

function findPowerGems(gs) {
  let boardcopy = [...gs.board.map((row) => [...row])];
  let colors = Array.from(gs.board.reduce((c, row) => {
    for (let ele of row) {
      if (ele !== ' ') {
        c.add(ele);
      }
    }
    return c;
  }, new Set()));
  let colorGems = {};
  for (let color of colors) {
    // first find all lines
    let lines = [];
    for (let col = 0; col < 6; col++) {
      lines.push([]);
      let current = -1;
      for (let row = 0; row < 12; row++) {
        if (gs.board[row][col] === color && current === -1) {
          current = row;
        } else if (gs.board[row][col] !== color && current > -1) {
          if (row - current >= 2) {
            lines[col].push([current, row]);
          }
          current = -1;
        }
      }
      if (current > -1 && current < 11) {
        lines[col].push([current, 12]);
      }
    }
    // now find all possible power gems for those lines
    let possibleGems = [];
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].length) continue;
      for (let li = 0; li < lines[i].length; li++) {
        let [min, max] = lines[i][li];
        let currentWidth = 1;
        for (let j = i + 1; j < lines.length; j++) {
          // Find an overlapping line
          let line = lines[j].find((l) => l[0] <= max && l[1] >= min);
          if (!line) break;
          let newMin = Math.max(line[0], min);
          let newMax = Math.min(line[1], max);
          if (newMax-newMin < 2) break;
          min = newMin;
          max = newMax;
          currentWidth += 1;
        }
        if (currentWidth > 1) {
          possibleGems.push([min, i, max - min, currentWidth]); // row, col, height, width
          // Remove this line as an option
          for (let k = i; k < i + currentWidth; k++) {
            for (let i = 0; i < lines.length; i++) {
              lines[k] = lines[k].map((l) => {
                if (l[1] < min) return l;
                return [max, max];
              })
            }
          }
        }
      }
    }
    if (possibleGems.length) {
      colorGems[color] = possibleGems;
    }
  }
  return colorGems;
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
    for (let j = 0; j < gs.board[i].length; j++) {
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
                while(gs.board[_newRow + height][k] === ' ' && _newRow + height < 11) {
                  _newRow += 1;
                }
                newRow = Math.min(_newRow, newRow);
              }
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
    // console.log(gs.pair.pos);
    // console.log(gs.pair.newPos);
    // console.log(gs.blank)
    throw new Error(`Can't move to new pos`)
  }
}
// PAIR 0: GY | MOVE: LL
function updateBoard(gs, newPos, board='blank') {
  // console.log(gs.pair.pos);
  // console.log(gs.pair.newPos);
  if (board === 'blank') {
    gs[board][gs.pair.newPos[0][0]][gs.pair.newPos[0][1]] = ' ';
    gs[board][gs.pair.newPos[1][0]][gs.pair.newPos[1][1]] = ' ';
  } else {
    gs[board][gs.pair.pos[0][0]][gs.pair.pos[0][1]] = ' ';
    gs[board][gs.pair.pos[1][0]][gs.pair.pos[1][1]] = ' ';
  }
  gs[board][newPos[0][0]][newPos[0][1]] = gs.pair.str[0];
  gs[board][newPos[1][0]][newPos[1][1]] = gs.pair.str[1];

}

let tests = [
  // [
  //   ['BR','LLL'],
  //   ['BY','LL'],['BG','ALL'],['BY','BRR'],['RR','AR'],['GY','A'],['BB','AALLL'],['GR','A'],['RY','LL'],['GG','L'],['GY','BB'],['bR','ALLL'],['gy','AAL']
  // ],
  // [['GR','ALLL'],['GG','ALLL'],['RG','AAL'],['RB','BLL'],['RG','ALL'],['BB','RR'],['BR','BB'],['BR','ALLL'],['YB','R'],['BG','BBRR'],['YR','AAR'],['RR','L'],['RR','ABLL'],['GY','BRR'],['BB','R'],['gB','RR'],['BR','ALL'],['Gr','BB'],['Rb','R'],['GG','B'],['bB','LL']],
  // [['RR','LLL'],['GG','LL'],['RG','BBL'],['GY','AR'],['RR','BBLLL'],['RB','AALL'],['GR','B'],['GB','AR'],['RR',''],['GG','R'],['YR','BR'],['RR','LLL'],['BR','AALL'],['Bg',''],['RR','BBBBLLL'],['GR','ALLL'],['bR','L'],['YG','BBBALL'],['RR','L'],['YB','AL']],
  // [['BB','LLLL'],['BB','LL'],['BB','L'],['BB','LLL'],['BB','LL'],['BG','L'],['BB',''],['BB','R'],['RB','BBRRR'],['RR','LLL'],['RR','BALL'],['RR',''],['RR','R'],['RR','L'],['RR','B'],['RR','LLL'],['RR','LL'],['RR','BLLL'],['RR','B'],['YR','ALL'],['GR','AL'],['Rb','RRRR']],
  // [['YY','BALLL'],['RR','AALL'],['RG','BR'],['YG','ALLR'],['BG','BRR'],['YR','BBLLLL'],['GR','BL'],['GG','ALB'],['GY',''],['yB','RR'],['GG','R'],['RB','LLLAAAB'],['Ry','LL'],['BG','BR'],['RB','BBRRR'],['Rg','R'],['bR','L'],['YR','BLLL'],['RR','LLLLLLLL'],['Yg','AALL'],['Br','LLL']],
  // [['RY','ALLL'],['YY','L'],['RG','BBR'],['YR','BLL'],['RR','ALLLL'],['GY','B'],['RR','RRRRRRR'],['RY','ALLL'],['BY','BBBBLL'],['BY','L'],['BG','BBBL'],['BB','LLL'],['BY','BBLL'],['BR','AL'],['RB','AR'],['BB','RR'],['GG','R'],['YB','LLLRR'],['GG',''],['rb','RR'],['bY','ABLL'],['GY','L'],['GR','BRR'],['RR','LLL'],['yy','LLLB'],['RY','BB']],
  [ [ 'GY', 'LL' ],
  [ 'BG', 'R' ],
  [ 'BB', 'BR' ],
  [ 'GG', 'BR' ],
  [ 'RG', 'AAL' ],
  [ 'GB', 'BBRR' ],
  [ 'YG', 'RR' ],
  [ 'YG', 'BRR' ],
  [ 'BG', 'LL' ],
  [ 'GB', '' ],
  [ 'RR', 'R' ],
  [ 'YR', 'AAAA' ],
  [ 'RB', 'RRA' ],
  [ 'YB', 'BB' ],
  [ 'BY', 'LLLB' ],
  [ 'bY', 'R' ],
  [ 'GB', 'L' ],
  [ 'RR', 'L' ],
  [ '0G', 'AARR' ],
  [ 'RB', 'AAL' ],
  [ 'GB', 'ALL' ],
  [ 'yB', 'R' ],
  [ 'Br', 'LLLA' ],
  [ 'BY', 'L' ],
  [ 'GR', 'ALL' ],
  [ 'B0', 'L' ],
  [ 'rY', 'ALL' ],
  [ 'RB', 'ALLL' ],
  [ 'BR', 'ALL' ],
  [ 'RR', 'LLLLR' ],
  [ 'GY', 'ALLL' ],
  [ 'BB', 'LL' ],
  [ '0G', 'RRA' ],
  [ 'yr', 'AALL' ] ]
]

for (let test of tests) {
  console.log(puzzleFighter(test));
}
