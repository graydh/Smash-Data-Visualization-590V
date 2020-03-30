d3.select("#nav-matchups").on("click", function() {
	let handler = function() {
		// TODO
		console.log("handler");
		console.log(d3.select(this));
	};
	d3.json("/allchars")
	.then(function (json) {
		let options = d3.select("#options");
		options.append("label")
			.text("Winner: ")
			.attr("for", "options-winner");
		let winnerDropdown = options.append("select")
			.attr("id", "options-winner")
			.on("change", handler);
		winnerDropdown.selectAll("option")
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
			.text("Loser: ")
			.attr("for", "options-loser");
		let loserDropdown = options.append("select")
			.attr("id", "options-loser")
			.on("change", handler);
		loserDropdown.selectAll("option")
			.data(json)
			.enter()
			.append("option")
			.attr("value", function (d) {
				return d.shortName;
			})
			.text(function (d) {
				return d.name;
			});
	});
});