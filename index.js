const path = require("path");
const express = require("express");
const fetch = require("node-fetch");
const { characters, default: SlippiGame} = require("slp-parser-js");
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

const app = express();

let port = process.env.PORT || 3000;

app.get("/allchars", function(req, res) {
	console.log("GET: /allchars");
	let allchars = characters.getAllCharacters();
	allchars.sort((a, b) => a.name.localeCompare(b.name));
	res.json(allchars);
});

app.get("/allplayers", function(req, res) {
	console.log("GET: /allplayers");
	MongoClient.connect("mongodb://127.0.0.1:27017/", {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(client => {
		let db = client.db("smashdb");
		return db.collection("sets").aggregate(
			[
				{
					$group: {
						"_id": null,
						"player1": {
							$addToSet: "$player1"
						},
						"player2": {
							$addToSet: "$player2"
						},
					}
				},
				{
					$project: {
						"players": {
							$setUnion: ["$player1", "$player2"]
						}
					}
				}
			]
		);
	})
	.then(result => {
		return result.toArray();
	})
	.then(result => {
		result = result[0].players;
		result.sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
		return result;
	})
	.then(result => {
		res.send(result);
	})
	.catch(err => {
		console.error(err);
	});
});

app.get("/matchup", function(req, res) {
	console.log("GET: /matchup with params", req.query);
	MongoClient.connect("mongodb://127.0.0.1:27017/", {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(client => {
		let db = client.db("smashdb");
		return db.collection("sets").aggregate(
			[
				{
					$unwind: "$games"
				},
				{
					$match: {
						$or: [
							{
								"games.player1.character": req.query.character1,
								"games.player2.character": req.query.character2,
							},
							{
								"games.player1.character": req.query.character2,
								"games.player2.character": req.query.character1,
							}
						]
					}
				},
				{
					$project: {
						"winner": {
							$cond: {
								if: {
									$eq: [ "$games.winner", "player1" ]
								},
								then: {
									"tag": "$player1",
									"character": "$games.player1.character"
								},
								else: {
									"tag": "$player2",
									"character": "$games.player2.character"
								}
							}
						},
						"loser": {
							$cond: {
								if: {
									$eq: [ "$games.winner", "player1" ]
								},
								then: {
									"tag": "$player2",
									"character": "$games.player2.character"
								},
								else: {
									"tag": "$player1",
									"character": "$games.player1.character"
								}
							}
						},
						"stage": "$games.stage"
					}
				}
			]
		);
	})
	.then(result => {
		return result.toArray();
	})
	.then(result => {
		res.send(result);
	})
	.catch(err => {
		console.error(err);
	});
});

app.get("/averages", function(req, res) {
	console.log("GET: /averages with params", req.query);
	let metric = req.query.metric;
	MongoClient.connect("mongodb://127.0.0.1:27017/", {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(client => {
		let db = client.db("smashdb");
		return db.collection("sets").find();
	})
	.then(result => {
		return result.toArray();
	})
	.then(query => {
		let totals = {};
		let counts = {};
		for (let set of query) {
			for (let game of set.games) {
				if (game.player1[metric] !== null) {
					totals[set.player1] = game.player1[metric] + (totals[set.player1] || 0);
					counts[set.player1] = 1 + (counts[set.player1] || 0);
				}
				if (game.player2[metric] !== null) {
					totals[set.player2] = game.player2[metric] + (totals[set.player2] || 0);
					counts[set.player2] = 1 + (counts[set.player2] || 0);
				}
			}
		}
		let result = [];
		for (let key in totals) {
			if (totals.hasOwnProperty(key)) {
				result.push({
					name: key,
					avg: totals[key] / counts[key]
				});
			}
		}
		result.sort((a,b) => b.avg - a.avg);
		return result;
	})
	.then(result => {
		res.send(result);
	})
	.catch(err => {
		console.error(err);
	});
});

app.get("/playerdata", function(req, res) {
	console.log("GET: /playerdata with params", req.query);
	let player = req.query.player;
	MongoClient.connect("mongodb://127.0.0.1:27017/", {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(client => {
		let db = client.db("smashdb");
		return db.collection("sets").aggregate(
			[
				{
					$match: {
						$or: [
							{ player1: player },
							{ player2: player }
						]
					}
				},
				{
					$project: {
						"games": {
							$map: {
								"input": "$games",
								"in": {	
									"game": {
										$cond: {
											if: { $eq: ["$player1", player] },
											then: "$$this.player1",
											else: "$$this.player2",
										}
									},
									"stage": "$$this.stage",
									"winner": {
										$cond: {
											if: { $eq: ["$player1", player] },
											then: { $eq: ["$$this.winner", "player1"] },
											else: { $eq: ["$$this.winner", "player2"] },
										}
									}
								}
							}
						}
					}
				},
				{
					$unwind: "$games"
				},
				{
					$project: {
						"inputsPerSecond": "$games.game.inputsPerSecond",
						"openingsPerKill": "$games.game.openingsPerKill",
						"damagePerOpening": "$games.game.damagePerOpening",
						"neutralWinRatio": "$games.game.neutralWinRatio",
						"counterHitRatio": "$games.game.counterHitRatio",
						"tag": "$games.game.tag",
						"character": {
							"character": "$games.game.character",
							"color": "$games.game.color",
						},
						"stage": "$games.stage",
						"winner": "$games.winner"
					}
				}
			]
		);
	})
	.then(result => {
		return result.toArray();
	})
	.then(result => {
		res.send(result);
	})
	.catch(err => {
		console.error(err);
	});
});

app.get("/gamedata", function(req, res) {
	console.log("GET: /gamedata with params", req.query);
	let id = req.query.id;
	let player1 = req.query.player1;
	let player2 = req.query.player2;
	let player = req.query.player;
	MongoClient.connect("mongodb://127.0.0.1:27017/", {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(client => {
		let db = client.db("smashdb");
		if (id) {
			return db.collection("sets").find({ _id: new mongodb.ObjectId(id) });
		}
		if (player1 && player2) {
			return db.collection("sets").aggregate([
				{
					$match: {
						$or: [
							{
								"player1": player1,
								"player2": player2,
							},
							{
								"player1": player2,
								"player2": player1,
							},
						]
					}
				},
				{
					$project: {
						"_id": 1,
						"round": 1,
						"tournament": 1,
						"player1": {
							$cond: {
								if: { $eq: ["$player1", player1]},
								then: "$player1",
								else: "$player2"
							}
						},
						"player2": {
							$cond: {
								if: { $eq: ["$player1", player1]},
								then: "$player2",
								else: "$player1"
							}
						},
						"games": {
							$map: {
								"input": "$games",
								"in": {	
									"player1": {
										$cond: {
											if: { $eq: ["$player1", player1] },
											then: "$$this.player1",
											else: "$$this.player2",
										}
									},
									"player2": {
										$cond: {
											if: { $eq: ["$player1", player1] },
											then: "$$this.player2",
											else: "$$this.player1",
										}
									},
									"winner": {
										$cond: {
											if: { $eq: ["$player1", player1] },
											then: "$$this.winner",
											else: {
												$cond: {
													if: { $eq: ["$$this.winner", "player1"] },
													then: "player2",
													else: "player1",
												}
											},
										}
									},
									"gamenum": "$$this.gamenum",
									"stage": "$$this.stage",
									"filepath": "$$this.filepath",
								}
							}
						}
					}
				}
			]);
		}
		if (player1 || player2 || player) {
			player = player1 || player2 || player;
			return db.collection("sets").find({
				$or: [
					{ "player1": player },
					{ "player2": player }
				]
			});
		}
		return db.collection("sets").find();
	})
	.then(result => {
		return result.toArray();
	})
	.then(result => {
		res.send(result);
	})
	.catch(err => {
		console.error(err);
	});
});

app.get("/head2head", function(req, res) {
	console.log("GET: /head2head");
	MongoClient.connect("mongodb://127.0.0.1:27017/", {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(client => {
		let db = client.db("smashdb");
		return db.collection("sets").find();
	})
	.then(result => {
		return result.toArray();
	})
	.then(async (sets) => {
		let ranks = [
			"Price",
			"Migz",
			"wub",
			"handog",
			"Shee",
			"slacks",
			"b.water",
			"Grim",
			"Miami",
			"Gambit",
			"Fruity",
			"Will",
			"Mike",
			"ToffeeMamba",
			"Primer",
			"Silky",
			"elicik",
			"CamBailey",
			"McGinness",
			"Jester",
			"Mig",
			"Arcade",
			"Supermanchunky",
			"Crow",
			"Silver"
		];
		let allplayers = await fetch(`http://localhost:${port}/allplayers`);
		allplayers = await allplayers.json();
		allplayers.sort((a,b) => {
			indexA = ranks.indexOf(a);
			indexB = ranks.indexOf(b);
			if (indexA === -1 && indexB === -1) {
				return a.toLowerCase().localeCompare(b.toLowerCase());
			}
			else {
				return indexB - indexA;
			}
		});
		let matchups = [];
		for (let player1 of allplayers) {
			let row = [];
			for (let player2 of allplayers) {
				row.push([0,0]);
			}
			matchups.push(row);
		}
		for (let set of sets) {
			player1 = allplayers.indexOf(set.player1);
			player2 = allplayers.indexOf(set.player2);
			winner = set.games[set.games.length-1].winner;
			if (winner === "player1") {
				matchups[player1][player2][0] += 1;
				matchups[player2][player1][1] += 1;
			}
			else {				
				matchups[player1][player2][1] += 1;
				matchups[player2][player1][0] += 1;
			}
		}
		return { matchups, labels: allplayers };
	})
	.then(result => {
		res.send(result);
	})
	.catch(err => {
		console.error(err);
	});
});

app.use(express.static(path.join(__dirname, "client")));
app.listen(port);
console.log(`Server now running on port ${port}`);