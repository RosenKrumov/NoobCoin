'use strict';
var CryptoJS = require("crypto-js");
var express = require("express");
var bodyParser = require('body-parser');

var http_port = process.env.HTTP_PORT || 3001;
var node_name = process.env.NODE_NAME || "Some Node";
var URL = "http://localhost:" + http_port;
var DIFFICULTY = 4;
var FAUCET_ADDRESS = '0x756F45E3FA69347A9A973A725E3C98bC4db0b5a0'; //TODO
var FAUCET_PUBKEY = '0x756F45E3FA69347A9A973A725E3C98bC4db0b5a0'; //TODO
var FAUCET_SIGNATURE = ['0x756F45E3FA69347A9A973A725E3C98bC4db0b5a0', '0x756F45E3FA69347A9A973A725E3C98bC4db0b5a0']; //TODO
var INITIAL_COINS_DISTRIBUTION = 100000000;

var node = {};
var allTransactions = [];

class Transaction {
	constructor(fromAddress, toAddress, value, senderPublicKey, senderSignature, transactionHash, dateReceived, minedInBlockIndex, paid) {
		this.fromAddress = fromAddress;
		this.toAddress = toAddress;
		this.value = value;
		this.senderPublicKey = senderPublicKey;
		this.senderSignature = senderSignature;
		this.transactionHash = transactionHash;
		this.dateReceived = dateReceived;
		this.minedInBlockIndex = minedInBlockIndex;
		this.paid = paid;	
	}
}

class Block {
	constructor(index, transactions, difficulty, previousBlockHash, minedBy, blockDataHash, nonce, dateCreated, blockHash) {
		this.index = index;
		this.transactions = transactions;
		this.difficulty = difficulty;
		this.previousBlockHash = previousBlockHash;
		this.minedBy = minedBy;
		this.blockDataHash = blockDataHash;
		this.nonce = nonce;
		this.dateCreated = dateCreated;
		this.blockHash = blockHash;
	}
}

class Node {
	constructor(name, url, genesisBlock) {
		this.name = name;
		this.url = url;
		
		this.peers = {
			"count": 0,
			"peers": []
		};
	
		this.blocks = {
			"count": 1,
			"blocks": [genesisBlock]
		};
		
		this.pendingTransactions = {
			"count": 0,
			"transactions": []
		};
		
		this.balances = {};
		
		this.miningJobs = {};
	}

}

var startNode = () => {
	var genesisTransactionHash = CryptoJS.SHA256(0 + parseInt(FAUCET_ADDRESS, 16) + INITIAL_COINS_DISTRIBUTION + 
									parseInt(FAUCET_PUBKEY, 16) + parseInt(FAUCET_SIGNATURE[0], 16) + parseInt(FAUCET_SIGNATURE[1], 16)).toString();
	
	var genesisTransactionHashDate = new Date().getTime() / 1000;
	var genesisTransaction = new Transaction(0, FAUCET_ADDRESS, INITIAL_COINS_DISTRIBUTION, FAUCET_PUBKEY, FAUCET_SIGNATURE,
								 genesisTransactionHash, genesisTransactionHashDate, 0, true);
	allTransactions.push(genesisTransaction);

	var genesisBlockIndex = 0;
	var genesisBlockTransactions = [genesisTransaction];
	var genesisBlockTransactionHashes = genesisTransaction.transactionHash;
	var genesisBlockPrevHash = 0;
	var genesisBlockMinedBy = 0;
	var genesisBlockNonce = 0;
	var genesisBlockDateCreated = new Date().getTime() / 1000;
	
	var genesisBlockDataHash = CryptoJS.SHA256(genesisBlockIndex + genesisBlockTransactionHashes + DIFFICULTY + 
							genesisBlockPrevHash + genesisBlockMinedBy).toString();
							
	var genesisBlockHash = CryptoJS.SHA256(genesisBlockIndex + genesisBlockTransactionHashes + DIFFICULTY + 
							genesisBlockPrevHash + genesisBlockMinedBy + genesisBlockNonce + genesisBlockDateCreated).toString();
	
	var genesisBlock = new Block(genesisBlockIndex, genesisBlockTransactions, DIFFICULTY, genesisBlockPrevHash, genesisBlockMinedBy, 
							genesisBlockDataHash, genesisBlockNonce, genesisBlockDateCreated, genesisBlockHash);
	
	node = new Node(node_name, URL, genesisBlock);
}

var initHttpServer = () => {
	var app = express();
	app.use(bodyParser.json());
	
	app.get('/info', (req, res) => res.send(JSON.stringify(node)));
	app.get('/blocks', (req, res) => res.send(JSON.stringify(node.blocks)));
	app.get('/blocks/:id', (req, res) => {
		var id = req.params.id;
		if(node.blocks['blocks'].some(b => b.index == id))
		{
			res.send(JSON.stringify(node.blocks['blocks'].find(b => b.index == id)));
		}
		else
		{
			res.status(404)
		    	.send('Not found');
		}
	});
	
	app.get('/balance/:address/confirmations/:confirmations', (req, res) => {
		var address = req.params.address;
		var confirmations = req.params.number;
	});
	
	app.post('/transactions/new', (req, res) => {
		
	});
	
	app.get('/transactions/:hash/info', (req,res) => {
		var hash = req.params.hash;
		if(allTransactions.some(t => t.hash = hash))
		{
			res.send(JSON.stringify(allTransactions.find(t => t.hash = hash)));
		}
		else
		{
			res.status(404)
				.send('Not found');
		}
	});
	
	app.post('/blocks/notify', (req, res) => {
	
	});
	
	app.get('/peers', (req, res) => res.send(JSON.stringify(node.peers)));
	app.post('/peers', (req, res) => {
	
	});
	
	app.listen(http_port, () => console.log('Listening http on port: ' + http_port));
}

startNode();
initHttpServer();
