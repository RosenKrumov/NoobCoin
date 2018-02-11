'use strict';
var CryptoJS = require("crypto-js");
var express = require("express");
var bodyParser = require('body-parser');

var http_port = process.env.HTTP_PORT || 4001;
var node_hostname = process.env.NODE_HOSTNAME || "localhost";
var node_port = process.env.NODE_PORT || "3001";
var miner_address = process.env.MINER_ADDR || "0";
var URL = "http://localhost:" + http_port;
var DIFFICULTY = 4;

var communicateWithNode = () => {
	console.log("Requesting job from node...\n");

	http.get({
		hostname: node_hostname,
		port: node_port,
		path: '/mining/get-block/' + miner_address,
		agent: false
	}, (res) => {
		console.log("Got a job from node... \n");
		var data = res.body.data;
		var miningResponse = mineBlock(data);
		console.log("New block mined... Sending back to node.\n");
		
		const postData = queryString.stringify(miningResponse);
		const options = {
			hostname: node_hostname,
			port: node_port,
			path: '/mining/submit-block/' + miner_address,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(postData)
			}
		};
		
		const req = http.request(options, (res) => {
			console.log(res);
		}
		
		req.write(postData);
		req.end();
	});
}

var mineBlock = (blockData) => {
	var newBlockIndex = blockData.index + 1;
	var nonce = 0;
	var nextTimeStamp = new Date().getTime() / 1000;
	var blockDataHash = blockData.blockDataHash;

	var blockHash = CryptoJS.SHA256("" + blockDataHash + nonce).toString();
	
	while(blockHash.substring(0, DIFFICULTY) !== Array(difficulty + 1).join("0"))
	{
		nonce++;
		nextTimeStamp = new Date().getTime() / 1000;
		blockHash = CryptoJS.SHA256("" + blockDataHash + nonce).toString();
	}
	
	console.log("Found a block with nonce: " + nonce + "\n");
	
	return 
	{
		"nonce": nonce, 
		"dateCreated": nextTimeStamp, 
		"blockHash": blockHash
	};
}

while(1)
{
	communicateWithNode();
}

