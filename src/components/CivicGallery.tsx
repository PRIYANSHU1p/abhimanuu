import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const images = [
    { url: "/image/one.avif", title: "Infrastructure Repair", category: "Roads" },
    { url: "/image/two.jpg", title: "Sanitation Drive", category: "Cleanup" },
    { url: "/image/three.jpg", title: "Water Management", category: "Utility" },
    { url: "/image/four.webp", title: "Public Lighting", category: "Energy" },
    { url: "/image/five.avif", title: "Community Welfare", category: "Social" },
    { url: "/image/six.avif", title: "Urban Greenery", category: "Environment" },
    { url: "/image/seven.jpg", title: "Traffic Management", category: "Safety" },
    { url: "/image/nine.jpg", title: "Public Health", category: "Health" },
    { url: "/image/ten.avif", title: "Emergency Services", category: "Rescue" }
];

export const CivicGallery = ({ language }: { language: 'en' | 'hi' }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const nextSlide = () => {
        setDirection(1);
        setActiveIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = () => {
        setDirection(-1);
        setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    useEffect(() => {
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, []);

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
            scale: 1.1
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0,
            scale: 0.9
        })
    };

    return (
        <div className="relative h-[350px] w-full max-w-full mx-auto rounded-[2rem] overflow-hidden bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800 shadow-2xl group shadow-blue-500/10">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={activeIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.6 },
                        scale: { duration: 0.8 }
                    }}
                    className="absolute inset-0"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 dark:from-slate-950/90 via-slate-900/20 dark:via-slate-950/20 to-transparent z-10" />
                    <img 
                        src={images[activeIndex].url} 
                        alt={images[activeIndex].title}
                        className="h-full w-full object-cover"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="absolute bottom-8 left-8 z-20"
                    >
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20 mb-2 inline-block backdrop-blur-md">
                            {images[activeIndex].category}
                        </span>
                        <h3 className="text-3xl font-black text-white italic tracking-tight">
                            {images[activeIndex].title}
                        </h3>
                        <p className="text-slate-400 text-xs mt-1 max-w-md font-medium">
                            {language === 'hi' ? 'नागरिकों द्वारा रिपोर्ट किया गया और अधिकारियों द्वारा हल किया गया।' : 'Reported by citizens and resolved by authorities.'}
                        </p>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
            
            <div className="absolute bottom-8 right-8 flex gap-2 z-30">
                <button 
                    onClick={prevSlide} 
                    className="h-10 w-10 rounded-xl bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white hover:bg-primary transition-all hover:scale-105 active:scale-95 shadow-2xl"
                >
                    <ChevronLeft size={20} />
                </button>
                <button 
                    onClick={nextSlide} 
                    className="h-10 w-10 rounded-xl bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white hover:bg-primary transition-all hover:scale-105 active:scale-95 shadow-2xl"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
                {images.map((_, i) => (
                    <button 
                        key={i}
                        onClick={() => {
                            setDirection(i > activeIndex ? 1 : -1);
                            setActiveIndex(i);
                        }}
                        className={`h-1 transition-all duration-500 rounded-full ${i === activeIndex ? 'w-8 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
                    />
                ))}
            </div>
        </div>
    );
};

