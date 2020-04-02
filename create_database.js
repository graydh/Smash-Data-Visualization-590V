const MongoClient = require("mongodb").MongoClient;
const { characters, stages, default: SlippiGame} = require("slp-parser-js");
const fs = require("fs");
const path = require("path");

MongoClient.connect("mongodb://127.0.0.1:27017/", {
   useNewUrlParser: true,
   useUnifiedTopology: true
})
.then(async client => {
	console.log("Connected");
	let db = client.db("smashdb");
	await db.createCollection("sets", {
		validator: {
			$jsonSchema: {
				bsonType: "object",
				required: ["tournament", "round", "player1", "player2", "games"],
				properties: {
					tournament: {
						bsonType: "string",
					},
					round: {
						bsonType: "string",
					},
					player1: {
						bsonType: "string",
						description: "Tag of player1 (on smash.gg)"
					},
					player2: {
						bsonType: "string",
						description: "Tag of player2 (on smash.gg)"
					},
					games: {
						bsonType: "array",
						items: {
							bsonType: "object",
							required: ["gamenum", "player1", "player2", "stage", "winner", "filepath"],
							properties: {
								gamenum: {
									bsonType: "int",
									minimum: 1,
									maximum: 5,
								},
								player1: {
									bsonType: "object",
									description: "Data for the SET winner, not game winner",
									required: [
										"character",
										"color",
										"inputsPerSecond",
										"openingsPerKill",
										"damagePerOpening",
										"neutralWinRatio",
										"counterHitRatio",
										"tag"
									],
									properties: {
										character: {
											bsonType: "string",
										},
										color: {
											bsonType: "string",
										},
										inputsPerSecond: {
											bsonType: ["number", "null"],
										},
										openingsPerKill: {
											bsonType: ["number", "null"],
										},
										damagePerOpening: {
											bsonType: ["number", "null"],
										},
										neutralWinRatio: {
											bsonType: ["number", "null"],
										},
										counterHitRatio: {
											bsonType: ["number", "null"],
										},
										tag: {
											bsonType: "string",
										},
									},
								},
								player2: {
									bsonType: "object",
									description: "Data for the SET lower, not game loser",
									required: [
										"character",
										"color",
										"inputsPerSecond",
										"openingsPerKill",
										"damagePerOpening",
										"neutralWinRatio",
										"counterHitRatio",
										"tag"
									],
									properties: {
										character: {
											bsonType: "string",
										},
										color: {
											bsonType: "string",
										},
										inputsPerSecond: {
											bsonType: ["number", "null"],
										},
										openingsPerKill: {
											bsonType: ["number", "null"],
										},
										damagePerOpening: {
											bsonType: ["number", "null"],
										},
										neutralWinRatio: {
											bsonType: ["number", "null"],
										},
										counterHitRatio: {
											bsonType: ["number", "null"],
										},
										tag: {
											bsonType: "string",
										},
									},
								},
								stage: {
									bsonType: "string",
								},
								winner: {
									bsonType: ["string", "null"],
									description: "Must be 'player1' or 'player2'",
								},
								filepath: {
									bsonType: "string",
								},
							},
						},
					},
				},
			},
		},
	})
	await db.collection("sets").createIndex({ tournament: 1, round: 1, player1: 1, player2: 1 }, { unique: true });
	console.log("Importing sets...");
	let promises = [];
	for (let tournament of fs.readdirSync("replays")) {
		for (let replay of fs.readdirSync(path.join("replays", tournament))) {
			let re = /(.{2,3})_(\w+)(?:\(\w+\))?_(\w+)(?:\(\w+\))?_Game(\d).slp/;
			let match = replay.match(re);
			let set = {
				tournament: tournament,
				round: match[1],
				player1: match[2],
				player2: match[3],
				games: [],
			};
			// Add all sets, ignoring duplicates
			promises.push(db.collection("sets").insertOne(set).catch(err => {
				if (err.code !== 11000) {
					console.error(err);
				}
			}));
		}
	}
	await Promise.all(promises);
	console.log("Imported all sets");
	console.log("Importing games...");
	promises = [];
	for (let tournament of fs.readdirSync("replays")) {
		for (let replay of fs.readdirSync(path.join("replays", tournament))) {
			let filepath = path.join("replays", tournament, replay);
			// console.log(`Importing ${filepath}`);
			let re = /(.{2,3})_(\w+)(?:\(\w+\))?_(\w+)(?:\(\w+\))?_Game(\d).slp/;
			let match = replay.match(re);
			let game = new SlippiGame(filepath);
			player1 = game.getSettings().players[0];
			player1index = player1.playerIndex;
			player2 = game.getSettings().players[1];
			player2index = player2.playerIndex;
			game.getStats();
			let winner = null;
			let framesPlayers = game.getLatestFrame().players;
			if (framesPlayers.find(x => x && x.post.playerIndex === player1index).post.stocksRemaining === 0) {
				winner = "player2";
			}
			if (framesPlayers.find(x => x && x.post.playerIndex === player2index).post.stocksRemaining === 0) {
				winner = "player1";
			}
			let player1stats = game.getStats().overall.find(x => x && x.playerIndex === player1index);
			let player2stats = game.getStats().overall.find(x => x && x.playerIndex === player2index);
			let gamedata = {
				gamenum: parseInt(match[4]),
				player1: {
					character: characters.getCharacterShortName(player1.characterId),
					color: characters.getCharacterColorName(player1.characterId, player1.characterColor),
					inputsPerSecond: player1stats.inputsPerMinute.ratio / 60,
					openingsPerKill: player1stats.openingsPerKill.ratio,
					damagePerOpening: player1stats.damagePerOpening.ratio,
					neutralWinRatio: player1stats.neutralWinRatio.ratio,
					counterHitRatio: player1stats.counterHitRatio.ratio,
					tag: player1.nametag,
				},
				player2: {
					character: characters.getCharacterShortName(player2.characterId),
					color: characters.getCharacterColorName(player2.characterId, player2.characterColor),
					inputsPerSecond: player2stats.inputsPerMinute.ratio / 60,
					openingsPerKill: player2stats.openingsPerKill.ratio,
					damagePerOpening: player2stats.damagePerOpening.ratio,
					neutralWinRatio: player2stats.neutralWinRatio.ratio,
					counterHitRatio: player2stats.counterHitRatio.ratio,
					tag: player2.nametag,
				},
				stage: stages.getStageName(game.getSettings().stageId),
				winner: winner,
				filepath: filepath,
			};
			promises.push(db.collection("sets").updateOne(
				{ tournament: tournament, round: match[1], player1: match[2], player2: match[3]},
				{ $push: { games: gamedata } }
			));
		}
	};
	await Promise.all(promises);
	console.log("Imported all games");
	// Detect for two game sets - winner of one game is the winner of the other
	console.log("Inferring some non-finished games...");
	let sets = await db.collection("sets").find({
		"games": {
			$size: 2
		},
		$or: [
			{ "games.0.winner": { $type: 10 } },
			{ "games.1.winner": { $type: 10 } }
		]
	}).toArray();
	promises = [];
	for (let set of sets) {
		let game1winner = set.games[0].winner;
		let game2winner = set.games[1].winner;
		let setWinner = game1winner === null ? game2winner : game1winner;
		promises.push(db.collection("sets").updateOne(
			{ _id: set._id },
			{
				$set: {
					"games.0.winner": setWinner,
					"games.1.winner": setWinner,
				}
			}
		));
	}
	await Promise.all(promises);
	sets = await db.collection("sets").find({ "games.winner": null }).toArray();
	for (let set of sets) {
		console.warn(`Requires manual intervention: ${set.tournament}/${set.round}_${set.player1}_${set.player2}`);
	}
	// Rename players who have changed tags
	console.log("Renaming players...");
	let names = [
		["Huang", "Supermanchunky"],
		["SenpaiSully", "Sully"],
		["CrazyKing508", "CrazyKing"],
		["Mibz", "Migz"],
		["Amnesiac", "Will"],
		["Aguitas", "b.water"],
		["Mysticus", "Gambit"],
	];
	for (let name of names) {
		await db.collection("sets").updateMany(
			{ "player1": name[0] },
			{ $set: { "player1": name[1] } }
		);
		await db.collection("sets").updateMany(
			{ "player2": name[0] },
			{ $set: { "player2": name[1] } }
		);
	}
	console.log("Done");
	console.log("Don't forget to correct winners and set fix null sets!");
	client.close();
})
.catch(err => {
	console.error(err);
});
