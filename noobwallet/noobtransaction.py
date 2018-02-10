from pycoin.ecdsa import generator_secp256k1, sign
from datetime import datetime
import hashlib
import binascii

def send(sender_addr_info, recipient_addr, amount):
    if not is_valid_addr(recipient_addr):
        raise ValueError("Invalid recipient address provided")

    date = str(datetime.utcnow())

    msg_hash = hashlib.sha256()
    msg_hash.update(f'{sender_addr_info.addr}{recipient_addr}{amount}{date}'.encode())

    signature = sign(generator_secp256k1, int(sender_addr_info.skey, 16), int(msg_hash.hexdigest(), 16))

    data = {
        'sender_addr': sender_addr_info.addr,
        'recipient_addr': recipient_addr,
        'amount': amount,
        'date': date,
        'pkey': sender_addr_info.pkey,
        'signature': [ hex(signature[0])[2:], hex(signature[1])[2:] ]
    };

    print(data)

    # TODO: sign transaction and send with format: { sender_addr, recipient_addr, amount, pkey, signature }
    pass

def is_valid_addr(addr):
    return int(addr, 16).bit_length() <= 160

