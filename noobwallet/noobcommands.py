import noobcrypto

def create_wallet():
    mnemonic = noobcrypto.generate_mnemonic()

    print("This is your mnemonic phrase. DON'T LOSE IT:")
    print("\t", end="")
    for word in mnemonic:
        print(word, end=" ")
    print()
