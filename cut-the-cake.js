function cut(cake){
  //coding and coding..
  let numRaisins = cake.split('').reduce((c, p) => c + (p === 'o' ? 1 : 0), 0);
  if (!numRaisins) return [];
  if (numRaisins === 1) return [cake];

  let cakeArray = cake.split('\n').map(l => l.split(''));
  let height = cakeArray.length;
  let width = cakeArray[0].length;
  let cakeArea = width * height;
  let piecesArea = cakeArea / numRaisins;

  let shapes = findShapes(height, width, piecesArea);
  // Now recursively place shapes until i cant anymore
  let totalRaisinsUsed = 0;
  let usedShapes = [];
  let nextCorner = [0, 0];

  function fn(cakeArray, usedShapes, totalRaisinsUsed, nextCorner) {
    let [row, col] = nextCorner;
    // console.log('totalRaisinsUsed:',totalRaisinsUsed)
    // console.log(nextCorner);
    for (let shape of shapes) {
      // console.log('shape:', shape)
      if (['x','X'].includes(cakeArray[row][col])) continue;
      if (canPlace(col, row, shape, cakeArray)) {
        let raisinsUsed = placeShape(col, row, shape, cakeArray);
        // console.log(shape);
        // print(cakeArray);
        if (raisinsUsed === 1) {
          usedShapes.push({left: col, top: row, shape: shape});
          totalRaisinsUsed += 1;
          if (usedShapes.length === width * height / (shapes[0][0] * shapes[0][1])) {
            // Done!!!
            return usedShapes;
          }
          // find the nextCorner,
          let nextCorner = null;
          for (let j = 0; j < width; j++) {
            for (let i = 0; i < height; i++) {
              if(['.', 'o'].includes(cakeArray[i][j])) {
                nextCorner = [i, j];
                break;
              }
            }
            if (nextCorner) break;
          }
          let deeper = fn(cakeArray, usedShapes, totalRaisinsUsed, nextCorner);
          if (deeper) return deeper;
          // Nothing has been found
          usedShapes.pop();
          totalRaisinsUsed -= 1;
        }
        removeShape(col, row, shape, cakeArray);
      }
    }
    return false;
  }

  usedShapes = fn(cakeArray, usedShapes, totalRaisinsUsed, nextCorner);
  return formatAnswer(cake, cakeArray, usedShapes || []);
}

function formatAnswer(cake, cakeArray, usedShapes) {
  let result = [];
  // first sort the usedShapes array
  usedShapes = usedShapes.sort((a, b) => {
    if (a.top < b.top) {
      return -1;
    } else if (a.top === b.top) {
      if (a.left < b.left) {
        return -1;
      }
      return 1;
    }
    return 1;
  })
  for (let {left, top, shape} of usedShapes) {
    let cut = "";
    for (let i = top; i < top + shape[0]; i++) {
      for (let j = left; j < left + shape[1]; j++) {
        if (cakeArray[i][j] === 'X') {
          cut += 'o';
        } else {
          cut += '.';
        }
      }
      if (i < top + shape[0] - 1) cut += '\n';
    }
    result.push(cut);
  }
  return result;
}

function print(cakeArray) {
  console.log('\n');
  console.log(cakeArray.map((c) => c.join('')).join('\n'));
  console.log('\n');
}

function findShapes(height, width, area) {
  let shapes = [];
  for (let i = 1; i <= height; i++) {
    for (let j = 1; j <= width; j++) {
      if (i * j === area) {
        shapes.push([i, j]);
      }
    }
  }
  return shapes;
}

function canPlace(left, top, shape, cakeArray) {
  if (top + shape[0] > cakeArray.length) return false;
  if (left + shape[1] > cakeArray[0].length) return false;
  let count = 0;
  for (let i = top; i < top + shape[0]; i++) {
    for (let j = left; j < left + shape[1]; j++) {
      if (cakeArray[i][j] === 'x') {
        return false;
      } else if (cakeArray[i][j] === 'X'){
        return false;
      } else if (cakeArray[i][j] === 'o'){
        count += 1;
      }
    }
  }
  return count === 1;
}

function placeShape(left, top, shape, cakeArray) {
  let raisinsUsed = 0;
  for (let i = top; i < top + shape[0]; i++) {
    for (let j = left; j < left + shape[1]; j++) {
      if (cakeArray[i][j] === '.') {
        cakeArray[i][j] = 'x';
      } else {
        cakeArray[i][j] = 'X';
        raisinsUsed += 1;
      }
    }
  }
  return raisinsUsed;
}

function removeShape(left, top, shape, cakeArray) {
  for (let i = top; i < top + shape[0]; i++) {
    for (let j = left; j < left + shape[1]; j++) {
      if (cakeArray[i][j] === 'x') {
        cakeArray[i][j] = '.';
      } else if (cakeArray[i][j] === 'X'){
        cakeArray[i][j] = 'o';
      }
    }
  }
}

var cake =
// `.o............
// ..............
// .o........o...
// ..............
// o.........o...
// ..........o...
// ..............
// ..o.......o...
// ..........o...
// ..............
// ...o......o...`
`...........................o..............
..........................................
.o........................................
.....o....................................
.......................................o..
..............o...........................
........................o.................
.........o................................`

console.log(cut(cake));
