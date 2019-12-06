function sudoku(puzzle) {
  //return the solved puzzle as a 2d array of 9 x 9
  function fn (row, col, puzzle) {
    let nextRow = col === 8 ? row + 1 : row;
    if (nextRow === 9) {
      // We are done!
      return puzzle;
    }
    let nextCol = (col + 1) % 9;
    // If already placed
    if (puzzle[row][col] > 0) {
      let deep = fn(nextRow, nextCol, puzzle);
      if (deep) return puzzle;
    } else {
      for(let n = 1; n <= 9; n++) {
        // Add this number to this puzzle
        if (!canPlace(row, col, n, puzzle)) continue;
        puzzle[row][col] = n;
        let deep = fn(nextRow, nextCol, puzzle);
        if (deep) return puzzle;
        // Remove
        puzzle[row][col] = 0;
      }
    }
    return false;
  }
  return fn(0, 0, puzzle);
}

function print(puzzle) {
  console.log(
    puzzle.map((l) => l.join('')).join('\n')
  );
}

function canPlace(row, col, number, puzzle) {
  // Check row
  for (let j = 0; j < 9; j++) {
    if (puzzle[row][j] === number) return false;
  }
  // Check col
  for (let i = 0; i < 9; i++) {
    if (puzzle[i][col] === number) return false;
  }
  // Check square
  let squareTop = Math.floor(row / 3) * 3;
  let squareLeft = Math.floor(col / 3) * 3;
  for (let i = squareTop; i < squareTop + 3; i++) {
    for (let j = squareLeft; j < squareLeft + 3; j++) {
      if (puzzle[i][j] === number) return false;
    }
  }
  return true;
}

var puzzle = [
     [5,3,0,0,7,0,0,0,0],
     [6,0,0,1,9,5,0,0,0],
     [0,9,8,0,0,0,0,6,0],
     [8,0,0,0,6,0,0,0,3],
     [4,0,0,8,0,3,0,0,1],
     [7,0,0,0,2,0,0,0,6],
     [0,6,0,0,0,0,2,8,0],
     [0,0,0,4,1,9,0,0,5],
     [0,0,0,0,8,0,0,7,9]];


console.log(sudoku(puzzle));
