

export function CRTOverlay() {
    return (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden mix-blend-overlay">
            {/* Scanlines */}
            <div
                className="w-full h-full opacity-30"
                style={{
                    backgroundImage: "linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.2) 50%)",
                    backgroundSize: "100% 4px"
                }}
            />

            {/* Curved CRT Shadow vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />

            {/* RGB split simulation softly */}
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />
        </div>
    )
}
