import base64
import os
from io import BytesIO

import cv2
import numpy as np
from PIL import Image


def create_directory(path: str) -> str:
    if not os.path.exists(path):
        os.makedirs(path)
    return os.path.abspath(path)


def save_frame_as_image(frame, frame_num, output_path):
    frame_image = Image.fromarray(frame)
    frame_image.save(f'{output_path}/frame{frame_num}.png')


def generate_html_img(frame) -> str:
    # Преобразование изображения в строку base64
    image = Image.fromarray(frame)
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    image_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    content = f'<img src="data:image/png;base64,{image_base64}" alt="Image">'

    return content


def generate_html_with_img_list(img_list: list[str]):
    content = '\n'.join(img_list)

    # Генерация содержимого HTML-файла
    html_content = f"""
    <html>
    <head></head>
    <body>{content}</body>
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
    return frame[y:y+height, x:x+width]


def extract_frames(video_path: str,
                   output_path: str,
                   threshold: int,
                   trim_frames_start: int = 0,
                   trim_frames_end: int = 0,
                   start_point: tuple[int, int] = None,
                   width: int = None,
                   height: int = None):
    print('Начинаем извлечение кадров.')

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

        if (frame_num < trim_frames_start
                or frame_num > total_frames - trim_frames_end):
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

            # save_frame_as_image(first_frame, frame_num, output_path)

            first_frame = gray_frame
            saved_frame_num += 1

    # Закрываем видео
    video.release()

    html_content = generate_html_with_img_list(html_img_list)

    with open(output_path, 'w') as file:
        file.write(html_content)

    print(f'  Всего кадров извлечено: {saved_frame_num}')

    print("Извлечение кадров завершено.")


def main():
    # Пример использования функции extract_frames
    video_path = (
        '../in/Minor Swing Django Reinhardt - '
        'Solo et tablature (Gyspy jazz free tab).mp4'
    )
    output_path = '{}/output.html'.format(
        create_directory('../out')
    )
    threshold = 50
    x = 0
    y = 477
    width = 1280 - x
    height = 720 - y
    trim_frames_start = 30
    trim_frames_end = 25

    extract_frames(
        video_path=video_path,
        output_path=output_path,
        threshold=threshold,
        trim_frames_start=trim_frames_start,
        trim_frames_end=trim_frames_end,
        start_point=(x, y),
        width=width,
        height=height
    )


if __name__ == '__main__':
    main()
