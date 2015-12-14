[
	{
		title: 'Warming up',
		description: 'A few small, easy tasks to get you started',
		tasks: ['exhello','hello','simplemathmul','nseq1','sumlt100'],
		completion_message: {
			heading: "Warmup completed!",
			message: "This is going great! You managed to complete the warm up exercises " + 
				"without breaking anything! There is no real reward before you complete the " +
				"next section, but here is a nice horse just the same..." +
				"<pre>" +
"           .  ,\n" +
"           |\\/|\n" +
"           bd \"n.\n" +
"          /   _,\"n.___.,--x.\n" +
"         &lt;co&gt;'\\             Y\n" +
"          ~~   \\       L   7|\n" +
"                H l--'~\\\\ (||\n" +
"                H l     H |`'\n" +
"                H [     H [\n" +
"           ____//,]____//,]___\n</pre>"

		}

	},
	{
		title: 'Your first upgrade!',
		description: 'Complete these tasks to earn your first upgrade: a faster CPU!',
		tasks: ['multtab','sum7mult','streamcopy','streammult','nseq3'],
		reward: 'CPU: 30 Hz',
		unlock: {clockSpeedHz: 30},	
		completion_message: {
			heading: "Upgrade time!",
			message: "Very cool! By completing these tasks, you have earned a new upgrade to your computer. "+
				"Enjoy your newfound speed!" + 
				"<center><pre>\n\nCPU speed: 30hz\n\n\n</pre><center>" +
				"You have to reset your computer to unlock the upgrade. Type 'reset' to do that."
		}
	},
	{
		title: 'Streams of fun!',
		description: 'Complete these ',
		tasks: ['streamoddeven','streamevenfinder','streammax','streampivot'],
	},
	{
		title: 'Stringzoo',
		description: 'Try your hand at this collection of stringy problems.',
		tasks: ['string1'],
		completion_message: {
			heading: "String",
			message: "No message yet..."
		}
	},
	{
		title: 'The rest',
		description: 'Uncategorized, untested, possibly unpossible',
		tasks: []
	},
]