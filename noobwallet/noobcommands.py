import binascii
import requests
import noobcrypto
from noobcredentials import NoobCredentials
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

def create_wallet():
    mnemonic = noobcrypto.generate_mnemonic()

    print("This is your mnemonic phrase. DON'T LOSE IT:")
    print("\t", end="")
    for word in mnemonic:
        print(word, end=" ")
    print()

def show_balance():
    credentials = None
    try:
        credentials = NoobCredentials.read()
    except ValueError as e:
        print(e)

    print("Which address index to use? ", end="")
    addr_index = int(input())
    wallet_addr_info = noobcrypto.get_address_info(credentials, addr_index)

    balance = noobcomms.get_balance(node_url, wallet_addr_info)
    print(f"Your balance for address {wallet_addr_info.addr} is {balance} NC")

    pass

def show_addresses(count):
    credentials = None
    try:
        credentials = NoobCredentials.read()
    except ValueError as e:
        print(e)

    for i in range(count):
        noobaddr_info = noobcrypto.get_address_info(credentials, i)
        print(f"address {i}: {noobaddr_info.addr}")
        print(f"\tskey: {noobaddr_info.skey}")
        print(f"\tpkey: {noobaddr_info.pkey}")

def make_transaction():
    credentials = None
    try:
        credentials = NoobCredentials.read()
    except ValueError as e:
        print(e)

    print("Which address index to use? ", end="")
    addr_index = int(input())
    wallet_addr_info = noobcrypto.get_address_info(credentials, addr_index)

    print("Input recipient's address: ", end="")
    recipient_addr = input()

    print("How much noob coins would you like to send? ", end="")
    amount = int(input())

    noobcomms.send_transaction(node_url, wallet_addr_info, recipient_addr, amount)

