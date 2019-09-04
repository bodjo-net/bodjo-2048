bodjo.on('connect', socket => {
	let lastDatas = {};
	socket.on('field', (username, data, defeat) => {
		let field = parseField(data);
		bodjo.callRender(username, 150, null, null, field, defeat);
	});

	socket.on('disconnect', () => {
		socket.removeAllListeners();
	});
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