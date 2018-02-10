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
	constructor(fromAddress, toAddress, value, senderPublicKey, senderSignature, 
			transactionHash, dateReceived, minedInBlockIndex, paid) {
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
	constructor(index, transactions, difficulty, previousBlockHash, minedBy, reward,
			blockDataHash, nonce, dateCreated, blockHash) {
		this.index = index;
		this.transactions = transactions;
		this.difficulty = difficulty;
		this.previousBlockHash = previousBlockHash;
		this.minedBy = minedBy;
		this.reward = reward;
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
					parseInt(FAUCET_PUBKEY, 16) + parseInt(FAUCET_SIGNATURE[0], 16) + 
					parseInt(FAUCET_SIGNATURE[1], 16)).toString();
	
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
							genesisBlockPrevHash + genesisBlockMinedBy + genesisBlockNonce + 
							genesisBlockDateCreated).toString();
	
	var genesisBlock = new Block(genesisBlockIndex, genesisBlockTransactions, DIFFICULTY, genesisBlockPrevHash, genesisBlockMinedBy, 0,
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
	
	app.get('/mining/get-block/:address', (req, res) => {
		
	});
	
	app.post('/mining/submit-block/:address', (req, res) => {
		var minerAddress = req.params.address; 
		var miningJobIndex = node.miningJobs.map(
			function(j) { 
				return j['address']; 
			}).indexOf(minerAddress);
			
		node.miningJobs.splice(miningJobIndex, 1);
		
		var isBlockAccepted = processBlock(req.body.data);
		
		if(isBlockAccepted)
		{
			var response = {
				"status": "accepted",
				"message": "Block accepted, expected reward: " + 
					node.miningJobs[minerAddress].reward + " coins"
			};
			
			res.status(200)
				.send(JSON.stringify(response));
		}
		else
		{
			res.status(400)
				.send('Block is not accepted');
		}
	});
	
	app.get('/balance/:address/confirmations/:confirmations', (req, res) => {
		var address = req.params.address;
		var confirmations = req.params.number;
		//TODO
	});
	
	app.post('/transactions/new', (req, res) => {
		var newTransaction = addPendingTransaction(req.body.data);
		if(newTransaction == false)
		{
			res.status(400)
				.send('Bad request');
		}
		else
		{
			allTransactions.push(newTransaction);
			node.pendingTransactions.push(newTransaction);
			var response = {
				"dateReceived": newTransaction.dateReceived,
				"transactionHash": newTransaction.transactionHash
			};
			
			res.status(200)
				.send(JSON.stringify(response));
		}
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
		//TODO
	});
	
	app.get('/peers', (req, res) => res.send(JSON.stringify(node.peers))); //TODO 409 code
	app.post('/peers', (req, res) => {
		//TODO
	});
	
	app.listen(http_port, () => console.log('Listening http on port: ' + http_port));
}

var checkIfSenderHasMoneyForTransaction = (address, value) => {
	if(node.balances['address'] >= value) //TODO: CHECK CONCEPT
	{
		return true;
	}
	else
	{
		return false;
	}
}

var validateKeys = (pubKey, signature) => {
	//TODO validation of public key and signature
}

var validateAddresses = (fromAddress, toAddress) => {
	if(node['balances'].hasOwnProperty(fromAddress) &&
		node['balances'].hasOwnProperty(toAddress))
	{
		return true;
	}
	else
	{
		return false;
	}
}

var processBlock = (blockData) => {
	var block = node.miningJobs[minerData.address];
	block.nonce = minerData.nonce;
	block.dateCreated = minerData.dateCreated;
	block.blockHash = minerData.blockHash;
	var blockHashFromNode = CryptoJS.SHA256(parseInt(block.blockDataHash, 16) + nonce).toString();
	if(blockHashFromNode.substring(0, DIFFICULTY) == Array(DIFFICULTY + 1).join("0"))
	{
		node.blocks.push(block);
		
		block.transactions.forEach(t => 
						node.pendingTransactions.splice(node.pendingTransactions.indexOf(t['transactionHash']), 1)); //TODO: CHECK SYNTAX
						
		block.transactions.forEach(function(t){
			node.balances[t['fromAddress']] -= t['value'];
			node.baalnces[t['toAddress']] += t['value'];
		});
		
	}
	else
	{
		return false;
	}	
}

var createPendingTransaction = (transactionData) => {
	var hasMoneyForTransaction = 
		checkIfSenderHasMoneyForTransaction(transactionData.fromAddress, transactionData.value);
	var keysAreValid = validateKeys(transactionData.senderPubKey, transactionData.senderSignature);
	var addressesAreValid = validateAddresses(transactionData.fromAddress, transactionData.toAddress);
	
	if(hasMoneyForTransaction && keysAreValid && addressesAreValid)
	{
		var transactionDate = new Date().getTime() / 1000;
		var transactionHash = CryptoJS.SHA256(parseInt(transactionData.fromAddress, 16),
												parseInt(transactionData.toAddress, 16),
												transactionData.value,
												parseInt(transactionData.senderPubKey, 16),
												parseInt(transactionData.senderSignature[0], 16),
												parseInt(transactionData.senderSignature[0], 16))
												.toString();

		var newTransaction = new Transaction(transactionData.fromAddress,
											 transactionData.toAddress,
											 transactionData.value,
											 transactionData.senderPubKey,
											 transactionData.senderSignature,
											 transactionHash,
											 transactionDate,
											 0,
											 false);
		return newTransaction;
	}
	else
	{
		return false;
	}
}

var synchronizeWithPeer = () => {

}

var addPeer = (peerData) => {
	
}

startNode();
initHttpServer();
