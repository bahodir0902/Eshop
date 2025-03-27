import uuid

def get_random_username():
    return f'{uuid.uuid4().hex}'