function Interpreter()
{
    this.vars = {};
    this.functions = {};
}

Interpreter.prototype.tokenize = function (program)
{
  if (program === "")
    return [];

  var regex = /\s*([-+*\/\%=\(\)]|[A-Za-z_][A-Za-z0-9_]*|[0-9]*\.?[0-9]+)\s*/g;
  return program.split(regex).filter(function (s) { return !s.match(/^\s*$/); });
};

Interpreter.prototype._fn = function(tokens) {
  console.log(tokens);
  if (!tokens.length) {
    return '';
  } else if (tokens.length === 1) {
    if (parseInt(tokens[0]) > -20) {
      return parseInt(tokens[0]);
    } else {
      if ( this.vars[tokens[0]] !== undefined ) {
          tokens[0] = this.vars[tokens[0]];
          return this._fn(tokens);
        } else if (this.functions[tokens[0]] && !this.functions[tokens[0]].variables.length) {
          let { variables, body } = this.functions[tokens[0]];
          let values = tokens.slice(1, 1 + variables.length);
          let mappedBody = body.map((v) => {
            let index = variables.indexOf(v);
            if (index > -1) {
              return values[index];
            }
            return v;
          });
          let wrappedBody = ['('].concat(mappedBody).concat([')']);
          tokens.splice(0, 1 + variables.length, ...wrappedBody);
          return this._fn(tokens);
        } else {
          throw new Error(`ERROR: Invalid identifier. No variable with name '${tokens[0]}' was found.`);
        }
    }
  } else if (tokens[0] === 'fn') { // function definition
    let funcName = tokens[1];
    console.log('funcName:', funcName);
    console.log(this.vars);
    if (this.vars[funcName] !== undefined) {
      throw new Error('Naming error');
    }
    let varEnd = tokens.indexOf('=');
    let variables = tokens.slice(2, varEnd);
    if (Array.from(new Set(variables)).length < variables.length) {
      throw new Error("Contains duplicates");
    }
    let body = tokens.slice(varEnd+2);
    for (let variable of variables) {
      if (body.indexOf(variable) === -1) {
        throw new Error(`Variable ${variable} not used in function`)
      }
    }
    this.functions[funcName] = {
      variables: variables,
      body: body,
    };
    return '';
  }

  else {
    // parentheses
    if (tokens.includes('(')) {
      let start = tokens.indexOf('(') + 1;
      let i = start;
      let level = 0;
      let end = -1;
      while (i < tokens.length) {
        if (tokens[i] === '(') {
          level += 1;
        }
        if (tokens[i] === ')') {
          if (level === 0) {
            end = i;
            break;
          } else {
            level -= 1;
          }
        }
        i += 1;
      }
      let innerValue = this._fn(tokens.slice(start, end));
      tokens.splice(start - 1, end + 1, innerValue, ...tokens.splice(end+1));
      return this._fn(tokens);
    } else if (parseInt(tokens[0]) > -20) {
      if (tokens.length === 2) {
        throw new Error('Invalid length')
      }
      let i = 1
      let found = false;
      while(i < tokens.length) {
        if (['%','/','*'].includes(tokens[i])) {
          found = true;
          break;
        }
        i += 2;
      }
      if (found) {
        let returnValue = parseInt(tokens[i-1]);
        switch(tokens[i]) {
          case '*': returnValue *= parseInt(tokens[i+1]); break;
          case '%': returnValue = returnValue % parseInt(tokens[i+1]); break;
          case '/':
            if (parseInt(tokens[i+1]) > -1) returnValue /= parseInt(tokens[i+1]);
            else returnValue = 0;
          default: break;
        }
        tokens[i-1] = returnValue;
        tokens.splice(i,2); // remove
        return this._fn(tokens);
      }
      i = 1
      while(i < tokens.length) {
        if (['+','-'].includes(tokens[i])) {
          found = true;
          break;
        }
        i += 2;
      }
      if (found) {
        let returnValue = parseInt(tokens[i-1]);
        switch(tokens[i]) {
          case '+': returnValue += parseInt(tokens[i+1]); break;
          case '-': returnValue -= parseInt(tokens[i+1]); break;
          default: break;
        }
        tokens[i-1] = returnValue;
        tokens.splice(i,2); // remove
        return this._fn(tokens);
      }

    } else {
      if (['+','-'].includes(tokens[0])) {
        return parseInt(tokens.join(''));
      } else if(tokens[1] === '=') {
        if (this.functions[tokens[0]]) {
          throw new Error('error')
        }
        this.vars[tokens[0]] = this._fn(tokens.slice(2));
        return this.vars[tokens[0]];
      } else if (tokens.length === 2) {
        throw new Error('Invalid length')
      } else {
        if ( this.vars[tokens[0]] !== undefined ) {
          tokens[0] = this.vars[tokens[0]];
          return this._fn(tokens);
        } else if (this.functions[tokens[0]]) {

          // check is there any chained function calls
          for (var i = tokens.length - 1; i >= 0; i--) {
            if (this.functions[tokens[i]]) {
              let { variables, body } = this.functions[tokens[i]];
              let values = tokens.slice(i + 1, i + 1 + variables.length);
              let mappedBody = body.map((v) => {
                let index = variables.indexOf(v);
                if (index > -1) {
                  return values[index];
                }
                return v;
              });
              let wrappedBody = ['('].concat(mappedBody).concat([')']);
              let tokensEnd = tokens.splice(i + 1 + variables.length);
              console.log('tokensEnd:', tokensEnd)
              tokens.splice(i, i + 1 + variables.length, ...wrappedBody, ...tokensEnd);
              return this._fn(tokens);
            }
          }
          return this._fn(tokens);
        } else {
          throw new Error(`ERROR: Invalid identifier. No variable with name '${tokens[0]}' was found.`);
        }
      }
    }
  }
}

Interpreter.prototype.input = function (expr)
{
  var tokens = this.tokenize(expr);

  let result = this._fn(tokens);

  console.log(result);

  return result;

};
