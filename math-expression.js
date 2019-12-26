function getTokens(expression) {
  let tokens = expression.split('').filter((t) => t !== ' ');
  for(let i = tokens.length - 2; i >= 0; i--) {
    if (
      tokens[i] === '.' || tokens[i+1][0] === '.' || (
        parseInt(tokens[i]) > -1 && parseInt(tokens[i+1]) > -1
      )
    ) {
      tokens.splice(i, 2, tokens[i] + tokens[i+1]);
    }
  }
  for(let i = tokens.length - 3; i >= 0; i--) {
    if (
      ['*','/'].includes(tokens[i]) && tokens[i+1] === '-' && parseInt(tokens[i+2]) > -1
    ) {
      tokens.splice(i+1, 2, tokens[i+1] + tokens[i+2]);
    }
  }
  return tokens;
}

function recr(tokens) {
  while (tokens.includes('(')) {
    let level = 0;
    let start = tokens.indexOf('(');
    let end;
    for (end = start + 1; end < tokens.length; end++) {
      if (tokens[end] === '(') {
        level += 1;
        continue;
      }
      if (tokens[end] === ')') {
        if (level) {
          level -= 1;
        } else {
          end += 1;
          break;
        }
      }
    }
    let complete = recr(tokens.slice(start+1, end-1));
    tokens.splice(start, end - start, ...complete);
    tokens = getTokens(replaceDoubleNeg(tokens.join('')));
  }
  // Multiply
  let i = 1;
  if (['*','/','+','-'].includes(tokens[0])) {
    tokens.splice(0,0,0);
  }
  while (i < tokens.length) {
    if (['*','/'].includes(tokens[i])) {
      let result;
      if (tokens[i] === '*') {
        result = parseFloat(tokens[i-1]) * parseFloat(tokens[i+1]);
      } else {
        result = parseFloat(tokens[i-1]) / parseFloat(tokens[i+1]);
      }
      tokens.splice(i-1, 3, result);
    } else {
      i++;
    }
  }
  i = 1;
  while (i < tokens.length) {
    if (['+','-'].includes(tokens[i])) {
      let result;
      if (tokens[i] === '+') {
        result = parseFloat(tokens[i-1]) + parseFloat(tokens[i+1]);
      } else {
        result = parseFloat(tokens[i-1]) - parseFloat(tokens[i+1]);
      }
      tokens.splice(i-1, 3, result);
    } else {
      i++;
    }
  }
  // console.log(tokens);
  return tokens;
}

function replaceDoubleNeg(expression) {
  expression = expression.replace(/ /g, '');
  expression = expression.replace(/--/g, '+');
  expression = expression.replace(/\/\+/g, '/');
  expression = expression.replace(/\+-/g, '-');
  return expression;
}

var calc = function (expression) {
  // evaluate `expression` and return result
  // if there are brackets, remove and replace
  expression = replaceDoubleNeg(expression);
  let tokens = getTokens(expression);
  // console.log(tokens);
  let r = recr(tokens);
  return parseFloat(r[0]);
};

var tests = [
  ['1+1', 2],
  ['1 - 1', 0],
  ['1* 1', 1],
  ['1 /1', 1],
  ['-123', -123],
  ['123', 123],
  ['2 /2+3 * 4.75- -6', 21.25],
  ['12* 123', 1476],
  ['2 / (2 + 3) * 4.33 - -6', 7.732],
  ['12*-1', -12],
  ['12*123/-(-5+2)', 492],
  ["(1 - 2) + -(-(-(-4)))", 3],
];

for(let test of tests) {
  console.log()
  console.log(calc(test[0]), test[1], calc(test[0]) === test[1]);
  // break;
}
