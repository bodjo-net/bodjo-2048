// colors
let border = '#BBADA0';
let bg = '#CDC1B4';
let tileBgColor = [
	'#eee4da', // 2
	'#ede0c8', // 4
	'#f2b179', // 8
	'#f59563', // 16
	'#f67c5f', // 32
	'#f65e3b', // 64
	'#edcf72', // 128
	'#edcc61', // 256
	'#edc850', // 512
	'#edc53f', // 1024
	'#edc22e', // 2048
	'#3c3a32', // 4096
	'#3c3a32', // 8192
	'#3c3a32', // 16384
	'#3c3a32', // 32768
	'#d500f9'  // 65536+
];
let tileTextColor = [
	'#776e65', // 2
	'#776e65', // 4
	'#f9f6f2', // 8+
];
const UP = 0;
const RIGHT = 1;
const DOWN = 2;
const LEFT = 3;

let tdata = {};
bodjo.render = function (canvas, ctx, resizeCanvas, dataPushed, timeout, lastField, lastTurn, field, defeat) {
	if (!canvas.id)
		canvas.id = randomID();

	let height = field.length,
		width = field[0].length;
	resizeCanvas(width / height);

	if (lastField != null && dataPushed) {
		let tiles = [];
		let tilesMap = matrix(width, height, null);
		for (let y = 0; y < height; ++y) {
			for (let x = 0; x < width; ++x) {
				if (lastField[y][x] > 0) {
					let tile = {fromX: x, fromY: y, toX: x, toY: y, x: x, y: y, v: lastField[y][x], appear: false};
					tiles.push(tile);
					tilesMap[y][x] = tile;
				} else {
					tilesMap[y][x] = {x: x, y: y, v: 0};
				}
			}
		}

		step(tilesMap, lastTurn, tiles);
		for (let y = 0; y < height; ++y) {
			for (let x = 0; x < width; ++x) {
				if (field[y][x] > 0 &&
					field[y][x] != tilesMap[y][x].v) {
					tiles.push({x: x, y: y, fromX: x, fromY: y, toX: x, toY: y, v: field[y][x], appear: true, 'new': true});
					break;
				}
			}
		}
		tiles = tiles.sort((a,b)=>(a.appear&&!b.appear)||(b.disappear&&!a.disappear)?1:(a.disappear&&!b.disappear?-1:0))

		if (typeof tdata[canvas.id] !== 'undefined') {
			let tids = Object.keys(tdata[canvas.id]);
			for (let t = 0; t < tids.length; ++t)
				delete tdata[canvas.id][tids[t]];
		} else 
			tdata[canvas.id] = {};

		let tid = randomID();
		tdata[canvas.id][tid] = true;
		let start = Date.now(), duration = range(timeout * 0.75, 16, 300);
		function tick() {
			if (!tdata[canvas.id][tid])
				return;

			let t = (Date.now() - start) / duration;
			// console.log(t);

			// render
			let p = Math.min(canvas.width, canvas.height) * 0.1 / Math.min(width, height),
				w = (canvas.width - p * (width+1)) / width,
				h = (canvas.height - p * (height+1)) / height,
				m = Math.min(w, h),
				r = m * 0.05,
				fontsize = m * 0.5;

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			drawRoundedRect(ctx, 0, 0, canvas.width, canvas.height, r, border);
			for (let y = 0; y < height; ++y)
				for (let x = 0; x < width; ++x)
					drawRoundedRect(ctx, p+x*(w+p), p+y*(h+p), w, h, r, bg);

			let appearnewt = range((t-0.75)/0.25, 0, 1),
				movingt = range((t-0.25)/0.5, 0, 1),
				appeart = bounce(range((t-0.75)/0.25, 0, 1));
			for (let i = 0; i < tiles.length; ++i) {
				let x = tiles[i].fromX + (tiles[i].toX - tiles[i].fromX) * movingt,
					y = tiles[i].fromY + (tiles[i].toY - tiles[i].fromY) * movingt,
					s = 1;
				if (tiles[i].appear&&tiles[i].new)
					s = appearnewt;
				else if (tiles[i].appear)
					s = appeart;
				drawTile(ctx, x, y, w, h, s, p, r, fontsize, tiles[i].v);
			}

			if (t < 1)
				requestAnimationFrame(tick);
			else {
				delete tdata[canvas.id][tid];
			}
		}
		requestAnimationFrame(tick)
	} else {
		let p = Math.min(canvas.width, canvas.height) * 0.1 / Math.min(width, height),
			w = (canvas.width - p * (width+1)) / width,
			h = (canvas.height - p * (height+1)) / height,
			m = Math.min(w, h),
			r = m * 0.05,
			fontsize = m * 0.5;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		drawRoundedRect(ctx, 0, 0, canvas.width, canvas.height, r, border);
		for (let y = 0; y < height; ++y)
			for (let x = 0; x < width; ++x)
				drawRoundedRect(ctx, p+x*(w+p), p+y*(h+p), w, h, r, bg);

		for (let y = 0; y < height; ++y) {
			for (let x = 0; x < width; ++x) {
				if (field[y][x] == 0)
					continue;
				drawTile(ctx, x, y, w, h, 1, p, r, fontsize, field[y][x]);
			}
		}
	}
}
function bounce(t) {
	return (-2 * Math.pow(t-0.75, 2) + 1.125);
}
function drawTile(ctx, x, y, w, h, s, p, r, fontsize, v) {
	if (s == 0)
		return;
	ctx.font = '700 ' + fontsize*s*(v>=10?0.75:1) + 'px \'Source Code Pro\'';
	drawRoundedRect(ctx, p+x*(w+p)+(1-s)/2*w, p+y*(h+p)+(1-s)/2*h, w*s, h*s, r, tileBgColor[range(v-1, 0, tileBgColor.length-1)]);
	ctx.fillStyle = tileTextColor[range(v-1, 0, tileTextColor.length-1)];
	let text = (v>=14 ? short(Math.pow(2,v)) : Math.pow(2, v)) + "";
	let textwidth = ctx.measureText(text).width;
	ctx.fillText(text, 
				 p+x*(w+p)+w/2 - textwidth / 2,
				 p+y*(h+p)+h*0.65);
}
function short(n) {
	if (n >= 1000000)
		return ~~(n / 1000000) + "M";
	if (n >= 1000)
		return ~~(n / 1000) + "K";
	return n;
}
function drawRoundedRect(ctx, x, y, w, h, r, color) {
	ctx.beginPath();
	ctx.arc(x+r, y+r, r, PI, -PI/2);
	ctx.arc(x+w-r, y+r, r, -PI/2, 0);
	ctx.arc(x+w-r, y+h-r, r, 0, PI/2);
	ctx.arc(x+r, y+h-r, r, PI/2, PI);
	ctx.fillStyle = color;
	ctx.fill();
}
function rowstep(arr, dir, tiles, tilesMap) {
	let len = arr.length, e = dir?len-1:0;
	for (let i = dir?len-1:0; i >= 0 && i < len; dir?--i:++i) {
		if (arr[i].v > 0 && i != e) {
			if (arr[i].v == arr[e].v) {
				let ix = arr[i].x, iy = arr[i].y;
				arr[i].toX = arr[i].x = arr[e].x;
				arr[i].toY = arr[i].y = arr[e].y;
				let tile = {fromX: arr[e].x, fromY: arr[e].y, x: arr[e].x, y: arr[e].y, toX: arr[e].x, toY: arr[e].y, appear: true, v: arr[e].v+1};
				tiles.push(tile);
				arr[e].disappear = true;
				tilesMap[arr[e].y][arr[e].x] = arr[e] = tile;
				tilesMap[iy][ix] = arr[i] = {x: ix, y:iy, v:0};

				if (dir) e--;
				else e++;
			} else if (arr[e].v == 0) {
				let ix = arr[i].x, iy = arr[i].y;
				arr[i].toX = arr[i].x = arr[e].x;
				arr[i].toY = arr[i].y = arr[e].y;
				tilesMap[arr[e].y][arr[e].x] = arr[e] = arr[i];
				tilesMap[iy][ix] = arr[i] = {x:ix,y:iy,v:0};
				// arr[i].disappear = true;
				// arr[e] = arr[i];
				// arr[i] = 0;
			} else if (arr[e].v > 0) {
				if (dir) e--;
				else e++;
				if (i != e) {
					let ix = arr[i].x, iy = arr[i].y;
					arr[i].toX = arr[i].x = arr[e].x;
					arr[i].toY = arr[i].y = arr[e].y;
					tilesMap[arr[e].y][arr[e].x] = arr[e] = arr[i];
					tilesMap[iy][ix] = arr[i] = {x:ix,y:iy,v:0};
					// arr[i].disappear = true;
					// arr[e] = arr[i];
					// arr[i] = 0;
				}
			}
		}
	}
	return arr;
}
function step(map, turn, tiles) {
	switch (turn) {
		case RIGHT:
		case LEFT:
			for (let y = 0; y < map.length; ++y)
				/*map[y] = */rowstep(map[y].slice(0), turn == RIGHT, tiles, map);
			break;
		case DOWN:
		case UP:
			for (let x = 0; x < map[0].length; ++x) {
				let column = Array.from({length: map.length}, (_,i) => map[i][x]);
				rowstep(column, turn == DOWN, tiles, map);
				// for (let y = 0; y < map.length; ++y)
					// map[y][x] = stepped[y];
			}
			break;
	}
	// return map;
}
function range(x, _min, _max) {
	return Math.max(Math.min(x, _max), _min);
}
function matrix(w, h, def) {
	return Array.from({length: h}, () => Array.from({length: w}, () => def));
}
function randomID() {
	let q = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
	return Array.from({length: 16}, () => q[Math.round(Math.random()*(q.length-1))]).join('');
}