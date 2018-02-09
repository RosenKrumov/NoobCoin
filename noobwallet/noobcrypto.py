import hashlib, hmac, math, binascii
import uuid

def bips39_wordlist():
    bips39_file = open("bips39-english.txt", "r")
    return bips39_file.read().split('\n')

def generate_mnemonic():
    # random 128 bit key
    randKey = uuid.uuid4().int

    sha = hashlib.sha256()
    sha.update(randKey.to_bytes(128, 'big'))

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

def derive_key_hkdf(password, key, der_path):
    target_key_length = 128
    hash_func = hashlib.sha256
    key = hmac.new(salt, password, hash_func).digest()
    hash_len = hash_func().digest_size
    result, t = b"", b""

    for i in range(math.ceil(target_key_length / hash_len)):
        t = hmac.new(key, t + der_path + bytes([1 + i])).digest()
        result += t

    return result[:target_key_length]
