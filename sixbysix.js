var colors = require('colors');

function solvePuzzle(_clues) {
  let solution = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
  let clues = formatClues(_clues);
  // Add in 1s and SIZEs
  solution = add1andEnd(solution, clues);
  solution = recr(solution, clues, SIZE);
  return solution;
}

function recr(_solution, clues, number) {
  let solution = _solution.map(row => row.slice());
  if (number === 1) {
    let s = solution.map((row) => row.slice().map((c) => c ? c : 1));
    if (check(s, clues, true)) {
      return s;
    }
    return false;
  }


  while (true) {
    solution = addNotPossible(solution, clues, number);
    let changed = addRequired(solution, clues, number);
    if (!changed) break;
  }

  if (solution.every((row) => row.includes(number))) {
    solution = removeNotPossible(solution, clues);
    return recr(solution, clues, number - 1);
  }

  let possibleInserts = findPossibleInserts(solution);
  solution = removeNotPossible(solution, clues);
  for(let insert of possibleInserts) {
    for (let [i, j] of insert) { solution[i][j] = number; }
    if  (check(solution, clues)) {
      let result = recr(solution, clues, number - 1);
      if (result) return result;
    }
    for (let [i, j] of insert) { solution[i][j] = 0; }
  }
  return false;
}

function addRequired(solution, clues, number) {
  let changed = false;

  for (let i = 0; i < SIZE; i++) {
    let row = solution[i];
    if (!row.includes(number)) {
      if (row.filter((c) => !c).length === 1) {
        let j = row.indexOf(0);
        solution[i][j] = number;
        changed = true;
      }
    }
  }
  for (let j = 0; j < SIZE; j++) {
    let col = solution.map((r) => r[j]);
    if (!col.includes(number)) {
      if (col.filter((r) => !r).length === 1) {
        let i = col.indexOf(0);
        solution[i][j] = number;
        changed = true;
      }
    }
  }
  return changed;
}

function findPossibleInserts(solution) {
  let inserts = [];
  for (let i = 0; i < SIZE; i++) {
    let cols = solution[i].map((c, index) => c ? -1 : index).filter((c) => c > -1);
    if (!cols.length) continue;
    let cells = cols.map((j) => [i, j]);
    if (inserts.length) {
      let newInserts = [];
      for(let insert of inserts) {
        let usedCols = new Set(insert.map((ii) => ii[1]));
        let allowed = cells.filter((cell) => {
          return !usedCols.has(cell[1]);
        });
        newInserts = newInserts.concat(allowed.map((a) => {
          return insert.concat([a]);
        }));
      }
      inserts = newInserts.slice();
    } else {
      inserts = cells.map((c) => [c]);
    }
  }
  return inserts;
}

function addNotPossible(_solution, clues, number) {
  let solution = _solution.map(row => row.slice());
  for (let a = 0; a < SIZE; a++) {
    let j = solution[a].indexOf(number);
    if (j > -1) {
      // add row
      for (let jj = 0; jj < SIZE; jj++) {
        if (!solution[a][jj]) solution[a][jj] = 9;
      }
      // add col
      for (let ii = 0; ii < SIZE; ii++) {
        if (!solution[ii][j]) solution[ii][j] = 9;
      }
    }
    let col = solution.map((c) => c[a]);
    let clue = clues.top[a];
    if (clue) {
      // need to figure out which are not possible
      for (let i = 0; i < number + clue - (SIZE+1); i++) {
        if (!solution[i][a]) solution[i][a] = 9;
      }
      let count = currentCount(col);
      if (count === clue) {
        // If the next number is great than number
        let n = col.find((c) => c > 0 && c !== 9);
        if (n > number) {
          for (let i = 0; i < SIZE; i++) {
            if (solution[i][a] >= number) break;
            if (!solution[i][a]) solution[i][a] = 9;
          }
        }
      }
      for (let i = 0; i < SIZE; i++) {
        if (solution[i][a] !== 0) continue;
        let array = col.slice().map((c) => c === 9 ? 0 : c);
        array[i] = number;
        let used = new Set(array.map((c) => c > 0 ? c : 0));
        let index = array.indexOf(0);
        for (let b = array[0]+1; b < SIZE; b++) {
          if (used.has(b)) continue;
          array[index++] = b;
          while(index < SIZE && array[index]) {index++;}
          if (index >= SIZE) break;
        }
        let count = currentCount(array);
        if (count < clue) {
          solution[i][a] = 9;
        }
      }
    }
    let colReversed = col.slice().reverse();
    clue = clues.bottom[a];
    if (clue) {
      // need to figure out which are not possible
      let count = currentCount(colReversed);
      for (let i = 0; i < number + clue - (SIZE+1); i++) {
        if (!solution[SIZE-1-i][a]) solution[SIZE-1-i][a] = 9;
      }
      if (count === clue) {
        // If the next number is great than number
        let n = colReversed.find((c) => c > 0 && c !== 9);
        if (n > number) {
          for (let i = 0; i < SIZE; i++) {
            if (solution[SIZE-1-i][a] >= number) break;
            if (!solution[SIZE-1-i][a]) solution[SIZE-1-i][a] = 9;
          }
        }
      }
      for (let i = 0; i < SIZE; i++) {
        if (solution[SIZE-1-i][a] !== 0) continue;
        let array = colReversed.slice().map((c) => c === 9 ? 0 : c);
        array[i] = number;
        let used = new Set(array.map((c) => c > 0 ? c : 0));
        let index = array.indexOf(0);
        for (let b = array[0]+1; b < SIZE; b++) {
          if (used.has(b)) continue;
          array[index++] = b;
          while(index < SIZE && array[index]) {index++;}
          if (index >= SIZE) break;
        }
        let count = currentCount(array);
        if (count < clue) {
          solution[SIZE-1-i][a] = 9;
        }
      }
    }
    let row = solution[a];
    clue = clues.left[a];
    if (clue) {
      // need to figure out which are not possible
      for (let j = 0; j < number + clue - (SIZE+1); j++) {
        if (!solution[a][j]) solution[a][j] = 9;
      }
      let count = currentCount(row);
      if (count === clue) {
        // If the next number is great than number
        let n = row.find((c) => c > 0 && c !== 9);
        if (n > number) {
          for (let j = 0; j < SIZE; j++) {
            if (solution[a][j] >= number) break;
            if (!solution[a][j]) solution[a][j] = 9;
          }
        }
      }
      for (let j = 0; j < SIZE; j++) {
        if (solution[a][j] !== 0) continue;
        let array = row.slice().map((c) => c === 9 ? 0 : c);
        array[j] = number;
        let used = new Set(array.map((c) => c > 0 ? c : 0));
        let index = array.indexOf(0);
        for (let b = array[0]+1; b < SIZE; b++) {
          if (used.has(b)) continue;
          array[index++] = b;
          while(index < SIZE && array[index]) {index++;}
          if (index >= SIZE) break;
        }
        let count = currentCount(array);
        if (count < clue) {
          // print(solution, clues)
          solution[a][j] = 9;
          // print(solution, clues)
        }
      }
    }
    let rowReversed = row.slice().reverse();
    clue = clues.right[a];
    if (clue) {
      // need to figure out which are not possible
      for (let j = 0; j < number + clue - (SIZE+1); j++) {
        if (!solution[a][SIZE-1-j]) solution[a][SIZE-1-j] = 9;
      }
      let count = currentCount(rowReversed);
      if (count === clue) {
        // If the next number is great than number
        let n = rowReversed.find((c) => c > 0 && c !== 9);
        if (n > number) {
          for (let j = 0; j < SIZE; j++) {
            if (solution[a][SIZE-1-j] >= number) break;
            if (!solution[a][SIZE-1-j]) solution[a][SIZE-1-j] = 9;
          }
        }
      }
      for (let j = 0; j < SIZE; j++) {
        if (solution[a][SIZE-1-j] !== 0) continue;
        let array = rowReversed.slice().map((c) => c === 9 ? 0 : c);
        array[j] = number;
        let used = new Set(array.map((c) => c > 0 ? c : 0));
        let index = array.indexOf(0);
        for (let b = array[0]+1; b < SIZE; b++) {
          if (used.has(b)) continue;
          array[index++] = b;
          while(index < SIZE && array[index]) {index++;}
          if (index >= SIZE) break;
        }
        let count = currentCount(array);
        if (count < clue) {
          solution[a][SIZE-1-j] = 9;
        }
      }
    }
  }
  return solution;
}

function currentCount(array) {
  let number = 0;
  let max = 0;
  for (let a = 0; a < SIZE; a++) {
    if (array[a] > max && array[a] !== 9) {
      number += 1;
      max = array[a];
    }
  }
  return number;
}

function removeNotPossible(solution, number) {
  return solution.map((row) => row.slice().map((c) => c === 9 ? 0 : c));
}

function add1andEnd(_solution, clues) {
  let solution = _solution.map(row => row.slice());
  for (let a = 0; a < SIZE; a++) {
    let clue = clues.top[a];
    if (clue === 1) {
      solution[0][a] = SIZE;
    }
    if (clue === SIZE) {
      for (let i = 0; i < SIZE; i++) {
        solution[i][a] = i + 1;
      }
    }

    clue = clues.bottom[a];
    if (clue === 1) {
      solution[SIZE-1][a] = SIZE;
    }
    if (clue === SIZE) {
      for (let i = 0; i < SIZE; i++) {
        solution[SIZE-1-i][a] = i + 1;
      }
    }

    if (clues.top[a] + clues.bottom[a] === SIZE + 1) {
      solution[clues.top[a]-1][a] = SIZE;
    }

    clue = clues.left[a];
    if (clue === 1) {
      solution[a][0] = SIZE;
    }
    if (clue === SIZE) {
      for (let j = 0; j < SIZE; j++) {
        solution[a][j] = j + 1;
      }
    }

    clue = clues.right[a];
    if (clue === 1) {
      solution[a][SIZE-1] = SIZE;
    }
    if (clue === SIZE) {
      for (let j = 0; j < SIZE; j++) {
        solution[a][SIZE-1-j] = j + 1;
      }
    }

    if (clues.left[a] + clues.right[a] === SIZE + 1) {
      solution[a][clues.left[a]-1] = SIZE;
    }
  }
  return solution;
}

function formatClues(clues) {
  return clues.reduce((c, clue, i) => {
    if (i < SIZE) { // top
      c.top.push(clue);
    } else if (i < SIZE*2) { // right
      c.right.push(clue);
    } else if (i < SIZE*3) { // bottom
      c.bottom.splice(0, 0, clue);
    } else { // left
      c.left.splice(0, 0, clue);
    }
    return c;
  }, {
    top: [],
    bottom: [],
    left: [],
    right: [],
  });
}

function check(solution, clues, final=false) {
  let numbers = Array(SIZE).fill().map((_, i) => i+1);
  for (let a = 0; a < SIZE; a++) {
    if (final) {
      let row = new Set(solution[a]);
      let col = new Set(solution.map((c) => c[a]));
      if (!numbers.every((n) => row.has(n) && col.has(n))) {
        return false;
      }
    }
    let clue = clues.top[a];
    if (clue) {
      let number = currentCount(solution.map((c) => c[a]));
      if (final) {
        if (number !== clue) return false;
      } else {
        if (number > clue) return false;
      }
    }
    clue = clues.bottom[a];
    if (clue) {
      let number = currentCount(solution.map((c) => c[a]).reverse());
      if (final) {
        if (number !== clue) return false;
      } else {
        if (number > clue) return false;
      }
    }
    clue = clues.left[a];
    if (clue) {
      let number = currentCount(solution[a]);
      if (final) {
        if (number !== clue) return false;
      } else {
        if (number > clue) return false;
      }
    }
    clue = clues.right[a];
    if (clue) {
      let number = currentCount(solution[a].slice().reverse());
      if (final) {
        if (number !== clue) return false;
      } else {
        if (number > clue) return false;
      }
    }
  }
  return true;
}

function print(solution, clues) {
  if (solution) {
    if (clues) {
      console.log(('  '+clues.top.join(' ')+'  ').green)
      console.log(solution.map((row,i) => {
        return (colors.green(clues.left[i]) + '|' + row.join(',') + '|' + colors.green(clues.right[i]));
      }).join('\n'));
      console.log(('  '+clues.bottom.join(' ')+'  ').green)
    } else {
      console.log('solution:');
      console.log(solution.map((row) => row.join(',')).join('\n'));
      console.log();
    }
  } else {
    console.log('No solution');
  }
}

//
// var clues = [ 0, 0, 0, 2, 2, 0,
//               0, 0, 0, 6, 3, 0,
//               0, 4, 0, 0, 0, 0,
//               4, 4, 0, 3, 0, 0];
//
// var expected = [[ 5, 6, 1, 4, 3, 2 ],
//                 [ 4, 1, 3, 2, 6, 5 ],
//                 [ 2, 3, 6, 1, 5, 4 ],
//                 [ 6, 5, 4, 3, 2, 1 ],
//                 [ 1, 2, 5, 6, 4, 3 ],
//                 [ 3, 4, 2, 5, 1, 6 ]];
//
// var clues = [ 3, 2, 2, 3, 2, 1,
//               1, 2, 3, 3, 2, 2,
//               5, 1, 2, 2, 4, 3,
//               3, 2, 1, 2, 2, 4];
//
// var expected = [[ 2, 1, 4, 3, 5, 6],
//                 [ 1, 6, 3, 2, 4, 5],
//                 [ 4, 3, 6, 5, 1, 2],
//                 [ 6, 5, 2, 1, 3, 4],
//                 [ 5, 4, 1, 6, 2, 3],
//                 [ 3, 2, 5, 4, 6, 1]];
//
//
// var clues = [7,0,0,0,2,2,3, 0,0,3,0,0,0,0, 3,0,3,0,0,5,0, 0,0,0,0,5,0,4];
// var expected = [
//   [ 1, 5, 6, 7, 4, 3, 2 ],
//   [ 2, 7, 4, 5, 3, 1, 6 ],
//   [ 3, 4, 5, 6, 7, 2, 1 ],
//   [ 4, 6, 3, 1, 2, 7, 5 ],
//   [ 5, 3, 1, 2, 6, 4, 7 ],
//   [ 6, 2, 7, 3, 1, 5, 4 ],
//   [ 7, 1, 2, 4, 5, 6, 3 ],
// ]

// var clues = [ 4, 4, 0, 3, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 6, 3, 0, 0, 4, 0, 0, 0, 0 ]
//
// var clues = [7,0,0,0,2,2,3, 0,0,3,0,0,0,0, 3,0,3,0,0,5,0, 0,0,0,0,5,0,4];
var clues = [0,2,3,0,2,0,0, 5,0,4,5,0,4,0, 0,4,2,0,0,0,6, 5,2,2,2,2,4,1];
// var clues = [3,3,2,1,2,2,3, 4,3,2,4,1,4,2, 2,4,1,4,5,3,2, 3,1,4,2,5,2,3];
// var clues = [6,4,0,2,0,0,3, 0,3,3,3,0,0,4, 0,5,0,5,0,2,0, 0,0,0,4,0,0,3];
//
// var expected = [
//   [2,1,6,4,3,7,5],
//   [3,2,5,7,4,6,1],
//   [4,6,7,5,1,2,3],
//   [1,3,2,6,7,5,4],
//   [5,7,1,3,2,4,6],
//   [6,4,3,2,5,1,7],
//   [7,5,4,1,6,3,2],
// ]
[0,2,3,0,2,0,0, 5,0,4,5,0,4,0, 0,4,2,0,0,0,6, 5,2,2,2,2,4,1]
var SIZE = clues.length / 4;

var start = new Date()
setTimeout(function(argument) {
  // execution time simulated with setTimeout function
  let solution = solvePuzzle(clues);
  print(solution, formatClues(clues));
  var end = new Date() - start
  console.info('Execution time: %dms', end)
})
