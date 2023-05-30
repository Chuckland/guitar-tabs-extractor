let currentDraggingSliderLeft;
let currentDraggingSliderRight;
let currentImageInEdit;
let preEditState;
let undoRedoEngines = [new UndoRedoEngine()];

// Переменная для хранения информации о действии по перетаскиванию слайдера для реализации анду/реду
let currentEventToUndoRedo;

// Флаг для того, чтобы отличить двойное нажатие мыши на слайдер от перетаскивания слайдера
let isDragging = false;

const getAncestorByClassName = (node, className) => {
    let result = node;
    while (result && !result?.classList?.contains(className)) {
        result = result.parentElement;
    }
    return result;
};

const show = (element) => {
    element?.classList.remove('hidden');
};

const hide = (element) => {
    element?.classList.add('hidden');
};

const disable = (element) => {
    element.setAttribute('disabled', true);
};

const enable = (element) => {
    element?.removeAttribute('disabled');
};

const undoSliderLeft = (target) => {
    const {image, slider, positionBefore, boundariesBefore} = target;
    setSliderLeft(slider, positionBefore);
    setImageVisibleArea(image, boundariesBefore.imageLeft, boundariesBefore.imageRight);
};

const redoSliderLeft = (target) => {
    const {image, slider, positionAfter, boundariesAfter} = target;
    setSliderLeft(slider, positionAfter);
    setImageVisibleArea(image, boundariesAfter.imageLeft, boundariesAfter.imageRight);
};

const undoSliderRight = (target) => {
    const {image, slider, positionBefore, boundariesBefore} = target;
    setSliderRight(slider, positionBefore);
    setImageVisibleArea(image, boundariesBefore.imageLeft, boundariesBefore.imageRight);
};

const redoSliderRight = (target) => {
    const {image, slider, positionAfter, boundariesAfter} = target;
    setSliderRight(slider, positionAfter);
    setImageVisibleArea(image, boundariesAfter.imageLeft, boundariesAfter.imageRight);
};

const getSliderLeftPosition = (image) => {
    const sliderLeft = image.querySelector('.image__slider_left');
    let match = sliderLeft?.style?.left?.match(/\d+/);
    return match?.at(0) || 0;
};

const getSliderRightPosition = (image) => {
    const sliderRight = image.querySelector('.image__slider_right');
    match = sliderRight?.style?.right?.match(/\d+/);
    return match?.at(0) || 0;
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

const handleHideButtonClick = (event) => {
    const button = event.target;
    const image = getAncestorByClassName(button, 'image');
    hide(image);

    undoRedoEngines.at(0)?.add({
        target: image,
        undo: show,
        redo: hide,
    });
};

const handleShowAllButtonClick = () => {
    const hiddenImages = document.querySelectorAll('.image.hidden');

    const showImages = (images) => {
        images?.forEach((image) => {
            show(image);
        });
    };

    const hideImages = (images) => {
        images?.forEach((image) => {
            hide(image);
        });
    };

    showImages(hiddenImages);

    undoRedoEngines.at(0).add({
        target: hiddenImages,
        undo: hideImages,
        redo: showImages,
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
        show(counter);
        show(showAllImagesButton);
    } else {
        counter.textContent = '';
        hide(counter);
        hide(showAllImagesButton);
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

    // Фиксируем слайдер и изображение, над которыми осуществляется действие
    currentDraggingSliderLeft = e.target;
    currentImageInEdit = getAncestorByClassName(currentDraggingSliderLeft, 'image');

    // Фиксируем часть информации о действии для реализации анду / реду
    currentEventToUndoRedo = {
        target: {
            image: currentImageInEdit,
            slider: currentDraggingSliderLeft,
            boundariesBefore: getCurrentImageBoundaries(currentImageInEdit),
            positionBefore: getSliderLeftPosition(currentImageInEdit)
        },
        undo: undoSliderLeft,
        redo: redoSliderLeft
    };
};

const sliderLeftDoubleClickHandler = (e) => {
    e.preventDefault();

    const slider = e.target;
    const image = getAncestorByClassName(slider, 'image');

    // Фиксируем состояния до действия
    const boundariesBefore = getCurrentImageBoundaries(image);
    const positionBefore = getSliderLeftPosition(image);

    // Осуществляем действие
    setSliderLeft(slider, 0);
    setImageVisibleArea(image, 0, null);

    // Фиксируем информацию о действии для реализации анду / реду
    const eventToUndoRedo = {
        target: {
            image,
            slider,
            boundariesBefore,
            boundariesAfter: getCurrentImageBoundaries(image),
            positionBefore,
            positionAfter: 0
        },
        undo: undoSliderLeft,
        redo: redoSliderRight
    };

    // Добавляем действие в движок анду / реду
    undoRedoEngines.at(0).add(eventToUndoRedo);

    currentEventToUndoRedo = null;
};

const sliderRightMouseDownHandler = (e) => {
    e.preventDefault();

    // Фиксируем слайдер и изображение, над которыми осуществляется действие
    currentDraggingSliderRight = e.target;
    currentImageInEdit = getAncestorByClassName(currentDraggingSliderRight, 'image');

    // Фиксируем часть информации о действии для реализации анду / реду
    currentEventToUndoRedo = {
        target: {
            image: currentImageInEdit,
            slider: currentDraggingSliderRight,
            boundariesBefore: getCurrentImageBoundaries(currentImageInEdit),
            positionBefore: getSliderRightPosition(currentImageInEdit)
        },
        undo: undoSliderRight,
        redo: redoSliderRight
    };
};

const sliderRightDoubleClickHandler = (e) => {
    e.preventDefault();

    const slider = e.target;
    const image = getAncestorByClassName(slider, 'image');
    const content = image.querySelector('.image__content');

    // Фиксируем состояния до действия
    const boundariesBefore = getCurrentImageBoundaries(image);
    const positionBefore = getSliderRightPosition(image);

    // Осуществляем действие
    setSliderRight(slider, 0);
    setImageVisibleArea(image, null, content.offsetWidth);

    // Фиксируем информацию о действии для реализации анду / реду
    const eventToUndoRedo = {
        target: {
            image,
            slider,
            boundariesBefore,
            boundariesAfter: getCurrentImageBoundaries(image),
            positionBefore,
            positionAfter: 0
        },
        undo: undoSliderRight,
        redo: redoSliderRight
    };

    // Добавляем действие в движок анду / реду
    undoRedoEngines.at(0).add(eventToUndoRedo);

    currentEventToUndoRedo = null;
};

const dragImageSliderHandler = (e) => {
    // Проверяем, что есть активный ползунок в состоянии перетаскивания
    if (currentDraggingSliderLeft || currentDraggingSliderRight) {
        isDragging = true;

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

            if (currentEventToUndoRedo) {
                currentEventToUndoRedo.target.positionAfter = getSliderLeftPosition(currentImageInEdit);
            }
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

            if (currentEventToUndoRedo) {
                currentEventToUndoRedo.target.positionAfter = getSliderRightPosition(currentImageInEdit);
            }
        }

        const leftBoundary = sliderLeft.offsetLeft;
        const rightBoundary = sliderRight.offsetLeft + sliderRight.offsetWidth;
        setImageVisibleArea(currentImageInEdit, leftBoundary, rightBoundary);

        if (currentEventToUndoRedo) {
            currentEventToUndoRedo.target.boundariesAfter = getCurrentImageBoundaries(currentImageInEdit);
        }
    }
};

const imageSliderMouseUpHandler = () => {
    currentDraggingSliderLeft = null;
    currentDraggingSliderRight = null;

    if (currentEventToUndoRedo && isDragging) {
        undoRedoEngines.at(0).add(currentEventToUndoRedo);
    }
    currentEventToUndoRedo = null;
    isDragging = false;
};

const initCropImages = () => {
    const images = document.querySelectorAll('.image');
    images?.forEach((image) => {
        const content = image.querySelector('.image__content');
        const sliderLeft = image.querySelector('.image__slider_left');
        const sliderRight = image.querySelector('.image__slider_right');

        if (image && content && sliderLeft && sliderRight) {
            sliderLeft.addEventListener('dblclick', sliderLeftDoubleClickHandler);
            sliderRight.addEventListener('dblclick', sliderRightDoubleClickHandler);

            sliderLeft.addEventListener('mousedown', sliderLeftMouseDownHandler);
            sliderRight.addEventListener('mousedown', sliderRightMouseDownHandler);

            document.addEventListener('mousemove', dragImageSliderHandler);
            document.addEventListener('mouseup', imageSliderMouseUpHandler);
        }
    });
};

const savePreEditState = (images) => {
    preEditState = {};
    images?.forEach((image) => {
        const {imageLeft, imageRight} = getCurrentImageBoundaries(image);
        preEditState[image.id] = {
            imageLeft,
            imageRight,
            sliderLeftPos: getSliderLeftPosition(image),
            sliderRightPos: getSliderRightPosition(image),
        };
    });
};

const enterEditMode = () => {
    // Ищем все не скрытые изображения
    const images = document.querySelectorAll('.image:not(.hidden)');

    images.forEach((image) => {
        // Показываем ползунки
        const sliderLeft = image.querySelector('.image__slider_left');
        show(sliderLeft);

        const sliderRight = image.querySelector('.image__slider_right');
        show(sliderRight);
    });

    // Скрываем глобальные кнопки
    const showAllImagesBlock = document.querySelector('#showAllImages');
    hide(showAllImagesBlock);

    const editButton = document.querySelector('#edit');
    hide(editButton);

    // Отображаем панель редактирования
    const background = document.querySelector('.globalButtons__editModeBackground');
    show(background);

    const label = document.querySelector('.globalButtons__editModeLabel');
    show(label);

    const confirmButton = document.querySelector('#confirmEdit');
    show(confirmButton);

    const cancelButton = document.querySelector('#cancelEdit');
    show(cancelButton);

    // Добавляем отдельный движок отмены действий
    // Он будет действовать в рамках текущего режима редактирования
    undoRedoEngines = [new UndoRedoEngine()].concat(undoRedoEngines);
    undoRedoEngines.at(0)?.addEventListener('add', updateUndoRedoButtonStates);
    undoRedoEngines.at(0)?.addEventListener('undo', updateUndoRedoButtonStates);
    undoRedoEngines.at(0)?.addEventListener('redo', updateUndoRedoButtonStates);
    updateUndoRedoButtonStates(undoRedoEngines.at(0).getCurrentState());

    // Сохраняем состояние видимых изображений до редактирования
    // К моменту сохранения состояния уже должны быть видны ползунки
    savePreEditState(images);
};

const exitEditMode = () => {
    // Ищем все не скрытые изображения
    const images = document.querySelectorAll('.image:not(.hidden)');

    images.forEach((image) => {
        // Скрываем ползунки
        const sliderLeft = image.querySelector('.image__slider_left');
        hide(sliderLeft);

        const sliderRight = image.querySelector('.image__slider_right');
        hide(sliderRight);
    });

    // Отображаем глобальные кнопки
    const showAllImagesBlock = document.querySelector('#showAllImages');
    show(showAllImagesBlock);

    const editButton = document.querySelector('#edit');
    show(editButton);

    // Скрываем панель редактирования
    const background = document.querySelector('.globalButtons__editModeBackground');
    hide(background);

    const label = document.querySelector('.globalButtons__editModeLabel');
    hide(label);

    const confirmButton = document.querySelector('#confirmEdit');
    hide(confirmButton);

    const cancelButton = document.querySelector('#cancelEdit');
    hide(cancelButton);
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

    if (undoRedoEngines.length > 1) {
        // Достаём движок, который использовался в режиме редактирования
        const engine = undoRedoEngines.shift();

        // Объединяем его с движком текущим
        undoRedoEngines.at(0).merge(engine);

        updateUndoRedoButtonStates(undoRedoEngines.at(0).getCurrentState());
    }
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

    if (undoRedoEngines.length > 1) {
        // Достаём движок, который использовался в режиме редактирования
        undoRedoEngines.shift();

        updateUndoRedoButtonStates(undoRedoEngines.at(0).getCurrentState());
    }
};

const initEditingButtons = () => {
    const editButton = document.querySelector('#edit');
    editButton?.addEventListener('click', editButtonClickHandler);

    const confirmEditButton = document.querySelector('#confirmEdit');
    confirmEditButton?.addEventListener('click', confirmEditButtonClickHandler);

    const cancelEditButton = document.querySelector('#cancelEdit');
    cancelEditButton?.addEventListener('click', cancelEditButtonClickHandler);
};

const updateUndoRedoButtonStates = (state) => {
    const undoButton = document.querySelector('#undo');
    const redoButton = document.querySelector('#redo');
    const {toUndo, toRedo} = state;
    (toUndo === 0) ? disable(undoButton) : enable(undoButton);
    (toRedo === 0) ? disable(redoButton) : enable(redoButton);
};

const initUndoRedoButtonsHandlers = () => {
    const undoButton = document.querySelector('#undo');
    disable(undoButton);
    undoButton.addEventListener('click', () => {
        undoRedoEngines.at(0)?.undo();
    });

    const redoButton = document.querySelector('#redo');
    disable(redoButton);
    redoButton.addEventListener('click', () => {
        undoRedoEngines.at(0)?.redo();
    });

    undoRedoEngines.at(0)?.addEventListener('add', updateUndoRedoButtonStates);
    undoRedoEngines.at(0)?.addEventListener('undo', updateUndoRedoButtonStates);
    undoRedoEngines.at(0)?.addEventListener('redo', updateUndoRedoButtonStates);
};

document.addEventListener('DOMContentLoaded', () => {
    initUndoRedoButtonsHandlers();
    initHideImageButtonsHandlers();
    initShowAllImagesButtonHandler();
    initImagesObserving();
    initCropImages();
    initEditingButtons();
});