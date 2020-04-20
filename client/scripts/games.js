d3.select("#nav-games").on("click", function () {
	d3.select("#options").html("");
	d3.select("#visualization").html("");
	let textw = 200;
	let graphw = 400;
	let w = textw + graphw;
	let h = 400;
	let padding = 10;

	let options = d3.select("#options");

	options.append("label")
		.text("Player 1: ")
		.attr("id", "label-options-player1");
	options.append("br");

	options.append("label")
		.text("Player 2: ")
		.attr("id", "label-options-player2");
	options.append("br");

	options.append("label")
		.text("Select Set: ")
		.attr("id", "label-select-set");
	options.append("br");

	options.append("label")
		.text("Select Game: ")
		.attr("id", "label-select-game");
	options.append("br");


	let renderer2 = function () {
		let set = d3.select("#select-set").property("value");
		
		d3.select("#select-game").selectAll("option").remove();
		
		if(set ==="") return;

		d3.json(`/gamedata?id=${set}`)
			.then(function (json) {
				let games = json[0].games;

				console.log(games);
				gameDropdown.selectAll("option")
					.data(games)
					.enter()
					.append("option")
					.attr("value", function (d) {
						return d.gamenum;
					})
					.text(function (d, i) {
						return "game " + i;
					});
			});
	}

	let renderer1 = function () {
		let player1 = d3.select("#options-player1").property("value");
		let player2 = d3.select("#options-player2").property("value");
		d3.select("#select-set").selectAll("option").remove();

		d3.json(`/gamedata?player1=${player1}&player2=${player2}`)
			.then(function (json) {
				let sets = json;
				setDropdown.selectAll("option")
					.data(sets)
					.enter()
					.append("option")
					.attr("value", function (d) {
						return d._id;
					})
					.text(function (d) {
						return d.tournament + " " + d.round;
					});
			}).then(renderer2);
	};

	let playerdropdown = d3.select("#label-options-player1").append("select")
		.attr("id", "options-player1")
		.on("change", renderer1);

	let playerdropdown2 = d3.select("#label-options-player2").append("select")
		.attr("id", "options-player2")
		.on("change", renderer1);

	let setDropdown = d3.select("#label-select-set").append("select")
		.attr("id", "select-set")
		.on("change", renderer2);

	let gameDropdown = d3.select("#label-select-game").append("select")
		.attr("id", "select-game")
		.on("change", renderer2);

	d3.json("/allplayers")
		.then(function (json) {
			players = json;
			let options = d3.select("#options");

			playerdropdown.selectAll("option")
				.data(json)
				.enter()
				.append("option")
				.attr("value", function (d) {
					return d;
				})
				.text(function (d) {
					return d;
				});
			playerdropdown.property("value", "elicik");
			options.append("br");

			playerdropdown2.selectAll("option")
				.data(json)
				.enter()
				.append("option")
				.attr("value", function (d) {
					return d;
				})
				.text(function (d) {
					return d;
				});
			playerdropdown2.property("value", "Arcade");
			options.append("br");
		})
		.then(renderer1);
});





// var movies = [
// 	{ title: "The Godfather", year: 1972, length: 175, budget: 6000000, rating: 9.1 },
// 	{ title: "The Shawshank Redemption", year: 1994, length: 142, budget: 25000000, rating: 9.1 },
// 	{ title: "The Lord of the Rings: The Return of the King", year: 2003, length: 251, budget: 94000000, rating: 9 },
// 	{ title: "The Godfather: Part II", year: 1974, length: 200, budget: 13000000, rating: 8.9 },
// 	{ title: "Shichinin no samurai", year: 1954, length: 206, budget: 500000, rating: 8.9 },
// 	{ title: "Buono, il brutto, il cattivo, Il", year: 1966, length: 180, budget: 1200000, rating: 8.8 },
// 	{ title: "Casablanca", year: 1942, length: 102, budget: 950000, rating: 8.8 },
// 	{ title: "The Lord of the Rings: The Fellowship of the Ring", year: 2001, length: 208, budget: 93000000, rating: 8.8 },
// 	{ title: "The Lord of the Rings: The Two Towers", year: 2002, length: 223, budget: 94000000, rating: 8.8 },
// 	{ title: "Pulp Fiction", year: 1994, length: 168, budget: 8000000, rating: 8.8 }
// ];

// // column definitions
// var columns = [
// 	{ head: 'Movie title', cl: 'title', html: ƒ('title') },
// 	{ head: 'Year', cl: 'center', html: ƒ('year') },
// 	{ head: 'Length', cl: 'center', html: ƒ('length', length()) },
// 	{ head: 'Budget', cl: 'num', html: ƒ('budget', d3.format('$,')) },
// 	{ head: 'Rating', cl: 'num', html: ƒ('rating', d3.format('.1f')) }
// ];

// // create table
// var table = d3.select('body')
// 	.append('table');

// // create table header
// table.append('thead').append('tr')
// 	.selectAll('th')
// 	.data(columns).enter()
// 	.append('th')
// 	.attr('class', ƒ('cl'))
// 	.text(ƒ('head'));

// // create table body
// table.append('tbody')
// 	.selectAll('tr')
// 	.data(movies).enter()
// 	.append('tr')
// 	.selectAll('td')
// 	.data(function (row, i) {
// 		return columns.map(function (c) {
// 			// compute cell values for this specific row
// 			var cell = {};
// 			d3.keys(c).forEach(function (k) {
// 				cell[k] = typeof c[k] == 'function' ? c[k](row, i) : c[k];
// 			});
// 			return cell;
// 		});
// 	}).enter()
// 	.append('td')
// 	.html(ƒ('html'))
// 	.attr('class', ƒ('cl'));

// function length() {
// 	var fmt = d3.format('02d');
// 	return function (l) { return Math.floor(l / 60) + ':' + fmt(l % 60) + ''; };
// }