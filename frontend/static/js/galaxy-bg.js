// ==================== ANIMATED GALAXY BACKGROUND ====================
(function() {
    'use strict';

    let canvas, ctx;
    let stars = [];
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let animationId = null;

    // Galaxy palette colors (from existing CSS variables)
    const COLORS = {
        bgPrimary: '#0B0E16',
        bgSecondary: '#0F1C3D',
        bgTertiary: '#182952',
        accentPrimary: '#5D8BF4',
        accentSecondary: '#1F4068',
        textPrimary: '#F7F7FF'
    };

    function initGalaxyBackground() {
        canvas = document.getElementById('galaxyBgCanvas');
        if (!canvas) return;

        ctx = canvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Initialize stars
        createStars();

        // Mouse/touch tracking for parallax
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchmove', handleTouchMove, { passive: true });

        // Start animation
        animate();
    }

    function resizeCanvas() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        createStars(); // Recreate stars on resize
    }

    function createStars() {
        const starCount = Math.floor((canvas.width * canvas.height) / 12000);
        stars = [];

        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                twinklePhase: Math.random() * Math.PI * 2,
                parallaxFactor: Math.random() * 0.5 + 0.3, // Depth effect
            });
        }
    }

    function handleMouseMove(e) {
        targetMouseX = e.clientX;
        targetMouseY = e.clientY;
    }

    function handleTouchMove(e) {
        if (e.touches.length > 0) {
            targetMouseX = e.touches[0].clientX;
            targetMouseY = e.touches[0].clientY;
        }
    }

    function drawNebula() {
        const time = Date.now() * 0.0001;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Multiple nebula layers for depth
        const nebulas = [
            {
                x: centerX + Math.sin(time * 0.3) * 200,
                y: centerY + Math.cos(time * 0.2) * 150,
                radius: canvas.width * 0.8,
                color: COLORS.bgTertiary,
                opacity: 0.15
            },
            {
                x: centerX + Math.cos(time * 0.25) * -180,
                y: centerY + Math.sin(time * 0.3) * 200,
                radius: canvas.width * 0.6,
                color: COLORS.accentSecondary,
                opacity: 0.12
            },
            {
                x: centerX + Math.sin(time * 0.2) * 150,
                y: centerY + Math.cos(time * 0.35) * -170,
                radius: canvas.width * 0.5,
                color: COLORS.accentPrimary,
                opacity: 0.08
            }
        ];

        nebulas.forEach(nebula => {
            const gradient = ctx.createRadialGradient(
                nebula.x, nebula.y, 0,
                nebula.x, nebula.y, nebula.radius
            );
            gradient.addColorStop(0, nebula.color + Math.floor(nebula.opacity * 255).toString(16).padStart(2, '0'));
            gradient.addColorStop(0.5, nebula.color + Math.floor(nebula.opacity * 0.5 * 255).toString(16).padStart(2, '0'));
            gradient.addColorStop(1, COLORS.bgPrimary + '00');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
    }

    function drawStars() {
        const time = Date.now() * 0.001;
        const parallaxOffsetX = (mouseX - canvas.width / 2) * 0.02;
        const parallaxOffsetY = (mouseY - canvas.height / 2) * 0.02;

        stars.forEach(star => {
            // Twinkling effect
            const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
            const currentOpacity = star.opacity * twinkle;

            // Parallax movement based on mouse
            const parallaxX = star.x + parallaxOffsetX * star.parallaxFactor;
            const parallaxY = star.y + parallaxOffsetY * star.parallaxFactor;

            // Draw star glow
            const glowGradient = ctx.createRadialGradient(
                parallaxX, parallaxY, 0,
                parallaxX, parallaxY, star.radius * 3
            );
            glowGradient.addColorStop(0, COLORS.textPrimary + Math.floor(currentOpacity * 255).toString(16).padStart(2, '0'));
            glowGradient.addColorStop(0.5, COLORS.accentPrimary + Math.floor(currentOpacity * 0.5 * 255).toString(16).padStart(2, '0'));
            glowGradient.addColorStop(1, COLORS.textPrimary + '00');

            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(parallaxX, parallaxY, star.radius * 3, 0, Math.PI * 2);
            ctx.fill();

            // Draw star core
            ctx.fillStyle = COLORS.textPrimary + Math.floor(currentOpacity * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(parallaxX, parallaxY, star.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function animate() {
        // Smooth mouse tracking
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        // Clear canvas
        ctx.fillStyle = COLORS.bgPrimary;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw nebula layers
        drawNebula();

        // Draw stars
        drawStars();

        animationId = requestAnimationFrame(animate);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGalaxyBackground);
    } else {
        initGalaxyBackground();
    }
})();

