function square_sums_row(n) {
  let m = Math.floor(Math.sqrt(2*n-1));
  let squares = Array(m).fill().map((_,i) => (i+1)**2);
  let remaining = new Set(Array(n).fill().map((_,i) => i+1));
  let result = Array(n).fill(0);
  let i = 0;
  for (let start = 1; start <= n; start++) {
    remaining.delete(start);
    result[0] = start;
    while(true) {
      if(i === n) return result;
      let values = [];
      for(let square of squares) {
        let test = square - result[i-1];
        if (test < 1) continue;
        if (remaining.has(test)) {
          values.push(test);
        }
      }
      if (!values.length) return false;
      for(let value of values) {
        remaining.delete(value);
        result[i] = value;
        let inner = recr(result,remaining,i+1);
        if (inner) return inner;
        result[i] = 0;
        remaining.add(value);
      }
      return false;
    }
    remaining.add(start);
    result[0] = 0;
  }


  // function recr(result, remaining, i) {
  //   if(i === n) return result;
  //   let values = [];
  //   for(let square of squares) {
  //     let test = square - result[i-1];
  //     if (test < 1) continue;
  //     if (remaining.has(test)) {
  //       values.push(test);
  //     }
  //   }
  //   if (!values.length) return false;
  //   for(let value of values) {
  //     remaining.delete(value);
  //     result[i] = value;
  //     let inner = recr(result,remaining,i+1);
  //     if (inner) return inner;
  //     result[i] = 0;
  //     remaining.add(value);
  //   }
  //   return false;
  // }
  for (let start = 1; start <= n; start++) {
    remaining.delete(start);
    result[0] = start;
    let outcome = recr(result, remaining, 1);
    if (outcome) return outcome;
    remaining.add(start);
    result[0] = 0;
  }
  return false;
}

var start = new Date()
setTimeout(function(argument) {
  // execution time simulated with setTimeout function
  console.log(square_sums_row(41));
  var end = new Date() - start;
  console.info('Execution time: %dms', end);
})
