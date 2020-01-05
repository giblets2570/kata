let util = require('util');

function Compiler () {};

Compiler.prototype.compile = function (program) {
  return this.pass3(this.pass2(this.pass1(program)));
};

Compiler.prototype.tokenize = function (program) {
  // Turn a program string into an array of tokens.  Each token
  // is either '[', ']', '(', ')', '+', '-', '*', '/', a variable
  // name or a number (as a string)
  var regex = /\s*([-+*/\(\)\[\]]|[A-Za-z]+|[0-9]+)\s*/g;
  return program.replace(regex, ":$1").substring(1).split(':').map( function (tok) {
    return isNaN(tok) ? tok : tok|0;
  });
};

Compiler.prototype.pass1recr = function (vars, expression) {
  if (expression.includes('(')) {
    let start = expression.indexOf('(');
    let level = 0;
    let i;
    for(i = start + 1; i < expression.length; i++) {
      if (expression[i] === '(') {
        level += 1;
        continue;
      }
      if (expression[i] === ')') {
        if (level > 0) {
          level -= 1;
        } else {
          break;
        }
      }
    }
    let inner = expression.slice(start+1, i);
    let result = this.pass1recr(vars, inner);
    if (result.length !== 1) throw new Error('Not correct length');
    expression.splice(start, i-start+1, result[0]);
    return this.pass1recr(vars, expression);;
  } else {
    let i = 1;
    while(i < expression.length) {
      if(['*','/'].includes(expression[i])) {
        let [a, op, b] = expression.slice(i-1, i+2);
        let tree = {op: op};
        if (parseInt(a) > -1) {
          tree.a = { op: 'imm', n: parseInt(a), }
        } else if (typeof a === 'object') {
          tree.a = a
        } else {
          if (!vars.includes(a)) throw new Error("Not a valid");
          tree.a = { op: 'arg', n: vars.indexOf(a), }
        }
        if (parseInt(b) > -1) {
          tree.b = { op: 'imm', n: parseInt(b), }
        } else if (typeof b === 'object') {
          tree.b = b
        } else {
          if (!vars.includes(b)) throw new Error("Not a valid");
          tree.b = { op: 'arg', n: vars.indexOf(b), }
        }

        expression.splice(i-1, 3, tree);
      } else {
        i += 2;
      }
    }
    i = 1;
    while(i < expression.length) {
      if(['+','-'].includes(expression[i])) {
        let [a, op, b] = expression.slice(i-1, i+2);
        let tree = {op: op};
        if (parseInt(a) > -1) {
          tree.a = { op: 'imm', n: parseInt(a), }
        } else if (typeof a === 'object') {
          tree.a = a
        } else {
          if (!vars.includes(a)) throw new Error("Not a valid");
          tree.a = { op: 'arg', n: vars.indexOf(a), }
        }
        if (parseInt(b) > -1) {
          tree.b = { op: 'imm', n: parseInt(b), }
        } else if (typeof b === 'object') {
          tree.b = b
        } else {
          if (!vars.includes(b)) throw new Error("Not a valid");
          tree.b = { op: 'arg', n: vars.indexOf(b), }
        }
        expression.splice(i-1, 3, tree);
      } else {
        i += 2;
      }
    }
    return expression;
  }
}

Compiler.prototype.pass1 = function (program) {
  // return un-optimized AST
  let tokens = this.tokenize(program);

  let varEnd = tokens.indexOf(']');
  let vars = tokens.slice(1, varEnd);
  let expression = tokens.slice(varEnd+1);

  let result = this.pass1recr(vars, expression);
  if (result.length !== 1) throw new Error('Not correct length');
  return result[0];
};

Compiler.prototype.pass2 = function (ast) {
  // return AST with constant expressions reduced
  if (ast.a.n !== undefined && ast.b.n !== undefined) {
    if (ast.a.op === 'imm' && ast.b.op === 'imm') {
      let newObj = { op: 'imm' };
      switch (ast.op) {
        case '*': {
          newObj.n = ast.a.n * ast.b.n;
          break;
        }
        case '/': {
          newObj.n = ast.a.n / ast.b.n;
          break;
        }
        case '+': {
          newObj.n = ast.a.n + ast.b.n;
          break;
        }
        case '-': {
          newObj.n = ast.a.n - ast.b.n;
          break;
        }
      }
      return newObj;
    } else {
      return ast;
    }
  } else {
    if (ast.a && ast.a.n === undefined) {
      ast.a = this.pass2(ast.a);
    }
    if (ast.b && ast.b.n === undefined) {
      ast.b = this.pass2(ast.b);
    }
    if (ast.a && ast.b) {
      if (ast.a.op === 'imm' && ast.b.op === 'imm') {
        ast = this.pass2(ast);
      }
    }
    return ast;
  }
};

Compiler.prototype.pass3recr = function (ast, result) {
  // return assembly instructions
  let a, b;
  if (ast.a.op === 'imm') {
    result.push(`IM ${ast.a.n}`);
  } else if (ast.a.op === 'arg') {
    result.push(`AR ${ast.a.n}`);
  } else {
    // console.log('SOMETHING?')
    this.pass3recr(ast.a, result);
  }
  if (ast.b.op === 'imm') {
    result.push('SW');
    result.push(`IM ${ast.b.n}`);
  } else if (ast.b.op === 'arg') {
    result.push('SW');
    result.push(`AR ${ast.b.n}`);
  } else {
    result.push('PU');
    this.pass3recr(ast.b, result);
    result.push('SW');
    result.push('PO');
    result.push('SW');
  }
  if (result[result.length-1] === 'SW') {
    result.pop()
  } else {
    result.push('SW');
  }
  if (ast.op === '*') {
    result.push('MU');
  }
  if (ast.op === '+') {
    result.push('AD');
  }
  if (ast.op === '-') {
    result.push('SU');
  }
  if (ast.op === '/') {
    result.push('DI');
  }
  return result;
}

Compiler.prototype.pass3 = function (ast) {

  let result = this.pass3recr(ast, []);
  return result;
};

function runProgram(p3) {
  let registers = [null, null];
  let stack = [];
  let args = Array.prototype.slice.call(arguments, 1);
  console.log('args:',args);
  for (let command of p3) {
    if (command === 'SW') {
      registers = registers.reverse();
    } else if (command.includes('IM ')) {
      let num = parseInt(command.slice(3));
      registers[0] = num;
    } else if (command.includes('AR ')) {
      let num = parseInt(command.slice(3));
      registers[0] = args[num];
    } else if (command === 'PU') {
      if (registers[0] !== null) {
        stack.push(registers[0]);
      }
    } else if (command === 'PO') {
      let value = stack.pop();
      if (value !== null) {
        registers[0] = value;
      }
    } else if (command === 'AD') {
      registers[0] = registers[0] + registers[1];
    } else if (command === 'SU') {
      registers[0] = registers[0] - registers[1];
    } else if (command === 'MU') {
      registers[0] = registers[0] * registers[1];
    } else if (command === 'DI') {
      registers[0] = registers[0] / registers[1];
    }
    console.log()
    console.log('command:',command,'stack:',stack,'registers:',registers);
  }
}

var prog = '[ x y z ] ( 2*3*x + 5*y - 3*z ) / (1 + 3 + 2*2)';//' / (1 + 3 + 2*2)';
// var prog = '[ x ] ( x + 2*5 )'
// var prog = '[ x ] ( x + 2*5 ) / ( 4 + x )'
// var t1 = JSON.stringify({"op":"/","a":{"op":"-","a":{"op":"+","a":{"op":"*","a":{"op":"*","a":{"op":"imm","n":2},"b":{"op":"imm","n":3}},"b":{"op":"arg","n":0}},"b":{"op":"*","a":{"op":"imm","n":5},"b":{"op":"arg","n":1}}},"b":{"op":"*","a":{"op":"imm","n":3},"b":{"op":"arg","n":2}}},"b":{"op":"+","a":{"op":"+","a":{"op":"imm","n":1},"b":{"op":"imm","n":3}},"b":{"op":"*","a":{"op":"imm","n":2},"b":{"op":"imm","n":2}}}});
// var t2 = JSON.stringify({"op":"/","a":{"op":"-","a":{"op":"+","a":{"op":"*","a":{"op":"imm","n":6},"b":{"op":"arg","n":0}},"b":{"op":"*","a":{"op":"imm","n":5},"b":{"op":"arg","n":1}}},"b":{"op":"*","a":{"op":"imm","n":3},"b":{"op":"arg","n":2}}},"b":{"op":"imm","n":8}});

var c = new Compiler();
// Test.expect(c,"Able to construct compiler");

console.log(prog);

var p1 = c.pass1(prog);
var p2 = c.pass2(p1);

console.log(JSON.stringify(p2, 1,2,3,4));

var p3 = c.pass3(p2);

runProgram(p3,2,3,5);

console.log(JSON.stringify(p3));
