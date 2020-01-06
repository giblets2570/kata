var query = function() {
  var object = {
    data: null,
    selector: null,
    groupers: null,
    wheres: [],
    havings: [],
    orderer: null,
    select: function(f) {
      if (this.selector) throw new Error('Duplicate SELECT');
      this.selector = f || function(row){return row;};
      return this;
    },
    where: function() {
      let wheres = Array.prototype.slice.call(arguments, 0);
      this.wheres.push(wheres);
      return this;
    },
    from: function(){
      if (this.data) throw new Error('Duplicate FROM');
      let input = Array.prototype.slice.call(arguments, 0);
      if (input.length === 1) {
        this.data = input[0].slice();
        return this;
      }
      this.data = [];
      for(let i = 0; i < input[0].length; i++) {
        let row = [];
        for(let j = 0; j < input[1].length; j++) {
          this.data.push([input[0][i], input[1][j]]);
        }
      }
      // if theres more to join
      for(let k = 2; k < input.length; k++) {
        let rows = [];
        for(let i = 0; i < this.data.length; i++) {
          for(let j = 0; j < input[k].length; j++) {
            let row = this.data[i].slice();
            row.push(input[k][j]);
            rows.push(row);
          }
        }
        this.data = rows;
      }
      return this;
    },
    groupBy: function(){
      if (this.groupers) throw new Error('Duplicate GROUPBY')
      this.groupers = Array.prototype.slice.call(arguments, 0);
      return this;
    },
    orderBy: function(f) {
      if (this.orderer) throw new Error('Duplicate ORDERBY')
      this.orderer = f;
      return this;
    },
    having: function(f) {
      this.havings.push(f);
      return this;
    },
    execute: function(){
      this.data = this.data || [];
      for(let ors of this.wheres) {
        this.data = this.data.filter((row) => {
          return !ors.every((or) => !or(row));
        });
      }
      if (this.groupers) {

        let result = Array.from(new Set(this.data.map(this.groupers[0])));
        result = result.map((u) => [u, []]);
        let uniques = this.groupers.map((grouper) => Array.from(new Set(this.data.map(grouper))));

        for(let row of this.data) {
          let group = this.groupers[0](row);
          let location = result.find((c) => c[0] === group);
          for(let grouper of this.groupers.slice(1)) {
            let group = grouper(row);
            let next = location[1].find((c) => c[0] === group);
            if (!next) {
              location[1].push([group, []]);
              next = location[1].find((c) => c[0] === group);
            };
            location = next;
          }
          location[1].push(row);
        }
        this.data = result;
      }
      for(let having of this.havings) {
        this.data = this.data.filter(having);
      }
      if (this.orderer) {
        this.data = this.data.sort(this.orderer);
      }
      if (this.selector) {
        this.data = this.data.map(this.selector);
      }
      return this.data;
    }
  }
  return object;
};

var persons = [
  {name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married'},
  {name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single'},
  {name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married'},
  {name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'married'},
  {name: 'Rose', profession: 'scientific', age: 50, maritalStatus: 'married'},
  {name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'single'},
  {name: 'Anna', profession: 'politician', age: 50, maritalStatus: 'married'}
];

var teachers = [
  {
    teacherId: '1',
    teacherName: 'Peter'
  },
  {
    teacherId: '2',
    teacherName: 'Anna'
  }
];


var students = [
  {
    studentName: 'Michael',
    tutor: '1'
  },
  {
    studentName: 'Rose',
    tutor: '2'
  }
];

function teacherJoin(join) {
  return join[0].teacherId === join[1].tutor;
}

function student(join) {
  return {studentName: join[1].studentName, teacherName: join[0].teacherName};
}

function isEven(number) {
  return number % 2 === 0;
}

function parity(number) {
  return isEven(number) ? 'even' : 'odd';
}

function isPrime(number) {
  if (number < 2) {
    return false;
  }
  var divisor = 2;
  for(; number % divisor !== 0; divisor++);
  return divisor === number;
}

function prime(number) {
  return isPrime(number) ? 'prime' : 'divisible';
}

var numbers1 = [1, 2];
var numbers2 = [4, 5];
var numbers3 = [6, 7];
var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

//SELECT studentName, teacherName FROM teachers, students WHERE teachers.teacherId = students.tutor
let p = query().select().from(numbers).groupBy(parity).execute();
// query().select(student).from(teachers, students).where(teacherJoin).execute();
// query().select().from(numbers).where(isEven).where(isPrime).execute();
console.log(JSON.stringify(p,1,2,3,4));
