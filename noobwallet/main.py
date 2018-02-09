import noobcommands

def create_wallet():
    pass

def parse_args(args):
    if (args.create):
        noobcommands.create_wallet()

if __name__ == '__main__':
    from argparse import ArgumentParser

    parser = ArgumentParser()
    parser.add_argument('-c', '--create', action='store_true', help='create wallet')
    args = parser.parse_args()

    parse_args(args)

