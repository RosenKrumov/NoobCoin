'use strict';
var express = require("express");
var bodyParser = require('body-parser');
var http = require('http');
var express = require('express');
var path = require('path');

var node_hostname = "localhost"
var http_port = "8001"

var initHttpServer = () => {
	var app = express();
	app.set('view engine', 'pug');
	app.use(bodyParser.json());
	
	app.get('/', function(req, res){
		var options = {
		  host: 'localhost',
		  port: 3001,
		  path: '/blocks'
		};

		http.get(options, function(response) {
		  console.log("Got response: " + response.statusCode);

		  response.on("data", function(chunk) {
		  	var dataStr = ("" + chunk);
		  	var dataJSON = JSON.parse(dataStr);
			res.render('index', {title: 'Hey', message: 'Noob Explorer', data: dataJSON});
		  });
		}).on('error', function(e) {
		  console.log("Got error: " + e.message);
		});
	});
	
	app.get('/blocks/:id', function(req, res){
		var options = {
		  host: 'localhost',
		  port: 3001,
		  path: '/blocks'
		};
		var index = req.params.id;

		http.get(options, function(response) {
		  console.log("Got response: " + response.statusCode);

		  response.on("data", function(chunk) {
		  	var dataStr = ("" + chunk);
		  	var dataJSON = JSON.parse(dataStr);
			res.render('block', {title: 'Hey', message: 'Noob Explorer', block: dataJSON[index]});
		  });
		}).on('error', function(e) {
		  console.log("Got error: " + e.message);
		});
	});
	
	app.get('/transactions/:hash', function(req, res){
		var hash = req.params.hash;
		var options = {
		  host: 'localhost',
		  port: 3001,
		  path: '/transaction/' + hash
		};

		http.get(options, function(response) {
		  console.log("Got response: " + response.statusCode);

		  response.on("data", function(chunk) {
		  	var dataStr = ("" + chunk);
		  	var dataJSON = JSON.parse(dataStr);
			res.render('transaction', {title: 'Hey', message: 'Noob Explorer', transaction: dataJSON});
		  });
		}).on('error', function(e) {
		  console.log("Got error: " + e.message);
		});
	});
	
	app.get('/blocks/:id/transactions', function(req, res){
		var id = req.params.id;
		var options = {
		  host: 'localhost',
		  port: 3001,
		  path: '/blocks'
		};

		http.get(options, function(response) {
		  console.log("Got response: " + response.statusCode);

		  response.on("data", function(chunk) {
		  	var dataStr = ("" + chunk);
		  	var dataJSON = JSON.parse(dataStr);
			res.render('block-transactions', {title: 'Hey', message: 'Noob Explorer', block: dataJSON[id]});
		  });
		}).on('error', function(e) {
		  console.log("Got error: " + e.message);
		});

	});
	
	app.listen(http_port, () => console.log('Listening http on port ' + http_port));
}

function getLatestBlocks() {

	
	console.log('DATA: ' + data);

	return data;
}

initHttpServer();

