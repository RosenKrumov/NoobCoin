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
    constructor(fromAddress, toAddress, value, senderPublicKey, senderSignature) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.value = value;
        this.senderPublicKey = senderPublicKey;
        this.senderSignature = senderSignature;
        this.dateReceived = new Date().toUTCString();
        this.transactionHash = this.calc_transaction_hash();
    }

    calc_transaction_hash() {
        return "" + this.fromAddress + this.toAddress +
                    this.value + this.senderPublicKey + this.senderSignature +
                    this.dateReceived;
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

var startNode = () => {
    var genesisTransaction = new Transaction(
        "0", FAUCET_ADDRESS, INITIAL_COINS_DISTRIBUTION, FAUCET_PUBKEY, FAUCET_SIGNATURE);

    var genesisBlock =
        new Block(0, [ genesisTransaction ], 0, 0, 0, new Date().toUTCString());

    node = new Node(node_name, genesisBlock);
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
            res.status(200).send('Block is accepted');
        }
        else
        {
            res.status(400).send('Block is not accepted');
        }
    });

    app.get('/balance/:address/confirmations/:confirmations', (req, res) => {
        var address = req.params.address;
        //TODO
    });

    app.post('/transactions/new', (req, res) => {
        var newTransaction = addPendingTransaction(req.body.data);
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

    app.get('/transactions/:hash/info', (req,res) => {
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

    app.post('/blocks/notify', (req, res) => {
        //TODO
    });

    app.get('/peers', (req, res) => res.send(JSON.stringify(node.peers))); //TODO 409 code
    app.post('/peers', (req, res) => {
        //TODO
    });

    app.listen(http_port, () => console.log('Listening http on port: ' + http_port));
}

var addressHasEnoughMoney = (address, value) => {
    return (node.balances['address'] >= value);
}

var validateKeys = (pubKey, signature) => {
    //TODO validation of public key and signature
}

var validateAddresses = (fromAddress, toAddress) => {
    // TODO: actual validation of address
    return true;
}

var processBlock = (minerData) => {
    var block = node.miningJobs[minerData.address];

    block.nonce = minerData.nonce;
    block.dateCreated = minerData.dateCreated;
    block.blockHash = minerData.blockHash;

    var blockHash = CryptoJS.SHA256("" + block.blockDataHash + nonce).toString();
    if(blockHash.substring(0, DIFFICULTY) == Array(DIFFICULTY + 1).join("0"))
    {
        node.blocks.push(block);

        block.transactions.forEach(t =>
                        node.pendingTransactions.splice(node.pendingTransactions.indexOf(t['transactionHash']), 1)); //TODO: CHECK SYNTAX

        block.transactions.forEach(function(t) {
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
        addressHasMoney(transactionData.fromAddress, transactionData.value);
    var keysAreValid = validateKeys(transactionData.senderPubKey, transactionData.senderSignature);
    var addressesAreValid = validateAddresses(transactionData.fromAddress, transactionData.toAddress);

    if(hasMoneyForTransaction && keysAreValid && addressesAreValid)
    {
        return new Transaction(transactionData.fromAddress,
                               transactionData.toAddress,
                               transactionData.value,
                               transactionData.senderPubKey,
                               transactionData.senderSignature);
    }
    else
    {
        // TODO: Throw exception
        return false;
    }
}

var synchronizeWithPeer = () => {

}

var addPeer = (peerData) => {

}

startNode();
initHttpServer();
