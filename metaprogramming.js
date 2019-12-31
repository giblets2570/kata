function callNextMethod(methodInfo) {
  var args = Array.prototype.slice.call(arguments,1);
  // call the next method or throw an error
  let method = methodInfo.generic._findMethod.apply(this, [{
    discriminator: methodInfo.discriminator,
    combination: methodInfo.combination,
  }].concat(args));
  // No next method found for NAME in COMBINATION
  if (!method) throw String(`No next method found for ${methodInfo.generic.getName()} in ${methodInfo.combination}`);
  // if (method.combination === 'primary') methodInfo.generic.callMethods('before', ...args);
  let result = method.fn.apply(this, args);
  // if (method.combination === 'primary') methodInfo.generic.callMethods('after', ...args);
  return result;
};

function defgeneric(name) {
  // console.log('generic.defgeneric');
  // console.log(arguments);
  var generic = function () {
    var args = Array.prototype.slice.call(arguments,0);
    var method = generic._findMethod.apply(this, [null].concat(args));
    if (!method) throw String(`No method found for ${generic.getName()} with args: ${args.map((a) => typeof a).join(',')}`);
    let callBeforeAndAfter = method.combination === 'primary' || generic.isPrimaryCalled(method, ...args);
    if (callBeforeAndAfter) generic.callMethods('before', ...args);
    try {
      let result = method.fn.apply(this, args);
      if (callBeforeAndAfter) generic.callMethods('after', ...args);
      return result;
    } catch (e) {
      throw e
    }
  };

  generic.callMethods = function(combination) {
    // console.log('generic.callMethods');
    // console.log(arguments);
    var args = Array.prototype.slice.call(arguments,1);
    let specificities = generic.getSpecificities(combination, ...args);
    if (specificities.length) {
      specificities = specificities.sort((a, b) => {
        for (let i = 0; i < a.specificity.length; i++) {
          if (a.specificity[i] === b.specificity[i]) continue;
          if (a.specificity[i] > b.specificity[i]) return combination === 'before' ? 1 : -1;
          return combination === 'before' ? -1 : 1;
        }
      });
      specificities.forEach(function(specificity) {
        let method = generic[combination][specificity.index];
        method.fn.apply(this, args);
      })
    }
  }

  generic.primary = [];
  generic.around = [];
  generic.before = [];
  generic.after = [];

  generic.getName = function() {
    // console.log('generic.getName');
    // console.log(arguments);
    return name;
  };

  generic.isPrimaryCalled = function(method) {
    // console.log('generic.isPrimaryCalled');
    // console.log(arguments);
    let nextMethod = Object.assign({}, method);
    var args = Array.prototype.slice.call(arguments,1);
    while (nextMethod.code.includes('callNextMethod')) {
      try {
        nextMethod = generic._findMethod(nextMethod, ...args);
        if (nextMethod.combination === 'primary') {
          return true;
        }
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  generic.defmethod = function (discriminator, fn, combination) {
    // console.log('generic.defmethod');
    // console.log(arguments);
    combination = combination || 'primary';
    // XXX: assign the new method
    // Find the old method
    let i;
    for (i = 0; i < generic[combination].length; i++) {
      if (generic[combination].discriminator === discriminator) break;
    }
    let bounded = fn.bind({
      generic: generic,
      discriminator: discriminator,
      combination: combination,
    })
    generic[combination].splice(i, 1, {
      discriminator: discriminator,
      fn: bounded,
      code: String(fn),
    });
    return generic;
  };

  generic.removeMethod = function (discriminator, combination) {
    // console.log('generic.removeMethod');
    // console.log(arguments);
    combination = combination || 'primary';
    // XXX: remove the method
    for (var i = 0; i < generic[combination].length; i++) {
      if (generic[combination][i].discriminator === discriminator) {
        generic[combination].splice(i, 1);
        break;
      }
    }
    return generic;
  };

  generic.getSpecificities = function (combination) {
    // console.log('generic.getSpecificities');
    // console.log(arguments);
    var args = Array.prototype.slice.call(arguments,1);
    let specificities = generic[combination].map(function(t, i) {
      let types = t.discriminator.split(',');
      let correct = types.map(function(t, index) {
        let a = args[index];
        if (a instanceof Object && a.constructor.name === t) return 1;
        // Skip t 2
        let constructorName = a.constructor.name;
        let na = a.__proto__;
        let returnVal = 2
        while (na.constructor.name !== 'Object') {
          if (na instanceof Object && na.constructor.name === t) return returnVal;
          constructorName = na.constructor.name;
          na = na.__proto__;
          returnVal += 1;
        };
        if (a === null && t === 'null') return returnVal;
        if (typeof a === t) return returnVal+1;
        if (t === '*') return returnVal+2;
        return 0;
      });
      return {specificity: correct, index: i, discriminator: t.discriminator};
    }).filter((type) => type.specificity.every((type) => type > 0));
    return specificities;
  }

  generic._findMethod = function (prevInfo) {
    // console.log('generic._findMethod');
    // console.log(arguments);
    var args = Array.prototype.slice.call(arguments,1);
    if (!prevInfo || prevInfo.combination === 'around') {
      let combination = 'around';
      let specificities = generic.getSpecificities('around', ...args);
      if (!specificities.length) {
        combination = 'primary';
        specificities = generic.getSpecificities('primary', ...args);
      }
      specificities = specificities.sort((a, b) => {
        for (let i = 0; i < a.specificity.length; i++) {
          if (a.specificity[i] === b.specificity[i]) continue;
          if (a.specificity[i] > b.specificity[i]) return 1;
          return -1;
        }
      });
      if (specificities.length) {
        let index;
        if (prevInfo) {
          if (combination !== prevInfo.combination) {
            index = 0;
          } else {
            index = specificities.findIndex((s) => s.discriminator === prevInfo.discriminator) + 1;
            if (!index) throw String('Error')
            if (combination === 'around' && index >= specificities.length) {
              combination = 'primary';
              specificities = generic.getSpecificities('primary', ...args);
              specificities = specificities.sort((a, b) => {
                for (let i = 0; i < a.specificity.length; i++) {
                  if (a.specificity[i] === b.specificity[i]) continue;
                  if (a.specificity[i] > b.specificity[i]) return 1;
                  return -1;
                }
              });
              index = 0;
            }
          }
        } else {
          index = 0;
        }
        if (index < specificities.length) {
          let method = generic[combination][specificities[index].index];
          if (method) return {...method, combination: combination};
        }
      }
    } else {
      let combination = 'primary';
      let specificities = generic.getSpecificities('primary', ...args);
      if (specificities.length) {
        specificities = specificities.sort((a, b) => {
          for (let i = 0; i < a.specificity.length; i++) {
            if (a.specificity[i] === b.specificity[i]) continue;
            if (a.specificity[i] > b.specificity[i]) return 1;
            return -1;
          }
        });
        let index;
        if (prevInfo) {
          index = specificities.findIndex((s) => s.discriminator === prevInfo.discriminator) + 1;
          if (!index) throw String('Error')
        } else {
          index = 0;
        }
        if (index < specificities.length) {
          let method = generic.primary[specificities[index].index];
          if (method) return {...method, combination: combination, };
        }
      }
    }
  }

  generic.findMethod = function () {
    // console.log('generic.findMethod');
    // console.log(arguments);
    var args = Array.prototype.slice.call(arguments,0);
    let method = generic._findMethod.apply(this, [null].concat(args));
    return (function() {
      let callBeforeAndAfter = method.combination === 'primary' || generic.isPrimaryCalled(method, ...args);
      if (callBeforeAndAfter) generic.callMethods('before', ...args);
      let result = method.fn();
      if (callBeforeAndAfter) generic.callMethods('after', ...args);
      return result;
    })
  }

  return generic;
};


// var append = defgeneric('append');
// append.defmethod('Array,Array', function (a,b) { return a.concat(b); });
// append.defmethod('*,Array', function (a,b) { return [a].concat(b); });
// append.defmethod('Array,*', function (a,b) { return a.concat([b]); });
//
// try {
//   append(1,2)
// } catch (e) {
//   console.log(e)
//   "No method found for append with args: number,number", "No method"
// }



// Test.assertSimilar(append([1,2],[3,4]),[1,2,3,4], "Append array + array");
// Test.assertSimilar(append(1,[2,3,4]),[1,2,3,4], "Append number + array");
// Test.assertSimilar(append([1,2,3],4),[1,2,3,4], "Append array + number");
// Test.expectError("No way to append two integers.", function () {
//   append(1,2);
// });
// console.log(append([1,2],[3,4]));
// console.log(append(1,[2,3,4]));
// console.log(append([1,2,3],4));
// append(1,2);


(1,eval)("function Mammal() {} \
\
function Rhino() {} \
Rhino.prototype = new Mammal(); \
Rhino.prototype.constructor = Rhino; \
\
function Platypus() {} \
Platypus.prototype = new Mammal(); \
Platypus.prototype.constructor = Platypus; \
\
function KingPlatypus() {} \
KingPlatypus.prototype = new Platypus(); \
KingPlatypus.prototype.constructor = KingPlatypus;");



// var name = defgeneric('name')
//   .defmethod('Mammal', function () { return 'Mammy'; })
//   .defmethod('Platypus', function (p) { return 'Platty ' + callNextMethod(this, p); })
//   .defmethod('KingPlatypus', function (p) { return 'KingPlatypus ' + callNextMethod(this, p); })
//
// // console.log(name);
// // console.log(name.getName());
// console.log(name(new Rhino()));
// console.log(name(new Platypus()));
// console.log(name(new KingPlatypus()));

// //
// var laysEggs = defgeneric('laysEggs')
//   .defmethod('Mammal', function () { return false; })
//   .defmethod('Platypus', function () { return true; });
//
// //
// //
// laysEggs
//   .defmethod('Platypus', function () { console.log('Before platypus egg check.'); }, 'before')
//   .defmethod('Mammal', function () { console.log('Before mammal egg check.'); }, 'before')
//   .defmethod('*', function () { console.log('Before egg check.'); }, 'before')
//   .defmethod('Platypus', function () { console.log ('After platypus egg check.'); }, 'after')
//   .defmethod('Mammal', function () { console.log('After mammal egg check.'); }, 'after');
//
// laysEggs.defmethod('Platypus', function (p) {
//   console.log('>>>Around platypus check.');
//   var ret = callNextMethod(this,p);
//   console.log('<<<Around platypus check.');
//   return ret;
// }, 'around');
// laysEggs.defmethod('Mammal', function (p) {
//   console.log('>>>Around mammal check.');
//   var ret = callNextMethod(this,p);
//   console.log('<<<Around mammal check.');
//   return ret;
// }, 'around');
//
// // console.log(laysEggs);
//
// // console.log(laysEggs(new Rhino()));     // => false
// console.log(laysEggs(new Platypus()));  // => true
//
//
// var msgs = "";
// var log = function (str) { msgs += str; };
// var describe = defgeneric('describe')
//   .defmethod('Platypus', function () { log('Platy' + arguments.length.toString()); return 'P'; })
//   .defmethod('Mammal', function () { log('Mammy' + arguments.length.toString()); return 'M'; })
//   .defmethod('Platypus', function () { log('platypus' + arguments.length.toString()); }, 'before')
//   .defmethod('Platypus', function () { log('/platypus' + arguments.length.toString()); }, 'after')
//   .defmethod('Mammal', function () { log('mammal' + arguments.length.toString()); }, 'before')
//   .defmethod('Mammal', function () { log('/mammal' + arguments.length.toString()); }, 'after')
//   .defmethod('object', function () { log('object' + arguments.length.toString()); }, 'before')
//   .defmethod('object', function () { log('/object' + arguments.length.toString()); }, 'after');
//
// var tryIt = function (a) {
//   msgs = "";
//   var ret = describe(a);
//   return ret + ':' + msgs;
// };
//
// console.log(tryIt(new Platypus()));
//
// // //
// describe.removeMethod('Platypus', 'primary')

// describe = defgeneric('describe')
//   .defmethod('Mammal', function(m) { return 'mammal' })
//   .defmethod('Platypus', function(m) { return 'plat ' + callNextMethod(this, m) })
//   .defmethod('KingPlatypus', function(m) { return 'king ' +  callNextMethod(this, m) })
//   .defmethod('Rhino', function(r) { return callNextMethod(this, r) }, 'around')
//
//   .defmethod('KingPlatypus', function() { console.log('KingPlatypus before') }, 'before')
//   .defmethod('KingPlatypus', function() { console.log('KingPlatypus after') }, 'after')
//   .defmethod('Mammal', function() { console.log('Mammal before') }, 'before')
//   .defmethod('*', function() { console.log('Egg before') }, 'before')
//   .defmethod('Mammal', function() { console.log('Mammal after') }, 'after')
//   .defmethod('Platypus', function() { console.log('Platypus before') }, 'before')
//   .defmethod('Platypus', function() { console.log('Platypus after') }, 'after')
//
//
// describe
//   .defmethod('Platypus', function(p){ return 'describe ' + callNextMethod(this, p); }, 'around');

// var msg = null;
//
// describe = defgeneric('describe')
//   .defmethod('Platypus', function () { msg = 'P'; }, 'before')
//   .defmethod('Platypus', function (p) { return 'Mammal. [Aquatic]'; }, 'primary')
//   .defmethod('Mammal', function () { return "Mammal."; }, 'primary')
//
// console.log(describe(new KingPlatypus()))
// console.log(msg);


var msg;

let describe = defgeneric('describe')
  .defmethod( 'Platypus', function () { msg = 'P'; }, 'before' )
  .defmethod( 'Platypus', function (p) { return 'Mammal. [Aquatic]'; } )
  .defmethod( 'Mammal', function () { return "Mammal."; } )


let method1 = describe.findMethod( new Platypus () );
console.log(method1);

let method2 = describe.findMethod( new Platypus () );
console.log(method2);

let method3 = describe.findMethod( new Rhino () );
console.log(method3);

describe.removeMethod('Platypus', 'before' );
describe.defmethod('Platypus', function (p) { return 'Weird Mammal.'; } );

let method4 = describe.findMethod(new Platypus());
console.log(method4);


console.log(msg);
console.log(method1());
console.log(msg);
console.log(method2());
console.log(msg);
console.log(method3());
console.log(msg);
console.log(method4());
console.log(msg);
