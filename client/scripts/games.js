
d3.select("#nav-games").on("click", function () {

	const tableDiv = d3.select('#visualization').append('div').attr('id', 'tableContainer').attr('class', 'well');
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
	let games;
	let renderer3 = function () {
		let gamenum = d3.select("#select-game").property("value");
		let game = games[gamenum - 1];
		let data = [];
		console.log(game);
		for (key of Object.keys(game.player1)) {
			let obj = {
				player1: game.player1[key],
				player2: game.player2[key],
				metric: key
			};
			data.push(obj);
		}
		console.log(data);
		tablulate(data);
	}
	let renderer2 = function () {
		let set = d3.select("#select-set").property("value");

		d3.select("#select-game").selectAll("option").remove();
		if (set === "") return;

		d3.json(`/gamedata?id=${set}`)
			.then(function (json) {
				games = json[0].games;

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
			}).then(renderer3);
	}

	let renderer1 = function () {
		d3.selectAll('table').remove();
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
		.on("change", renderer3);

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

	function tablulate(data) {
		d3.selectAll('table').remove();
		columns = ["metric", "player1", "player2"];
		var table = tableDiv.append('table');
		table.attr('class', 'table table-condensed table-striped table-bordered');
		var thead = table.append('thead')
		var tbody = table.append('tbody')

		thead.append('tr')
			.selectAll('th')
			.data(columns)
			.enter()
			.append('th')
			.text(function (d) { return d })

		var rows = tbody.selectAll('tr')
			.data(data)
			.enter()
			.append('tr')

		var cells = rows.selectAll('td')
			.data(function (row) {
				return columns.map(function (column) {
					return { column: column, value: row[column] }
				})
			})
			.enter()
			.append('td')
			.text(function (d) { return d.value })

		return table;
	}

});
