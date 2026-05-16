import "../../app.css";
import Game from "../Engine/Game/Game";

if (process.env.NODE_ENV === 'development') {
    window.addEventListener('beforeunload', event => {
        delete event.returnValue;
        Object.defineProperty(event, 'returnValue', {
            get: () => undefined,
            set: () => { },
            configurable: true
        });
    }, true);
}