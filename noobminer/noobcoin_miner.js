'use strict';
var CryptoJS = require("crypto-js");
var express = require("express");
var bodyParser = require('body-parser');
var http = require("http");

var node_hostname = process.env.NODE_HOSTNAME || "localhost";
var node_port = process.env.NODE_PORT || "3001";
var miner_address = process.env.MINER_ADDR || "0";
var DIFFICULTY = 4;

var communicateWithNode = () => {
    console.log("Requesting job from node...\n");

    http.get({
        hostname: node_hostname,
        port: node_port,
        path: '/mining/get/' + miner_address,
        agent: false
    }, (response) => {
        var miningJob = '';
        response.on('data', function(d) {
            miningJob += d;
        });
        response.on('end', () => handleMiningJob(JSON.parse(miningJob)));
    });
}

var handleMiningJob = (miningJob) => {
    console.log("Got a job from node... \n");
    console.log("Block hash to mine: " + miningJob.blockDataHash);

    var miningResponse = mineBlock(miningJob);
    console.log("New block mined... Sending back to node.\n");
    console.log("Block mined: " + JSON.stringify(miningResponse));

    const postData = JSON.stringify(miningResponse);
    const options = {
        hostname: node_hostname,
        port: node_port,
        path: '/mining/submit/' + miner_address,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, null);

    req.write(postData);
    req.end();

    communicateWithNode();
}

var mineBlock = (blockData) => {
    var blockDataHash = blockData.blockDataHash;
    var dateCreated = new Date().toISOString();
    var nonce = 0;

    var blockHash = CryptoJS.SHA256("" + blockDataHash + dateCreated + nonce).toString();

    while(blockHash.substring(0, DIFFICULTY) !== Array(DIFFICULTY + 1).join("0"))
    {
        nonce++;
        dateCreated = new Date().toISOString();
        blockHash = CryptoJS.SHA256("" + blockDataHash + dateCreated + nonce).toString();
    }

    var miningResponse = {
        "nonce": nonce,
        "dateCreated": dateCreated,
        "blockHash": blockHash
    };

    return miningResponse
}

communicateWithNode();
