import sys
import faucet_commands
from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/request', methods=['POST'])
def request_money():
    values = request.get_json()

    address = values.get('address')
    if address is None:
        return "Error: Please supply a valid Noob Coin address"

    faucet_commands.make_transaction(address)

    response = {
        'message': f'10 noob coins were sent to {address}'
    }

    return jsonify(response), 200

if __name__ == '__main__':
    from argparse import ArgumentParser

    parser = ArgumentParser()
    parser.add_argument('-n', '--node', type=str, help='node to connect to', required=True)
    parser.add_argument('-p', '--port', default=5000, type=int, help='port to host on')

    args = parser.parse_args()
    if not faucet_commands.connect(args.node):
        sys.exit()

    app.run(host='localhost', port=args.port)

