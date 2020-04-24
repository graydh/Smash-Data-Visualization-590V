d3.select("#nav-players").on("click", function () {
	d3.select("#options").html("");
	d3.select("#visualization").html("");
	let textw = 100;
	let graphw = 500;
	let w = textw + graphw;
	let h = 600;
	let padding = 5;
	let players = [];
	let svg = d3.select("#visualization")
		.append("svg")
		.attr("id", "players")
		.attr("width", w)
		.attr("height", h);
	let g_text = svg
		.append("g");
	let g_graph = svg
		.append("g")
		.attr("transform", `translate(${textw}, 0)`);
	svg.append("g")
		.attr("id", "xAxis")
		.attr("transform", `translate(${textw}, -1)`);

	let renderer = function () {
		let player = d3.select("#options-player").property("value");
		let metric = d3.select("#options-metric").property("value");
		let order = d3.select("#options-order").property("value");

		let playerArray = [];
		d3.json(`/averages?metric=${metric}`)
		.then(function (json) {
			let playerArray = json;

			//yScale Domain Ordering
			let orders = {
				Alphabetical: function(a,b){return a.name.localeCompare(b.name) },
				Ascending: function(a, b){return a.avg - b.avg},
				Descending: function(a, b){return b.avg - a.avg}
			};

			//convert object to needed order
			playerArray.sort(orders[order]);
			let sorted_players = playerArray.map(a => a.name);

			//needed for xScale domain
			let dataMax = Math.max(...playerArray.map(x => x.avg));
			// let dataMin = Math.min(...playerArray.map(x => x.avg));
			let dataMin = 0;

			let xScale = d3.scaleLinear()
				.domain([dataMin, dataMax])
				.range([0, graphw - 2 * padding]);

			let yScale = d3.scaleBand()
				.domain(sorted_players)
				.rangeRound([0, h])
				.paddingInner(0.1)
				.paddingOuter(0.1)
				.align(0.75);

			let handleMouseOver = function(d) {
				g_graph.append("text")
					.attr("id", "tooltip")
					.attr("x", xScale(d.avg) - padding)
					.attr("y", yScale(d.name) + yScale.bandwidth() / 2)
					.style("font-size", yScale.bandwidth())
					.text(d.avg.toFixed(3));
			}
			let handleMouseOut = function(d) {
				d3.select("#tooltip").remove();
			}
			g_graph.selectAll(".bar")
				.data(playerArray)
				.enter()
				.append("rect")
				.attr("class", "bar")
			g_graph.selectAll(".bar")
				.on("mouseover", handleMouseOver)
				.on("mouseout", handleMouseOut)
				.data(playerArray)
				.transition()
				.attr("x", 0)
				.attr("y", function (d) {
					return yScale(d.name);
				})
				.attr("width", function (d) {
					return xScale(d.avg);
				})
				.attr("height", yScale.bandwidth())
				.attr("fill", function (d) {
					if(d.name === player){
						return "hsl(360, 80%, 50%)"
					}
					return "hsl(120, 30%, 50%)"
				});
			g_text.selectAll(".label")
				.data(playerArray)
				.enter()
				.append("text")
				.attr("class", "label")
				.style("font-size", yScale.bandwidth());
			g_text.selectAll(".label")
				.data(playerArray)
				.transition()
				.attr("x", textw - padding)
				.attr("y", function (d) {
					return yScale(d.name) + yScale.bandwidth() / 2;
				})
				.text(function (d) {
					return `${d.name}`;
				});
			svg.select("#xAxis")
				.call(d3.axisBottom(xScale));

			let zoomUpdater = function() {
				yScale.rangeRound([0, h].map(d => d3.event.transform.applyY(d)));
				g_graph.selectAll(".bar")
					.attr("y", function (d) {
						return yScale(d.name);
					})
					.attr("height", function(d) {
						return yScale.bandwidth();
					});
				g_text.selectAll(".label")
					.attr("y", function (d) {
						return yScale(d.name) + yScale.bandwidth() / 2;
					})
					.style("font-size", yScale.bandwidth());
			}

			let zoom = d3.zoom()
				.scaleExtent([1, 5])
				.translateExtent([[0, 0], [w, h]])
				.extent([[0, 0], [w, h]])
				.on("zoom", zoomUpdater);
			svg.call(zoom);
			svg.call(zoom.transform, d3.zoomIdentity);
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

		options.append("br");
		options.append("label")
			.text("Order: ")
			.attr("for", "options-order");
		options.append("br");
		let orderdropdown = options.append("select")
			.attr("id", "options-order")
			.on("change", renderer);
		let orders = [
			{label: "Alphabetical"},
			{label: "Ascending"},
				{label: "Descending"}
			];
		orderdropdown.selectAll("option")
			.data(orders)
			.enter()
			.append("option")
			.attr("value", function (d){
				return d.label;
			})
			.text(function (d) {
				return d.label;
			});
		orderdropdown.property("label", "Alphabetical");

	})
	.then(renderer);
});