import base64
from io import BytesIO

from PIL import Image

import utils


def generate_html_img(frame, index) -> str:
    # Преобразование изображения в строку base64
    image = Image.fromarray(frame)
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    image_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    icon_eye_off = get_icon('eye-off-16.svg')

    content = f"""
    <div id="image{index}" class="image">
        <img src="data:image/png;base64,{image_base64}" alt="Image"
        class="image__content">
        <div class="image__slider image__slider_left hidden"></div>
        <div class="image__slider image__slider_right hidden"></div>
        <div class="image__buttons">
            <button class="image__hideButton">{icon_eye_off}</button>
        </div>
    </div>
    """

    return content


def get_scripts() -> str:
    result = ''
    with open('UndoRedoEngine.js', 'r') as file:
        result += f'<script>{file.read()}</script>'
    with open('script.js', 'r') as file:
        result += f'<script>{file.read()}</script>'
    return result


def get_styles() -> str:
    with open('styles.css', 'r') as file:
        return f'<style>{file.read()}</style>'


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
    icon_pencil = get_icon('pencil-16.svg')
    icon_check = get_icon('check-a-16.svg')
    icon_cross = get_icon('cross-16.svg')
    icon_arrow_left = get_icon('arrow-shape-d-radius-up-left-16.svg')
    icon_arrow_right = get_icon('arrow-shape-d-radius-up-right-16.svg')

    # Генерация содержимого HTML-файла
    html_content = f"""
    <html>
    <head>
        <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
        {styles}
        {scripts}
    </head>
    <body>
        <main>
            <header>
                <div id="description" class="description">
                    <h1>Табулатуры для гитары</h1>
                    <p id="source" class="source">{short_file_name}</p>
                </div>
                <section id="globalButtons" class="globalButtons hideOnPrint">
                    <div class="globalButtons__editModeBackground hidden"></div>
                    <div class="globalButtons__editModeLabel hidden">
                        {icon_pencil}
                        <span>Редактирование</span>
                    </div>
                    <div id="showAllImages" class="showAllImages">
                        <span id="hiddenImagesNumber"
                        class="hiddenImagesNumber hidden"></span>
                        <button id="showAllImagesButton" class="hidden">
                            {icon_eye_open}
                        </button>
                    </div>
                    <button id="undo" disabled>{icon_arrow_left}</button>
                    <button id="redo" disabled>{icon_arrow_right}</button>
                    <button id="edit">{icon_pencil}</button>
                    <button id="confirmEdit" class="hidden">
                        {icon_check}
                    </button>
                    <button id="cancelEdit" class="hidden">
                        {icon_cross}
                    </button>
                </section>
            </header>
            <div class="imagesContainer">
                <div class="imagesContainer__innerBorder"></div>
                {images}
            </div>
        </main>
    </body>
    </html>
    """

    return html_content
