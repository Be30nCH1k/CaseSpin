import { useRef, useEffect } from 'react';

const SPIN_TURNS = 6;
const SPIN_MS = 4000;
const easing = (t: number): number => 1 - Math.pow(1 - t, 4);

export const useWheelAnimation = (
    setNeedleDeg: (deg: number) => void,
    onComplete: () => void
) => {
    const rafRef = useRef<number>(0);
    const fromDeg = useRef(0);

    const animateNeedle = (targetAngle: number, onDone: () => void) => {
        const start = fromDeg.current % 360;
        const total = SPIN_TURNS * 360 + targetAngle;
        const t0 = performance.now();

        const tick = (now: number) => {
            const t = Math.min((now - t0) / SPIN_MS, 1);
            const eased = easing(t);
            const deg = start + eased * (total - start);
            setNeedleDeg(deg % 360);

            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                fromDeg.current = targetAngle;
                setNeedleDeg(targetAngle);
                onDone();
            }
        };

        rafRef.current = requestAnimationFrame(tick);
    };

    const resetNeedle = () => {
        setNeedleDeg(0);
        fromDeg.current = 0;
    };

    useEffect(() => {
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return { animateNeedle, resetNeedle };
};