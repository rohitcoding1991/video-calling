import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const TABLET_MIN = 768;
const DESKTOP_MIN = 1025;

const getBreakpoint = (width: number): Breakpoint => {
  if (width < TABLET_MIN) return 'mobile';
  if (width < DESKTOP_MIN) return 'tablet';
  return 'desktop';
};

export const useBreakpoint = (): Breakpoint => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
    getBreakpoint(window.innerWidth)
  );

  useEffect(() => {
    const tabletMql = window.matchMedia(`(min-width: ${TABLET_MIN}px)`);
    const desktopMql = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);

    const update = () => {
      setBreakpoint(getBreakpoint(window.innerWidth));
    };

    tabletMql.addEventListener('change', update);
    desktopMql.addEventListener('change', update);

    return () => {
      tabletMql.removeEventListener('change', update);
      desktopMql.removeEventListener('change', update);
    };
  }, []);

  return breakpoint;
};
