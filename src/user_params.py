import json
import os
from typing import Any


def get_user_input() -> tuple[str, int, int, int, int, int]:
    (
        video_path, threshold, x, y, skip_start_frames, skip_end_frames
    ) = get_data_from_config()

    video_path = get_param(
        param_name='Видео',
        last_value=video_path,
        request_text='Введите путь до mp4-файла',
        error_text='Ошибка. Введите путь к существующему mp4-файлу.',
        validation=lambda v: v.endswith('.mp4') and os.path.exists(v)
    )
    threshold = get_param(
        param_name='Пороговое значение для сравнения кадров',
        last_value=threshold,
        request_text='Введите число от 0 до 100',
        error_text='Ошибка. Введите число от 0 до 100.',
        validation=lambda v: str(v).isdigit() and (0 <= int(v) <= 100)
    )
    x = get_param(
        param_name='Координата X левой верхней точки',
        last_value=x,
        request_text='Введите неотрицательное число',
        error_text='Ошибка. Введите неотрицательное целое число.',
        validation=lambda v: str(v).isdigit() and int(v) >= 0
    )
    y = get_param(
        param_name='Координата Y левой верхней точки',
        last_value=y,
        request_text='Введите неотрицательное число',
        error_text='Ошибка. Введите неотрицательное целое число.',
        validation=lambda v: str(v).isdigit() and int(v) >= 0
    )
    skip_start_frames = get_param(
        param_name='Сколько кадров пропустить в начале',
        last_value=skip_start_frames,
        request_text='Введите неотрицательное число',
        error_text='Ошибка. Введите неотрицательное целое число.',
        validation=lambda v: str(v).isdigit() and int(v) >= 0
    )
    skip_end_frames = get_param(
        param_name='Сколько кадров пропустить в конце',
        last_value=skip_end_frames,
        request_text='Введите неотрицательное число',
        error_text='Ошибка. Введите неотрицательное целое число.',
        validation=lambda v: str(v).isdigit() and int(v) >= 0
    )

    save_params({
        'video_path': video_path,
        'threshold': int(threshold),
        'x': int(x),
        'y': int(y),
        'skip_start_frames': int(skip_start_frames),
        'skip_end_frames': int(skip_end_frames)
    })

    return (
        video_path,
        int(threshold),
        int(x),
        int(y),
        int(skip_start_frames),
        int(skip_end_frames),
    )


CONFIG_FILE = 'config.json'


def get_non_negative_integer_input(prompt: str) -> int:
    value = input(prompt)
    while not value.isdigit() or int(value) < 0:
        print('Ошибка. Введите неотрицательное целое число.')
        value = input(prompt)
    return int(value)


def get_data_from_config() -> tuple[
        str | None, int | None, int | None, int | None, int | None,
        int | None]:
    # Проверяем наличие файла config.json и загружаем данные,
    # если файл существует
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            config_data = json.load(f)
    else:
        config_data = {}

    # Проверяем наличие параметров в config_data
    # и устанавливаем значения по умолчанию
    video_path = config_data.get("video_path", None)
    threshold = config_data.get("threshold", None)
    x = config_data.get("x", None)
    y = config_data.get("y", None)
    skip_start_frames = config_data.get("skip_start_frames", None)
    skip_end_frames = config_data.get("skip_end_frames", None)

    return video_path, threshold, x, y, skip_start_frames, skip_end_frames


def get_param(param_name: str,
              last_value: Any | None,
              request_text: str,
              error_text: str,
              validation: Any) -> str:
    indent_level_2 = ' ' * 2
    result = last_value
    last_value_text = ''
    print(param_name)
    if result is not None:
        print(
            f'{indent_level_2}Прошлое значение: {result}'
        )
        last_value_text = (
            ' (или нажмите Enter, чтобы использовать прошлое значение)'
        )
    result = input(
        f'{indent_level_2}{request_text}{last_value_text}: '
    ) or result

    # Проверка video_path
    while result is None or not validation(result):
        print(f'{indent_level_2}{error_text}')
        result = input(
            f'{indent_level_2}{request_text}{last_value_text}: '
        ) or result

    return result


def save_params(params: dict) -> None:
    # Сохраняем параметры в файл config.json
    with open(CONFIG_FILE, "w") as f:
        json.dump(params, f, indent=4)
