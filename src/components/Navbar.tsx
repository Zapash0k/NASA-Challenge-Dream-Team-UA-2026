import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { missionDayOf, useMission } from '../core/missionControler';

export default function Navbar() {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const isActive = (path: string) =>
        location.pathname === path
            ? 'text-emerald-400 border-b-2 border-emerald-400 pb-1 font-semibold'
            : 'text-neutral-400 hover:text-white transition-colors pb-1';

    const { playerState } = useMission();
    const missionDay = missionDayOf(playerState);

    // Закривати меню при переході на іншу сторінку
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Відстеження свайпів вліво (відкрити) та вправо (закрити) на мобільних екранах
    useEffect(() => {
        let startX = 0;
        let startY = 0;

        const handleTouchStart = (e: TouchEvent) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (window.innerWidth >= 768) return;

            const deltaX = e.changedTouches[0].clientX - startX;
            const deltaY = e.changedTouches[0].clientY - startY;

            // Ігноруємо вертикальний скрол сторінки
            if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;

            if (deltaX > 50) {
                // Свайп вліво — відкриваємо ліву панель
                setIsOpen(true);
            } else if (deltaX < -50) {
                // Свайп вправо — закриваємо панель
                setIsOpen(false);
            }
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);

    return (
        <header className="border-b border-neutral-800 pb-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-neutral-400">
                        MISSION DAY(nominal): <strong className="text-white">{missionDay}</strong>
                    </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
                    OrbitWell
                </h1>
                <span>Wellness in every orbit</span>
            </div>
            <button
                type="button"
                className="mobile-nav-trigger"
                aria-label="Open navigation menu"
                onClick={() => setIsOpen(true)}
            >
                <span>☰</span>
                <span>Menu</span>
            </button>
            {/* Затемнення фону при відкритому мобільному меню */}
            <div
                className={`mobile-nav-backdrop ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Навігаційні посилання (виїжджаюча панель на мобільному / рядок на ПК) */}
            <nav className={`navigation ${isOpen ? 'open' : ''}`}>
                <button
                    type="button"
                    className="mobile-nav-close"
                    aria-label="Close menu"
                    onClick={() => setIsOpen(false)}
                >
                    ×
                </button>

                <Link to="/" className={isActive('/')} onClick={() => setIsOpen(false)}>
                    Dashboard
                </Link>
                <Link to="/body" className={isActive('/body')} onClick={() => setIsOpen(false)}>
                    Body Map
                </Link>
                <Link to="/measure" className={isActive('/measure')} onClick={() => setIsOpen(false)}>
                    Manual Measure
                </Link>
                <Link to="/mission" className={isActive('/mission')} onClick={() => setIsOpen(false)}>
                    Mission Sim
                </Link>
            </nav>
        </header>
    );
}