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
  console.log(shapes)
  // Now recursively place shapes until i cant anymore
  let totalRaisinsUsed = 0;
  let usedShapes = [];
  let triedPlacements = {};
  usedShapes = tryShapes(width, height, shapes, cakeArray, usedShapes, totalRaisinsUsed, triedPlacements);
  return formatAnswer(cakeArray, usedShapes || []);
}

function tryShapes(width, height, shapes, cakeArray, usedShapes, totalRaisinsUsed, triedPlacements) {
  for (let shape of shapes) {
    for (let row = 0; row < height - shape[0] + 1; row ++) {
      for (let col = 0; col < width - shape[1] + 1; col ++) {
        if (['x','X'].includes(cakeArray[row][col])) continue;
        if (canPlace(col, row, shape, cakeArray, triedPlacements)) {
          let raisinsUsed = placeShape(col, row, shape, cakeArray);
          // print(cakeArray)
          if (raisinsUsed === 1) {
            usedShapes.push({left: col, top: row, shape: shape});
            totalRaisinsUsed += 1;
            if (usedShapes.length === width * height / (shapes[0][0] * shapes[0][1])) {
              // Done!!!
              return usedShapes;
            }
            let deeper = tryShapes(width, height, shapes, cakeArray, usedShapes, totalRaisinsUsed, triedPlacements);
            if (deeper) return deeper;
            // Nothing has been found
            usedShapes.pop();
            totalRaisinsUsed -= 1;
          }
          removeShape(col, row, shape, cakeArray);
          // print(cakeArray)
          triedPlacements[[row,col,shape].toString()] = true;
        }
      }
    }
  }
  return false;
}

function formatAnswer(cakeArray, usedShapes) {
  let result = [];
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

function canPlace(left, top, shape, cakeArray, triedPlacements) {
  if(triedPlacements[[left,top,shape].toString()]) return false;
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