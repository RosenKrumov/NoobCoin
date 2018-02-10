
def send(sender_addr_info, recipient_addr, amount):
    if not is_valid_addr(recipient_addr):
        raise ValueError("Invalid recipient address provided")

    # TODO: sign transaction and send with format: { sender_addr, recipient_addr, amount, pkey, signature }
    pass

def is_valid_addr(addr):
    return int(addr, 16).bit_length() <= 160

