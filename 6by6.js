function solvePuzzle(clues) {
  // Start your coding here...
  let solution = Array(6).fill().map(() => Array(6).fill(0));
  for(let i = 0; i < clues.length; i++) {
    let clue = clues[i];
    if (!clue) continue;
    if (i < 6) {
      if (clue === 1) {
        solution[0][i] = 6;
      }
      if (clue === 6) {
        for(let row of [0,1,2,3,4,5]) {
          solution[row][i] = row + 1;
        }
      }
    } else if (i < 12) {
      if (clue === 1) {
        solution[i-6][5] = 6;
      }
      if (clue === 6) {
        for(let row of [5,4,3,2,1,0]) {
          solution[i-6][row] = 6-row;
        }
      }
    } else if (i < 18) {
      if (clue === 1) {
        solution[5][17 - i] = 6;
      }
      if (clue === 6) {
        for(let row of [5,4,3,2,1,0]) {
          solution[row][17 - i] = 6-row;
        }
      }
    } else {
      if (clue === 1) {
        solution[23 - i][0] = 6;
      }
      if (clue === 6) {
        for(let row of [0,1,2,3,4,5]) {
          solution[23 - i][row] = row+1;
        }
      }
    }
  }
  // Now i need to join up topppp and bottom
  let formattedClues = clues.reduce((c, clue, i) => {
    if (i < 6) { // topppp
      c.topppp.push(clue);
    } else if (i < 12) { // rightt
      c.rightt.push(clue);
    } else if (i < 18) { // bottom
      c.bottom.splice(0, 0, clue);
    } else { // lefttt
      c.lefttt.splice(0, 0, clue);
    }
    return c;
  }, {
    topppp: [],
    bottom: [],
    lefttt: [],
    rightt: [],
  });
  console.log(formattedClues)
  // Add in all definite 6s
  for (let i = 0; i < 6; i++) {
    if (formattedClues.topppp[i] + formattedClues.bottom[i] === 7) {
      solution[i][formattedClues.topppp[i]-1] = 6;
    }
    if (formattedClues.lefttt[i] + formattedClues.rightt[i] === 7) {
      solution[i][formattedClues.lefttt[i]-1] = 6;
    }
  }
  // Find all the ones that have topppp + bottom - 1
  for (let i = 0; i < 6; i++) {
    let column = solution.map((s) => s[i]);
    if (formattedClues.topppp[i] + formattedClues.bottom[i] - 1 === column.filter((c) => c === 0).length ) {
      solution[formattedClues.topppp[i] - 1][i] = 6; // needs to account for filled number
    }
    let row = solution[i];
    if (formattedClues.lefttt[i] + formattedClues.rightt[i] - 1 === row.filter((c) => c === 0).length ) {
      solution[formattedClues.lefttt[i] - 1][i] = 6; // needs to account for filled number
    }
  }

  let used6Cols = solution.map((s) => s.indexOf(6)).filter((s) => s !== -1);
  let allowed6Cols = new Set([0,1,2,3,4,5]);
  used6Cols.forEach((s) => allowed6Cols.delete(s));

  while(true) {
    let foundCol = false;
    for (let i = 0; i < 6; i++) {
      if (solution[i].includes(6)) continue;
      if (allowed6Cols.size === 1) {
        solution[i][Array.from(allowed6Cols)[0]] = 6;
        break;
      }
      if (formattedClues.lefttt[i]) {
        // console.log('loop');
        // console.log('row:', i);
        // console.log('clue:', formattedClues.lefttt[i]);
        let allowed6Colarr = Array.from(allowed6Cols);
        // console.log(allowed6Colarr);
        allowed6Colarr = allowed6Colarr.filter((t) => t >= formattedClues.lefttt[i]-1);
        // console.log(i, formattedClues.lefttt[i]);
        if (allowed6Colarr.length === 1) {
          // Weve foudn the only place it can go
          let col = allowed6Colarr[0];
          allowed6Cols.delete(col);
          solution[i][col] = 6;
          foundCol = true;
        }
      }
    }
    if (!foundCol) break;
  }
  let currentNum = 5;

  function recr(_solution, currentNum) {
    let logging = currentNum === 3
    // console.log()
    let solution = _solution.map((r) => r.slice());
    // console.log()
    // console.log(solution, currentNum)
    if (currentNum === 1) {
      console.log(formattedClues);
      solution = solution.map((r) => r.map((c) => c ? c : 1));
      console.log(solution);
    }
    if (currentNum === 0) {
      // console.log(solution)
      if (check(solution, clues)) return solution;
      return false;
    };
    // currentNum - 3
    // 7 - currentNum
    // this should be related to what is on the board
    // for 5 it is constant
    let currentNumLimit = currentNum - 3;
    let round = 0;
    while (true) {
      if (round) {
        // Then add in the clues
        for (let i in formattedClues.topppp) {
          let clue = formattedClues.topppp[i];
          if(clue < currentNumLimit) continue;
          for (let row = 0; row < clue - (7 - currentNum); row++) {
            if(!solution[row][i]) solution[row][i] = 9;
          }
        }
        if (logging) console.log('formattedClues.topppp', formattedClues.topppp);
        if (logging) console.log(solution);
        for (let i in formattedClues.bottom) {
          let clue = formattedClues.bottom[i];
          if(clue < currentNumLimit) continue;
          for (let row = 0; row < clue - (7 - currentNum); row++) {
            if(!solution[5-row][i]) solution[5-row][i] = 9;
          }
        }
        if (logging) console.log('formattedClues.bottom', formattedClues.bottom);
        if (logging) console.log(solution);
        for (let j in formattedClues.lefttt) {
          let clue = formattedClues.lefttt[j];
          if(clue < currentNumLimit) continue;
          for (let col = 0; col < clue - (7 - currentNum); col++) {
            if(!solution[j][col]) solution[j][col] = 9;
          }
        }
        if (logging) console.log('formattedClues.lefttt', formattedClues.lefttt);
        if (logging) console.log(solution);
        for (let j in formattedClues.rightt) {
          let clue = formattedClues.rightt[j];
          if(clue < currentNumLimit) continue;
          for (let col = 0; col < clue - (7 - currentNum); col++) {
            if(!solution[j][5-col]) solution[j][5-col] = 9;
          }
        }
        if (logging) console.log('formattedClues.rightt', formattedClues.rightt);
        if (logging) console.log(solution);
        // Check if there are any rows with only one 0
        let found = false;
        for (let row = 0; row < 6; row++) {
          if (solution[row].filter((c) => c === 0).length === 1) {
            let col = solution[row].indexOf(0);
            solution[row][col] = currentNum;
            // console.log('here row')
            found = true;
          }
        }
        for (let col = 0; col < 6; col++) {
          let column = solution.map((r) => r[col]);
          if (column.filter((c) => c === 0).length === 1) {
            let row = column.indexOf(0);
            if (solution[row].indexOf(currentNum) > -1) continue; // Check if row ok
            solution[row][col] = currentNum;
            // console.log('here col')
            found = true;
          }
        }
        if (!found) {
          // console.log('round:', round);
          break;
        }
      }
      // Lets add in where the 5s cant be
      for (let i = 0; i < solution.length; i++) {
        for (let j = 0; j < solution[i].length; j++) {
          if (solution[i][j] === currentNum) {
            for (let row = 0; row < 6; row++) {
              if(!solution[row][j]) solution[row][j] = 9;
            }
            for (let col = 0; col < 6; col++) {
              if(!solution[i][col]) solution[i][col] = 9;
            }
          }
        }
      }
      round += 1;
    }

    let usedCols = solution.map((s) => s.indexOf(currentNum)).filter((s) => s !== -1);
    let allowedCols = new Set([0,1,2,3,4,5]);
    usedCols.forEach((s) => allowedCols.delete(s));
    allowedCols = Array.from(allowedCols);

    let allowedRows = [0,1,2,3,4,5].filter((i) => {
      return solution[i].indexOf(currentNum) === -1;
    });

    if (logging) console.log('currentNumLimit:', currentNumLimit)
    if (logging) console.log(solution)
    if (logging) console.log('allowedCols:', allowedCols)
    if (logging) console.log('allowedRows:', allowedRows)

    if (currentNum === 3) {
      console.log();
      console.log(solution);
      return false;
    }

    let allowedPlacements = [];
    for (let row of allowedRows) {
      for (let col of allowedCols) {
        if (!solution[row][col]) {
          allowedPlacements.push([row, col]);
        }
      }
    }

    solution = solution.map((row) => row.map((c) => c === 9 ? 0 : c));

    let numAlready = solution.filter((r) => r.indexOf(currentNum) >= 0).length;

    let toUsePlacements = allowedPlacements.reduce((c, _p) => {
      let usedPlacements = [_p];
      allowedPlacements.forEach((placement) => {
        let any = usedPlacements.find((p) => (
          p[0] === placement[0] ||
          p[1] === placement[1]
        ));
        if (!any) usedPlacements.push(placement);
      });
      if (usedPlacements.length === 6 - numAlready) {
        c[_p] = usedPlacements;
      }
      return c;
    }, {});


    // console.log(toUsePlacements, numAlready);

    toUsePlacements = Object.keys(toUsePlacements).map((key) => toUsePlacements[key]);
    // console.log('currentNum:',currentNum);
    // console.log(solution);
    // console.log(toUsePlacements);

    // console.log(toUsePlacements);

    for(let usedPlacement of toUsePlacements) {
      for (let i = 0; i < usedPlacement.length; i++) {
        let [row, col] = usedPlacement[i];
        solution[row][col] = currentNum;
      }
      if(solution.filter((r) => r.indexOf(currentNum) >= 0).length === 6) {
        let result = recr(solution, currentNum - 1);
        if (result) return result;
      }
      for (let i = 0; i < usedPlacement.length; i++) {
        let [row, col] = usedPlacement[i];
        solution[row][col] = 0;
      }
    }
    return false;
  }

  solution = recr(solution, currentNum);

  return solution;
}




// function recr(current, clues, index=0) {
//   if (index === 6) {
//     if (check(current, clues)) return current;
//     return false;
//   }
//   // recursive
//
//   // We are going to get it column by column
//   let allowedColumns = [6, ]
//
//   let row = Math.floor(index / 6);
//   let col = index % 6;
//   let allowed = new Set(Array(6).fill().map((_, i) => i+1));
//   for (let i = 0; i < 6; i++) {
//     allowed.delete(current[row][i])
//   }
//   for (let j = 0; j < 6; j++) {
//     allowed.delete(current[j][col])
//   }
//   for (let value = 1; value <= 6; value++) {
//     if (!allowed.has(value)) continue;
//     current[row][col] = value;
//     let result = recr(current, clues, index + 1);
//     if (result) return result;
//   }
//   current[row][col] = 0;
//   return false;
// }

function check(solution, clues) {
  for(let i = 0; i < clues.length; i++) {
    let clue = clues[i];
    if (!clue) continue;
    let number = 0;
    let max = 0;
    if (i < 6) {
      for (let row = 0; row < 6; row++) {
        if (solution[row][i] > max) {
          number += 1;
          max = solution[row][i];
        }
      }
      if (number !== clue) return false;
    } else if (i < 12) {
      for (let col = 5; col >= 0; col--) {
        if (solution[i-6][col] > max) {
          number += 1;
          max = solution[i-6][col];
        }
      }
      if (number !== clue) return false;
    } else if (i < 18) {
      for (let row = 5; row >= 0; row--) {
        if (solution[row][17 - i] > max) {
          number += 1;
          max = solution[row][17 - i];
        }
      }
      if (number !== clue) return false;
    } else {
      for (let col = 0; col < 6; col++) {
        if (solution[23 - i][col] > max) {
          number += 1;
          max = solution[23 - i][col];
        }
      }
      if (number !== clue) return false;
    }
  }
  return true;
}


var clues = [ 0, 0, 0, 2, 2, 0,
              0, 0, 0, 6, 3, 0,
              0, 4, 0, 0, 0, 0,
              4, 4, 0, 3, 0, 0];

var expected = [[ 5, 6, 1, 4, 3, 2 ],
                [ 4, 1, 3, 2, 6, 5 ],
                [ 2, 3, 6, 1, 5, 4 ],
                [ 6, 5, 4, 3, 2, 1 ],
                [ 1, 2, 5, 6, 4, 3 ],
                [ 3, 4, 2, 5, 1, 6 ]];

// console.log(check(expected, clues));

console.log(solvePuzzle(clues));
console.log(expected);
