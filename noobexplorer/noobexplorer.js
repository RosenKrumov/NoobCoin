'use strict';
var express = require("express");
var bodyParser = require('body-parser');
var http = require('http');

var node_hostname = "localhost"
var node_port = "3001"

function getLatestBlocks() {
	var options = {
	  host: 'localhost',
	  port: 3001,
	  path: '/blocks'
	};
	
	var data = "";

	http.get(options, function(res) {
	  console.log("Got response: " + res.statusCode);

	  res.on("data", function(chunk) {
	  	data += chunk;
		console.log("BODY: " + chunk);
	  });
	}).on('error', function(e) {
	  console.log("Got error: " + e.message);
	});
	
	var blockDiv = document.createElement('div');
	blockDiv.innerHTML += data;
	
	document.getElementById('blocks').appendChild(blockDiv);
}


