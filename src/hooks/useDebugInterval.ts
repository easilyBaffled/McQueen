import { useEffect, useRef } from 'react';
import { useDebugStore } from '../store/debugStore';

export function useDebugInterval(callback: () => void, delay: number) {
  const { isPaused } = useDebugStore();
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (isPaused || delay === null) return;
    
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay, isPaused]);
}