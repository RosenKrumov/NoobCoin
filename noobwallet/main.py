import noobcommands

def create_wallet():
    pass

def parse_args(args):
    if (args.create):
        noobcommands.create_wallet()
    elif (args.balance):
        noobcommands.show_balance()
    elif (args.addresses):
        noobcommands.show_addresses()

if __name__ == '__main__':
    from argparse import ArgumentParser

    parser = ArgumentParser()
    parser.add_argument('-c', '--create', action='store_true', help='create wallet')
    parser.add_argument('-b', '--balance', action='store_true', help='see balance')
    parser.add_argument('-a', '--addresses', default=10, type=int, help='show addresses (default 10)')

    args = parser.parse_args()

    parse_args(args)

