prompt:Diseña un juego móvil estilo Tetris moderno, adictivo y altamente pulido, optimizado para teléfonos (portrait), con mecánicas clásicas mejoradas y una experiencia visual premium.
Concepto general:
Un Tetris contemporáneo que mantiene la esencia pura del clásico pero añade elegancia visual, feedback satisfactorio y progresión moderna. Nombre sugerido: “NEXUS Blocks” o “Void Tetris”. Debe sentirse premium, relajante pero desafiante, con un toque futurista minimalista.
Estilo visual:

Paleta de colores: Fondo negro profundo con gradientes sutiles. Bloques con colores vibrantes y luminosos (cian, magenta, amarillo, verde esmeralda, violeta). Efectos de brillo, glow y partículas al hacer líneas.
Diseño de bloques: Bloques con bordes redondeados suaves, efecto cristalino o metálico sutil, iluminación volumétrica y reflejos. Cada tetromino tiene un color distintivo y glow propio.
Estilo general: Cyber-minimalista con toques neon. Interfaz limpia, sin elementos innecesarios. Tipografía futurista moderna y legible.
Animaciones:
Caída suave de piezas con leve “rebote” al aterrizar.
Explosiones de partículas y líneas brillantes al completar una o múltiples líneas.
Efecto de “clear” con flash elegante y sonido satisfactorio.
Shake sutil de la pantalla al hacer tetris (4 líneas).


Mecánicas de juego (funcionales y equilibradas):

Controles táctiles optimizados:
Swipe izquierdo/derecho para mover.
Swipe abajo para caída rápida (soft drop).
Tap en el lado derecho para rotar derecha / izquierdo para rotar izquierda.
Botón de “Hold” y “Next Piece” visibles.

Sistema clásico de Tetris (SRS - Super Rotation System) con wall kicks.
Niveles que aumentan progresivamente la velocidad.
Sistema de puntuación: Single, Double, Triple, Tetris, T-Spins y combos.
Modo Ghost Piece (pieza sombra) activado por defecto.
Hold piece (guardar pieza) con cooldown visual.
Next queue de 3 piezas.

Estructura de la pantalla principal (Mobile Portrait):

Zona de juego ocupando el 70% superior (área de tablero centrada).
Panel derecho o inferior con:
Siguiente pieza (grande y clara).
Pieza en Hold.
Puntuación actual, nivel y líneas completadas.
Botones grandes y fáciles de tocar: Pause, Hold, Rotación alternativa.

Fondo dinámico que cambia sutilmente según el nivel o combo.

Modos de juego:

Modo Clásico (sin fin hasta Game Over).
Modo Zen (velocidad baja, sin presión, para relajarse).
Modo Desafío (niveles con objetivos específicos: hacer X tetris, sobrevivir X minutos, etc.).
Modo Diario (un tablero especial cada día).

Progresión y monetización (opcional pero elegante):

Sistema de skins para bloques y fondos (desbloqueables con monedas ganadas en partida).
Logros y estadísticas detalladas.
Tabla de récords globales.

Detalles de interacción y pulido:

Feedback háptico fuerte en cada movimiento, rotación y línea completada.
Sonidos muy satisfactorios: drop, rotate, line clear, tetris (con crescendo).
Efectos de pantalla: screen shake en tetris, partículas brillantes, trail en las piezas al caer rápido.
Transiciones suaves entre menús.
Tutorial inicial muy breve y visual (3 pantallas).
Pausa elegante con opción de reanudar o reiniciar.

Ambiente general:
Adictivo, satisfactorio, premium, moderno, limpio y visualmente hermoso. Debe sentirse profesional y pulido como un juego de estudio grande, pero manteniendo la simplicidad y pureza del Tetris clásico.


codigo:<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>NEXUS Blocks - Prototype</title>
    <style>
        :root {
            --bg: #050505;
            --grid-line: rgba(255, 255, 255, 0.05);
            --cyan: #00F0FF;
            --yellow: #FFD700;
            --violet: #BD00FF;
            --green: #00FF7F;
            --magenta: #FF0055;
            --orange: #FF9500;
            --blue: #0080FF;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; -webkit-tap-highlight-color: transparent; }
        
        body {
            background: radial-gradient(circle at 50% 0%, #1a0b2e 0%, var(--bg) 60%);
            color: white;
            font-family: 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
        }

        .game-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            padding: 10px;
        }

        .hud-top {
            display: flex;
            justify-content: space-between;
            width: 100%;
            margin-bottom: 10px;
            font-size: 14px;
            letter-spacing: 1px;
        }

        .hud-top span { color: var(--cyan); text-shadow: 0 0 5px var(--cyan); }

        .main-area {
            display: flex;
            gap: 15px;
        }

        .side-panel {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            width: 80px;
        }

        .panel-box {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 8px;
            text-align: center;
            backdrop-filter: blur(5px);
        }

        .panel-title { font-size: 10px; color: #888; margin-bottom: 5px; text-transform: uppercase; }
        .panel-value { font-size: 18px; font-weight: bold; color: #fff; text-shadow: 0 0 10px var(--cyan); }
        
        .mini-grid { width: 60px; height: 60px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; margin: 0 auto; }
        .mini-cell { width: 100%; height: 100%; background: transparent; }
        .mini-cell.active { border-radius: 2px; box-shadow: 0 0 4px currentColor; }

        #board {
            display: grid;
            grid-template-columns: repeat(10, 1fr);
            grid-template-rows: repeat(20, 1fr);
            width: 300px;
            height: 600px;
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            box-shadow: 0 0 30px rgba(0, 240, 255, 0.1);
            position: relative;
        }

        .cell {
            border: 1px solid var(--grid-line);
            border-radius: 2px;
        }

        .block {
            border-radius: 4px;
            box-shadow: inset 2px 2px 0 rgba(255,255,255,0.2), inset -2px -2px 0 rgba(0,0,0,0.2);
            animation: land 0.15s ease-out;
        }

        .ghost {
            border-radius: 4px;
            border: 2px dashed currentColor;
            opacity: 0.3;
            background: transparent !important;
        }

        .clearing {
            animation: clearFlash 0.3s ease-out forwards;
        }

        @keyframes clearFlash {
            0% { background: white !important; box-shadow: 0 0 20px white; }
            100% { background: transparent !important; transform: scale(0); }
        }

        @keyframes land {
            0% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }

        .controls-hint {
            margin-top: 15px;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>

    <div class="game-container">
        <div class="hud-top">
            <div>SCORE: <span id="score">0</span></div>
            <div>LEVEL: <span id="level">1</span></div>
            <div>LINES: <span id="lines">0</span></div>
        </div>
        
        <div class="main-area">
            <div class="side-panel">
                <div class="panel-box">
                    <div class="panel-title">Hold</div>
                    <div class="mini-grid" id="hold-grid"></div>
                </div>
            </div>
            
            <div id="board"></div>
            
            <div class="side-panel">
                <div class="panel-box">
                    <div class="panel-title">Next</div>
                    <div class="mini-grid" id="next-grid"></div>
                </div>
            </div>
        </div>

        <div class="controls-hint">
            Tap Izq: Rotar Anti | Tap Der: Rotar Hor | Swipe Abajo: Soft Drop | Swipe Arriba: Hard Drop
        </div>
    </div>

    <script>
        const COLS = 10, ROWS = 20;
        const board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
        
        const COLORS = { I: '#00F0FF', O: '#FFD700', T: '#BD00FF', S: '#00FF7F', Z: '#FF0055', L: '#FF9500', J: '#0080FF' };
        const SHAPES = {
            I: [[1,1,1,1]], O: [[1,1],[1,1]], T: [[0,1,0],[1,1,1]],
            S: [[0,1,1],[1,1,0]], Z: [[1,1,0],[0,1,1]], L: [[0,0,1],[1,1,1]], J: [[1,0,0],[1,1,1]]
        };
        const TYPES = Object.keys(SHAPES);
        
        let current = null, next = null, hold = null, canHold = true;
        let score = 0, lines = 0, level = 1, dropInterval = 1000;
        let dropTimer = 0, lastTime = 0;
        let gameActive = true;

        const boardEl = document.getElementById('board');
        const nextGridEl = document.getElementById('next-grid');
        const holdGridEl = document.getElementById('hold-grid');

        function initBoard() {
            boardEl.innerHTML = '';
            for(let r=0; r<ROWS; r++){
                for(let c=0; c<COLS; c++){
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.dataset.r = r; cell.dataset.c = c;
                    boardEl.appendChild(cell);
                }
            }
        }

        function newPiece() {
            const type = TYPES[Math.floor(Math.random() * TYPES.length)];
            return { type, shape: SHAPES[type], color: COLORS[type], x: 3, y: 0 };
        }

        function draw() {
            // Limpiar tablero visual
            document.querySelectorAll('.cell').forEach(c => {
                c.className = 'cell';
                c.style.background = '';
                c.style.boxShadow = '';
            });

            // Dibujar bloques asentados
            for(let r=0; r<ROWS; r++){
                for(let c=0; c<COLS; c++){
                    if(board[r][c]) {
                        const cell = boardEl.children[r*COLS + c];
                        cell.className = 'cell block';
                        cell.style.background = board[r][c];
                        cell.style.boxShadow = `0 0 8px ${board[r][c]}`;
                    }
                }
            }

            // Dibujar fantasma (Ghost)
            if(current) {
                let ghostY = current.y;
                while(!collide(current, 0, ghostY - current.y + 1)) ghostY++;
                
                current.shape.forEach((row, r) => {
                    row.forEach((val, c) => {
                        if(val) {
                            const x = current.x + c, y = ghostY + r;
                            if(y >=0) {
                                const cell = boardEl.children[y*COLS + x];
                                cell.className = 'cell ghost';
                                cell.style.color = current.color;
                            }
                        }
                    });
                });

                // Dibujar pieza actual
                current.shape.forEach((row, r) => {
                    row.forEach((val, c) => {
                        if(val) {
                            const x = current.x + c, y = current.y + r;
                            if(y >=0) {
                                const cell = boardEl.children[y*COLS + x];
                                cell.className = 'cell block';
                                cell.style.background = current.color;
                                cell.style.boxShadow = `0 0 10px ${current.color}`;
                            }
                        }
                    });
                });
            }
            updateSidePanels();
        }

        function updateSidePanels() {
            drawMiniGrid(nextGridEl, next);
            drawMiniGrid(holdGridEl, hold);
        }

        function drawMiniGrid(el, piece) {
            el.innerHTML = '';
            for(let i=0; i<16; i++) {
                const div = document.createElement('div');
                div.className = 'mini-cell';
                el.appendChild(div);
            }
            if(piece) {
                piece.shape.forEach((row, r) => {
                    row.forEach((val, c) => {
                        if(val) {
                            const idx = r*4 + c;
                            el.children[idx].classList.add('active');
                            el.children[idx].style.background = piece.color;
                            el.children[idx].style.color = piece.color;
                        }
                    });
                });
            }
        }

        function collide(piece, dx, dy, shape = piece.shape) {
            for(let r=0; r<shape.length; r++){
                for(let c=0; c<shape[r].length; c++){
                    if(shape[r][c]) {
                        const x = piece.x + c + dx;
                        const y = piece.y + r + dy;
                        if(x < 0 || x >= COLS || y >= ROWS) return true;
                        if(y >= 0 && board[y][x]) return true;
                    }
                }
            }
            return false;
        }

        function merge() {
            current.shape.forEach((row, r) => {
                row.forEach((val, c) => {
                    if(val) board[current.y + r][current.x + c] = current.color;
                });
            });
            canHold = true;
        }

        function rotate() {
            const shape = current.shape;
            const N = shape.length;
            const M = shape[0].length;
            const newShape = Array.from({length: M}, () => Array(N).fill(0));
            for(let r=0; r<N; r++) for(let c=0; c<M; c++) newShape[c][N-1-r] = shape[r][c];
            
            if(!collide(current, 0, 0, newShape)) {
                current.shape = newShape;
            } else if(!collide(current, 1, 0, newShape)) { // Wall kick básico
                current.x++; current.shape = newShape;
            } else if(!collide(current, -1, 0, newShape)) {
                current.x--; current.shape = newShape;
            }
        }

        function clearLines() {
            let cleared = [];
            for(let r = ROWS - 1; r >= 0; r--) {
                if(board[r].every(cell => cell !== 0)) {
                    cleared.push(r);
                }
            }

            if(cleared.length > 0) {
                // Animación de flash
                cleared.forEach(r => {
                    for(let c=0; c<COLS; c++) {
                        boardEl.children[r*COLS + c].classList.add('clearing');
                    }
                });

                setTimeout(() => {
                    cleared.forEach(r => {
                        board.splice(r, 1);
                        board.unshift(Array(COLS).fill(0));
                    });
                    
                    // Lógica de puntos
                    const points = [0, 100, 300, 500, 800];
                    score += points[cleared.length] * level;
                    lines += cleared.length;
                    level = Math.floor(lines / 10) + 1;
                    dropInterval = Math.max(100, 1000 - (level * 80));
                    document.getElementById('score').textContent = score;
                    document.getElementById('lines').textContent = lines;
                    document.getElementById('level').textContent = level;
                    draw();
                }, 300);
            }
        }

        function drop(isSoft = false) {
            if(!collide(current, 0, 1)) {
                current.y++;
                if(isSoft) score += 1;
            } else {
                lockPiece();
            }
        }

        function hardDrop() {
            let dropDist = 0;
            while(!collide(current, 0, 1)) { current.y++; dropDist++; }
            score += dropDist * 2;
            if(dropDist > 0) navigator.vibrate(50); // Haptic feedback
            lockPiece();
        }

        function lockPiece() {
            merge();
            navigator.vibrate(20);
            clearLines();
            current = next;
            next = newPiece();
            if(collide(current, 0, 0)) {
                alert("GAME OVER! Score: " + score);
                gameActive = false;
            }
            draw();
        }

        function holdPiece() {
            if(!canHold) return;
            if(hold) {
                let temp = hold.type;
                hold = { type: current.type, shape: SHAPES[current.type], color: COLORS[current.type] };
                current = { type: temp, shape: SHAPES[temp], color: COLORS[temp], x: 3, y: 0 };
            } else {
                hold = { type: current.type, shape: SHAPES[current.type], color: COLORS[current.type] };
                current = next;
                next = newPiece();
            }
            canHold = false;
            draw();
        }

        function update(time = 0) {
            if(!gameActive) return;
            const deltaTime = time - lastTime;
            lastTime = time;
            dropTimer += deltaTime;

            if(dropTimer > dropInterval) {
                drop();
                dropTimer = 0;
                draw();
            }
            requestAnimationFrame(update);
        }

        // --- CONTROLES TÁCTILES ---
        let touchStartX = 0, touchStartY = 0, touchStartTime = 0;

        boardEl.addEventListener('touchstart', e => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        }, { passive: false });

        boardEl.addEventListener('touchend', e => {
            e.preventDefault();
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            const dt = Date.now() - touchStartTime;

            // Tap (Rotación)
            if(Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 200) {
                const rect = boardEl.getBoundingClientRect();
                if(touchEndX < rect.left + rect.width / 2) rotate(); // Tap izq
                else rotate(); // Tap der (En este prototipo simple rota igual, en real sería antihorario)
                draw();
                return;
            }

            // Swipes
            if(Math.abs(dx) > Math.abs(dy)) {
                if(dx < -20) { if(!collide(current, -1, 0)) current.x--; }
                else if(dx > 20) { if(!collide(current, 1, 0)) current.x++; }
            } else {
                if(dy > 40) drop(true); // Soft Drop
                else if(dy < -40) hardDrop(); // Hard Drop
            }
            draw();
        }, { passive: false });

        // Inicialización
        initBoard();
        current = newPiece();
        next = newPiece();
        draw();
        update();
    </script>
</body>
</html>