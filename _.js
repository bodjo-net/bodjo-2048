require('colors');
function rowstep(arr, dir) {
	let len = arr.length, e = dir?len-1:0;
	for (let i = dir?len-1:0; i >= 0 && i < len; dir?--i:++i) {
		if (arr[i] > 0 && i != e) {
			if (arr[i] == arr[e]) {
				arr[i] = 0;
				arr[e]++;
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

assert([0, 0, 0, 0], false, [0, 0, 0, 0]);
assert([0, 1, 0, 0], false, [1, 0, 0, 0]);
assert([0, 1, 1, 0], false, [2, 0, 0, 0]);
assert([0, 1, 1, 1], false, [2, 1, 0, 0]);
assert([1, 1, 1, 1], false, [2, 2, 0, 0]);
assert([1, 0, 1, 1], false, [2, 1, 0, 0]);
assert([1, 2, 3, 4], false, [1, 2, 3, 4]);
assert([1, 2, 4, 4], false, [1, 2, 5, 0]);
assert([2, 1, 1, 1], false, [2, 2, 1, 0]);
assert([2, 1, 1, 0], false, [2, 2, 0, 0]);
assert([0, 2, 1, 1], false, [2, 2, 0, 0]);
assert([2, 2, 1, 1], false, [3, 2, 0, 0]);
assert([0, 2, 1, 1], false, [2, 2, 0, 0]);
assert([0, 2, 1, 1], true, [0, 0, 2, 2]);
assert([2, 2, 1, 1], true, [0, 0, 3, 2]);
assert([0, 0, 0, 0], true, [0, 0, 0, 0]);
assert([0, 1, 0, 0], true, [0, 0, 0, 1]);
assert([0, 1, 1, 0], true, [0, 0, 0, 2]);
assert([0, 1, 1, 1], true, [0, 0, 1, 2]);
assert([1, 1, 1, 1], true, [0, 0, 2, 2]);
assert([1, 0, 1, 1], true, [0, 0, 1, 2]);
assert([1, 2, 3, 4], true, [1, 2, 3, 4]);
assert([1, 2, 4, 4], true, [0, 1, 2, 5]);

assert([10, 0, 0, 10], false, [11, 0, 0, 0]);
assert([10, 1, 10, 0], false, [10, 1, 10, 0]);
assert([10, 1, 10, 0], true, [0, 10, 1, 10]);

function assert(arr, dir, expectation) {
	let res = rowstep(arr.slice(0), dir);
	let r = (JSON.stringify(res) == 
			 JSON.stringify(expectation))
	console.log(('['+(['❌'.red,'✔️'.green])[r-0]+']').bold+' ('+JSON.stringify(arr)+', '+dir+') => ' + JSON.stringify(res) + (r?'':' (expected ' + JSON.stringify(expectation)+')'));
}