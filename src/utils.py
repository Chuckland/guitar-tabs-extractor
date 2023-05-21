import os


def create_directory(path: str) -> str:
    if not os.path.exists(path):
        os.makedirs(path)
    return os.path.abspath(path)


def shorten(s: str, max_len: int) -> str:
    result = s
    right = 15
    if len(s) > max_len:
        left = (
            max_len - right
            if max_len - right < len(s) - right
            else len(s) - right
        )
        result = s[0:left] + '...' + s[len(s) - right:len(s)]
    return result


def get_file_name_without_extension(file_path: str) -> str:
    file_name = os.path.basename(file_path)
    return os.path.splitext(file_name)[0]
