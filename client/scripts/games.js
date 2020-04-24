
d3.select("#nav-games").on("click", function () {

	d3.select("#options").html("");
	d3.select("#visualization").html("");

	let sets;
	let games;
	let renderer = function () {
		let gamenum = parseInt(d3.select("#options-game").property("value"));
		let game = games.find(x => x.gamenum === gamenum);
		let data = [];
		let metrics = ["inputsPerSecond", "openingsPerKill", "damagePerOpening", "neutralWinRatio", "counterHitRatio", "tag"];
		for (let metric of metrics) {
			data.push([metric, game.player1[metric], game.player2[metric]])
		}
		d3.select("#visualization").html("");
		let columns = ["metric", "player1", "player2"];
		let table = d3.select("#visualization")
			.append("table")
			.attr("id", "games");
		table.append("thead")
			.append("tr")
			.selectAll("th")
			.data(columns)
			.enter()
			.append("th")
			.text(function (d) {
				let map = {
					"metric": "Metric",
					"player1": d3.select("#options-player1").property("value") + " ",
					"player2": d3.select("#options-player2").property("value") + " ",
				}
				return map[d];
			})
			.filter(function (d) {
				return (d === "player1" || d === "player2");
			})
			.append("img")
			.attr("src", function(d) {
				return `charactericons/${game[d].character}-${game[d].color}.png`;
			});

		let rows = table.append("tbody")
			.selectAll("tr")
			.data(data)
			.enter()
			.append("tr");

		let cells = rows.selectAll("td")
			.data(function (row) {
				return row;
			})
			.enter()
			.append("td")
			.text(function (d) {
				return d;
			});
	}
	let renderGames = function () {
		let set = d3.select("#options-set").property("value");

		d3.select("#options-game").selectAll("option").remove();
		if (set === "") return;

		games = sets.find(x => x._id === set).games;

		d3.select("#options-game").selectAll("option")
			.data(games)
			.enter()
			.append("option")
			.attr("value", function (d) {
				return d.gamenum;
			})
			.text(function (d, i) {
				return `Game ${i+1}`;
			});
		renderer();
	}

	let renderSets = function () {
		let player1 = d3.select("#options-player1").property("value");
		let player2 = d3.select("#options-player2").property("value");
		d3.select("#options-set").selectAll("option").remove();
		d3.json(`/gamedata?player1=${player1}&player2=${player2}`)
		.then(function (json) {
			sets = json;
			d3.select("#options-set").selectAll("option")
				.data(json)
				.enter()
				.append("option")
				.attr("value", function (d) {
					return d._id;
				})
				.text(function (d) {
					return `${d.tournament} - ${d.round}`;
				});
		})
		.then(renderGames);
	};

	let options = d3.select("#options");
	options.append("label")
		.text("Player 1:")
		.attr("for", "options-player1");
	options.append("br");
	options.append("select")
		.attr("id", "options-player1")
		.on("change", renderSets);
	options.append("br");

	options.append("label")
		.text("Player 2:")
		.attr("for", "options-player2");
	options.append("br");
	options.append("select")
		.attr("id", "options-player2")
		.on("change", renderSets);
	options.append("br");

	options.append("label")
		.text("Set:")
		.attr("for", "options-set");
	options.append("br");
	options.append("select")
		.attr("id", "options-set")
		.on("change", renderGames);
	options.append("br");

	options.append("label")
		.text("Game:")
		.attr("for", "options-game");
	options.append("br");
	options.append("select")
		.attr("id", "options-game")
		.on("change", renderer);


	d3.json("/allplayers")
	.then(function (json) {
		let player1dropdown = d3.select("#options-player1");
		let player2dropdown = d3.select("#options-player2");

		player1dropdown.selectAll("option")
			.data(json)
			.enter()
			.append("option")
			.attr("value", function (d) {
				return d;
			})
			.text(function (d) {
				return d;
			});
		player1dropdown.property("value", "elicik");

		player2dropdown.selectAll("option")
			.data(json)
			.enter()
			.append("option")
			.attr("value", function (d) {
				return d;
			})
			.text(function (d) {
				return d;
			});
		player2dropdown.property("value", "Arcade");
	})
	.then(renderSets);
});
