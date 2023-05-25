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
    icon_pencil = get_icon('pencil-16.svg')
    icon_check = get_icon('check-a-16.svg')
    icon_cross = get_icon('cross-16.svg')

    # todo: добавить кнопки undo и redo
    # Генерация содержимого HTML-файла
    html_content = f"""
    <html>
    <head>
        <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
        <style>{styles}</style>
        <script>{scripts}</script>
    </head>
    <body>
        <main>
            <header>
                <div id="description" class="description">
                    <h1>Табулатуры для гитары</h1>
                    <p id="source" class="source">{short_file_name}</p>
                </div>
                <section id="globalButtons" class="globalButtons hideOnPrint">
                    <div id="defaultButtons" class="defaultButtons">
                        <div id="showAllImages" class="showAllImages">
                            <span id="hiddenImagesNumber" 
                            class="hiddenImagesNumber hidden"></span>
                            <button id="showAllImagesButton">
                                {icon_eye_open}
                                <span>Показать все</span>
                            </button>
                        </div>
                        <button id="edit">{icon_pencil}</button>
                    </div>
                    <div id="editModePanel" class="editModePanel hidden">
                        <div class="editModePanel__background"></div>
                        <div class="editModePanel__label">
                            {icon_pencil}
                            <span>Редактирование</span>
                        </div>
                        <button id="confirmEdit">{icon_check}</button>
                        <button id="cancelEdit">{icon_cross}</button>
                    </div>
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
