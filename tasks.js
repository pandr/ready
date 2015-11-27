[{
  'exhello':
  {
    name: 'Hello',
    description: "This is a small program. Try guessing what it does, before typing 'run' to try it out!",
    source: ""+
"write('Hi, my name is Ready.');\n"+
"write('What is your name?');\n"+
"var human = read();\n"+
"write('Good to meet you, ' + human + '.');\n",
    completion_message: {
      heading: "Awesome!",
      message: "Now it is your turn programming the computer. See if you can complete the entire warmup section."
    }
  },
  'hello':
  {
    'name': 'Say hello',
    'description': 'Write a program that write "Hello, World" on the screen',
    'outputCheck': function(m) {
      return (/^hello, world/i).test(m);
    },
    completion_message: {
      heading: "Well done!",
      message: "Your first real task!"
    }
  },
  'simplemathmul':
  {
    'name': 'Do math I',
    'description': 'Write a program that write the result of 1379 * 7728',
    'outputCheck': function(m) {
      return parseInt(m) == 1379*7728;
    }
  },
  'nseq1':
  {
    'name': 'Number sequence',
    'description': 'Write a program that write the numbers from 1 to 100 (inclusive)',
    'outputChecker': function() {
      this.i = 0;
      this.check = function(s, m) {
        this.i++;
        s.ok = parseInt(m) == this.i; 
        s.done = this.i == 100;
      }
    }
  },
  'sumlt100':
  {
    'name': 'Do math II',
    'description': 'Write the sum of all numbers less than 100. So you must calculate 1 + 2 + ... + 99',
    'outputCheck': function(m) {
      return parseInt(m) == 4950;
    }
  },
  'nseq3':
  {
    'name': 'Back and forth',
    'description': 'A sequence starts like this: 1, 5, 4, 8, 7, 11, ... You start by 1 and add 4, then subtract 1, '+
      'then add 4, then substract 1, and so on. Write the first 100 numbers from this sequence',
    'outputChecker': function() {
      this.i = 0;
      this.val = 1;
      this.check = function (s,m) {
        this.i++;
        s.ok = parseInt(m) == this.val;
        s.done = this.i == 100;
        this.val += (this.i&1) ? 4 : -1;
      }
    }
  },
  'multtab':
  {
    'name': 'Multiplication table',
    'description': 'Write a program that write the multiplication table for 7; from 7 to 70.',
    'outputChecker': function() {
      this.i = 0;
      this.check = function(s, m) {
        this.i++;
        s.ok = parseInt(m) == this.i*7; 
        s.done = this.i == 10;
      }
    }
  },
  'sum7mult':
  {
    'name': 'Do math III',
    'description': 'The natural numbers below 20 which are multiplies of 7 are: 7 and 14. '+
      'The sum of these numbers are 21. What is the sum of all multiplies of 7 below 80',
    'outputCheck': function(m) {
      return parseInt(m) == 462;
    }
  },
  'streamcopy':
  {
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
  'streammult':
  {
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
  'nseq2':
  {
    'name': 'Fibonacci',
    'description': 'The Fibonacci sequence is the numbers 1, 1, 2, 3, 5, 8, ... where each number is the sum of the two previous numbers. Write a program that write the first 25 numbers from this sequence.',
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
  'streammax':
  {
    'name': 'Maximizer',
    'description': 'Find and write the largest number from the input.',
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
  'euler1':
  {
    'name': 'Do math IV (Euler 1)',
    'description': 'If we list all the natural numbers below 10 that are multiples of 3 or 5, we get 3, 5, 6 and 9. The sum of these multiples is 23.'+
      'Find the sum of all multiplies of 3 and 5 below 100.',
    'outputCheck': function(m) {
      return parseInt(m) == 2318;
    }
  },
  'streamoddeven':
  {
    'name': 'Odd or even',
    'description': 'Read the input and write "Even" or "Odd" for each number.',
    'outputChecker': function() {
      this.i = 0;
      this.stream1 = [];
      this.check = function(s, m) {
        var ans = (this.stream1[this.i]&1) ? "odd" : "even";
        s.ok = (ans == m.toLowerCase());
        this.i++;
        s.done = this.i == this.stream1.length;
      }
      this.populate = function() {
        this.stream1 = randomlist(0,1000,random(20,30));
        return {stream1: this.stream1};
      }
    }
  },
  'streamevenfinder':
  {
    'name': 'Odd ones out',
    'description': 'Read all of the input but write only the even numbers out',
    'outputChecker': function() {
      this.i = 0;
      this.stream1 = [];
      this.answer = [];
      this.check = function(s, m) {
        s.ok = (parseInt(m) == this.answer[this.i]);
        this.i++;
        s.done = this.i == this.answer.length;
      }
      this.populate = function() {
        this.stream1 = randomlist(0,1000,random(20,30));
        for(var i = 0; i < this.stream1.length; i++)
        {
          var n = this.stream1[i];
          if(n&1)
            continue;
          this.answer.push(n);
        }
        return {stream1: this.stream1};
      }
    }
  },
  'streampivot':
  {
    'name': 'First is the judge',
    'description': 'Read the first number from input. Then read the rest of the numbers and compare them to the first. '+
      'Write "bigger" or "smaller" or "same" for each number.',
    'outputChecker': function() {
      this.i = 0;
      this.stream1 = [];
      this.check = function(s, m) {
        this.i++;
        var first = this.stream1[0];
        var n = this.stream1[this.i];
        var res = n > first ? "bigger" : n < first ? "smaller" : "same";
        s.ok = (m.toLowerCase() == res);
        s.done = this.i == this.stream1.length-1;
      }
      this.populate = function() {
        this.stream1 = randomlist(0,1000,random(20,30));
        return {stream1: this.stream1};
      }
    }
  },
  'string1':
  {
    'name': 'Strings 101',
    'description': '',
    'outputChecker': function() {
      this.i = 0;
      this.stream1 = [];
      this.check = function(s, m) {
        this.i++;
        var first = this.stream1[0];
        var n = this.stream1[this.i];
        var res = n > first ? "bigger" : n < first ? "smaller" : "same";
        s.ok = (m.toLowerCase() == res);
        s.done = this.i == this.stream1.length-1;
      }
      this.populate = function() {
        this.stream1 = randomlist(0,1000,random(20,30));
        return {stream1: this.stream1};
      }
    }
  },
}];
