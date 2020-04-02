const readlineSync = require("readline-sync");
const MongoClient = require("mongodb").MongoClient;

// Timeout of 30 minutes. This is to account for the large amount of time needed to correct winners
MongoClient.connect("mongodb://127.0.0.1:27017/", {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	socketTimeoutMS: 1800000
})
.then(async client => {
	console.log("Connected");
	let db = client.db("smashdb");

	console.log("Correcting winners...")
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
	]
	let sets = await db.collection("sets").find().toArray();
	for (let set of sets) {
		let setWinner = set.games[set.games.length-1].winner;
		if (setWinner === null) {
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
			console.log("Upset!");
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
	}
	client.close();
});