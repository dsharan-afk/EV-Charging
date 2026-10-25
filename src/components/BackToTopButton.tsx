import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      id="back-to-top-btn"
      onClick={scrollToTop}
      className="fixed bottom-20 right-6 z-40 p-2.5 rounded-full bg-neutral-900/90 border border-neutral-700/80 text-neutral-300 hover:text-white hover:border-emerald-500 shadow-xl backdrop-blur-sm transition-all hover:scale-110 active:scale-95 no-print"
      title="Back to top"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
};
