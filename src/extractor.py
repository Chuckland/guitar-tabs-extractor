import cv2
import numpy as np

import utils
from html_generating import generate_html_img, generate_html_with_img_list


def crop_frame(frame,
               start_point: tuple[int, int] = None,
               width: int = None,
               height: int = None):
    if start_point is None or width is None or height is None:
        return frame

    x, y = start_point
    return frame[y:y + height, x:x + width]


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
            html_img_list.append(
                generate_html_img(frame=frame, index=saved_frame_num)
            )
            first_frame = gray_frame
            saved_frame_num += 1

    # Закрываем видео
    video.release()

    print(f'  Всего кадров извлечено: {saved_frame_num}')
    print("Кадры извлечены.")

    html_content = generate_html_with_img_list(
        img_list=html_img_list,
        file_name=utils.get_file_name_without_extension(video_path)
    )

    with open(output_path, 'w') as file:
        file.write(html_content)
    print(f'Сформирован файл: {output_path}')
