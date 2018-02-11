'use strict';
var CryptoJS = require("crypto-js");
var express = require("express");
var bodyParser = require('body-parser');

var http_port = process.env.HTTP_PORT || 3001;
var node_name = process.env.NODE_NAME || "NoobCoin Node";
var DIFFICULTY = 4;
var FAUCET_ADDRESS = '0x756F45E3FA69347A9A973A725E3C98bC4db0b5a0'; //TODO
var FAUCET_PUBKEY = '0x756F45E3FA69347A9A973A725E3C98bC4db0b5a0'; //TODO
var FAUCET_SIGNATURE = ['0x756F45E3FA69347A9A973A725E3C98bC4db0b5a0', '0x756F45E3FA69347A9A973A725E3C98bC4db0b5a0']; //TODO
var INITIAL_COINS_DISTRIBUTION = 100000000;

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

    app.post('/mining/submit-block/:address', (req, res) => {
        if (!node.miningJobs[req.params.address])
        {
            res.status(400).send('no mining job is assigned');
            return;
        }

        var isBlockAccepted = processBlock(req.body, req.params.address);
        delete node.miningJobs[req.params.address];

        if(isBlockAccepted)
        {
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

    app.get('/transactions/:hash', (req,res) => {
        var hash = req.params.hash;
        if(allTransactions.some(t => t.hash == hash))
        {
            res.send(JSON.stringify(allTransactions.find(t => t.hash == hash)));
        }
        else
        {
            res.status(404)
                .send('Not found');
        }
    });

    // TODO: Add transaction history endpoint for address

    // TODO: Do with web sockets similar to naivechain
    app.post('/blocks/notify', (req, res) => {
        //TODO
    });

    app.get('/peers', (req, res) => res.send(JSON.stringify(node.peers))); //TODO 409 code
    app.post('/peers', (req, res) => {
        //TODO
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
    var block = node.miningJobs[minerAddress];

    block.nonce = minerData.nonce;
    block.dateCreated = minerData.dateCreated;
    block.blockHash = minerData.blockHash;

    var blockHash = CryptoJS.SHA256("" + block.blockDataHash + block.nonce + block.dateCreated).toString();
    // TODO: validation of block
    //if(blockHash.substring(0, DIFFICULTY) == Array(DIFFICULTY + 1).join("0"))
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
    var keysAreValid = validateKeys(transactionData.senderPubKey, transactionData.senderSignature);
    var addressesAreValid = validateAddresses(transactionData.fromAddress, transactionData.toAddress);

    if(hasMoneyForTransaction && keysAreValid && addressesAreValid)
    {
        return new Transaction(transactionData.fromAddress,
                               transactionData.toAddress,
                               transactionData.amount,
                               transactionDate.date,
                               transactionData.senderPubKey,
                               transactionData.senderSignature);
    }
    else
    {
        return false;
    }
}

var addressHasEnoughMoney = (address, amount) => {
    // TODO
    return true;
    //return (node.balances['address'] >= amount);
}

var validateKeys = (pubKey, signature) => {
    //TODO validation of public key and signature
    return true;
}

var validateAddresses = (fromAddress, toAddress) => {
    // TODO: actual validation of address
    return true;
}

var synchronizeWithPeer = () => {

}

var addPeer = (peerData) => {

}

var startNode = () => {
    var genesisTransaction = new Transaction(
        "0", FAUCET_ADDRESS, INITIAL_COINS_DISTRIBUTION, new Date().toUTCString(), FAUCET_PUBKEY, FAUCET_SIGNATURE);

    var genesisBlock =
        new Block(0, [ genesisTransaction ], 0, 0, 0, new Date().toUTCString());

    node = new Node(node_name, genesisBlock);
}

startNode();
initHttpServer();
