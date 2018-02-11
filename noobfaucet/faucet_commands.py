import sys
sys.path.insert(0, '../noobwallet')

import binascii
import requests
from noobcredentials import NoobCredentials
import noobcrypto
import noobcomms
import os

def connect(url: str):
    try:
        response = requests.get(url = f"{url}/info");
    except Exception as e:
        print('Failed to establish connection with node. Aborting')
        return False

    if response.status_code == 200:
        print("Successfully connected to node")
    else:
        print(f"Failed to connect to node. Server status code {response.status_code}")

    global node_url
    node_url = url

    return response.status_code == 200

def make_transaction(recipient_addr):
    FAUCET_MNEM = \
        ['treat', 'snap', 'junk', 'insane', 'ginger', 'hawk',
         'jar', 'drive', 'circle', 'vapor', 'such', 'turtle']
    FAUCET_PASS = "faucet123"
    credentials = NoobCredentials(FAUCET_MNEM, FAUCET_PASS)

    wallet_addr_info = noobcrypto.get_address_info(credentials, 0)
    amount = 10

    noobcomms.send_transaction(node_url, wallet_addr_info, recipient_addr, amount)

