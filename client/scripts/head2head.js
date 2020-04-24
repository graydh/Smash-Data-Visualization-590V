d3.select("#nav-head2head").on("click", function () {
	let size = 10;
	let w_i = 0;
	let h_i = 0;
	let data = {
		matchups: {},
		labels: [],
	}
	let movement = [["", "↑", ""], ["←", "", "→"], ["", "↓", ""]];
	let renderer = function() {
		let options = d3.select("#options");
		options.html("");
		options.append("table")
			.attr("id", "head2head-movement")
			.append("tbody")
			.selectAll("tr")
			.data(movement)
			.enter()
			.append("tr")
			.selectAll("td")
			.data(function (d, i) {
				return d;
			})
			.enter()
			.append("td")
			.style("height", 20)
			.style("width", 20)
			.on("click", function(d) {
				if (d === "↑" && h_i !== 0) {
					h_i--;
				}
				if (d === "↓" && h_i < data.labels.length - size) {
					h_i++;
				}
				if (d === "←" && w_i !== 0) {
					w_i--;
				}
				if (d === "→" && w_i < data.labels.length - size) {
					w_i++;
				}
				renderer();
			})
			.filter(function (d) {
				if (d === "↑" && h_i !== 0) {
					return true;
				}
				if (d === "↓" && h_i < data.labels.length - size) {
					return true;
				}
				if (d === "←" && w_i !== 0) {
					return true;
				}
				if (d === "→" && w_i < data.labels.length - size) {
					return true;
				}
				return false;
			})
			.text(function (d, i) {
				return d;
			})
			.attr("class", "active");
		d3.select("#visualization").html("");
		let table = d3.select("#visualization")
			.append("table")
			.attr("id", "head2head")
		table.append("thead")
			.append("tr")
			.selectAll("th")
			.data([,].concat(data.labels.slice(w_i, w_i + size)))
			.enter()
			.append("th")
			.text(function (d) {
				return d;
			})
		let rows = table.append("tbody")
			.selectAll("tr")
			.data(data.matchups.slice(h_i, h_i + size))
			.enter()
			.append("tr")
		rows.data(data.labels.slice(h_i, h_i + size))
			.append("th")
			.text(function (d, i) {
				return d;
			});
		let cells = rows.selectAll("td")
			.data(function(d, i) {
				// return data.matchups[i];
				return data.matchups[i+h_i].slice(w_i, w_i + size);
			})
			.enter()
			.append("td")
			.text(function(d) {
				return d[0] + "-" + d[1];
			})
			.style("background-color", function(d) {
				if (d[0] === 0 && d[1] === 0) {
					return "#cccccc";
				}
				else if (d[0] > 0 && d[1] > 0) {
					return "#ffff99";
				}
				else if (d[0] > d[1]) {
					return "#99ff99";
				}
				else {
					return "#ff9999";
				}
			})
	}
	d3.select("#options").html("");
	d3.select("#visualization").html("");
	d3.json("/head2head")
	.then(function(json) {
		data.matchups = json.matchups;
		data.labels = json.labels;
		renderer();
	});
});