const readlineSync = require("readline-sync");
const MongoClient = require("mongodb").MongoClient;

MongoClient.connect("mongodb://127.0.0.1:27017/", {
   useNewUrlParser: true,
   useUnifiedTopology: true
})
.then(async client => {
	console.log("Connected");
	let db = client.db("smashdb");

	console.log("Correcting winners...")
	let ranks = [
		"Migz",
		"Shee",
		"slacks",
		"b.water",
		"Grim",
		"Miami",
		"Fruity",
		"Will",
		"Mike",
		"ToffeeMamba",
		"Primer",
		"elicik",
		"Silky",
		"CamBailey",
		"Mig",
		"Arcade",
		"Supermanchunky",
		"Crow",
		"Silver",
	]
	await db.collection("sets").find().forEach(async (set) => {
		let setWinner = set.games[set.games.length-1].winner;
		if (setWinner === "null") {
			console.warn(`Requires manual intervention: ${set.tournament}/${set.round}_${set.player1}_${set.player2}`);
			return;
		}
		let setLoser = setWinner === "player1" ? "player2" : "player1";
		let winner;
		let loser;
		if (ranks.indexOf(set.player1) >= ranks.indexOf(set.player2)) {
			winner = set.player1;
			loser = set.player2;
		}
		else {
			loser = set.player1;
			winner = set.player2;
		}

		console.log(`${set.tournament} (${set.round}): ${winner} beat ${loser}`);
		let answer = readlineSync.question("LEFT (enter) or RIGHT (anything+enter)");
		if (answer !== "") {
			console.log(answer);
			let temp = winner;
			winner = loser;
			loser = temp;
		}
		let newset = {};
		newset[setWinner] = winner;
		newset[setLoser] = loser;
		await db.collection("sets").updateOne(
			{ _id: set._id },
			{ $set: newset }
		);
	});
});