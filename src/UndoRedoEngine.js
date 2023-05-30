class UndoRedoEngine {

    toUndo;
    toRedo;
    eventListeners;

    constructor() {
        this.toUndo = [];
        this.toRedo = [];
        this.eventListeners = {
            'add': [],
            'undo': [],
            'redo': []
        }
    };

    add = (event) => {
        if (!event || typeof(event) !== 'object') {
            throw new Error('No event is passed.');
        }

        const absenceData = [];
        if (!event.hasOwnProperty('target')) {
            absenceData.push('target');
        }
        if (!event.hasOwnProperty('undo')) {
            absenceData.push('undo');
        }
        if (!event.hasOwnProperty('redo')) {
            absenceData.push('redo');
        }
        if (absenceData.length > 0) {
            throw new Error(`Event doesn't contain necessary data: ${absenceData.join(', ')}.`)
        }

        // Добавляем событие в список на отмену
        this.toUndo.push(event);

        // Если список на восстановление не пуст — очищаем его
        if (this.toRedo.length > 0) {
            this.toRedo.splice(0, this.toRedo.length);
        }

        const result = {
            toUndo: this.toUndo.length,
            toRedo: this.toRedo.length
        };

        // Вызываем все слушателей события о добавлении
        this.eventListeners['add'].forEach(listener => listener(result));

        return result;
    };

    merge = (other) => {
        if (!(other instanceof UndoRedoEngine)) {
            throw new Error('Object has invalid class.')
        }

        this.toUndo = this.toUndo.concat(other.toUndo);
        this.toRedo = other.toRedo;

        return {
            toUndo: this.toUndo.length,
            toRedo: this.toRedo.length
        };
    };

    undo = () => {
        // Достаем последнее событие из списка на отмену
        const eventToUndo = this.toUndo.pop();

        if (eventToUndo) {
            // Далем отмену
            eventToUndo.undo(eventToUndo.target);

            // Добавляем событие в список на восстановление
            this.toRedo.push(eventToUndo);
        }

        const result = {
            toUndo: this.toUndo.length,
            toRedo: this.toRedo.length
        };

        // Вызываем все слушателей события об отмене
        this.eventListeners['undo'].forEach(listener => listener(result));

        return result;
    };

    redo = () => {
        // Достаем последнее событие из списка на восстановление
        const eventToRedo = this.toRedo.pop();

        if (eventToRedo) {
            // Далем восстановление
            eventToRedo.redo(eventToRedo.target);

            // Добавляем событие в список на отмену
            this.toUndo.push(eventToRedo);
        }

        const result = {
            toUndo: this.toUndo.length,
            toRedo: this.toRedo.length
        };

        // Вызываем все слушателей события о восстановлении
        this.eventListeners['redo'].forEach(listener => listener(result));

        return result;
    };

    getCurrentState = () => {
        return {
            toUndo: this.toUndo.length,
            toRedo: this.toRedo.length
        };
    };

    addEventListener = (type, listener) => {
        if (!this.eventListeners.hasOwnProperty(type)) {
            throw new Error('Unknown type of event.')
        }

        if (this.eventListeners[type].indexOf(listener) === -1) {
            this.eventListeners[type].push(listener);
        }
    };

    removeEventListener = (type, listener) => {
        if (!this.eventListeners.hasOwnProperty(type)) {
            throw new Error('Unknown type of event.')
        }

        const index = this.eventListeners[type].indexOf(listener);
        if (index !== -1) {
            this.eventListeners[type].splice(index, 1);
        }
    };
};