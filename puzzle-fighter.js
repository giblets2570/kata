//need help with debugging?
//uncomment the line below to see the game state for each Gem pair
//seeStates = true;

function puzzleFighter(arr){
	//your code goes here. you can do it!
  let gameState = {
    board: Array(12).fill().map(() => Array(6).fill(' ')),
    pair: null
  };
  for (let [pair, moves] of arr) {
    // console.log(pair, moves);
    addPair(gameState, pair);
    moves.split('').forEach(function(move){
      makeMove(gameState, move);
    });
    // remove pair
    gameState.pair = null;
    while(true) {
      let dropped = drop(gameState);
      if (!dropped) break;
      // check for collisions
      let collisions = checkForCollisions(gameState);
      for (let collision of collisions) {
        applyCollision(gameState, collision);
      }
    }
    // printState(gameState);
    // console.log('\n');
  }
  return gameState.board.map((row) => row.join('')).join('\n');
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
  gs.board[0][3] = pair[0];
  gs.board[1][3] = pair[1];
  gs.pair = {
    str: pair,
    align: 0,
    pos: [[0, 3],[1, 3]],
  };
}

function checkForCollisions(gs) {
  let collisions = [];
  for (let i = gs.board.length - 1; i >= 0; i--) {
    for (let j = 0; j < gs.board[i].length; j++) {
      if (gs.board[i][j] > 'Z') { // lowercase
        // Check if there are any touching
        let color = gs.board[i][j].toUpperCase();
        if (
          (i > 0 && gs.board[i-1][j] === color) ||
          (i < 11 && gs.board[i+1][j] === color) ||
          (j > 0 && gs.board[i][j-1] === color) ||
          (i < 5 && gs.board[i][j+1] === color)
        ) {
          collisions.push([i, j]);
        }
      } else if (gs.board[i][j] === '0') {
        collisions.push([i, j]);
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
    for (let [i, j] of toRemove) {
      gs.board[i][j] = ' ';
    }
  }
}

function drop(gs) {
  let toDrop = [];
  for (let i = gs.board.length - 2; i >= 0; i--) {
    for (let j = 0; j < gs.board[i].length; j++) {
      if (gs.board[i][j] !== ' ' && gs.board[i+1][j] === ' ') {
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
  let newPos = [[...gs.pair.pos[0]],[...gs.pair.pos[1]]];
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
      if (newPos[1][1] > 5) {
        newPos[0][1] -= 1;
        newPos[1][1] -= 1;
      }
      newPos[1] = [newPos[0][0],newPos[0][1]+1];
      break;
    default: break
  }
  checkNewPos(gs, newPos, [1]);
  updateBoard(gs, newPos);
  gs.pair.pos = newPos;
  gs.pair.align = newAlign;
}

function moveDirection(gs, direction) {
  // -1 left, +1 right
  if (!gs.pair) throw new Error('No active pair');
  if (direction === -1) {
    if (gs.pair.pos[0][1] === 0 || gs.pair.pos[0][1] === 0) {
      throw new Error(`Can't move left`)
    }
  } else {
    if (gs.pair.pos[0][1] === 5 || gs.pair.pos[0][1] === 5) {
      throw new Error(`Can't move right`)
    }
  }
  let newPos = [[...gs.pair.pos[0]],[...gs.pair.pos[1]]];
  newPos[0][1] += direction;
  newPos[1][1] += direction;
  checkNewPos(gs, newPos);
  updateBoard(gs, newPos);
  gs.pair.pos = newPos;
}

function checkNewPos(gs, newPos, indices=[0,1]) {
  for(let i of indices) {
    if (newPos[i][0] < 0) {
      throw new Error(`Can't move to new pos`)
    }
    gs.board[gs.pair.pos[0][0]][gs.pair.pos[0][1]] = ' ';
    gs.board[gs.pair.pos[1][0]][gs.pair.pos[1][1]] = ' ';
    let cantMove = gs.board[newPos[i][0]][newPos[i][1]] !== ' ';
    gs.board[gs.pair.pos[0][0]][gs.pair.pos[0][1]] = gs.pair.str[0];
    gs.board[gs.pair.pos[1][0]][gs.pair.pos[1][1]] = gs.pair.str[1];
    if (cantMove) {
      throw new Error(`Can't move to new pos`)
    }
  }
}

function updateBoard(gs, newPos) {
  gs.board[gs.pair.pos[0][0]][gs.pair.pos[0][1]] = ' ';
  gs.board[gs.pair.pos[1][0]][gs.pair.pos[1][1]] = ' ';
  gs.board[newPos[0][0]][newPos[0][1]] = gs.pair.str[0];
  gs.board[newPos[1][0]][newPos[1][1]] = gs.pair.str[1];
}

let test1 = [
  ['BR','LLL'],
  ['BY','LL'],
  ['BG','ALL'],
  ['BY','BRR'],
  ['RR','AR'],
  ['GY','A'],
  ['BB','AALLL'],
  ['GR','A'],
  ['RY','LL'],
  ['GG','L'],
  ['GY','BB'],
  ['bR','ALLL'],
  ['gy','AAL']
];
puzzleFighter(test1);
