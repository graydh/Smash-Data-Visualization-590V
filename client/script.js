d3.select("#nav-players").on("click", function () {
	d3.select("#options").html("");
	d3.select("#visualization").html("");
	let textw = 200;
	let graphw = 400;
	let w = textw + graphw;
	let h = 400;
	let padding = 10;
	let players = [];
	let svg = d3.select("#visualization")
		.append("svg")
		.attr("width", w)
		.attr("height", h);
	let g_text = svg
		.append("g");
	let g_graph = svg
		.append("g")
		.attr("transform", `translate(${textw}, 0)`);


	let renderer = function () {
		let player = d3.select("#options-player").property("value");
		let metric = d3.select("#options-metric").property("value");

		console.log(players);
		let playerArray = [];

		for (let playerName of players) {
			d3.json(`/playerdata?player=${playerName}`)
				.then(function (json) {
					playerObject = new Object();
					playerObject["player"] = playerName;
					let games = 0;
					let total_metric = 0;
					for (let game of json) {
						if (game[metric] !== null)
							games += 1;
							total_metric += game[metric];
					}
					playerObject[metric] = total_metric/games;
					
					playerArray.push(playerObject);
				});
		}

		console.log(playerArray);


		let xScale = d3.scaleLinear()
			.domain([0, 12])
			.range([0, graphw - 2 * padding]);

		let yScale = d3.scaleBand()
			.domain(player)
			.rangeRound([0, h])
			.paddingInner(padding / h)
			.paddingOuter(padding / h * 4);

		let barHeight = (h - padding * (players.length + 1)) / players.length;

		
		g_graph.selectAll(".left")
			.data(playerArray)
			.enter()
			.append("rect")
			.attr("class", "left");
		g_graph.selectAll(".left")
			.data(playerArray)
			.transition()
			.attr("x", padding)
			.attr("y", function (d, i) {
				return yScale(d.player);
			})
			.attr("width", function (d, i) {
				return xScale(d[metric]);
			})
			.attr("height", barHeight)
			.attr("fill", function (d, i) {
				return "hsl(120, 30%, 50%)"
			});
		g_text.selectAll("text")
			.data(playerArray)
			.enter()
			.append("text")
			.style("dominant-baseline", "middle")
			.style("text-anchor", "end");
		g_text.selectAll("text")
			.data(playerArray)
			.transition()
			.attr("x", textw)
			.attr("y", function (d, i) {
				return yScale(d.player) + barHeight / 2;
			})
			.text(function (d, i) {
				return `${d.player}`;
			});

	};

	d3.json("/allplayers")
		.then(function (json) {
			players = json;
			let options = d3.select("#options");
			options.append("label")
				.text("Player: ")
				.attr("for", "options-player");
			options.append("br");

			let playerdropdown = options.append("select")
				.attr("id", "options-player")
				.on("change", renderer);
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
			options.append("label")
				.text("Metric: ")
				.attr("for", "options-metric");
			options.append("br");
			let metricdropdown = options.append("select")
				.attr("id", "options-metric")
				.on("change", renderer);
			let metrics = [
				{
					label: "Inputs Per Second",
					value: "inputsPerSecond"
				},
				{
					label: "Openings Per Kill",
					value: "openingsPerKill"
				},
				{
					label: "Damage Per Opening",
					value: "damagePerOpening"
				},
				{
					label: "Neutral Win Ratio",
					value: "neutralWinRatio"
				},
				{
					label: "Counter Hit Ratio",
					value: "counterHitRatio"
				}
			];

			metricdropdown.selectAll("option")
				.data(metrics)
				.enter()
				.append("option")
				.attr("value", function (d) {
					return d.value;
				})
				.text(function (d) {
					return d.label;
				});
			metricdropdown.property("value", "inputsPerSecond");
		})
		.then(renderer);
});

d3.select("#nav-matchups").on("click", function () {
	d3.select("#options").html("");
	d3.select("#visualization").html("");
	let textw = 200;
	let graphw = 400;
	let w = textw + graphw;
	let h = 400;
	let padding = 10;
	let svg = d3.select("#visualization")
		.append("svg")
		.attr("width", w)
		.attr("height", h);
	let g_text = svg
		.append("g");
	let g_graph = svg
		.append("g")
		.attr("transform", `translate(${textw}, 0)`);


	let renderer = function () {
		let character1 = d3.select("#options-character1").property("value");
		let character2 = d3.select("#options-character2").property("value");
		d3.json(`/matchup?character1=${character1}&character2=${character2}`)
			.then(function (json) {

				let stages = ["Final Destination", "Battlefield", "Fountain of Dreams", "Yoshi's Story", "Dream Land N64", "Pokémon Stadium"];
				let dataset = [];
				let scales = [];
				for (let stage of stages) {
					let char1length = json.filter(x => x.stage === stage && x.winner.character === character1).length;
					let char2length = json.filter(x => x.stage === stage && x.winner.character === character2).length;
					let xScale = d3.scaleLinear()
						.domain([0, char1length + char2length])
						.range([0, graphw - 2 * padding]);
					dataset.push({
						"stage": stage,
						"character1": char1length,
						"character2": char2length,
						"xScale": xScale,
					});
				}
				let yScale = d3.scaleBand()
					.domain(stages)
					.rangeRound([0, h])
					.paddingInner(padding / h)
					.paddingOuter(padding / h * 4);
				// green for player 1, red for player 2
				let colorScale1 = d3.scaleSqrt()
					.domain([-0.5, 0, 0.5])
					.range(["hsl(120, 100%, 50%)", "hsl(120, 30%, 50%)", "hsl(120, 100%, 50%)"]);
				let colorScale2 = d3.scaleSqrt()
					.domain([-0.5, 0, 0.5])
					.range(["hsl(0, 100%, 50%)", "hsl(0, 30%, 50%)", "hsl(0, 100%, 50%)"]);
				let barHeight = (h - padding * (stages.length + 1)) / stages.length;
				g_graph.selectAll(".right")
					.data(dataset)
					.enter()
					.append("rect")
					.attr("class", "right");
				g_graph.selectAll(".right")
					.data(dataset)
					.attr("x", padding)
					.attr("y", function (d, i) {
						return yScale(d.stage);
					})
					.attr("width", graphw - 2 * padding)
					.attr("height", barHeight)
					.attr("fill", function (d, i) {
						return colorScale2(d.character2 / (d.character1 + d.character2) - 0.5);
					});
				g_graph.selectAll(".left")
					.data(dataset)
					.enter()
					.append("rect")
					.attr("class", "left");
				g_graph.selectAll(".left")
					.data(dataset)
					.transition()
					.attr("x", padding)
					.attr("y", function (d, i) {
						return yScale(d.stage);
					})
					.attr("width", function (d, i) {
						return d.xScale(d.character1);
					})
					.attr("height", barHeight)
					.attr("fill", function (d, i) {
						return colorScale1(d.character1 / (d.character1 + d.character2) - 0.5);
					});
				g_text.selectAll("text")
					.data(dataset)
					.enter()
					.append("text")
					.style("dominant-baseline", "middle")
					.style("text-anchor", "end");
				g_text.selectAll("text")
					.data(dataset)
					.transition()
					.attr("x", textw)
					.attr("y", function (d, i) {
						return yScale(d.stage) + barHeight / 2;
					})
					.text(function (d, i) {
						return `${d.stage} (${d.character1}:${d.character2})`;
					});
			});
	};
	d3.json("/allchars")
		.then(function (json) {
			let options = d3.select("#options");
			options.append("label")
				.text("Character 1: ")
				.attr("for", "options-character1");
			options.append("br");
			let character1dropdown = options.append("select")
				.attr("id", "options-character1")
				.on("change", renderer);
			character1dropdown.selectAll("option")
				.data(json)
				.enter()
				.append("option")
				.attr("value", function (d) {
					return d.shortName;
				})
				.text(function (d) {
					return d.name;
				});
			character1dropdown.property("value", "Fox");
			options.append("br");
			options.append("label")
				.text("Character 2: ")
				.attr("for", "options-character2");
			options.append("br");
			let character2dropdown = options.append("select")
				.attr("id", "options-character2")
				.on("change", renderer);
			character2dropdown.selectAll("option")
				.data(json)
				.enter()
				.append("option")
				.attr("value", function (d) {
					return d.shortName;
				})
				.text(function (d) {
					return d.name;
				});
			character2dropdown.property("value", "Falco");
		})
		.then(renderer);
});