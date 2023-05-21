let currentDraggingSliderLeft;
let currentDraggingSliderRight;
let currentImageInEdit;

const getAncestorByClassName = (node, className) => {
    let result = node;
    while (!result?.classList.contains(className)) {
        result = result.parentElement;
    }
    return result;
};

const hideImage = (image) => {
    image?.classList?.add('hidden');
};

const handleHideButtonClick = (event) => {
    const button = event.target;
    const image = getAncestorByClassName(button, 'image');
    hideImage(image);
};

const handleShowAllButtonClick = () => {
    const images = document.querySelectorAll('.image');
    images?.forEach((image) => {
        image.classList.remove('hidden');
    });
};

const initHideImageButtonsHandlers = () => {
    const hideImageButtons = document.querySelectorAll('.image__hideButton');
    hideImageButtons?.forEach((button) => {
        button.addEventListener('click', handleHideButtonClick);
    });
};

const initShowAllImagesButtonHandler = () => {
    const showAllImagesButton = document.querySelector('#showAllImagesButton');
    showAllImagesButton?.addEventListener('click', handleShowAllButtonClick);
};

const getHiddenImagesNumberText = (num) => {
    const s = String(num);
    if (s[s.length - 1] === '1' && s.slice(s.length - 2, s.length) !== '11') {
        return `${num} скрыт`;
    } else {
        return `${num} скрыто`;
    }
};

const updateHiddenImagesNumber = () => {
    const hiddenNum = document.querySelectorAll('.image.hidden')?.length;
    const element = document.querySelector('#hiddenImagesNumber');
    if (hiddenNum >= 1) {
        element.textContent = getHiddenImagesNumberText(hiddenNum);
        element.classList.remove('hidden');
    } else {
        element.textContent = '';
        element.classList.add('hidden');
    }
};

const initImagesObserving = () => {
    const config = { attributes: true };
    const callback = (mutationList, observer) => {
        let needUpdate = false;
        for (const mutation of mutationList) {
            if (mutation.attributeName === 'class') {
                needUpdate = true;
                break;
            }
        }
        if (needUpdate) {
            updateHiddenImagesNumber();
        }
    };
    const observer = new MutationObserver(callback);

    const images = document.querySelectorAll('.image');
    images?.forEach((image) => {
        observer.observe(image, config);
    });
};

const sliderLeftMouseDownHandler = (e) => {
    e.preventDefault();
    currentDraggingSliderLeft = e.target;
};

const sliderLeftDoubleClickHandler = (e) => {
    const target = e.target;
    target.style.left = 0;
};

const sliderRightMouseDownHandler = (e) => {
    e.preventDefault();
    currentDraggingSliderRight = e.target;
};

const sliderRightDoubleClickHandler = (e) => {
    const target = e.target;
    target.style.right = 0;
};

const mouseOverHandler = (e) => {
    if (currentDraggingSliderLeft || currentDraggingSliderRight) {
        const content = currentImageInEdit.querySelector('.image__content');

        // Вычисляем позицию курсора относительно картинки
        const currentCursorPos = e.pageX - content?.getBoundingClientRect()?.left;

        const minSlidersDistance = 10;
        let newSliderPos;

        // Обрабатываем перетаскивание левого слайдера
        if (currentDraggingSliderLeft) {
            const sliderRight = currentImageInEdit.querySelector('.image__slider_right');

            if (currentCursorPos < 0) {
                // Если курсор находится слева за пределами картинки — берём левую границу картинки в качестве новой позиции слайдера
                newSliderPos = 0;
            } else if (
                currentCursorPos >= sliderRight.offsetLeft - minSlidersDistance ||
                currentCursorPos >= content.offsetWidth - currentDraggingSliderLeft.offsetWidth
            ) {
                // Если курсор находится правее, чем правый слайдер — берём позицию слева от правого слайдера с минимальным сдвигом
                newSliderPos = sliderRight.offsetLeft - minSlidersDistance;
            } else {
                newSliderPos = currentCursorPos;
            }
            // Меняем позицию левого ползунка.
            // В ответ на изменение позиции наблюдатель (observer)
            // реализует логику обновления видимой части картинки
            currentDraggingSliderLeft.style.left = newSliderPos + 'px';
        }

        // Обрабатываем перетаскивание правого слайдера
        if (currentDraggingSliderRight) {
            const sliderLeft = currentImageInEdit.querySelector('.image__slider_left');

            if (currentCursorPos > content.offsetWidth) {
                // Если курсор находится справа за пределами картинки — берём правую границу картинки в качестве новой позиции слайдера
                newSliderPos = content.offsetWidth;
            } else if (
                currentCursorPos < sliderLeft.offsetWidth ||
                currentCursorPos < sliderLeft.offsetLeft + minSlidersDistance
            ) {
                // Если курсор находится левее, чем левый слайдер — берём позицию справа от левого слайдера с минимальным сдвигом
                newSliderPos = sliderLeft.offsetLeft + minSlidersDistance;
            } else {
                newSliderPos = currentCursorPos;
            }
            // Меняем позицию правого ползунка.
            // В ответ на изменение позиции наблюдатель (observer)
            // реализует логику обновления видимой части картинки
            currentDraggingSliderRight.style.right = content.offsetWidth - newSliderPos + 'px';
        }
    }
};

const mouseUpHandler = () => {
    currentDraggingSliderLeft = null;
    currentDraggingSliderRight = null;
};

const sliderPositionMutationHandler = (mutationList, observer) => {
    mutationList.forEach(mutation => {
        if (mutation.attributeName === 'style') {
            const image = getAncestorByClassName(mutation.target, 'image');
            if (image) {
                const content = image.querySelector('.image__content');
                const sliderLeft = image.querySelector('.image__slider_left');
                const sliderRight = image.querySelector('.image__slider_right');

                const leftBoundary = sliderLeft.offsetLeft;
                const rightBoundary = sliderRight.offsetLeft + sliderRight.offsetWidth;
                content.style.clipPath = `polygon(${leftBoundary}px 0, ${rightBoundary}px 0, ${rightBoundary}px 100%, ${leftBoundary}px 100%)`;
            }
        }
    });
};

const initCropImages = () => {
    const images = document.querySelectorAll('.image');
    images?.forEach((image) => {
        const content = image.querySelector('.image__content');
        const sliderLeft = image.querySelector('.image__slider_left');
        const sliderRight = image.querySelector('.image__slider_right');

        // Добавляем наблюдателя за изменением позиций ползунков
        const observer = new MutationObserver(sliderPositionMutationHandler);
        const observerOptions = {
            attributes: true,
            attributeFilter: ['style']
        }
        observer.observe(sliderLeft, observerOptions);
        observer.observe(sliderRight, observerOptions);

        if (image && content && sliderLeft && sliderRight) {
            sliderLeft.addEventListener('mousedown', sliderLeftMouseDownHandler);
            sliderLeft.addEventListener('dblclick', sliderLeftDoubleClickHandler);

            sliderRight.addEventListener('mousedown', sliderRightMouseDownHandler);
            sliderRight.addEventListener('dblclick', sliderRightDoubleClickHandler);

            document.addEventListener('mousemove', mouseOverHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        }
    });
};

const toggleEditingImageMode = (image) => {
    if (image) {
        const buttons = image.querySelector('.image__buttons');
        const checkbox = image.querySelector('.checkbox');
        const sliderLeft = image.querySelector('.image__slider_left');
        const sliderRight = image.querySelector('.image__slider_right');

        // Если на вход поступила картинка, кот-я уже находится в режиме редактирования — выводим её из режима редактирования
        if (image === currentImageInEdit) {
            currentImageInEdit = null;

            // Скрываем ползунки
            sliderLeft?.classList.add('hidden');
            sliderRight?.classList.add('hidden');

            // Переводим чекбокс в невыбранное состояние
            checkbox?.classList.remove('checkbox_checked');

            // Открепляем панель с кнопками
            buttons?.classList.remove('image__buttons_pinned');
        } else {
            // Если на вход поступила картинка, кот-я не находится в режиме редактирования — вводим её в режим редактирования

            // Если какая-то картинка была в режиме редактирования — выводим её из режима
            if (currentImageInEdit) {
                toggleEditingImageMode(currentImageInEdit);
            }

            currentImageInEdit = image;

            // Показываем ползунки
            sliderLeft?.classList.remove('hidden');
            sliderRight?.classList.remove('hidden');

            // Переводим чекбокс в выбранное состояние
            checkbox?.classList.add('checkbox_checked');

            // Закрепляем панель с кнопками
            buttons?.classList.add('image__buttons_pinned');
        }
    } else {
        // Если на вход поступил null — при наличии активной картинки выводим её из режима редактирования
        if (currentImageInEdit) {
            toggleEditingImageMode(currentImageInEdit);
        }
    }
};

const editButtonClickHandler = (e) => {
    // todo: добавить выход из режима редактирования при нажатии вне картинки
    const target = e.target;
    const image = getAncestorByClassName(target, 'image');
    toggleEditingImageMode(image);
};

const initEditButtons = () => {
    const editButtons = document.querySelectorAll('.image__editButton');
    editButtons?.forEach((button) => {
        button.addEventListener('change', editButtonClickHandler);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    initHideImageButtonsHandlers();
    initShowAllImagesButtonHandler();
    initImagesObserving();
    initCropImages();
    initEditButtons();
});