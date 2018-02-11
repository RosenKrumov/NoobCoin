from pycoin.ecdsa import generator_secp256k1, sign
from datetime import datetime
import requests
import json
import hashlib
import binascii

def send(url, sender_addr_info, recipient_addr, amount):
    if not is_valid_addr(recipient_addr):
        raise ValueError("Invalid recipient address provided")

    date = str(datetime.utcnow())

    msg_hash = hashlib.sha256()
    msg_hash.update(f'{sender_addr_info.addr}{recipient_addr}{amount}{date}'.encode())

    signature = sign(generator_secp256k1, int(sender_addr_info.skey, 16), int(msg_hash.hexdigest(), 16))

    data = {
        'fromAddress': sender_addr_info.addr,
        'toAddress': recipient_addr,
        'amount': amount,
        'date': date,
        'pkey': sender_addr_info.pkey,
        'signature': [ hex(signature[0])[2:], hex(signature[1])[2:] ]
    };
    headers = {'content-type': 'application/json'}

    try:
        response = requests.post(url = f"{url}/transactions/new", data=json.dumps(data), headers=headers);
    except Exception as e:
        print(e)
        return

    if response.status_code == 200:
        print("Transaction submitted successully")
    else:
        print(f"Failed to transmit transaction. Server status code {response.status_code}")

def is_valid_addr(addr):
    return int(addr, 16).bit_length() <= 160

