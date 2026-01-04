import { useEffect, useRef, useState, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: RefObject<HTMLElement>;
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const [isIntersecting, setIsIntersecting] = useState(false);

  const frozen = freezeOnceVisible && isIntersecting;

  useEffect(() => {
    const node = ref.current;
    if (!node || frozen) return;

    const observerParams = { threshold, root, rootMargin };
    const observer = new IntersectionObserver(([entry]) => {
      setEntry(entry);
      setIsIntersecting(entry.isIntersecting);
    }, observerParams);

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, frozen]);

  return { ref, isIntersecting, entry };
}

// Hook for observing multiple elements
export function useIntersectionObserverArray<T extends HTMLElement>(
  elements: (T | null)[],
  options: UseIntersectionObserverOptions = {}
): boolean[] {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
  } = options;

  const [intersecting, setIntersecting] = useState<boolean[]>([]);

  useEffect(() => {
    const validElements = elements.filter((el): el is T => el !== null);
    if (validElements.length === 0) return;

    const observerParams = { threshold, root, rootMargin };
    const observer = new IntersectionObserver((entries) => {
      setIntersecting((prev) => {
        const newState = [...prev];
        entries.forEach((entry) => {
          const index = elements.indexOf(entry.target as T);
          if (index !== -1) {
            newState[index] = entry.isIntersecting;
          }
        });
        return newState;
      });
    }, observerParams);

    validElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [elements, threshold, root, rootMargin]);

  return intersecting;
}

export default useIntersectionObserver;
