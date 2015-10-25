var recast = require('recast');
var r_types = recast.types.namedTypes;
var b = recast.types.builders;

function newStep(loc)
{
	var node = b.expressionStatement(
		b.yieldExpression(
			newObjectExpression({
				type: 'step',
				start: newObjectExpression(loc.start),
				end: newObjectExpression(loc.end)
			}),
			false
		)
	);
	Object.defineProperty(node, '__stepper', {value: true});
	return node;
}

function newObjectExpression(obj)
{
	var props = [];
	for(var prop in obj) {
		var val = typeof obj[prop] === 'object' ? obj[prop] : b.literal(obj[prop]);
		props.push(b.property('init', b.literal(prop), val));
	}
	return b.objectExpression(props);
}

function transform(source)
{
	var ast = recast.parse(source);
	var statementcount = 0;

	recast.types.visit(ast, {
	
	
		visitForStatement: function(path) {
			this.loopAfterBodyHelper(path);
		},
		visitWhileStatement: function(path) {
			this.loopAfterBodyHelper(path);
		},
		visitForInStatement: function(path) {
			this.loopAfterBodyHelper(path);
		},
		loopAfterBodyHelper: function(path) {

			this.traverse(path);

			// Loop body. Insert step after
			var body = path.get('body');
			var block = b.blockStatement(
				[body.node, newStep(path.node.loc)]);
			body.replace(block);
		},

		visitStatement: function(path) {

			this.traverse(path);

			statementcount++;

			if(r_types.BlockStatement.check(path.node))
				return;
			if(r_types.ForStatement.check(path.parent.node))
				return;
			if(r_types.ForInStatement.check(path.parent.node))
				return;

			// Normal statement, insert step before 
			var bs = b.blockStatement(
				[newStep(path.node.loc), path.node]);
			path.replace(bs);
		},

		visitCallExpression: function(path) {
			this.traverse(path);
			var thunk = b.callExpression(
				b.identifier('__thunk'), [
					b.functionExpression(
						b.identifier('thunk'),
						[],
						b.blockStatement([b.returnStatement(path.node)]),
						true
					),
					b.thisExpression(),
					b.identifier('arguments')
				]
			);
			path.replace(
				b.yieldExpression(thunk, false)
			);

		},

		visitFunction: function (path)
		{
			this.traverse(path);
			path.node.generator = true;
		},


	});

	ast.program = b.program([
		b.functionDeclaration(
			b.identifier('__top'), [], b.blockStatement(ast.program.body), true)
	]);

	var res = {
		'code': recast.print(ast).code,
		'stats': {
			'statementcount' : statementcount
		}
	};
	return res;
}

module.exports = transform;

window.transform = transform;
