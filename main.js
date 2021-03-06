
    function random(min,max)
    {
      return min + Math.floor(Math.random()*(max-min+1));
    }

    function randomlist(min,max,count)
    {
      var res = [];
      for(var i = 0; i < count; i++)
        res.push(random(min,max));
      return res;
    }

    function shuffle(list, start, end)
    {
      if(start === undefined) {
        start = 0;
      }
      if(end === undefined) {
        end = list.length;
      }
      for(var i = start; i < end; i++)
      {
        var idx = random(i,end-1);
        var t = list[idx];
        list[idx] = list[i];
        list[i] = t;
      }
    }

    function range(min,max)
    {
      var res = [];
      for(var i = min; i <= max; i++)
      {
        res.push(i);
      }
      return res;
    }

    function FS()
    {
      var files = localStorage.files || "{}";
      this.files = JSON.parse(files);
    }

    FS.prototype.dir = function()
    {
      return Object.keys(this.files);
    }

    FS.prototype.load = function(name)
    {
      return this.files[name];
    }

    FS.prototype.exists = function(name)
    {
      return this.files[name] !== undefined;
    }

    FS.prototype.save = function(name, content)
    {
      this.files[name] = content;
      localStorage.files = JSON.stringify(this.files);
    }

    FS.prototype.delete = function(name)
    {
      delete this.files[name];
      localStorage.files = JSON.stringify(this.files);
    }

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
 
    function Machine(config) {
      var sandbox = {};
      this.__runner = new Runner(); 
      this.running = false;
      this.debugout = $('#debugout');
      this.config = {
        clockSpeedHz: 10,
        statementCapacity: 20,
      }
      this.attachedOutputs = [];
      this.attachedInputs = {};
      this.audioObjects = [];
      this.onDone = undefined;
      this.onStep = undefined;
      sandbox.__runner = this.__runner;
      sandbox.__thunk = __thunk;
      sandbox.__machine = this;
      sandbox.setTimeout = this.setTimeout.bind(this);
      sandbox.Audio = function (u) { var a = new Audio(u); sandbox.__machine.audioObjects.push(a); return (a); }
      this.context = new Context(sandbox);
      this.contextwindow = this.context.iframe.contentWindow;

      // Transfer config verrides
      for(var c in config)
      {
        this.config[c] = config[c];
      }
    }

    Machine.prototype.Audio = function(p)
    {
      Audio.apply(this, p);
    }

    Machine.prototype.echo = function(msg)
    {
      var out = this.attachedOutputs;
      for(var i = 0; i < out.length; i++)
      {
        out[i](msg);
      }
    }

    Machine.prototype.fullscreen = function(full)
    {

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
        this.onDone(this.__runner.state.done ? this.__runner.state.value : undefined);
      }

      // Clean up audio
      for(var i in this.audioObjects)
      {
        this.audioObjects[i].src = '';
        this.audioObjects[i].load();
      }
      this.audioObjects = [];

      this.system.fullscreen(false);

      this.running = false;
      //this.echo("Finished in " + this.__runner.stepcount + " steps")
    }

    Machine.prototype.run = function(onDone)
    {
      this.onDone = onDone;
      var interval = 1000 / this.config.clockSpeedHz;
      this.intervalId = setInterval(this.step.bind(this), interval);
      this.running = true;
    }

    function setupRuntime(machine)
    {
      var boot = document.querySelector('#bootstrap').textContent;
      machine.context.evaluate(boot);
    }

    function create_machine(term, system)
    {
      var system = new System();
      var m = new Machine(taskdatabase.unlocked_config);
      m.attachOutput(function (m) { term.echo(m+''); });
      m.term = term;
      m.system = system;
      setupRuntime(m);
      return m;
    }

    function Task(t, machine)
    {
      this.task = t;
      this.machine = machine;
      this.reset();
    }

    Task.prototype.reset = function()
    {
      this.completed = false;

      var t = this.task;

      if(t.outputChecker) {
        this.checker = new t.outputChecker();
      }
      else if (t.outputCheck) {
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
      else {
        // Always succeed
        this.checker = null;
      }
      if(this.checker != null)
      {
        stream0.show()
        stream0.clear();
        stream0.caption_ok();
      }
      else
      {
        stream0.hide();
      }

      this.data = undefined;
      if(this.checker && this.checker.populate)
      {
        this.data = this.checker.populate();
        if(this.data.stream1)
        {
          stream1.show();
          stream1.clear();
          for(var i = 0; i < this.data.stream1.length; i++)
            $("#stream1").append('<span>'+this.data.stream1[i]+'</span>'+"\n");
          this.machine.attachInput(1, this.data.stream1, stream1);
        }
        if(this.data.stream2)
        {
          stream2.show();
          stream2.clear();
          for(var i = 0; i < this.data.stream2.length; i++)
            $("#stream2").append('<span>'+this.data.stream2[i]+'</span>'+"\n");
          this.machine.attachInput(2, this.data.stream2, stream2);
        }
      }
      else
      {
        stream1.hide();
        stream2.hide();
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

    Task.prototype.preRun = function()
    {
      this.reset();

      var task = this;

      stream0.clear();
      stream0.caption_pending();

      var checker = this.checker;

      this.status = { ok: false, done: false };
      this.overflow = false;

      if(!checker)
      {
        this.status.ok = true;
        this.status.done = true;
      }
      else
      {
        //this.machine.echo("[Testing: " + this.getName()+"]");
        this.outputChecker = function (m) {
          var ok;
          if(!task.status.done) {
            checker.check(task.status, m);
            ok = task.status.ok;
          }
          else if(checker.allow_overflow) {
            ok = true;
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
        this.machine.attachOutput(this.outputChecker);
      }
    }

    Task.prototype.postRun = function()
    {
      this.machine.detachInput(1);

      if(!this.outputChecker)
      {
        this.completed = true;
        return;
      }

      this.machine.detachOutput(this.outputChecker);

      if(this.status.ok && this.status.done && !this.overflow)
      {
        stream0.caption_ok();
        this.completed = true;
        this.machine.echo("[[;#0f0;]Task completed!]");
      }
      else
      {
        stream0.caption_failed();
        if(this.status.ok && this.overflow)
          this.machine.echo("[[;red;]Task failed -- too much output]");
        else if (this.status.ok && !this.status.done)
          this.machine.echo("[[;red;]Task failed -- not enough output]");
        else
          this.machine.echo("[[;red;]Task failed -- error in output]");
      }
    }

    function TaskDatabase()
    {
      this._load();
      this.tasks = {};
      this.tasksections = [];
      this.unlocked_config = {};
      var t = this;
      $.get("tasks.js", function(data) {
        t.tasks = eval(data)[0];
        for(var i in t.tasks)
        {
          t.tasks[i].id = i;
        }
      }).fail( function(d, textStatus, error) {
        console.error("get failed, status: " + textStatus + ", error: "+error)
      });
      $.get("tasksections.js", function(data) {
        t.tasksections = eval(data);
        t.unlock_rewards();
      }).fail( function(d, textStatus, error) {
        console.error("get failed, status: " + textStatus + ", error: "+error)
      });
    }

    TaskDatabase.prototype.unlock_rewards = function()
    {
      for(var i = 0; i < this.tasksections.length; i++)
      {
        var sect = this.tasksections[i];
        sect.completed = true;
        for(var j = 0; j < sect.tasks.length; j++)
        {
          var id = sect.tasks[j];
          if (!this.is_solved(id))
          {
            sect.completed = false;
          }
        }
        if(!sect.completed)
          continue;

        // Section was completed, so unlock any unlocks
        if(sect.unlock)
        {
          for(var v in sect.unlock)
          {
            if(sect.unlock[v] < this.unlocked_config[v])
              continue;
            this.unlocked_config[v] = sect.unlock[v];
          }
        } 
      } 
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

    TaskDatabase.prototype.find_tasksection = function(task_id)
    {
      for(var i in this.tasksections)
      {
        if(this.tasksections[i].tasks.indexOf(task_id) >= 0)
          return this.tasksections[i];
      }
      return undefined;
    }

    TaskDatabase.prototype.set_solved = function(task_id)
    {
      var first_time = this.storage.solved_tasks[task_id] != 1;
      this.storage.solved_tasks[task_id] = 1;
      this._save();
      this.unlock_rewards();

      // Look for completion messages to fire
      var ts = this.find_tasksection(task_id);
      var t = this.find_task(task_id)
      if(first_time && ts && ts.completed && ts.completion_message)
      {
        var cm = ts.completion_message;
        show_message(cm.heading, cm.message);
      }
      else if(first_time && t && t.completion_message)
      {
        var cm = t.completion_message;
        show_message(cm.heading, cm.message);
      }
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
      return this.tasks[task_id];
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

    function System()
    {
      this.is_fullscreen = false;
    }

    System.prototype.fullscreen = function(full)
    {
      if(full === undefined)
        this.is_fullscreen = !this.is_fullscreen;
      else
        this.is_fullscreen = full;

      if(this.is_fullscreen)
      {
        $('#fullscreen-overlay').show();
        $('#screen').addClass("full-screen");
        $('#layoutButtonFullScreen').removeClass("fa-expand").addClass("fa-compress").addClass('full-screen');
      }
      else
      {
        $('#fullscreen-overlay').hide();
        $('#screen').removeClass("full-screen");
        $('#layoutButtonFullScreen').addClass("fa-expand").removeClass("fa-compress").removeClass('full-screen');
      }
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

/*
      editor.commands.on("exec", function(e) { 
        var rowCol = editor.selection.getCursor();
        if ((rowCol.row == 0) || ((rowCol.row + 1) == editor.session.getLength())) {
          if(e.command.readOnly)
            return;
          e.preventDefault();
          e.stopPropagation();
        }
      });

*/
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
      fs = new FS();

      var current_task = undefined;
      clear_task();

      function handle_command(input)
      {
        var re_parser = /([\w]+)/g;

        var args = input.match(re_parser);

        if(args === null)
          return;

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
              term.echo("ready");
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
            var lastIp = 0;
            var preRun = function() { current_task.preRun(); };
            var postRun = function() {
              current_task.postRun();
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
        else if(command == 'dir')
        {
          var files = fs.dir();
          var c = 0;
          for(var f in files)
          {
            term.echo(files[f]);
            c++;
          }
          term.echo('Total '+c+' files');
        }
        else if(command == 'load')
        {
          var name = args[1];
          if(name === undefined)
          {
            term.echo('Missing filename')
            return;
          }
          var data = fs.load(name);
          if(data == undefined)
          {
            term.echo('Unable to load '+name);
          }
          else
          {
            clear_task();
            set_program(data);
          }
        }
        else if(command == 'save')
        {
          var name = args[1];
          if(name === undefined)
          {
            term.echo('Missing filename')
            return;
          }
          if(fs.exists(name)) {
            term.echo('Overwriting!')
          }
          var data = editor.getSession().getValue();
          fs.save(name, data)
        }
        else if(command == 'delete')
        {
          var name = args[1];
          if(name === undefined)
          {
            term.echo('Missing filename')
            return;
          }
          if(!fs.exists(name))
          {
            term.echo('File ' + name + ' not found')
            return;
          }
          fs.delete(name)
        }
        else if(command == 'help')
        {
          term.echo("List of known commands:");
          term.echo("clear         Clear the screen");
          term.echo("help          Show this help");
          term.echo("reset         Reset the ready machine");
          term.echo("run           Run the program from the editor");
          term.echo("dir           List files");
          term.echo("load <name>   Load program into editor");
          term.echo("save <name>   Load program into editor");
          term.echo("delete <name> Delete the file");
        }
        else
        {
          run_program(input, function(){}, function(v){ if(v!==undefined)term.echo(v+''); }, function(){}, false, true);
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
          if(tcode.stats.statementcount > machine.config.statementCapacity)
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
      }

      function set_task(task_id)
      {
        var task = taskdatabase.find_task(task_id)
        if(task === undefined) {
          clear_task();
          return;
        }

        if(machine.running)
          machine.stop();
        
        current_task = new Task(task, machine);

        var program = current_task.task.source;

        if(program === undefined)
        {
          program = taskdatabase.get_program(task_id);
        }
        set_program(program);

        $('#tasktitle').text(task.name);
        $('#taskdescription').text(task.description);
        $('.taskarea').addClass("taskareaVisible");
        update_task_status(task_id);
      }

      function set_program(program)
      {
        editor.getSession().setValue(program);
        update_code_stats();
      }

      function update_code_stats()
      {
        var code = editor.getSession().getValue();
        // Update stats
        var parsed = false;
        try {
          code = prettyPrint(code); // parse and reprint to get rid of comments
          parsed = true;
        }
        catch (e) {
          // Ignore comments then....
        }
        if (parsed) {
          code = code.replace(/\t/g,' '); // remove tabs
          code = code.replace(/\r/g,' '); // remove the 'other' newlines 
          code = code.replace(/  */g,' '); // remove duplicate space
          code = code.replace(/\n/g,' '); // remove newlines
          code = code.replace(/ ([<>;\,}{\[\]\(\)+\-*\/\!"'%&=?~])/g, "$1");
          code = code.replace(/([<>;\,}{\[\]\(\)+\-*\/\!"'%&=?~]) /g, "$1");
          $('#codestats').html(code.length+" chars");
        }
        else
        {
          $('#codestats').html("? chars");
        }
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
        set_program(program);
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
        var code = editor.getSession().getValue();
        taskdatabase.store_program(name, code);

        update_code_stats();

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

      var ts = taskdatabase.tasksections;
      var all_tasks = {};
      for(var id in taskdatabase.tasks)
      {
        all_tasks[id] = 1;
      }
      for(var i = 0; i < ts.length; i++)
      {
        var sec = $('<div class="tasksection"></div>').appendTo($('#tasksections'));
        sec.append('<h3>'+ts[i].title+' (<span class="completion"></span>)</h3>');
        sec.append('<span class="taskprogress taskprogress_solved"></span><span class="taskprogress taskprogress_remaining"></span>');
        if(ts[i].reward)
          sec.append('<span class="reward">'+ts[i].reward+'</span>');
        sec.append('<p>'+ts[i].description+'</p>');
        var list = $('<ul class="tasklist"></ul>').appendTo(sec);
        var tasks = ts[i].tasks;
        if(i == ts.length-1)
        {
          for(var at in all_tasks)
            tasks.push(at)
        }
        for(var j = 0; j < tasks.length; j++)
        {
          var task = taskdatabase.find_task(tasks[j]);
          var nav = list.append('<li data-id="'+task.id+'">'+ task.name +'</li>');
          delete all_tasks[task.id];
        }
      }

      $('.tasksection > ul > li').click(function() {
        set_task($(this).data("id"));
        $('.helpPane').removeClass("helpPaneVisible");
      });

      $('.taskClose').click(function() {
        clear_task();
      })

      setup_help();

      if(!taskdatabase.is_solved('exhello'))
      {
        $('#taskButtonOpen').addClass("glow");
      }
    }

    function setup_help()
    {
      $('#helpButtonOpen').click(function(){
        $('.helpPane').addClass("helpPaneVisible");
        $('.helpPane > div').hide();
        $('.helpPane #help').show();
      });

      $('#taskButtonOpen').click(function(){
        $('.helpPane').addClass("helpPaneVisible");
        $('.helpPane > div').hide();
        $('.helpPane #tasks').show();
        $('.tasklist > li').each(function(i) {
        });
        $('.tasksection').each(function(i) {
          var total = 0;
          var solved = 0;
          $(this).find('.tasklist > li').each(function(j) {
            var id = $(this).data("id");
            total++;
            if(taskdatabase.is_solved(id)) {
              $(this).addClass("solved");
              solved++;
            }
            else
              $(this).removeClass("solved");
          })
          $(this).find('.completion').html(solved+"/"+total);
          $(this).find('.taskprogress_solved').css('width',(50*solved/total)+"px");
          $(this).find('.taskprogress_remaining').css('width',(50*(total-solved)/total)+"px");
        });
      });

      $('#helpButtonClose').click(function(){
        $('.helpPane').removeClass("helpPaneVisible");
      });

    }

    function show_message(headline, message)
    {
      function closeit() {
        $('#popup-box').removeClass("big");
        setTimeout(function() {
          $('#popup').hide();
        }, 300);
      }
      $('#popup').show(0,function() {
        $('#popup-box').addClass("big");
        $('#popup').focus();
        $('#popup').bind('keydown', function (e) {
          e.preventDefault();
          e.stopPropagation();
          closeit();
        });
      });
      $('#popup-heading').html(headline);
      $('#popup-text').html(message);

      $('#popup-close > a').click(closeit);
    }

    if (window.addEventListener)
      window.addEventListener("load", init, false);
    else if (window.attachEvent)
      window.attachEvent("onload", init);
    else window.onload = init;


