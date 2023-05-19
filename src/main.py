import base64
import json
import os
from io import BytesIO
from typing import Any

import cv2
import numpy as np
from PIL import Image

CONFIG_FILE = 'config.json'


def create_directory(path: str) -> str:
    if not os.path.exists(path):
        os.makedirs(path)
    return os.path.abspath(path)


def generate_html_img(frame) -> str:
    # Преобразование изображения в строку base64
    image = Image.fromarray(frame)
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    image_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    content = f"""
    <div class="image">
        <div class="image__container">
            <img src="data:image/png;base64,{image_base64}" alt="Image"
            class="image">
        </div>
        <div class="image__buttons">
            <button class="image__hideButton">\u00D7</button>
        </div>
    </div>
    """

    return content


def get_scripts() -> str:
    with open('script.js', 'r') as file:
        return file.read()


def get_styles() -> str:
    with open('styles.css', 'r') as file:
        return file.read()


def shorten(s: str) -> str:
    result = s
    max_len = 70
    right = 15
    if len(s) > max_len:
        left = (
            max_len - right
            if max_len - right < len(s) - right
            else len(s) - right
        )
        result = s[0:left] + '...' + s[len(s) - right:len(s)]
    return result


def generate_html_with_img_list(img_list: list[str],
                                file_name: str) -> str:
    images = '\n'.join(img_list)
    scripts = get_scripts()
    styles = get_styles()
    short_file_name = shorten(file_name)

    # Генерация содержимого HTML-файла
    html_content = f"""
    <html>
    <meta charset="utf-8" />
    <head>
        <style>{styles}</style>
        <script>{scripts}</script>
    </head>
    <body>
        <main>
            <header>
                <div id="description">
                    <h1>Табы для гитары</h1>
                    <p id="sourceDescription">Из видео «{short_file_name}»</p>
                </div>
                <div id="showAllImages">
                    <span id="hiddenImagesNumber" class="hidden"></span>
                    <button id="showAllImagesButton">Показать все</button>
                </div>
            </header>
            {images}
        </main>
    </body>
    </html>
    """

    return html_content


def crop_frame(frame,
               start_point: tuple[int, int] = None,
               width: int = None,
               height: int = None):
    if start_point is None or width is None or height is None:
        return frame

    x, y = start_point
    return frame[y:y + height, x:x + width]


def get_file_name_without_extension(file_path: str) -> str:
    file_name = os.path.basename(file_path)
    return os.path.splitext(file_name)[0]


def extract_frames(video_path: str,
                   output_path: str,
                   threshold: int,
                   skip_start_frames: int = 0,
                   skip_end_frames: int = 0,
                   start_point: tuple[int, int] = None,
                   width: int = None,
                   height: int = None) -> None:
    print('Извлекаем кадры.')

    # Открываем видео
    video = cv2.VideoCapture(video_path)

    # Проверяем, открылось ли видео
    if not video.isOpened():
        print('  Ошибка при открытии видео.')
        return

    # Извлекаем информацию о видео
    total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f'  Всего кадров в видео: {total_frames}')

    # Переменная, в которую будем записывать кол-во сохраненных кадров
    saved_frame_num = 0

    # Инициализируем переменную для хранения первого кадра
    first_frame = None

    html_img_list: list[str] = []

    # Проходимся по каждому кадру видео
    for frame_num in range(total_frames):
        # Читаем текущий кадр
        ret, frame = video.read()

        if (frame_num < skip_start_frames
                or frame_num > total_frames - skip_end_frames):
            continue

        frame = crop_frame(frame, start_point, width, height)

        # Проверяем, успешно ли прочитан кадр
        if not ret:
            print('  Ошибка при чтении кадра.')
            break

        # Переводим кадр в оттенки серого
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Если это первый кадр, фиксируем его
        if first_frame is None:
            first_frame = gray_frame
            continue

        # Вычисляем разницу между текущим и предыдущим кадрами
        frame_diff = cv2.absdiff(gray_frame, first_frame)

        # Вычисляем процент изменения в кадре
        frame_diff_percent = (
                (np.count_nonzero(frame_diff) / frame_diff.size) * 100
        )

        # Если процент изменения превышает пороговое значение,
        # сохраняем кадр
        if frame_diff_percent > threshold:
            html_img_list.append(generate_html_img(frame))
            first_frame = gray_frame
            saved_frame_num += 1

    # Закрываем видео
    video.release()

    print(f'  Всего кадров извлечено: {saved_frame_num}')
    print("Кадры извлечены.")

    html_content = generate_html_with_img_list(
        img_list=html_img_list,
        file_name=get_file_name_without_extension(video_path)
    )

    with open(output_path, 'w') as file:
        file.write(html_content)
    print(f'Сформирован файл: {output_path}')


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


def main():
    (
        video_path, threshold, x, y, skip_start_frames, skip_end_frames
    ) = get_user_input()
    width = 1280 - x
    height = 720 - y

    output_path = '{dir}/{file_name}.html'.format(
        dir=create_directory('../out'),
        file_name=get_file_name_without_extension(video_path)
    )

    extract_frames(
        video_path=video_path,
        output_path=output_path,
        threshold=threshold,
        skip_start_frames=skip_start_frames,
        skip_end_frames=skip_end_frames,
        start_point=(x, y),
        width=width,
        height=height
    )


if __name__ == '__main__':
    main()
