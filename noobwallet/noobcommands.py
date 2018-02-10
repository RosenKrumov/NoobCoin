import binascii
import noobcrypto
from noobcredentials import NoobCredentials
import noobtransaction
import os

def connect(addr: str):
    print(addr)
    # TODO: send http request to /info and see that everything is OK. Then store addr

def create_wallet():
    mnemonic = noobcrypto.generate_mnemonic()

    print("This is your mnemonic phrase. DON'T LOSE IT:")
    print("\t", end="")
    for word in mnemonic:
        print(word, end=" ")
    print()

def show_balance():
    print("show balance")
    # TODO
    pass

def show_addresses(count):
    credentials = None
    try:
        credentials = NoobCredentials.read()
    except ValueError as e:
        print(e)

    for i in range(count):
        noobaddr_info = noobcrypto.derive_address(credentials, i)
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
    sender_addr_info = noobcrypto.derive_address(credentials, addr_index)

    print("Input recipient's address: ", end="")
    recipient_addr = input()

    print("How much noob coins would you like to send? ", end="")
    amount = int(input())

    noobtransaction.send(sender_addr_info, recipient_addr, amount)

