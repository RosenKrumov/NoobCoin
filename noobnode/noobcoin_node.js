'use strict';
var CryptoJS = require("crypto-js");
var express = require("express");
var bodyParser = require('body-parser');
var WebSocket = require("ws");

var http_port = process.env.HTTP_PORT || 3001;
var p2p_port = process.env.P2P_PORT || 6001;
var node_name = process.env.NODE_NAME || "NoobCoin Node";
var DIFFICULTY = 4;
var FAUCET_ADDRESS = 'b825e4430d85fbca3f7d50cd82d1ab91dce9e287';
var INITIAL_COINS = 100000000;
var MINER_REWARD = 50;

var MessageTypes = {
	LATEST_BLOCK: 0,
	ALL_BLOCKS: 1,
	RESPONSE: 2
};

var sockets = [];

var node = {};


class Transaction {
    constructor(fromAddress, toAddress, amount, dateReceived, senderPublicKey, senderSignature) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.dateReceived = dateReceived;
        this.senderPublicKey = senderPublicKey;
        this.senderSignature = senderSignature;
        this.transactionHash = this.calc_transaction_hash();
    }

    calc_transaction_hash() {
        return CryptoJS.SHA256("" + this.fromAddress + this.toAddress +
                    this.amount + this.senderPublicKey + this.senderSignature +
                    this.dateReceived).toString();
    }
}

class Block {
    constructor(index, transactions, difficulty, previousBlockHash, nonce, dateCreated) {
        this.index = index;
        this.transactions = transactions;
        this.difficulty = difficulty;
        this.previousBlockHash = previousBlockHash;
        this.blockDataHash = this.calculateBlockDataHash();
        this.nonce = nonce;
        this.dateCreated = dateCreated;
        this.blockHash = this.calculateBlockHash();
    }

    calculateBlockDataHash() {
        return CryptoJS.SHA256(
            "" + this.index + this.transactions + this.difficulty + this.previousBlockHash).toString();
    }

    calculateBlockHash() {
        return CryptoJS.SHA256(this.blockDataHash + this.nonce + this.dateCreated).toString();
    }
}

class Node {
    constructor(name, genesisBlock) {
        this.name = name;
        this.peers = [];
        this.blocks = [ genesisBlock ];
        this.pendingTransactions = [];
        this.balances = {};
        this.miningJobs = {};
    }
}

var initP2PServer = () => {
	var server = new WebSocket.Server({port: p2p_port});
	server.on('connection', ws => initConnection(ws));
	console.log('listening websocket p2p port on: ' + p2p_port);
}

var initConnection = (ws) => {
	sockets.push(ws);
	initMessageHandler(ws);
	initErrorHandler(ws);
	write(ws, blockchainLengthMsg());
}

var initMessageHandler = (ws) => {
    ws.on('message', (data) => {
        var message = JSON.parse(data);
        console.log('Received message' + JSON.stringify(message));
        switch (message.type) {
            case MessageTypes.LATEST_BLOCK:
                write(ws, responseLatestMsg());
                break;
            case MessageTypes.ALL_BLOCKS:
                write(ws, responseChainMsg());
                break;
            case MessageTypes.RESPONSE:
                handleResponse(message);
                break;
        }
    });
};

var connectToPeer = (peer) => {
	var ws = new WebSocket(peer);
	ws.on('open', () => initConnection(ws));
	ws.on('error', () => {
		console.log('connection failed');
	});
}

var initErrorHandler = (ws) => {
    var closeConnection = (ws) => {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};

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

    app.get('/mining/get/:address', (req, res) => {
        if (!node.miningJobs[req.params.address]) {
            // TODO: Add miner reward
            var block = new Block(
                node.blocks[node.blocks.length - 1].index + 1,
                node.pendingTransactions,
                DIFFICULTY,
                node.blocks[node.blocks.length - 1].blockHash,
                0,
                0);

            node.miningJobs[req.params.address] = block;
            res.status(200).send(JSON.stringify(block));
        }
        else
        {
            res.status(400).send('miner already has a mining job');
        }
    });

    app.post('/mining/submit/:address', (req, res) => {
        if (!node.miningJobs[req.params.address])
        {
            res.status(400).send('no mining job is assigned');
            return;
        }

        var isBlockAccepted = processBlock(req.body, req.params.address);
        delete node.miningJobs[req.params.address];

        if(isBlockAccepted)
        {
        	broadcast(getLatestBlock());
            res.status(200).send('Block is accepted');
        }
        else
        {
            res.status(400).send('Block is not accepted');
        }
    });

    app.get('/balance/:address', (req, res) => {
        var address = req.params.address;
        var balance = getBalanceOf(address);

        var result = { 'address': address, 'balance': balance };
        res.status(200).send(result);
    });

    app.post('/transactions/new', (req, res) => {
        var newTransaction = createPendingTransaction(req.body);
        if (!newTransaction)
        {
            res.status(400).send('Bad request');
        }
        else
        {
            node.pendingTransactions.push(newTransaction);
            var response = {
                "dateReceived": newTransaction.dateReceived,
                "transactionHash": newTransaction.transactionHash
            };

            res.status(200).send(JSON.stringify(response));
        }
    });

    // TODO: Add transaction history endpoint for address
    app.get('/transactions/:address', (req,res) => {
        var address = req.params.address;
        /*
        if(allTransactions.some(t => t.hash == hash))
        {
            res.send(JSON.stringify(allTransactions.find(t => t.hash == hash)));
        }
        else
        {
            res.status(404)
                .send('Not found');
        }
        */
    });

    app.get('/peers', (req, res) => res.send(JSON.stringify(node.peers)));
    app.post('/peers', (req, res) => {
		var status = addPeer(req.body.data);
        if(status == true)
        {
        	res.status(200)
        		.send('Peer added');
        }
        else
        {
        	res.status(409)
        		.send('Peer is existing');
        }
    });

    app.listen(http_port, () => console.log('Listening http on port: ' + http_port));
}

var getBalanceOf = (address) => {
    var balance = 0;
    node.blocks.forEach(function(b) {
        b.transactions.forEach(function(t) {
            if (t.fromAddress == address) {
                balance -= t.amount;
            }

            if (t.toAddress == address) {
                balance += t.amount;
            }
        });
    });

    return balance;
}

var processBlock = (minerData, minerAddress) => {
	var lastBlock = getLatestBlock();
    var block = node.miningJobs[minerAddress];

    block.nonce = minerData.nonce;
    block.dateCreated = minerData.dateCreated;
    block.blockHash = minerData.blockHash;

    var blockHash = CryptoJS.SHA256("" + block.blockDataHash + block.nonce + block.dateCreated).toString();
    
    // TODO: validation of block - DONE
    //if(blockHash.substring(0, DIFFICULTY) == Array(DIFFICULTY + 1).join("0") && 
    //	lastBlock.index + 1 == block.index &&
    //	lastBlock.blockHash == block.previousBlockHash)
    if (true)
    {
        node.blocks.push(block);
        node.pendingTransactions =
            node.pendingTransactions.filter(function(t) {
                return block.transactions.filter(function(bt) {
                    return bt.transactionHash == t.transactionHash;
                }).length == 0;
            });

        return true;
    }
    else
    {
        return false;
    }
}

var createPendingTransaction = (transactionData) => {
    var hasMoneyForTransaction =
        addressHasEnoughMoney(transactionData.fromAddress, transactionData.amount);
    var keysAreValid = validateKeys(transactionData.pkey, transactionData.signature);
    var addressesAreValid = validateAddresses(transactionData.fromAddress, transactionData.toAddress);

    if(hasMoneyForTransaction && keysAreValid && addressesAreValid)
    {
        return new Transaction(
            transactionData.fromAddress, transactionData.toAddress, transactionData.amount,
            transactionData.date, transactionData.pkey, transactionData.signature);
    }
    else
    {
        return false;
    }
}

var addressHasEnoughMoney = (address, amount) => {
    var balance = getBalanceOf(address);
    //return (balance >= amount);
    return true;

}

var validateKeys = (pubKey, signature) => {
    //TODO validation of public key and signature
    return true;
}

var validateAddresses = (fromAddress, toAddress) => {
    // TODO: actual validation of address
    return true;
}

var handleResponse = (message) => {
	// TODO: check if block sort is needed
	var receivedBlocks = JSON.parse(message.data);
	var latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
	var ourLatestBlock = getLatestBlock();
	
	if(latestBlockReceived.index > ourLatestBlock.index)
	{
		if(ourLatestBlock.blockHash == latestBlockReceived.previousBlockHash)
		{
			node.blocks.push(latestBlockReceived);
			broadcast(responseLatestMsg());
		}
		else if(receivedBlocks.length == 1)
		{
			broadcast(blockchainMsg());
		}
		else
		{
			replaceBlockchain(receivedBlocks);
		}
	}
}

var replaceBlockchain = (newBlockchain) => {
	if (blockchainIsValid(newBlockchain) && newBlockchain.length > node.blocks.length) {
		node.blocks = newBlockchain;
		broadcast(responseLatestMsg());
	}
}

var blockchainIsValid = (blockchain) => {
	if(JSON.stringify(blockchain[0]) !== JSON.stringify(node.blocks[0]))
	{
		return false;
	}
	
	var tempBlock = blockchain[0];
	for (int i = 1; i < blockchain.length; i++)
	{
		var nextBlock = blockchain[i];
	    var blockHash = CryptoJS.SHA256("" + nextBlock.blockDataHash + nextBlock.nonce + nextBlock.dateCreated).toString();
    
    //if(blockHash.substring(0, DIFFICULTY) == Array(DIFFICULTY + 1).join("0") && 
    //	tempBlock.index + 1 == nextBlock.index &&
    //	tempBlock.blockHash == nextBlock.previousBlockHash)
		if(true) 
		{
			tempBlock = nextBlock;
		} else {
			return false;
		}
	}
	
	return true;
}

var addPeer = (peerData) => {
	var url = peerData.url;
	if(!node.peers.includes(url))
	{
		node.peers.push(url);
		connectToPeer(url);
		return true;
	}
	else
	{
		return false;
	}
}

var startNode = () => {
    var genesisTransaction = new Transaction(
        "0", FAUCET_ADDRESS, INITIAL_COINS, new Date().toUTCString(), "0", "0");

    var genesisBlock =
        new Block(0, [ genesisTransaction ], 0, 0, 0, new Date().toUTCString());

    node = new Node(node_name, genesisBlock);
}

var getLatestBlock = () => node.blocks[node.blocks.length - 1];

var blockchainLengthMsg = () => ({'type': MessageTypes.LATEST_BLOCK});
var blockchainMsg = () => ({'type': MessageTypes.ALL_BLOCKS});
var responseLatestMsg = () => ({
	'type': MessageTypes.RESPONSE,
	'data': JSON.stringify(getLatestBlock())
});

var responseChainMsg() = () => ({
	'type': MessageTypes.RESPONSE,
	'data': JSON.stringify(node.blocks())
});

var write = (ws, message) => {
	ws.send(JSON.stringify(message));
};

var broadcast = (message) => {
	sockets.forEach(s => write(s, message));
};

startNode();
initHttpServer();
initP2PServer();
