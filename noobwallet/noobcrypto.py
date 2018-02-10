import hashlib, hmac, math, binascii
from pycoin.ecdsa import generator_secp256k1
import uuid

class NoobAddress(object):
    def __init__(self, skey, pkey, addr):
        self.skey = skey
        self.pkey = pkey
        self.addr = addr

def bips39_wordlist():
    bips39_file = open("bips39-english.txt", "r")
    return bips39_file.read().split('\n')

def generate_mnemonic():
    # random 128 bit key
    randKey = uuid.uuid4().int

    sha = hashlib.sha256()
    sha.update(randKey.to_bytes(16, 'big'))

    # first 4 bits of sha256(key) == checksum
    checksum = int.from_bytes(sha.digest(), 'big') & 0x0F;

    # append checksum at end of 128 bit key
    bips39 = randKey | (checksum << 128)

    wordlist = bips39_wordlist()
    mnemonic = list()

    # first 11 bits
    mask = 0x07FF
    for i in range(12):
        index = (bips39 >> (11 * i)) & mask
        mnemonic.append(wordlist[index])

    return mnemonic

def encode_mnemonic(mnemonic):
    wordlist = bips39_wordlist()

    key = 0
    shift = 0
    for word in mnemonic:
        if word not in wordlist:
            raise ValueError("Invalid mnemonic")

        key = key | (wordlist.index(word) << shift)
        shift += 11

    return key.to_bytes(17, 'big')

def derive_address(credentials, addr_index):
    encoded_mnem = encode_mnemonic(credentials.mnemonic)
    encoded_pass = str.encode(credentials.password)
    encoded_der_path = str.encode(f"m/44'/14'/{addr_index}'")

    skey = derive_skey(encoded_mnem, encoded_pass, encoded_der_path)
    pkey = derive_pkey(skey)
    addr = pkey_to_addr(pkey)

    return NoobAddress(skey, pkey, addr)

def derive_skey(key, password, der_path):
    target_key_length = 64
    hash_func = hashlib.sha256

    key = hmac.new(key, password, hash_func).digest()
    hash_len = hash_func().digest_size
    result, t = b"", b""

    for i in range(math.ceil(target_key_length / hash_len)):
        t = hmac.new(key, t + der_path + bytes([1 + i])).digest()
        result += t

    return binascii.hexlify(result[:target_key_length]).decode()

def derive_pkey(skey_hex):
    #print("private key (hex):", skey_hex)
    skey = int(skey_hex, 16)

    pkey = (generator_secp256k1 * skey).pair()
    #print("public key:", pkey)

    pkey_compressed = hex(pkey[0])[2:] + str(pkey[1] % 2)
    #print("public key (compressed):", pkey_compressed)

    return pkey_compressed

def pkey_to_addr(msg) :
    hash_bytes = hashlib.new('ripemd160', msg.encode("utf8")).digest()
    return hash_bytes.hex()

