function interpret(code) {
  console.log(code);
  let formattedCode = code.split('\n').map((l) => l.split(''));
  let direction = 0;
  var output = "";
  let stack = [];
  // TODO: Interpret the code!
  let current = [0,0];
  let directions = ['>','<','v','^'];
  let command = getCommand(current, formattedCode);
  let stringMode = false;
  for (var i = 0; i < 50; i++) {
  // while(true) {
    console.log(command)
    if (command === '"') {
      stringMode = !stringMode;
    } else if(stringMode) {
      stack.push(command);
    } else if (directions.includes(command)) {
      direction = directions.indexOf(command);
    } else if (command === '+') {
      let a = stack.pop();
      let b = stack.pop() || 0;
      stack.push(a + b);
    } else if (command === '-') {
      let a = stack.pop();
      let b = stack.pop() || 0;
      stack.push(b - a);
    } else if (command === '*') {
      let a = stack.pop();
      let b = stack.pop();
      stack.push(b * a);
    } else if (command === '/') {
      let a = stack.pop();
      let b = stack.pop() || 0;
      if (a === 0) stack.push(0);
      else stack.push(b / a);
    } else if (command === '%') {
      let a = stack.pop();
      let b = stack.pop() || 0;
      if (a === 0) stack.push(0);
      else stack.push(b % a);
    } else if (command === '!') {
      let a = stack.pop();
      if (a === 0) stack.push(1);
      else stack.push(0);
    } else if (command === '`') {
      let a = stack.pop();
      let b = stack.pop();
      if (b > a) stack.push(1);
      else stack.push(0);
    } else if (command === '_') {
      let a = stack.pop();
      if (a === 0) direction = 0;
      else direction = 1;
    } else if (command === '|') {
      let a = stack.pop();
      if (a === 0) direction = 2;
      else direction = 3;
    } else if (command === ':') {
      if (stack.length === 0) {
        stack.push(0);
      } else {
        let value = stack[stack.length - 1];
        stack.push(value);
      }
    } else if (command === '\\') {
      let a = stack.pop();
      let b = stack.pop() || 0;
      stack.push(a);
      stack.push(b);
    } else if (command === '$') {
      stack.pop();
    } else if (command === '?') {
      direction = (direction + 1) % 4;
    } else if (command === '.') {
      let a = stack.pop();
      while(a !== undefined) {
        output += String(a);
        a = stack.pop();
      }
    } else if (command === ',') {
      let a = stack.pop();
      while(a !== undefined) {
        if (parseInt(a) > -1) {
          output += String.fromCharCode(parseInt(a));
        } else {
          output += String(a);
        }
        a = stack.pop();
      }
    } else if (command === '#') {
      move(current, direction, formattedCode);
    } else if (command === '@') {
      break;
    } else if (parseInt(command) > -1) {
      stack.push(parseInt(command));
    } else if (command === ' ') {

    } else if (command === 'p') {
      let y = stack.pop();
      let x = stack.pop();
      let v = stack.pop();
      formattedCode[y][x] = String.fromCharCode(parseInt(v));
    } else if (command === 'g') {
      let y = stack.pop();
      let x = stack.pop();
      stack.push(formattedCode[y][x]);
    } else {
      console.log(command);
    }
    move(current, direction, formattedCode);
    command = getCommand(current, formattedCode);
    console.log(stack, output);
  }
  return output;
}

function getCommand(current, code) {
  let [x, y] = current;
  return code[x][y];
}

function move(current, direction, code) {
  switch (direction) {
    case 0: current[1] = (current[1] + 1) % code[current[0]].length; break; // move right
    case 1: current[1] = (current[1] + code[current[0]].length - 1) % code[current[0]].length; break; // move left
    case 2: current[0] = (current[0] + 1) % code.length; break; // move down
    case 3: current[0] = (current[0] + code.length - 1) % code.length; break; // move up
    default: break
  }
}


// console.log(interpret('>987v>.v\nv456<  :\n>321 ^ _@'));
// console.log(interpret(`>25*"!dlroW olleH":v
//                 v:,_@
//                 >  ^`))
console.log(interpret(`01->1# +# :# 0# g# ,# :# 5# 8# *# 4# +# -# _@`));
