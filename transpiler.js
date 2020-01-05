function replaceLambdas(program) {
  let re = /{ *((\w+ *, *)*\w+ *->|) *(\w+\s*)* *}/gi;
  let lambdas = new Set()
  while(true) {
    let p = re.exec(program);
    if (!p) break;
    lambdas.add(p[0]);
  }
  lambdas = Array.from(lambdas);
  for (let lambda of lambdas) {
    let args = "";
    let body = "";
    if (lambda.includes('->')) {
      args = lambda.slice(1).split('->')[0].replace(/ /g,'');
      body = lambda.slice(1, lambda.length-1).split('->')[1];
      let vars = body.match(/\w+\s*/g);
      body = vars ? vars.map((v) => v+';').join('').replace(/\n/g,'') : "";
    } else {
      let vars = lambda.match(/\w+\s*/g);
      body = vars ? vars.map((v) => v+';').join('').replace(/\n/g,'') : "";
    }
    // if (body.length) body += ';';
    let formatted = `(${args}){${body}}`;
    program = program.replace(new RegExp(lambda, 'g'), formatted);
  }
  return program;
}

function validArgs(program) {
  // console.log('validArgs');
  let re = /\([a-z\d, _]*\)/gi;
  let matches = program.match(re);
  if (!matches) return false;
  for (let match of matches) {
    let matched = match.match(/[a-z_\d]+ +[a-z_\d]+/gi);
    if (matched) {
      return false;
    }
  }
  // console.log('valid');
  return true;
}


function removeOuterLambda(program) {
  let outerLambda = program.match(/^(\d+|[a-z_]\w*)\(((([a-z_]\w*|\d+|\((\w+,)*\w*\){(\w+;)*}),)*([a-z_]\w*|\d+|\((\w+,)*\w*\){(\w+;)*})|)\)\((\w+,)*\w*\){(\w+;)*}$/gi);
  if (outerLambda) {
    outerLambda = program.match(/\((\w+,)*\w*\){(\w+;)*}$/gi, '');
    program = program.replace(/\((\w+,)*\w*\){(\w+;)*}$/gi, '');
    if (program.includes('(')) {
      while(program[program.length-1] !== ')') program = program.slice(0, program.length-1);
      program = program.slice(0, program.length-1);
      if (program[program.length-1] === '(') {
        program += outerLambda[0] + ')';
      } else {
        program += ',' + outerLambda[0] + ')';
      }
    } else {
      program += '(' + outerLambda[0] + ')';
    }
  }
  outerLambda = program.match(/^\((\w+,)*\w*\){(\w+;)*}\(((([a-z_]\w*|\d+|\((\w+,)*\w*\){(\w+;)*}),)*([a-z_]\w*|\d+|\((\w+,)*\w*\){(\w+;)*})|)\)\((\w+,)*\w*\){(\w+;)*}$/gi);
  if (outerLambda) {
    outerLambda = program.match(/\((\w+,)*\w*\){(\w+;)*}$/gi, '');
    program = program.replace(/\((\w+,)*\w*\){(\w+;)*}$/gi, '');
    if (program.includes('(')) {
      while(program[program.length-1] !== ')') program = program.slice(0, program.length-1);
      program = program.slice(0, program.length-1);
      if (program[program.length-1] === '(') {
        program += outerLambda[0] + ')';
      } else {
        program += ',' + outerLambda[0] + ')';
      }
    } else {
      program += '(' + outerLambda[0] + ')';
    }
  }
  outerLambda = program.match(/^(\d+|[a-z_]\w*)((([a-z_]\w*|\d+|\((\w+,)*\w*\){(\w+;)*}),)*([a-z_]\w*|\d+|\((\w+,)*\w*\){(\w+;)*})|)$/gi);
  if (outerLambda) {
    outerLambda = program.match(/\((\w+,)*\w*\){(\w+;)*}$/gi, '');
    if (!outerLambda) return program;
    program = program.replace(/\((\w+,)*\w*\){(\w+;)*}$/gi, '');
    program += '(' + outerLambda + ')';
  }
  return program;
}

function formatDouble(program) {
  let outerLambda = program.match(/^\((\w+,)*\w*\){(\w+;)*}\((\w+,)*\w*\){(\w+;)*}$/gi);
  if (outerLambda) {
    let end = program.match(/\((\w+,)*\w*\){(\w+;)*}$/gi);
    program = program.replace(/\((\w+,)*\w*\){(\w+;)*}$/gi, '');
    program += '(' + end[0] + ')'
    // console.log(end[0]);
  }
  return program;
}

function transpile(program){
  // console.log()
  while(program[0] === ' ') program = program.slice(1);
  program = program.replace(/\n/g, ' ');
  // console.log(program);

  if (program.replace(/ /g,'').includes(',)')) return null;
  program = replaceLambdas(program);
  if (!validArgs(program)) return null;
  program = program.replace(/ /g, '').replace('),',',');
  program = removeOuterLambda(program);
  program = formatDouble(program);
  // console.log('program',program);
  // console.log('program',program);
  // For a function call
  let re = /^(\d+|[a-z_]\w*)\(((([a-z_]\w*|\d+|\(((([a-z_]\w*|\d+),)*([a-z_]\w*|\d+)|)\){(\w+;)*}),)*([a-z_]\w*|\d+|\(((([a-z_]\w*|\d+),)*([a-z_]\w*|\d+)|)\){(\w+;)*})|)\)$/gi;
  let match = program.match(re);
  if (match) return program;
  // console.log(program);
  // outside bracket
  re = /^\((\w+,)*\w*\){(\w+;)*}\(((([a-z_]\w*|\d+|\((\w+,)*\w*\){(\w+;)*}),)*([a-z_]\w*|\d+|\((\w+,)*\w*\){(\w+;)*})|)\)$/gi;
  match = program.match(re);
  if (match) return program;
  return null;
}

let tests = [
  'tCXvtzOT8_8p5 (fj5ea8ZdUzahiY  , {_  , iy3NNwK  , 28244 ,  847659, F8lc,  TCsTf9b5H2Ge3p  -> yjCUdZJJ7wa    zVD }  , {1, 9 ,ZiPm , 9524  -> ytaH aXVHzKH0pjzlXGe Mqx2_RBq } ,  fA1XQ3UP8o  , {qizqGHE   4939001   91003   7201448   7248   SXYMxR    YV},  F, myPqn9Gj,{Dg4rGzpg7T2vwKS     133   KP0yi     726    55712 9 },  {916,197972, 78  , 98 -> GH4PI    YiZdznxRdTcE    GMXbDFBd7    WP5nR7VEA } ) {315,PXTK5gwPQW3 , hPcr, Dpz4OH1Eu7rPC,JzoI3mw44CWpn9e , 9940405 ,  22  -> 36562817   2805   33  }',
  // 'call()',
//   `call(
// ){}`,
  // 'a b c',
  // 'invoke({},{})',
  // 'run({a})',
  // 'f({_->})',
  // 'invo(123, abc ),{ } )',
  // 'f(x){a->}',
  // '{a->a}(233)',
  // 'invoke({},{})',
  // 'f({jj->asWeCan t})',
  // 'invo(123, abc ) { } ',
  // '     { a   -> a }(cde,y,z){x,y,d -> stuff}  ',
  // 'f({_->})'
  // 'f({1a->a})',
  // '{a,b,c->a  b c }  (233 , 666, 999)',
 //  `f(abc,def){a,b,c,d,e->a
 //  b
 // c
 // d
 // e}`,
 // '{72801    51101  RAcZVn1pH3lPwgV    85   VI6_HHO2_  } {1827932   74592    79   97}',
 // '{}{}',
 // '{}()',
 // 'that(is,the) question',
 // '{7   dNagnbZm89EE6q    9612353    wmJeTY7aPjoo  6775810} (cCN8WOmne3z02,{385 , G4gCORDPNMWTV,  rzQpRFexl -> D8kl Ng1Ki_R39A01y} ,W00Ohs9MLGWe, {W1dErQEJI6tx  , IUPfpcNQ8c68N-> 7  485  1510     1    96197    jW51C} )'
]
//(){72801;51101;RAcZVn1pH3lPwgV;85;VI6_HHO2_;}((){1827932;74592;79;97;})
for(let test of tests){
  console.log(transpile(test));
}
