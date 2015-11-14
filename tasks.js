[
/*
  {
    type: 'section',
    name: 'Warm up'   
    content: ['hello', 'simplemathmul', 'nseq1', 'sumlt100']
  }
  */
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
    'id': 'nseq1',
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
    'id': 'streamcopy',
    'name': 'Copy cat',
    'description': 'Read data from input and write to output.',
    'outputChecker': function() {
      this.i = 0;
      this.stream1 = [];
      this.check = function(s, m) {
        s.ok = parseInt(m) == this.stream1[this.i];
        s.done = this.i == this.stream1.length-1;
        this.i++;
      }
      this.populate = function() {
        this.stream1 = [42,0];
        var l = Math.floor(10+Math.random()*10);
        for(var i = 0; i < l; i++)
          this.stream1.push(Math.floor(Math.random()*1000));
        return {stream1: this.stream1};
      }
    }
  },
  {
    'id': 'streammult',
    'name': 'Data multiplier',
    'description': 'Multiply the data from stream1 with 10 and output results.',
    'outputChecker': function() {
      this.i = 0;
      this.stream1 = [];
      this.check = function(s, m) {
        s.ok = parseInt(m) == this.stream1[this.i] * 10;
        s.done = this.i == this.stream1.length-1;
        this.i++;
      }
      this.populate = function() {
        this.stream1 = [];
        for(var i = 0; i < 10; i++)
          this.stream1.push(Math.floor(Math.random()*100));
        return {stream1: this.stream1};
      }
    }
  },
  {
    'id': 'nseq2',
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
    'id': 'streammax',
    'name': 'Maximizer',
    'description': 'Find and print the largest number from the input.',
    'outputChecker': function() {
      this.i = 0;
      this.stream1 = [];
      this.max = 0;
      this.check = function(s, m) {
        this.i++;
        s.ok = parseInt(m) == this.max
        s.done = this.i == 1
      }
      this.populate = function() {
        this.stream1 = [];
        var l = Math.floor(10+Math.random()*10);
        for(var i = 0; i < l; i++)
        {
          var n = Math.floor(Math.random()*1000);
          if(n > this.max) {
            this.max = n;
          }
          this.stream1.push(n);
        }
        return {stream1: this.stream1};
      }
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
