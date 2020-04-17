const path = require("path");
const express = require("express");
const { characters, default: SlippiGame} = require("slp-parser-js");
const MongoClient = require("mongodb").MongoClient;

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

app.use(express.static(path.join(__dirname, "client")));
app.listen(port);
console.log(`Server now running on port ${port}`);