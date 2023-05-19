const hideImage = (image) => {
    image?.classList?.add('hidden');
};

const handleHideButtonClick = (event) => {
    const button = event.target;
    let parent = button?.parentNode;

    // Поднимаемся по DOM-дереву в поисках нужного предка нажатой кнопки
    while (parent?.className?.split(' ')?.indexOf('image') === -1) {
        parent = parent?.parentNode;
    }
    hideImage(parent);
};

const handleShowAllButtonClick = () => {
    const images = document.querySelectorAll('div.image');
    images?.forEach((image) => {
        image.classList.remove('hidden');
    });
};

const initImageHideButtonsHandlers = () => {
    const imageHideButtons = document.querySelectorAll('.image__hideButton');
    imageHideButtons?.forEach((button) => {
        button.onclick = handleHideButtonClick
    });
};

const initShowAllImagesButtonHandler = () => {
    const showAllImagesButton = document.querySelector('#showAllImagesButton');
    if (showAllImagesButton) {
        showAllImagesButton.onclick = handleShowAllButtonClick;
    }
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

window.onload = () => {
    initImageHideButtonsHandlers();
    initShowAllImagesButtonHandler();
    initImagesObserving();
};