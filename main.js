
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
      this.attachedInputs = {};
      this.onDone = undefined;
      this.onStep = undefined;
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

    Machine.prototype.read = function(stream)
    {
      var s = this.attachedInputs[stream];
      if(s === undefined)
        return undefined;

      if(s.pos >= s.data.length)
        return undefined; //eof

      s.ui.scroll_to_line(s.pos);

      return s.data[s.pos++];
    }

    Machine.prototype.eof = function(stream)
    {
      var s = this.attachedInputs[stream];
      if(s === undefined)
        return true;

      return s.pos >= s.data.length;
    }

    Machine.prototype.attachOutput = function(f)
    {
      this.attachedOutputs.push(f);
    }

    Machine.prototype.attachInput = function(idx, data, stream_ui)
    {
      var s = {
        data: data,
        pos: 0,
        ui: stream_ui
      }
      this.attachedInputs[idx] = s;
    }

    Machine.prototype.detachInput = function(idx)
    {
      delete this.attachedInputs[idx];
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
      if(this.onStep !== undefined && this.__runner.state.value && this.__runner.state.value.type == 'step')
      {
        var lstart = this.__runner.state.value.start.line;
        var lend = this.__runner.state.value.end.line;
        this.onStep(lstart, lend);
      }
      //this.debugout.text("stepcount: " + this.__runner.stepcount);
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
        this.onDone(this.__runner.state.value);
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
      m.attachOutput(function (m) { term.echo(m+''); });
      setupRuntime(m);
      return m;
    }

    function Task(t)
    {
      this.task = t;
      this.reset();
    }

    Task.prototype.reset = function()
    {
      this.completed = false;

      var t = this.task;

      if(t.outputChecker) {
        this.checker = new t.outputChecker();
      }
      else {
        // If no outputChecker defined, make a default from outputCheck
        this.checker = new function() {
          this.i = 0;
          this.check = function(s, m) {
            this.i++;
            s.ok = t.outputCheck(m);
            s.done = this.i == 1;
          }
        }
      }

      this.data = undefined;
      if(this.checker.populate !== undefined)
      {
        this.data = this.checker.populate();
        if(this.data.stream1)
        {
          stream1.show();
          stream1.clear();
          for(var i = 0; i < this.data.stream1.length; i++)
            $("#stream1").append('<span>'+this.data.stream1[i]+'</span>'+"\n");
        }
      }
      else
      {
        stream1.hide();
      }
    }

    Task.prototype.getName = function()
    {
      return this.task.name;
    }

    Task.prototype.getId = function()
    {
      return this.task.id;
    }

    Task.prototype.preRun = function(machine)
    {
      this.reset();
      var task = this;
      stream0.clear();
      stream0.caption_pending();

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
          stream0.caption_failed();
        }
        $("#stream0").append('<span class="'+(ok ? 'output_ok' : 'output_not_ok')+'">'+m+'</span>'+"\n");
        stream0.scroll_to_bottom();
      }
      machine.attachOutput(this.outputChecker);
      if(this.data && this.data.stream1)
      {
        machine.attachInput(1, this.data.stream1, stream1);
      }
    }

    Task.prototype.postRun = function(machine)
    {
      machine.detachOutput(this.outputChecker);
      machine.detachInput(1);
      if(this.status.ok && this.status.done && !this.overflow)
      {
        stream0.caption_ok();
        this.completed = true;
        machine.echo("[Task completed!]");
      }
      else
      {
        stream0.caption_failed();
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

    function Stream(name)
    {
      this.name = name;
      this.container = $('#'+name+'-container');
      this.caption = $('#'+name+'-caption');
      this.box = $('#'+name);
    }

    Stream.prototype.show = function()
    {
      this.container.fadeIn().css("display","inline-block");
    }

    Stream.prototype.hide = function()
    {
      this.container.fadeOut();
    }

    Stream.prototype.clear = function()
    {
      this.box.html("");
    }

    Stream.prototype.caption_ok = function()
    {
      this.caption.removeClass("stream-checker-pending");
      this.caption.removeClass("stream-checker-failed");
      this.caption.addClass("stream-checker-ok");
    }

    Stream.prototype.caption_pending = function()
    {
      this.caption.removeClass("stream-checker-ok");
      this.caption.removeClass("stream-checker-failed");
      this.caption.addClass("stream-checker-pending");
    }

    Stream.prototype.caption_failed = function()
    {
      this.caption.removeClass("stream-checker-pending");
      this.caption.removeClass("stream-checker-ok");
      this.caption.addClass("stream-checker-failed");
    }

    Stream.prototype.scroll_to_bottom = function()
    {
      this.box.stop().animate({scrollTop:(this.box.prop("scrollHeight"))}, 'fast');
    }

    Stream.prototype.scroll_to_line = function(l)
    {
      this.box.children().removeClass("current");
      var scrollTo = this.box.children().eq(l);
      scrollTo.addClass("current");
      this.box.stop().animate({scrollTop:(
        scrollTo.offset().top - this.box.offset().top + this.box.scrollTop()
      )}, 'fast');
    }

    var stream0;
    var stream1;
    var stream2;

    function init() {

      stream0 = new Stream('stream0');
      stream1 = new Stream('stream1');
      stream2 = new Stream('stream2');
      stream0.hide();
      stream1.hide();
      stream2.hide();

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
            var lastIp = 0;
            var postRun = function() {
              editor.session.removeGutterDecoration(lastIp, "ipMarker");
            };
            var onStep = function(lstart, lend) {
              editor.session.removeGutterDecoration(lastIp, "ipMarker");
              editor.session.addGutterDecoration(lstart-1, "ipMarker");
              lastIp = lstart-1;
            };
            run_program(editor.getSession().getValue(), preRun, postRun, onStep, debug, false);
          }
          else
          {
            term.echo("[Testing: " + current_task.getName()+"]");
            var lastIp = 0;
            var preRun = function() { current_task.preRun(machine); };
            var postRun = function() {
              current_task.postRun(machine);
              if(current_task.completed)
              {
                set_task_solved(current_task.getId());
              }
              editor.session.removeGutterDecoration(lastIp, "ipMarker");
            };
            var onStep = function(lstart, lend) {
              editor.session.removeGutterDecoration(lastIp, "ipMarker");
              editor.session.addGutterDecoration(lstart-1, "ipMarker");
              lastIp = lstart-1;
            };
            run_program(editor.getSession().getValue(), preRun, postRun, onStep, debug, false);
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
          run_program(input, function(){}, function(v){ term.echo(v+''); }, function(){}, false, true);
        }
      }

      function run_program(code, preRun, postRun, onStep, debug, isEval)
      {
        var parsed = {};
        try {
          var insert_steps = true;
          var force_return = isEval;
          var tcode = transform(code, insert_steps, force_return);
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
            machine.onStep = onStep;
            machine.exec(tcode.code);
            machine.run(function(v) { postRun(v); machine.onStep = undefined; term.set_prompt("> ");});
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
        current_task = new Task(task);

        var program = taskdatabase.get_program(task_id);
        editor.getSession().setValue(program);

        $('#tasktitle').text(task.name);
        $('#taskdescription').text(task.description);
        $('.taskarea').addClass("taskareaVisible");
        stream0.show()
        stream0.clear();
        stream0.caption_ok();
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
        stream0.hide();
        stream1.hide();
        stream2.hide();
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
          name = current_task.getId();
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

