import { useRef, useLayoutEffect } from 'react';

const windowExists = typeof window !== `undefined`;

const getWindowSize = () => {
  if (!windowExists)
    return { innerHeight: 0, innerWidth: 0, outerHeight: 0, outerWidth: 0 };

  const { innerHeight, innerWidth, outerHeight, outerWidth } = { ...window };

  return { innerHeight, innerWidth, outerHeight, outerWidth };
};

export function useWindowResize(effect, deps, throttleInterval = 0) {
  const windowSize = useRef(getWindowSize());
  const throttleTimeout = useRef(null);

  const doGetWindowSize = () => {
    const newWindowSize = getWindowSize();

    // call effect
    effect({ previous: windowSize.current, current: newWindowSize });
    windowSize.current = newWindowSize;
    throttleTimeout.current = null;
  };

  useLayoutEffect(() => {
    const handleResize = () => {
      if (throttleInterval) {
        if (throttleTimeout.current === null) {
          throttleTimeout.current = setTimeout(
            doGetWindowSize,
            throttleInterval
          );
        }
      } else {
        doGetWindowSize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}