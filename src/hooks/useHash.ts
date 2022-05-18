import {useState} from "react";
import {useEventListener} from "./useEventListener";

export const useHash = () => {
    const [hash, setHash] = useState(window.location.hash);

    useEventListener(window, "hashchange", () => setHash(window.location.hash));

    return hash;
};
