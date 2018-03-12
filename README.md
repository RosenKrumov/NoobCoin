# NoobCoin
A complete blockchain system based on Python & Javascript

# Contributors:  
### [Preslav Mihaylov](https://github.com/PreslavMihaylov)  
### [Rosen Krumov](https://github.com/RosenKrumov)  

# Components

## Node
This is the component responsible for storing the blockchain and synchronizing with other nodes.

### REST Endpoints
{host}/info - all the information available about the node  
{host}/blocks - all the blocks known by the node 
{host}/balance/:address - the amount of Noob Coins a given address has  
{host}/mining/get/:address - get a block for mining with the given address as a miner address to reward  
{host}/mining/submit/:address - submit the mined block after getting it first
{host}/peers - information about the peers this node is connected to

## Wallet
The software responsible for generating private/public key pairs based on HMAC key derivation and ECDSA cryptography.

## Faucet
A variation of the wallet, which provides test noobcoins to people requesting them.

### REST Endpoints
{host}/request - request NoobCoins by providing your address

## Miner
The software which calculates the block hash with given difficulty based on the SHA256 hash algorithm.

## Block Explorer
A simple web server visualising the blocks and transactions happening in the noobcoin blockchain
