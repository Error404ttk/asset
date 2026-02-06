import React, { useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';

interface ImageModalProps {
    isOpen: boolean;
    imageUrl: string;
    altText?: string;
    onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, imageUrl, altText = 'Full screen image', onClose }) => {
    const [scale, setScale] = React.useState(1);
    const [isDragging, setIsDragging] = React.useState(false);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setScale(1);
            setPosition({ x: 0, y: 0 });
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        if (e.deltaY < 0) {
            setScale(s => Math.min(s + 0.1, 4));
        } else {
            setScale(s => Math.max(s - 0.1, 1));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            e.preventDefault();
            setIsDragging(true);
            setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            e.preventDefault();
            setPosition({
                x: e.clientX - startPos.x,
                y: e.clientY - startPos.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            {/* Toolbar */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-[101]" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-800/80 rounded-full flex items-center p-1 border border-slate-700">
                    <button
                        onClick={() => setScale(s => Math.max(s - 0.25, 1))}
                        className="p-2 text-white hover:text-blue-300 hover:bg-white/10 rounded-full transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut size={20} />
                    </button>
                    <span className="text-xs text-slate-300 w-12 text-center font-mono">{Math.round(scale * 100)}%</span>
                    <button
                        onClick={() => setScale(s => Math.min(s + 0.25, 4))}
                        className="p-2 text-white hover:text-blue-300 hover:bg-white/10 rounded-full transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn size={20} />
                    </button>
                    <div className="w-px h-6 bg-slate-600 mx-1"></div>
                    <button
                        onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
                        className="p-2 text-white hover:text-blue-300 hover:bg-white/10 rounded-full transition-colors"
                        title="Reset"
                    >
                        <Minimize size={20} />
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="p-3 bg-red-600/80 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Image Container */}
            <div
                className="relative w-full h-full flex items-center justify-center overflow-hidden p-4"
                onWheel={handleWheel}
            >
                <img
                    src={imageUrl}
                    alt={altText}
                    className={`max-w-full max-h-full object-contain transition-transform duration-100 ${isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'}`}
                    style={{
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (scale === 1) {
                            setScale(1.5); // Quick zoom on click
                        }
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    draggable={false}
                />

                {scale === 1 && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm pointer-events-none backdrop-blur-sm">
                        Scroll to zoom • Drag to pan
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageModal;
