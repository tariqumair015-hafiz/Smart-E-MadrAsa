import { useCallback, useRef } from 'react';

export function useScrollRestoration(key, isHorizontal = false) {
    const scrollTimeout = useRef(null);

    // useCallback ka faida yeh hai ke yeh tab khud chalega jab "Loading" khatam hogi
    const scrollRef = useCallback((element) => {
        // Agar abhi loading chal rahi hai aur element nahi bana, tou ruk jao
        if (!element) return;

        // 1. Kitabein screen par aate hi purani jagah par scroll kar do
        const savedPos = sessionStorage.getItem(`scroll_${key}`);
        if (savedPos) {
            setTimeout(() => {
                if (isHorizontal) {
                    element.scrollLeft = parseInt(savedPos, 10);
                } else {
                    element.scrollTop = parseInt(savedPos, 10);
                }
            }, 100); // 100ms delay taake kitabein theek se set ho jayen
        }

        // 2. Scroll karne par nayi jagah chupke se save karo
        const handleScroll = () => {
            clearTimeout(scrollTimeout.current);
            scrollTimeout.current = setTimeout(() => {
                const pos = isHorizontal ? element.scrollLeft : element.scrollTop;
                sessionStorage.setItem(`scroll_${key}`, pos.toString());
            }, 150);
        };

        // Puraane listeners hata kar naya lagana (Double firing se bachne ke liye)
        element.removeEventListener('scroll', handleScroll);
        element.addEventListener('scroll', handleScroll);

    }, [key, isHorizontal]);

    return scrollRef;
}