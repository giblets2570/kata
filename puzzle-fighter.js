//need help with debugging?
//uncomment the line below to see the game state for each Gem pair
//seeStates = true;
let util = require('util');

function puzzleFighter(arr){
	//your code goes here. you can do it!
  let gameState = {
    board: Array(12).fill().map(() => Array(6).fill(' ')),
    pair: null
  };
  for (let [pair, moves] of arr) {
    addPair(gameState, pair);
    printState(gameState);
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
      console.log(collisions);
    }
    printState(gameState);
  }
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
  console.log(util.inspect(gs, { showHidden: true, depth: null, colors: true }));
}

function addPair(gs, pair) {
  if (gs.pair) throw new Error('Already active pair');
  gs.board[0][3] = pair[0];
  gs.board[1][3] = pair[1];
  gs.pair = {
    str: pair,
    align: 0,
    pos: [[0, 3],[1, 3]],
    complete: [false, false],
  };
}

// function moveDown(gs){
//   if (!gs.pair) throw new Error('No active pair');
//   let lowests = [];
//   switch (gs.pair.align) {
//     case 0: lowests = [1]; break;
//     case 1: lowests = [0,1]; break;
//     case 2: lowests = [0]; break;
//     case 3: lowests = [0,1]; break;
//     default: break
//   }
//   // Check for collisions
//   let newPos = [[...gs.pair.pos[0]],[...gs.pair.pos[1]]];
//   for (let lowest of lowests) {
//     if (gs.board[gs.pair.pos[lowest][0]+1][gs.pair.pos[lowest][1]] !== ' ') {
//       continue;
//     }
//     newPos[lowest][0] += 1;
//   }
//   if (gs.pair.align === 0) {
//     newPos[0][0] = newPos[1][0] - 1;
//   }else if (gs.pair.align === 2) {
//     newPos[1][0] = newPos[0][0] - 1;
//   }
//   updateBoard(gs, newPos);
//   gs.pair.pos = newPos;
// }

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
puzzleFighter(test1)
