const example_tests = [
	['SEND + MORE = MONEY','9567 + 1085 = 10652'],
	['ZEROES + ONES = BINARY','698392 + 3192 = 701584'],
	// ['COUPLE + COUPLE = QUARTET','653924 + 653924 = 1307848'],
	// ['DO + YOU + FEEL = LUCKY','57 + 870 + 9441 = 10368'],
	// ['ELEVEN + NINE + FIVE + FIVE = THIRTY','797275 + 5057 + 4027 + 4027 = 810386'],
  // ["AACO + AACT + AACO + AACC + AACC + AAOC = CBAXO", '2210 + 2217 + 2210 + 2211 + 2211 + 2201 = 13260'],
  // ["SATURN + URANUS + NEPTUNE + PLUTO = PLANETS", '127503 + 502351 + 3947539 + 46578 = 4623971'],
  // ["UUE + LJPP + EEB = UBUU", '224 + 1655 + 443 = 2322'],
  // ["KWMD + SUG + WSGT = DUGK", '1264 + 530 + 2507 = 4301']
];

let allowedNumbersBase = [0,1,2,3,4,5,6,7,8,9];

function getPermutations(a,n,s=[],t=[]){
  return a.reduce((p,c,i,a) => {
    n > 1
      ? getPermutations(a.slice(0,i).concat(a.slice(i+1)), n-1, p, (t.push(c),t))
      : p.push((t.push(c),t).slice(0));
    t.pop();
    return p;
  }, s);
}

function parseValue(s, letterToNumber) {
  return s.split('').map((l) => {
    if (defined(letterToNumber[l])) return letterToNumber[l];
    return l;
  }).join('');
}

function wordToNumber(word, letterToNumber) {
  if(word.length===0) return 0;
  return parseInt(word.split('').map(l => l === ' ' ? '0' : letterToNumber[l]).join(''));
}

function defined(a) {
  return a !== undefined;
}

function isValid(s, letterToNumber) {
  let parsed = parseValue(s, letterToNumber);
  let [finalLefts, finalRight] = parsed.split(' = ');
  let finalLeft = finalLefts.split(' + ').reduce((c, l) => c + parseInt(l), 0);
  return (finalLeft === parseInt(finalRight));
}

function alphametics(s) {
  // has to be done recursively and checking each level
  let letterToNumber = {};
  let [leftSide, rightWord] = s.split(' = ');
  let leftWords = leftSide.split(' + ').map((w) => {
    // pad the words so all the same length
    while(w.length < rightWord.length) {
      w = ' ' + w;
    }
    return w;
  });

  let notAllowed = leftWords.reduce((c, w) => {
    let i = w.split('').filter((l) => l === ' ').length
    return {
      ...c,
      [w[i]]: 0,
    }
  }, {[rightWord[0]]: 0});

  function fn (letterToNumber, depth) {
    if (rightWord.length < depth) {
      // Check is the final solution valid
      if (isValid(s, letterToNumber)) return letterToNumber;
      return false;
    };
    let index = rightWord.length - depth;
    let usedNumbers = Object.values(letterToNumber);
    let allowedNumbers = allowedNumbersBase.filter((n) => !usedNumbers.includes(n));
    if (!defined(letterToNumber[rightWord[index]])) {
      if (depth === 1) allowedNumbers = [2];
      for (let allowedNumber of allowedNumbers) {
        if(notAllowed[rightWord[index]] !== allowedNumber) {
          // Try the recursion with this value
          let result = fn({
            ...letterToNumber,
            [rightWord[index]]: allowedNumber
          }, depth);
          if (result) {
            return result;
          }
        }
      }
    } else {
      // now we have the rightletter defined
      let leftNumbers = leftWords.map((w) => w[index] === ' ' ? 0 : letterToNumber[w[index]]);
      let notDefinedCount = leftNumbers.filter((l) => !defined(l)).length;
      // check if everythings defined
      let mod = Math.pow(10, depth);
      if (!notDefinedCount) return fn(letterToNumber, depth + 1);
      let rightWordPart = wordToNumber(rightWord.slice(index), letterToNumber);
      let leftWordsPrevSlice = leftWords.map((w) => w.slice(index+1));
      let leftWordsSlice = leftWords.map((w) => w.slice(index));

      // Find all the possible purmutations
      // and filter to rightWordPart - carry
      let carry = leftWordsPrevSlice
          .map((w) => wordToNumber(w, letterToNumber))
          .reduce((c, w) => c + w, 0);
      carry /= Math.pow(10, depth-1);
      carry = Math.floor(carry);
      let missingLetters = Array.from(new Set(leftWords.map((w) => w[index]).filter((l) => l !== ' ' && !defined(letterToNumber[l]))));
      let permutations = getPermutations(allowedNumbers, missingLetters.length);
      permutations = permutations
        .filter(p => missingLetters.every((l, i) => notAllowed[l] !== p[i]))
        // .filter(p => {
        //   let nextLetterToNumber = missingLetters.reduce((c, l, i) => ({
        //     ...c,
        //     [l]: p[i]
        //   }), {
        //     ...letterToNumber
        //   });
        //   // get sum over index left
        //   let sum = leftWords.map((w) => w[index]);
        //   sum = sum.map((l) => nextLetterToNumber[l]);
        //   sum = (sum.reduce((c, i) => c + i, 0) + carry) % 10;
        //   return sum === (nextLetterToNumber[rightWord[index]])
        // })
      for (let permutation of permutations) {
        let nextLetterToNumber = missingLetters.reduce((c, l, i) => ({
          ...c,
          [l]: permutation[i]
        }), {
          ...letterToNumber
        });
        let leftSumMod = leftWordsSlice
                      .map((w) => wordToNumber(w, nextLetterToNumber))
                      .reduce((c, w) => c + w, 0) % mod;
        if (leftSumMod === rightWordPart) {
          let result = fn(nextLetterToNumber, depth + 1);
          if (result) {
            return result;
          }
        };
      }
    }
    return false;
  }

  letterToNumber = fn(letterToNumber, 1);
  return parseValue(s, letterToNumber);
}

for (let test of example_tests) {
  console.log('my run:',alphametics(test[0]));
  console.log('actual:', test[1]);
}
