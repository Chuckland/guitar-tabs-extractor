import base64
from io import BytesIO

from PIL import Image

import utils


def generate_html_img(frame) -> str:
    # Преобразование изображения в строку base64
    image = Image.fromarray(frame)
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    image_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    icon_pencil = get_icon('pencil-16.svg')
    icon_eye_off = get_icon('eye-off-16.svg')

    content = f"""
    <div class="image">
        <img src="data:image/png;base64,{image_base64}" alt="Image"
        class="image__content">
        <div class="image__innerBorder"></div>
        <div class="image__slider image__slider_left hidden"></div>
        <div class="image__slider image__slider_right hidden"></div>
        <div class="image__buttons">
            <label class="image__editButton checkbox">
                <input type="checkbox">
                <div class="checkbox__background">
                    {icon_pencil}
                </div>
            </label>
            <button class="image__hideButton">{icon_eye_off}</button>
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


def get_icon(icon_name):
    icon_dir = 'assets'
    with open(f'{icon_dir}/{icon_name}', 'r') as file:
        return file.read()


def generate_html_with_img_list(img_list: list[str],
                                file_name: str) -> str:
    images = '\n'.join(img_list)
    scripts = get_scripts()
    styles = get_styles()
    short_file_name = utils.shorten(s=file_name, max_len=70)

    icon_eye_open = get_icon('eye-open-16.svg')

    # todo: добавить кнопки undo и redo
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
                    <h1>Табулатуры для гитары</h1>
                    <p id="sourceDescription">{short_file_name}</p>
                </div>
                <div id="showAllImages">
                    <span id="hiddenImagesNumber" class="hidden"></span>
                    <button id="showAllImagesButton">
                        {icon_eye_open}
                        <span>Показать все</span>
                    </button>
                </div>
            </header>
            {images}
        </main>
    </body>
    </html>
    """

    return html_content
