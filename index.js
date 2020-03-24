const path = require("path");
const express = require("express");
const { default: SlippiGame } = require("slp-parser-js");

const app = express();

let port = process.env.PORT || 3000;

// Request a specific game
// app.get("/replay", function(req, res) {
// 	let filename = req.query.filename;
// 	console.log(`Requested file: ${filename}`);
// 	let game = new SlippiGame(path.join(__dirname, "replays/", filename));
// 	let result = {
// 		"data": {
// 			"settings": game.getSettings(),
// 			"frames": game.getFrames(),
// 			"metadata": game.getMetadata()
// 		}
// 	};
// 	res.send(result);
// });

app.use(express.static(path.join(__dirname, "client")));
app.listen(port);
console.log(`Server now running on port ${port}`);