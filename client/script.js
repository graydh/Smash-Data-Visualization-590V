d3.select("#nav-matchups").on("click", function() {
	let renderer = function() {
		let character1 = d3.select("#options-character1").property("value");
		let character2 = d3.select("#options-character2").property("value");
		d3.json(`/matchup?character1=${character1}&character2=${character2}`)
		.then(function (json) {
			let svg = d3.select("#visualization svg");
			let w = svg.attr("width");
			let h = svg.attr("height");
			let padding = 10;

			let stages = ["Final Destination", "Battlefield", "Fountain of Dreams", "Yoshi's Story", "Dream Land N64", "Pokémon Stadium"];
			let dataset = [];
			let scales = [];
			for (let stage of stages) {
				let char1length = json.filter(x => x.stage === stage && x.winner.character === character1).length;
				let char2length = json.filter(x => x.stage === stage && x.winner.character === character2).length;
				let xScale = d3.scaleLinear()
					.domain([0, char1length + char2length])
					.range([0, w - 2*padding]);
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
			let colorScale = d3.scaleLinear()
				.domain([0, 1])
				.range(["blue", "yellow"]);

			let barHeight = (h - padding * (stages.length + 1))/stages.length;
			svg.selectAll("rect")
				.data(dataset)
				.enter()
				.append("rect");
			svg.selectAll("rect")
				.data(dataset)
				.transition()
				.attr("x", padding)
				.attr("y", function(d, i) {
					return yScale(d.stage);
				})
				.attr("width", function(d, i) {
					return d.xScale(d.character1);
				})
				.attr("height", barHeight)
				.attr("fill", function(d, i) {
					return colorScale(d.character1 / (d.character1 + d.character2));
				});
			svg.selectAll("text")
				.data(dataset)
				.enter()
				.append("text");
			svg.selectAll("text")
				.data(dataset)
				.transition()
				.attr("x", 2 * padding)
				.attr("y", function(d, i) {
					return yScale(d.stage) + barHeight / 2;
				})
				.text(function(d, i) {
					return `${d.stage} (${d.character1}:${d.character2})`;
				})
		});
	};
	d3.json("/allchars")
	.then(function (json) {
		let options = d3.select("#options");
		options.append("label")
			.text("Character 1: ")
			.attr("for", "options-character1");
		let character1Dropdown = options.append("select")
			.attr("id", "options-character1")
			.on("change", renderer);
		character1Dropdown.selectAll("option")
			.data(json)
			.enter()
			.append("option")
			.attr("value", function (d) {
				return d.shortName;
			})
			.text(function (d) {
				return d.name;
			});
		options.append("br");
		options.append("label")
			.text("Character 2: ")
			.attr("for", "options-character2");
		let character2Dropdown = options.append("select")
			.attr("id", "options-character2")
			.on("change", renderer);
		character2Dropdown.selectAll("option")
			.data(json)
			.enter()
			.append("option")
			.attr("value", function (d) {
				return d.shortName;
			})
			.text(function (d) {
				return d.name;
			});
	})
	.then(() => {
		let w = 400;
		let h = 400;
		let svg = d3.select("#visualization")
			.append("svg")
			.attr("width", w)
			.attr("height", h);
		renderer();
	});
});