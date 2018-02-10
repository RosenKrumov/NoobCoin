import binascii
import noobcrypto
from noobcredentials import NoobCredentials

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
        noobaddr = noobcrypto.derive_address(credentials, i)
        print(f"address: {noobaddr.addr}\n\tskey: {noobaddr.skey}\n\tpkey: {noobaddr.pkey}")
