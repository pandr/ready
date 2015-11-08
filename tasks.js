[
  {
    'id': 'hello',
    'name': 'Say hello',
    'description': 'Write a program that prints "Hello, World" on the screen',
    'outputCheck': function(m) {
      return (/^hello, world/i).test(m);
    }
  },
  {
    'id': 'simplemathmul',
    'name': 'Do math I',
    'description': 'Write a program that prints the result of 1379 * 7728',
    'outputCheck': function(m) {
      return parseInt(m) == 1379*7728;
    }
  },
  {
    'id': 'numseq1',
    'name': 'Number sequence',
    'description': 'Write a program that prints the numbers from 1 to 100 (inclusive)',
    'outputChecker': function() {
      this.i = 0;
      this.check = function(s, m) {
        this.i++;
        s.ok = parseInt(m) == this.i; 
        s.done = this.i == 100;
      }
    }
  },
  {
    'id': 'sumlt100',
    'name': 'Do math II',
    'description': 'Print the sum of all numbers less than 100. So you must calculate 1 + 2 + ... + 99',
    'outputCheck': function(m) {
      return parseInt(m) == 4950;
    }
  },
  {
    'id': 'numseq2',
    'name': 'Fibonacci',
    'description': 'The Fibonacci sequence is the numbers 1, 1, 2, 3, 5, 8, ... where each number is the sum of the two previous numbers. Write a program that prints the first 25 numbers from this sequence.',
    'outputChecker': function() {
      this.i = 0;
      this.f = 1;
      this.p = 0;
      this.check = function(s, m) {
        this.i++;
        s.ok = parseInt(m) == this.f; 
        s.done = this.i == 25;
        this.f = this.f + this.p;
        this.p = this.f - this.p;
      }
    }
  },
  {
    'id': 'multtab',
    'name': 'Multiplication table',
    'description': 'Write a program that prints the multiplication table for 7; from 7 to 70.',
    'outputChecker': function() {
      this.i = 0;
      this.check = function(s, m) {
        this.i++;
        s.ok = parseInt(m) == this.i*7; 
        s.done = this.i == 10;
      }
      this.check_size = function() {
        return this.i == 10;
      }
    }
  },
  {
    'id': 'sum7mult',
    'name': 'Do math III',
    'description': 'The natural numbers below 20 which are multiplies of 7 are: 7 and 14. '+
      'The sum of these numbers are 21. What is the sum of all multiplies of 7 below 80',
    'outputCheck': function(m) {
      return parseInt(m) == 462;
    }
  },
  {
    'id': 'euler1',
    'name': 'Do math IV (Euler 1)',
    'description': 'If we list all the natural numbers below 10 that are multiples of 3 or 5, we get 3, 5, 6 and 9. The sum of these multiples is 23.'+
      'Find the sum of all multiplies of 3 and 5 below 100.',
    'outputCheck': function(m) {
      return parseInt(m) == 2318;
    }
  },
];
