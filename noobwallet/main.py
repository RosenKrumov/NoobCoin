import noobcommands

def create_wallet():
    pass

def parse_args(args):
    if not noobcommands.connect(args.node):
        return

    if args.create:
        noobcommands.create_wallet()
    elif args.balance:
        noobcommands.show_balance()
    elif args.send:
        noobcommands.make_transaction()
    elif args.addresses != None:
        noobcommands.show_addresses(args.addresses)

if __name__ == '__main__':
    from argparse import ArgumentParser

    parser = ArgumentParser()
    parser.add_argument('-n', '--node', type=str, help='node to connect to', required=True)
    parser.add_argument('-c', '--create', action='store_true', help='create wallet')
    parser.add_argument('-b', '--balance', action='store_true', help='see balance')
    parser.add_argument('-s', '--send', action='store_true', help='make a transaction')
    parser.add_argument('-a', '--addresses', type=int, help='show addresses <count>')

    args = parser.parse_args()

    parse_args(args)

