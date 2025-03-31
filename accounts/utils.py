import uuid
import random

def get_random_username():
    return f'{uuid.uuid4().hex}'

def generate_random_code():
    return random.randint(1000, 9999)