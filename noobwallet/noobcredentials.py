import noobcrypto

class NoobCredentials(object):
    def __init__(self, mnemonic, password):
       self.mnemonic = mnemonic
       self.password = password

    @staticmethod
    def read():
        print("Input wallet mnemonic: ", end="")
        mnemonic = input().split(' ')
        if not NoobCredentials.is_valid(mnemonic):
            raise ValueError("Invalid mnemonic provided")

        print("Input password: ", end="")
        password = input()

        return NoobCredentials(mnemonic, password)

    @staticmethod
    def is_valid(mnemonic):
        wordlist = noobcrypto.bips39_wordlist()
        for word in mnemonic:
            if word not in wordlist:
                return False

        return len(mnemonic) == 12
