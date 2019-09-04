let BodjoGame = require('@dkaraush/bodjo-game');
let bodjo = new BodjoGame(promptConfig('config.json'));

const UP = 0;
const RIGHT = 1;
const DOWN = 2;
const LEFT = 3;

bodjo.initClient('./web/');
bodjo.scoreboard.sortFunction = (a, b) => b.score - a.score;

bodjo.on('player-connect', player => {
	let username = player.username;
	let level = matrix(), defeated = false, score = 0;
	putTile(level, 2);
	updateScoreboard(player, level, score);
	player.emit('field', encode(level), false)

	player.on('new', () => {
		defeated = false;
		score = 0;
		putTile(level = matrix(), 2);
		setTimeout(() => {
			player.emit('field', encode(level), false);
		}, 16);
	});

	player.on('turn', turn => {
		if (typeof turn !== 'number' ||
			!Number.isInteger(turn) ||
			turn < 0 || turn > 3 || defeated)
			return;

		setTimeout(() => {
			level = step(level, turn, (plus) => {
				score += plus;
			});
			updateScoreboard(username, level, score);
			putTile(level, 1);
			if (defeat(level)) {
				defeated = true;
				player.emit('field', encode(level), true);
				return;
			}
			player.emit('field', encode(level), false);
		}, 16);
	});
});

bodjo.start();

function encode(level) {
	let n = level.length;
	return buff(
		UInt8(n),
		Array.from(level, row => 
			Array.from(row, x => UInt8(x))
		)
	);
}
function getMax(level) {
	let max = 0;
	for (let y = 0; y < level.length; ++y)
		for (let x = 0; x < level[y].length; ++x)
			if (max < level[y][x])
				max = level[y][x];
	return max;
}
// function getScore(level) {
// 	let score = 0;
// 	for (let y = 0; y < level.length; ++y)
// 		for (let x = 0; x < level[y].length; ++x)
// 			if (level[y][x] > 0)
// 				score += Math.pow(2, level[y][x]);
// 	return score;
// }
function updateScoreboard(username, level, score) {
	let max = getMax(level);
	// let score = getScore(level);
	let past = bodjo.scoreboard.get(username);
	if (typeof past === 'undefined' ||
		past.max < max ||
		past.score < score)
		bodjo.scoreboard.push(username, {max, score});
}
function clone(a) {
	return Array.from(a, _ => _.slice(0));
}
function defeat(level) {
	let source = clone(level);
	for (let d = 0; d < 4; ++d)
	 	if (!equals(source, step(clone(level), d, false)))
	 		return false;
	return true;
}
function putTile(level, n = 1) {
	let empty = [];
	for (let y = 0; y < level.length; ++y)
		for (let x = 0; x < level[y].length; ++x)
			if (level[y][x] == 0)
				empty.push([x, y]);
	if (empty.length < n)
		return false;
	for (let i = 0; i < n; ++i) {
		let j = Math.round(Math.random()*(empty.length-1));
		level[empty[j][1]][empty[j][0]] = Math.random() >= 0.9 ? 2 : 1;
		empty.splice(j, 1);
	}
	return true;
}
function clone(a) {
	return Array.from(a, _ => _.slice(0));
}
function equals(a, b) {
	if (a.length != b.length ||
		a[0].length != b[0].length)
		return false;
	for (let y = 0; y < a.length; ++y)
		for (let x = 0; x < a[0].length; ++x)
			if (a[y][x] != b[y][x])
				return false;
	return true;
}
function matrix(n = 4, x = 0) {
	return Array.from({length: n}, () => Array.from({length: n}, () => x));
}
function rowstep(arr, dir, updScoreboard) {
	let len = arr.length, e = dir?len-1:0;
	for (let i = dir?len-1:0; i >= 0 && i < len; dir?--i:++i) {
		if (arr[i] > 0 && i != e) {
			if (arr[i] == arr[e]) {
				arr[i] = 0;
				arr[e]++;
				if (typeof updScoreboard === 'function')
					updScoreboard(Math.pow(2, arr[e]))
				if (dir) e--;
				else e++;
			} else if (arr[e] == 0) {
				arr[e] = arr[i];
				arr[i] = 0;
			} else if (arr[e] > 0) {
				if (dir) e--;
				else e++;
				if (i != e) {
					arr[e] = arr[i];
					arr[i] = 0;
				}
			}
		}
	}
	return arr;
}
function step(map, turn, updScoreboard) {
	switch (turn) {
		case RIGHT:
		case LEFT:
			for (let y = 0; y < map.length; ++y)
				map[y] = rowstep(map[y], turn == RIGHT, updScoreboard);
			break;
		case DOWN:
		case UP:
			for (let x = 0; x < map[0].length; ++x) {
				let column = Array.from({length: map.length}, (_,i) => map[i][x]);
				let stepped = rowstep(column, turn == DOWN, updScoreboard);
				for (let y = 0; y < map.length; ++y)
					map[y][x] = stepped[y];
			}
			break;
	}
	return map;
}
function flatten(input) {
	const stack = [...input];
	const res = [];
	while (stack.length) {
		const next = stack.pop();
		if (Array.isArray(next))
			stack.push(...next);
		else
			res.push(next);
	}
	return res.reverse();
}

// === Binary ===
function UInt8(n) {
	return new Uint8Array(Array.isArray(n) ? n : [n]).buffer;
}
function UInt16(n) {
	return new Uint16Array(Array.isArray(n) ? n : [n]).buffer;
}
function UInt32(n) {
	return new Uint32Array(Array.isArray(n) ? n : [n]).buffer;
}
function Float32(n) {
	return new Float32Array(Array.isArray(n) ? n : [n]).buffer;
}
function buff() {
	let array = flatten(Array.prototype.slice.apply(arguments));
	let sum = 0, offset = 0;
	for (let i = 0; i < array.length; ++i)
		sum += array[i].byteLength;
	let tmp = new Uint8Array(sum);
	for (let i = 0; i < array.length; ++i) {
		tmp.set(new Uint8Array(array[i]), offset);
		offset += array[i].byteLength;
	}
	return tmp.buffer;
}