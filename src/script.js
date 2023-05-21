let currentDraggingSliderLeft;
let currentDraggingSliderRight;
let currentImageInDrag;
let currentActiveEditButton;

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
    currentImageInDrag = getAncestorByClassName(currentDraggingSliderLeft, 'image');
};

const sliderLeftDoubleClickHandler = (e) => {
    const target = e.target;
    target.style.left = 0;
};

const sliderRightMouseDownHandler = (e) => {
    e.preventDefault();
    currentDraggingSliderRight = e.target;
    currentImageInDrag = getAncestorByClassName(currentDraggingSliderRight, 'image');
};

const sliderRightDoubleClickHandler = (e) => {
    const target = e.target;
    target.style.right = 0;
};

const mouseOverHandler = (e) => {
    if (currentDraggingSliderLeft || currentDraggingSliderRight) {
        const content = currentImageInDrag.querySelector('.image__content');

        // Вычисляем позицию курсора относительно картинки
        const currentCursorPos = e.pageX - content?.getBoundingClientRect()?.left;

        const minSlidersDistance = 10;
        let newSliderPos;

        // Обрабатываем перетаскивание левого слайдера
        if (currentDraggingSliderLeft) {
            const sliderRight = currentImageInDrag.querySelector('.image__slider_right');

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
            const sliderLeft = currentImageInDrag.querySelector('.image__slider_left');

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

const toggleEditButton = (button) => {
    // Если целевая кнопка является текущей активной — сбрасываем активное состояние
    if (button === currentActiveEditButton) {
        currentActiveEditButton = null;

        // Переводим чекбокс в невыбранное состояние
        button.classList.remove('checkbox_checked');

        const image = getAncestorByClassName(button, 'image');
        const sliderLeft = image.querySelector('.image__slider_left');
        const sliderRight = image.querySelector('.image__slider_right');

        // Скрываем ползунки
        sliderLeft?.classList.add('hidden');
        sliderRight?.classList.add('hidden');
    } else {
        // Если есть текущая активная кнопка — переключаем её состояние
        if (currentActiveEditButton) {
            toggleEditButton(currentActiveEditButton);
        }

        // Записываем целевую кнопку как текущую активную
        currentActiveEditButton = button;

        // Переводим чекбокс в выбранное состояние
        button.classList.add('checkbox_checked');

        const image = getAncestorByClassName(button, 'image');
        const sliderLeft = image.querySelector('.image__slider_left');
        const sliderRight = image.querySelector('.image__slider_right');

        // Показываем ползунки
        sliderLeft?.classList.remove('hidden');
        sliderRight?.classList.remove('hidden');
    }
};

const editButtonClickHandler = (e) => {
    // todo: при переходе в режим редактирования панель с кнопками должна быть видна всегда

    // todo: добавить выход из режима редактирования при нажатии вне картинки

    const target = e.target;
    const checkbox = getAncestorByClassName(target, 'checkbox');
    toggleEditButton(checkbox);
};

const initEditButton = () => {
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
    initEditButton();
});