import {useEffect, useRef} from "react";

export const useInterval = (period: number, callback: () => void) => {
    const ref = useRef<() => void>(callback);
    ref.current = callback;

    useEffect(() => {
        const interval = setInterval(() => ref.current(), period);

        return () => clearInterval(interval);
    }, [period, ref]);
};
