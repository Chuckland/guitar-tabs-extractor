let currentDraggingSliderLeft;
let currentDraggingSliderRight;
let currentImageInEdit;
let preEditState;

const getAncestorByClassName = (node, className) => {
    let result = node;
    while (result && !result?.classList?.contains(className)) {
        result = result.parentElement;
    }
    return result;
};

const setSliderLeft = (slider, pos) => {
    if (typeof pos === 'number' || parseInt(pos)) {
        slider.style.left = pos + 'px';
    }
};

const setSliderRight = (slider, pos) => {
    if (typeof pos === 'number' || parseInt(pos)) {
        slider.style.right = pos + 'px';
    }
};

const getCurrentImageBoundaries = (image) => {
    const content = image.querySelector('.image__content');

    let imageLeft = 0;
    let imageRight = content.offsetWidth;

    // Если у элемента с изображением установлен clipPath — вытаскиваем из него значения границ при помощи регулярного выражения
    const currentClipPath = content.style.clipPath;
    if (currentClipPath) {
        const re = /polygon\((?<left>\d+)\D*.*?,\D*(?<right>\d+)/;
        const groups = re.exec(currentClipPath)?.groups;
        imageLeft = groups?.left || imageLeft;
        imageRight = groups?.right || imageRight;
    }

    return {
        imageLeft,
        imageRight
    }
};

const setImageVisibleArea = (image, left, right) => {
    const {imageLeft, imageRight} = getCurrentImageBoundaries(image);
    const content = image.querySelector('.image__content');

    left = (left === null || left === undefined) ? imageLeft : left;
    right = (right === null || right === undefined) ? imageRight : right;

    content.style.clipPath = `polygon(${left}px 0, ${right}px 0, ${right}px 100%, ${left}px 100%)`;
}

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
    const counter = document.querySelector('#hiddenImagesNumber');
    const showAllImagesButton = document.querySelector('#showAllImagesButton');

    if (!counter || !showAllImagesButton) {
        return;
    }

    if (hiddenNum >= 1) {
        counter.textContent = getHiddenImagesNumberText(hiddenNum);
        counter.classList.remove('hidden');
        showAllImagesButton.classList.remove('hidden');
    } else {
        counter.textContent = '';
        counter.classList.add('hidden');
        showAllImagesButton.classList.add('hidden');
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
    currentImageInEdit = getAncestorByClassName(currentDraggingSliderLeft, 'image');
};

const sliderLeftDoubleClickHandler = (e) => {
    e.preventDefault();
    const target = e.target;
    const image = getAncestorByClassName(target, 'image');
    setSliderLeft(target, 0);
    setImageVisibleArea(image, 0, null);
};

const sliderRightMouseDownHandler = (e) => {
    e.preventDefault();
    currentDraggingSliderRight = e.target;
    currentImageInEdit = getAncestorByClassName(currentDraggingSliderRight, 'image');
};

const sliderRightDoubleClickHandler = (e) => {
    e.preventDefault();
    const target = e.target;
    const image = getAncestorByClassName(target, 'image');
    const content = image.querySelector('.image__content');
    setSliderRight(target, 0);
    setImageVisibleArea(image, null, content.offsetWidth);
};

const dragImageSliderHandler = (e) => {
    // Проверяем, что есть активный ползунок в состоянии перетаскивания
    if (currentDraggingSliderLeft || currentDraggingSliderRight) {
        const content = currentImageInEdit.querySelector('.image__content');

        // Вычисляем позицию курсора относительно картинки
        const currentCursorPos = e.pageX - content?.getBoundingClientRect()?.left;

        const minSlidersDistance = 10;
        let newSliderPos;

        const sliderRight = currentImageInEdit.querySelector('.image__slider_right');
        const sliderLeft = currentImageInEdit.querySelector('.image__slider_left');

        // Обрабатываем перетаскивание левого слайдера
        if (currentDraggingSliderLeft) {

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
            setSliderLeft(currentDraggingSliderLeft, newSliderPos);
        }

        // Обрабатываем перетаскивание правого слайдера
        if (currentDraggingSliderRight) {
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
            setSliderRight(currentDraggingSliderRight, content.offsetWidth - newSliderPos);
        }

        const leftBoundary = sliderLeft.offsetLeft;
        const rightBoundary = sliderRight.offsetLeft + sliderRight.offsetWidth;
        setImageVisibleArea(currentImageInEdit, leftBoundary, rightBoundary);
    }
};

const imageSliderMouseUpHandler = () => {
    currentDraggingSliderLeft = null;
    currentDraggingSliderRight = null;
};

const initCropImages = () => {
    const images = document.querySelectorAll('.image');
    images?.forEach((image) => {
        const content = image.querySelector('.image__content');
        const sliderLeft = image.querySelector('.image__slider_left');
        const sliderRight = image.querySelector('.image__slider_right');

        if (image && content && sliderLeft && sliderRight) {
            sliderLeft.addEventListener('mousedown', sliderLeftMouseDownHandler);
            sliderLeft.addEventListener('dblclick', sliderLeftDoubleClickHandler);

            sliderRight.addEventListener('mousedown', sliderRightMouseDownHandler);
            sliderRight.addEventListener('dblclick', sliderRightDoubleClickHandler);

            document.addEventListener('mousemove', dragImageSliderHandler);
            document.addEventListener('mouseup', imageSliderMouseUpHandler);
        }
    });
};

const savePreEditState = (images) => {
    preEditState = {};
    images?.forEach((image) => {
        const {imageLeft, imageRight} = getCurrentImageBoundaries(image);

        const sliderLeft = image.querySelector('.image__slider_left');
        const sliderRight = image.querySelector('.image__slider_right');

        let match = sliderLeft?.style?.left?.match(/\d+/);
        const sliderLeftPos = match?.at(0) || 0;

        match = sliderRight?.style?.right?.match(/\d+/);
        const sliderRightPos = match?.at(0) || 0;

        preEditState[image.id] = {
            imageLeft,
            imageRight,
            sliderLeftPos,
            sliderRightPos,
        };
    });
};

const enterEditMode = () => {
    // Ищем все не скрытые изображения
    const images = document.querySelectorAll('.image:not(.hidden)');
    const defaultButtons = document.querySelector('#defaultButtons');
    const editModePanel = document.querySelector('#editModePanel');

    images.forEach((image) => {
        const sliderLeft = image.querySelector('.image__slider_left');
        const sliderRight = image.querySelector('.image__slider_right');

        // Показываем ползунки
        sliderLeft?.classList.remove('hidden');
        sliderRight?.classList.remove('hidden');
    });

    // Скрываем глобальные кнопки
    defaultButtons?.classList.add('hidden');

    // Отображаем панель редактирования
    editModePanel?.classList.remove('hidden');

    // Сохраняем состояние видимых изображений до редактирования
    // К моменту сохранения состояния уже должны быть видны ползунки
    savePreEditState(images);
};

const exitEditMode = () => {
    // Ищем все не скрытые изображения
    const images = document.querySelectorAll('.image:not(.hidden)');
    const defaultButtons = document.querySelector('#defaultButtons');
    const editModePanel = document.querySelector('#editModePanel');

    images.forEach((image) => {
        const sliderLeft = image.querySelector('.image__slider_left');
        const sliderRight = image.querySelector('.image__slider_right');

        // Скрываем ползунки
        sliderLeft?.classList.add('hidden');
        sliderRight?.classList.add('hidden');
    });

    // Отображаем глобальные кнопки
    defaultButtons?.classList.remove('hidden');

    // Скрываем панель редактирования
    editModePanel?.classList.add('hidden');
};

const editButtonClickHandler = (e) => {
    enterEditMode();
};

const resetPreEditState = () => {
    preEditState = null;
};

const confirmEditButtonClickHandler = () => {
    resetPreEditState();
    exitEditMode();
};

const recoverToPreEditState = () => {
    Object.entries(preEditState).forEach((entry) => {
        const [id, positions] = entry;

        const image = document.querySelector(`#${id}`);
        const sliderLeft = image.querySelector(`.image__slider_left`);
        const sliderRight = image.querySelector(`.image__slider_right`);

        setSliderLeft(sliderLeft, positions.sliderLeftPos);
        setSliderRight(sliderRight, positions.sliderRightPos);
        setImageVisibleArea(image, positions.imageLeft, positions.imageRight);
    })
};

const cancelEditButtonClickHandler = () => {
    recoverToPreEditState();
    exitEditMode();
};

const initEditingButtons = () => {
    const editButton = document.querySelector('#edit');
    editButton?.addEventListener('click', editButtonClickHandler);

    const confirmEditButton = document.querySelector('#confirmEdit');
    confirmEditButton?.addEventListener('click', confirmEditButtonClickHandler);

    const cancelEditButton = document.querySelector('#cancelEdit');
    cancelEditButton?.addEventListener('click', cancelEditButtonClickHandler);
};

document.addEventListener('DOMContentLoaded', () => {
    initHideImageButtonsHandlers();
    initShowAllImagesButtonHandler();
    initImagesObserving();
    initCropImages();
    initEditingButtons();
});