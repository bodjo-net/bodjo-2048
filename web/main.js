var lastField = null,
	lastTurn = null;
let playing = false, 
	compiledFunction = null, 
	defeated = false,
	timeout = bodjo.storage.get('timeout') || 500,
	requestNew = false;
bodjo.on('connect', socket => {

	socket.on('field', (data, defeat) => {
		console.log("on 'field'")
		defeated = defeat;
		let field = parseField(data);
		bodjo.callRender(timeout, lastField, lastTurn, field, defeat);
		lastField = field;

		if (requestNew) {
			setTimeout(() => socket.emit('new'), timeout);
			requestNew = false;
		} else {
			if (playing) {
				if (defeat) {
					playing = false;
					bodjo.getControl('play').setActive(false);
				} else
					tick(lastField);
			}
		}
	});

	socket.on('disconnect', () => {
		playing = false;
		bodjo.getControl('play').setActive(false);
		defeated = false;
		compiledFunction = null;
		lastField = null;
		lastTurn = null;
		requestNew = null;
		socket.removeAllListeners();
	});

	function compile() {
		try {
			compiledFunction = new Function(bodjo.editor.getValue())();
			if (typeof compiledFunction !== 'function') {
				bodjo.showError('your code should return a function');
				compiledFunction = null;
				return false;
			}
			return true;
		} catch (e) {
			bodjo.showError(e);
			return false;
		}
	}
	function tick(field) {
		if (typeof compiledFunction !== 'function') {
			if (!compile()) {
				playing = false;
				bodjo.getControl('play').setActive(false);
				return;
			}
		}

		let result;
		try {
			result = compiledFunction(field);
		} catch (e) {
			bodjo.showError(e);
			playing = false;
			return;
		}

		if (!Number.isInteger(result) ||
			result < 0 || result > 4) {
			bodjo.showError('function should return an integer in range [0, 3] \n(');
			stop();
			return;
		}

		lastTurn = result;
		setTimeout(() => {
			if (!playing)
				return;
			socket.emit('turn', result);
		}, timeout);
	}

	function start() {
		if (playing)
			return;
		if (!compile())
			return;
		bodjo.getControl('play').setActive(true);
		playing = true;
		if (defeated) {
			requestNew = false;
			lastTurn = null;
			lastField = null;
			socket.emit('new');
			defeated = false;
		} else
			tick(lastField);
	}
	function stop() {
		if (!playing)
			return;
		bodjo.getControl('play').setActive(false);
		playing = false;
	}
	function again() {
		if (playing) {
			requestNew = true;
		} else {
			requestNew = false;
			lastTurn = null;
			lastField = null;
			socket.emit('new');
			defeated = false;
		}
	}

	bodjo.controls = [
		Button('play', start),
		Button('pause', stop),
		Button('replay', again),
		Slider('timeout', 15, 1000, _timeout => {
			timeout = parseInt(_timeout);
			bodjo.storage.set('timeout', timeout);
		})
	];

	bodjo.getControl('timeout').set(timeout);
});

bodjo.on('scoreboard', scoreboard => {
	bodjo.renderScoreboard(
		['Place', 'Player', 'Score', 'Max tile'], 
		Array.from(scoreboard, element => [
			element.place,
			Player(element.username),
			element.score,
			Math.pow(2, element.max)+''
		])
	);
});

function parseField(data) {
	let arr = new Uint8Array(data);
	let n = arr[0];
	let field = new Array(n);
	for (let y = 0, offset = 1; y < n; ++y) {
		field[y] = new Array(n);
		for (let x = 0; x < n; ++x)
			field[y][x] = arr[offset++];
	}
	return field;
}