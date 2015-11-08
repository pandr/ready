
    var sandbox = {};

    function Thunk(func, thisp, args)
    {
      this.func = func;
      this.thisp = thisp;
      this.args = args;
    }

    Thunk.prototype.invoke = function()
    {
      return this.func.apply(this.thisp, this.args);
    }

    function __thunk(func, thisp, args)
    {
      return new Thunk(func, thisp, args);
    }

    function Timers()
    {
      this.timeElapsed = 0;
      this._uid = 0;
      this._nextTick = null;
    }

    function Runner() {
      this.timers = new Timers();
    }

    Runner.prototype.init = function(gen)
    {
      this.gen = gen;
      this.stack = [];
      this.state = {
        value: null,
        done: false
      }
      this.stepcount = 0;
      this.errormessage = null;
      this.error = false;
    }

    Runner.prototype.step = function(val)
    {
      this.stepcount++;
      try {
        this.state = this.gen.next(val);
      } catch(e) {
        this.error = true;
        this.errormessage = "Execution error: " + e;
        return;
      } finally {
        //
      }
      var val = this.state.value;
      if(val && val instanceof Thunk) {
        this.stack.push(this.gen);
        this.gen = val.invoke();
        this.gen.type = 'thunk';
        this.step();
      } else if (this.state.done) {
        if(isGen(val)) {
          this.gen = val;
          this.gen.type = 'functionCall';
          this.state.done = false;
        } else if (this.stack.length) {
          this.gen = this.stack.pop();
          this.step(val);
        }
      }
    }

    function isGen(val) {
      return val && val.toString() === '[object Generator]';
    }

    // TODO: Use npm version
    function Context(sandbox, parentElement) {
      this.iframe = document.createElement('iframe');
      this.iframe.style.display = 'none';
      parentElement = parentElement || document.body;
      parentElement.appendChild(this.iframe);
      var win = this.iframe.contentWindow;
      sandbox = sandbox || {};
      Object.keys(sandbox).forEach(function (key) {
        win[key] = sandbox[key];
      });
    }

    Context.prototype.evaluate = function (code) {
      return this.iframe.contentWindow.eval(code);
    };

    Context.prototype.destroy = function () {
      if (this.iframe) {
        this.iframe.parentNode.removeChild(this.iframe);
        this.iframe = null;
      }
    };
 
    function Machine() {
      var sandbox = {};
      this.__runner = new Runner(); 
      this.running = false;
      this.debugout = $('#debugout');
      this.clockSpeedHz = 10;
      this.statementCapacity = 20;
      this.attachedOutputs = [];
      sandbox.__runner = this.__runner;
      sandbox.__thunk = __thunk;
      sandbox.__machine = this;
      sandbox.setTimeout = this.setTimeout.bind(this);
      this.context = new Context(sandbox);
      this.contextwindow = this.context.iframe.contentWindow;
    }

    Machine.prototype.echo = function(msg)
    {
      var out = this.attachedOutputs;
      for(var i = 0; i < out.length; i++)
      {
        out[i](msg);
      }
    }

    Machine.prototype.attachOutput = function(f)
    {
      this.attachedOutputs.push(f);
    }

    Machine.prototype.detachOutput = function(f)
    {
      var idx = this.attachedOutputs.indexOf(f);
      if(idx > -1)
      {
        this.attachedOutputs.splice(idx, 1);
      }
    }

    Machine.prototype.setTimeout = function(gen, timeout) {

    }

    // Start execution of processed code
    Machine.prototype.exec = function(code)
    {
      this.context.evaluate(code);
      this.context.evaluate('__runner.init(__top());');
      this.running = false;
    }

    Machine.prototype.step = function()
    {
      this.debugout.text("stepcount: " + this.__runner.stepcount);
      if(!this.__runner.state.done && this.__runner.stepcount < 100000)
      {
        this.__runner.step();
        if(!this.__runner.error)
          return;
        this.echo(this.__runner.errormessage);
      }
      this.stop();
    }

    Machine.prototype.stop = function()
    {
      if(this.running)
      {
        clearInterval(this.intervalId);
        this.onDone();
      }
      this.running = false;
      this.echo("ready");
      //this.echo("Finished in " + this.__runner.stepcount + " steps")
    }

    Machine.prototype.run = function(onDone)
    {
      this.onDone = onDone;
      var interval = 1000 / this.clockSpeedHz;
      this.intervalId = setInterval(this.step.bind(this), interval);
      this.running = true;
    }

    function setupRuntime(machine)
    {
      var boot = document.querySelector('#bootstrap').textContent;
      machine.context.evaluate(boot);

    }

    function create_machine(term)
    {
      var m = new Machine();
      // Inject term
      //m.contextwindow.term = term;
      m.attachOutput(function (m) { term.echo(m+''); });
      setupRuntime(m);
      return m;
    }

    function Task(t)
    {
      this.task = t;
      this.completed = false;
    }

    Task.prototype.getName = function()
    {
      return this.task.name;
    }

    Task.prototype.preRun = function(machine)
    {
      var task = this;
      $('#stream0').html("");
      $('#stream0-caption').removeClass("stream-checker-ok");
      $('#stream0-caption').removeClass("stream-checker-failed");
      $('#stream0-caption').addClass("stream-checker-pending");

      if(task.task.outputChecker) {
        this.checker = new task.task.outputChecker();
      }
      else {
        // If no outputChecker defined, make a default from outputCheck
        this.checker = new function() {
          this.i = 0;
          this.check = function(s, m) {
            this.i++;
            s.ok = task.task.outputCheck(m);
            s.done = this.i == 1;
          }
        }
      }
      var checker = this.checker;

      this.status = { ok: false, done: false };
      this.overflow = false;

      this.outputChecker = function (m) {
        var ok;
        if(!task.status.done) {
          checker.check(task.status, m);
          ok = task.status.ok;
        }
        else {
          task.overflow = true;
          ok = false;
        }
        if(!ok) {
          $('#stream0-caption').addClass("stream-checker-failed");
          $('#stream0-caption').removeClass("stream-checker-pending");
          $('#stream0-caption').removeClass("stream-checker-ok");
        }
        $("#stream0").append('<span class="'+(ok ? 'output_ok' : 'output_not_ok')+'">'+m+'</span>'+"\n");
        var s = $('#stream0');
        s.scrollTop(s.prop("scrollHeight"));
      }
      machine.attachOutput(this.outputChecker);
    }

    Task.prototype.postRun = function(machine)
    {
      machine.detachOutput(this.outputChecker);
      if(this.status.ok && this.status.done && !this.overflow)
      {
        $('#stream0-caption').addClass("stream-checker-ok");
        $('#stream0-caption').removeClass("stream-checker-pending");
        $('#stream0-caption').removeClass("stream-checker-failed");
        this.completed = true;
        machine.echo("[Task completed!]");
      }
      else
      {
        $('#stream0-caption').addClass("stream-checker-failed");
        $('#stream0-caption').removeClass("stream-checker-pending");
        $('#stream0-caption').removeClass("stream-checker-ok");
        if(this.status.ok && this.overflow)
          machine.echo("[Task failed -- too much output]");
        else if (this.status.ok && !this.status.done)
          machine.echo("[Task failed -- not enough output]");
        else
          machine.echo("[Task failed -- error in output]");
      }
    }

    function TaskDatabase()
    {
      this._load();
      this.tasks = [];
      var t = this;
      $.get("tasks.js", function(data) {
        t.add_tasks(eval(data));
      });
    }

    TaskDatabase.prototype.add_tasks = function(tasks)
    {
      this.tasks = this.tasks.concat(tasks);
    }

    TaskDatabase.prototype._load = function()
    {
      var storage = localStorage.storage || "{}";
      this.storage = JSON.parse(storage);
      this.storage.solved_tasks = this.storage.solved_tasks || {};
      this.storage.programs = this.storage.programs || {};
    }

    TaskDatabase.prototype._save = function()
    {
      localStorage.storage = JSON.stringify(this.storage);
    }

    TaskDatabase.prototype.is_solved = function(task_id)
    {
      return this.storage.solved_tasks[task_id] == 1;
    }

    TaskDatabase.prototype.set_solved = function(task_id)
    {
      this.storage.solved_tasks[task_id] = 1;
      this._save();
    }

    TaskDatabase.prototype.store_program = function(name, program)
    {
      this.storage.programs[name] = program;
      this._save();
    }

    TaskDatabase.prototype.get_program = function(name)
    {
      return this.storage.programs[name] || "";
    }

    TaskDatabase.prototype.find_task = function(task_id)
    {
      for(var i = 0; i < this.tasks.length; i++)
      {
        if(this.tasks[i].id == task_id)
          return this.tasks[i];
      }
      return undefined;
    }

    var taskdatabase = new TaskDatabase();

    function init() {
      var editor = ace.edit("editor");
      editor.setTheme("ace/theme/twilight");
      editor.getSession().setMode("ace/mode/javascript");

      var machine;

      var term = $('#screen').terminal(function(command, term)
        {
          if(machine.running)
          {
            handle_input(command);
          }
          else
          {
            handle_command(command);
          }
        },
        {
          greetings: "",
          name: "ready",
          prompt: "> "
        }
      );

      machine = create_machine(term);

      var current_task = undefined;
      clear_task();

      function handle_command(input)
      {
        var re_parser = /([\w]+)/g;

        var args = input.match(re_parser);

        var command = args[0];

        if(command == 'run')
        {
          var debug = args[1] == 1;
          if(current_task === undefined)
          {
            var preRun = function() {};
            var postRun = function() {};
            run_program(preRun, postRun, debug);
          }
          else
          {
            var task = new Task(current_task);
            term.echo("[Testing: " + task.getName()+"]");
            var preRun = function() { task.preRun(machine); };
            var postRun = function() {
              task.postRun(machine);
              if(task.completed)
              {
                set_task_solved(current_task.id);
              }
            };
            run_program(preRun, postRun, debug);
          }
        }
        else if(command == 'reset')
        {
          term.clear();
          clear_task();
          machine = create_machine(term);
        }
        else if(command == 'help')
        {
          term.echo("List of known commands:");
          term.echo("clear     Clear the screen");
          term.echo("help      Show this help");
          term.echo("reset     Reset the ready machine");
          term.echo("run       Run the program from the editor");
        }
        else
        {
          try {
            var res = machine.context.evaluate(input);
            term.echo(res+'');
          }
          catch(e) {
            term.echo(e);
          }
        }
      }

      function run_program(preRun, postRun, debug)
      {
        var code = editor.getSession().getValue();
        var parsed = {};
        try {
          var tcode = transform(code);
          if(debug)
          {
            // Debug output
            term.echo(tcode.code);
            term.echo("Statements: " + tcode.stats.statementcount);
          }
          if(tcode.stats.statementcount > machine.statementCapacity)
          {
            term.echo("Error: program too big: " + tcode.stats.statementcount + " statements");
          }
          else
          {
            machine.exec(tcode.code);
            machine.run(function() { postRun(); term.set_prompt("> ");});
            preRun(); // TODO: wire up input/output
            term.set_prompt("");
          }
        }
        catch (e) {
          term.echo("Error: " + e);
        }
      }

      function set_task_solved(task_id)
      {
        taskdatabase.set_solved(task_id);
        update_task_status(task_id);
        //$('#taskstatus').
      }

      function set_task(task_id)
      {
        var task = taskdatabase.find_task(task_id)
        if(task === undefined) {
          clear_task();
          return;
        }
        current_task = task;

        var program = taskdatabase.get_program(task_id);
        editor.getSession().setValue(program);

        $('#tasktitle').text(task.name);
        $('#taskdescription').text(task.description);
        $('.taskarea').addClass("taskareaVisible");
        $('#stream0-container').fadeIn();
        $('#stream0').html("");
        $('#stream0-caption').addClass("stream-checker-ok");
        $('#stream0-caption').removeClass("stream-checker-pending");
        $('#stream0-caption').removeClass("stream-checker-failed");
        update_task_status(task_id);
      }

      function update_task_status(task_id)
      {
        var solved = taskdatabase.is_solved(task_id);
        if(solved)
        {
          $('#taskstatus').text(task_id+": Solved")
          $('#taskstatus').addClass("taskstatusSolved");
          $('#taskstatus').removeClass("taskstatusUnsolved");
        }
        else
        {
          $('#taskstatus').text(task_id+": Not solved")
          $('#taskstatus').addClass("taskstatusUnsolved");
          $('#taskstatus').removeClass("taskstatusSolved");
        }
      }

      function clear_task()
      {
        current_task = undefined;
        var program = taskdatabase.get_program("default");
        editor.getSession().setValue(program);
        $('#tasktitle').text("");
        $('#taskdescription').text("");
        $('.taskarea').removeClass("taskareaVisible");
        $('#stream0-container').fadeOut();
      }

      function handle_input(command)
      {
          machine.contextwindow._input_queue.push(command);
      }

      function store_program()
      {
        var name = "default";
        if(current_task !== undefined)
        {
          name = current_task.id;
        }
        taskdatabase.store_program(name, editor.getSession().getValue());
      }

      var t = 0;
      setInterval(function() {
        t += 0.1;
        $('#title1').css('color', "rgb(26, "+Math.floor(164 + 20*Math.sin(t*2.0))+", 15)");
      }, 100 );

      var saving;
      editor.getSession().on('change', function() {
        clearTimeout(saving);
        saving = setTimeout(function() {
          store_program();
          $('#saver').fadeOut();
        }, 1000);
        $('#saver').fadeIn();
      });
      
      document.onkeydown = function(evt) {
        evt = evt || window.event;
        if (evt.keyCode == 27) {
          term.echo("*break*");
          setTimeout(function() {
            machine.stop();
          }, 100);
        }
      };

      var tasks = taskdatabase.tasks;
      for(var i = 0; i < tasks.length; i++)
      {
        var id = tasks[i].id;
        var nav = $('#tasklist').append('<li data-id="'+id+'">'+ tasks[i].name +'</li>');
      }
      $('#tasklist > li').click(function() {
        set_task($(this).data("id"));
        $('.helpPane').removeClass("helpPaneVisible");
      });

      $('.taskClose').click(function() {
        clear_task();
      })

      setup_help();

    }

    function setup_help()
    {
      $('#helpButtonOpen').click(function(){
        $('.helpPane').addClass("helpPaneVisible");
        $('.helpPane div').hide();
        $('.helpPane #help').show();
      });

      $('#taskButtonOpen').click(function(){
        $('.helpPane').addClass("helpPaneVisible");
        $('.helpPane div').hide();
        $('.helpPane #tasks').show();
        $('#tasklist > li').each(function(i) {
          var id = $(this).data("id");
          if(taskdatabase.is_solved(id))
            $(this).addClass("solved");
          else
            $(this).removeClass("solved");
        });
      });

      $('#helpButtonClose').click(function(){
        $('.helpPane').removeClass("helpPaneVisible");
      });

    }

    if (window.addEventListener)
      window.addEventListener("load", init, false);
    else if (window.attachEvent)
      window.attachEvent("onload", init);
    else window.onload = init;

