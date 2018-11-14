// This is a template for a Node.js scraper on morph.io (https://morph.io)

var cheerio = require("cheerio");
var request = require("request");
var sqlite3 = require("sqlite3").verbose();
var url = 'https://www.capitecbank.co.za/branch-locator?searchTerm=&_atms=&atms=on&_cashAcceptingAtms=&_branches=&_homeloans=';

function initDatabase(callback) {
	var db = new sqlite3.Database("data.sqlite");
	db.serialize(function() {
		db.run("CREATE TABLE IF NOT EXISTS data (lat float, lng float, title text)");
		callback(db);
	});
}

function updateRow(db, lat, lng, title) {
	var statement = db.prepare("INSERT INTO data VALUES (?, ?, ?)");
	statement.run(lat, lng, title);
	statement.finalize();
}

function readRows(db) {
	db.each("SELECT rowid AS id, lat, lng, title FROM data", function(err, row) {
		console.log(row.id + ": " + row.title + "(" + row.lat + "," + row.lng + ")");
	});
}

function fetchPage(url, callback) {
	// Use request to read in pages.
	request(url, function (error, response, body) {
		if (error) {
			console.log("Error requesting page: " + error);
			return;
		}

		callback(body);
	});
}

function run(db) {
	fetchPage(url, function (body) {
		// Use cheerio to find things in the page with css selectors.
		var $ = cheerio.load(body);

        var elements = $('.branchContactDetail').each(function(index, element) {
            var title = $(element).find('h2').text().trim();
            var lat = $(element).find('input[name="latitude"]').prop('value')
            var lng = $(element).find('input[name="longitude"]').prop('value')
            if (title != '' && lat != '' && lng != '') {
                updateRow(db, lat, lng, title);
            }

        });

		readRows(db);

		db.close();
	});
}

initDatabase(run);
