const app = new PIXI.Application();
const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;
const blueColor = 0xADD8E6; // Azul claro
const whiteColor = 0xFFFFFF; // Branco

let etSprite; // Declarando etSprite como uma variável global
let sprite; // Declarando sprite como uma variável global
let projectile; // Declarando projectile como uma variável global
let loseText;
let armalaser;
let tirolaser;
const balloonTextures = ['bcabeca.png', 'bdesista.png']; // Array com os nomes das texturas dos balões
let balloonSprite; // Variável para o sprite do balão

async function init() {
    await app.init({ width: screenWidth, height: screenHeight });
    document.body.appendChild(app.view);
    await PIXI.Assets.load(['sample.png', 'bullet.png', 'et.png','estrela.png', 'cat.png', 'laser.png', 'tirolaser.png', 'meteoro.png','bcabeca.png', 'bdesista.png','catiris.png']);

    const starsContainer = new PIXI.Container();
    app.stage.addChild(starsContainer);

    const numStars = 200; // número de estrelas
    const starTexture = PIXI.Texture.from('estrela.png'); // textura da estrela

    // Criando as estrelas
    for (let i = 0; i < numStars; i++) {
        const star = new PIXI.Sprite(starTexture);
        star.anchor.set(0.5);
        star.scale.set(0.01 + Math.random() * 0.01); // tamanhos aleatórios
        star.x = Math.random() * app.screen.width;
        star.y = Math.random() * app.screen.height;
        starsContainer.addChild(star);
    }

    // Função para reposicionar estrelas
    function resetStarPosition(star) {
        star.y = -star.height; // reposiciona no topo
        star.x = Math.random() * app.screen.width;
    }

    // Animação das estrelas
    app.ticker.add(() => {
        // Move cada estrela para baixo
        starsContainer.children.forEach(star => {
            star.y += 1;

            // Repositiona estrela no topo se sair da tela
            if (star.y > app.screen.height) {
                resetStarPosition(star);
            }
        });
    });
    

    sprite = PIXI.Sprite.from('sample.png');
    const scaleFactor = 0.7;
    sprite.scale.set(scaleFactor, scaleFactor);
    app.stage.addChild(sprite);
    sprite.x = app.screen.width / 2;
    sprite.y = app.screen.height / 2 + 150; // Mover o sprite para baixo


    const smoothness = 0.1; // Ajuste a suavidade do movimento
    const speed = 5; // Velocidade do foguete
    
    let mouseX = 0;
    let mouseY = 0;
    
    window.addEventListener('mousemove', (event) => {
        gsap.to(sprite, { x: event.clientX - sprite.width / 2, y: event.clientY - sprite.height / 2, duration: 0.5 });
    });
    
    app.ticker.add(() => {
        detectCollisionWithET();
        const dx = mouseX - sprite.x;
        const dy = mouseY - sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        if (distance > 1) {
            const vx = dx / distance * speed;
            const vy = dy / distance * speed;
    
            sprite.x += vx;
            sprite.y += vy;
        }
    });
    



    etSprite = PIXI.Sprite.from('et.png'); // Definição do sprite do ET
    app.stage.addChild(etSprite);
    etSprite.scale.set(0.5, 0.5);
    etSprite.x = app.screen.width / 2;

    let direction = 1;
    app.ticker.add(() => {
        etSprite.x += speed * direction;

        if (etSprite.x <= 0 || etSprite.x >= app.screen.width - sprite.width) {
            direction *= -1;
        }
    });
    function detectCollisionWithET() {
        const dx = etSprite.x + etSprite.width / 2 - sprite.x - sprite.width / 2;
        const dy = etSprite.y + etSprite.height / 2 - sprite.y - sprite.height / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        if (distance < (etSprite.width / 2 + sprite.width / 2) * 0.5) {
            app.stage.removeChild(sprite); // Remove o sprite do foguete
            showLoseText(); // Exibe o texto de perda
            return true;
        }
        return false;
    }
    
    let hits = 0;
    let shootingEnabled = true;
    let updateProjectile = null;
    let lastShotTime = 0; // Variável para rastrear o último tempo de tiro

    const pointsText = new PIXI.Text('Pontos: 0', { fontFamily: 'Arial', fontSize: 24, fill: 0xFFFFFF });
    pointsText.anchor.set(1, 1);
    pointsText.x = app.screen.width - 10;
    pointsText.y = app.screen.height - 10;
    app.stage.addChild(pointsText);

    loseText = new PIXI.Text('Você perdeu, tente novamente', { fontFamily: 'Arial', fontSize: 36, fill: 0xFF0000 });
loseText.anchor.set(0.5);
loseText.x = app.screen.width / 2;
loseText.y = app.screen.height / 2;
loseText.visible = false; // Inicialmente invisível
app.stage.addChild(loseText);

    function detectCollision(projectile) {
        const dx = etSprite.x + etSprite.width / 2 - projectile.x - projectile.width / 2;
        const dy = etSprite.y + etSprite.height / 2 - projectile.y - projectile.height / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < (etSprite.width / 2 + projectile.width / 2) * 0.5) {
            
            app.stage.removeChild(projectile);
            hits++;
            pointsText.text = `Pontos: ${hits + 10}`;
            etSprite.tint = 0xFF0000;

            setTimeout(() => {
                etSprite.tint = 0xFFFFFF; // Restaurar cor original após 200ms
            }, 200);

    
            return true;
        }
        return false;
    }

    function shoot() {
        if (!shootingEnabled) return;
    
        const soundTiro = new Howl({
            src: ['8bit_gunloop_explosion.mp3'],
        });
    
        soundTiro.play();
        const now = Date.now();
    
        // Verifica se passou mais de 1 segundo desde o último tiro
        if (now - lastShotTime < 1000) return;
    
        lastShotTime = now;
    
        projectile = new PIXI.Sprite(PIXI.Texture.from('bullet.png'));
        projectile.x = sprite.x + (sprite.width / 2);
        projectile.y = sprite.y - (sprite.height / -16);
        projectile.vx = 0;
        projectile.vy = -8; // Velocidade constante vertical
    
        app.stage.addChild(projectile);
    
        updateProjectile = function() {
            projectile.x += projectile.vx;
            projectile.y += projectile.vy;
    
            if (projectile.x < 0 || projectile.x > app.screen.width ||
                projectile.y < 0 || projectile.y > app.screen.height) {
                app.stage.removeChild(projectile);
            } else {
                if (detectCollision(projectile)) {
                    app.ticker.remove(updateProjectile);
                }
            }
        };
    
        app.ticker.add(updateProjectile);
    }
    document.addEventListener('click', shoot);
    setInterval(() => {
        launchLaserGun();
    }, 15000);

    const sound = new Howl({
        src: ['delayed_chips.mp3'],
        loop: true,
    });

    sound.play();
}
async function launchCat(sample) {
    await PIXI.Assets.load(['cat.png']);
    const cat = PIXI.Sprite.from('cat.png');
    cat.anchor.set(0.5);
    cat.scale.set(0.2);
    cat.x = etSprite.x + 100; // Posição X igual à do ET
    cat.y = etSprite.y + 100; // Posição Y igual à do ET
    app.stage.addChild(cat);

 /*soundCat.play();*/

    const catSpeed = 8;

    app.ticker.add(() => {
        cat.y += catSpeed;

        // Remove o gato quando atingir a parte inferior da tela
        if (cat.y > app.screen.height) {
            app.stage.removeChild(cat);
        }

        // Verifica colisão com o sprite
        if (sprite && cat.x > sprite.x && cat.x < sprite.x + sprite.width &&
            cat.y > sprite.y && cat.y < sprite.y + sprite.height) {
            
            app.stage.removeChild(sprite); // Remove o sprite ao invés do gato
            showLoseText();


        }
    });
}
function showLoseText() {
    loseText.visible = true;
    setTimeout(restartGame);
}

// Lança o gato a cada 10 segundos
setInterval(() => {
    launchCat(etSprite);
}, 1000);

function launchLaserGun() {
    PIXI.Assets.load(['laser.png', 'tirolaser.png']).then(() => { // Carregar a textura do tiro laser
        const laserGun = PIXI.Sprite.from('laser.png');
        laserGun.anchor.set(0.5);
        laserGun.scale.set(2);
        laserGun.x = 50; // Posição X no canto esquerdo
        laserGun.y = 400; // Posição Y aleatória
        app.stage.addChild(laserGun);

        shootLaser(laserGun); // Chamar a função para disparar o tiro laser
    });
}
function shootLaser(laserGun) {
    const tirolaser = PIXI.Sprite.from('tirolaser.png');
    tirolaser.anchor.set(0.5);
    tirolaser.x = laserGun.x + 320; // Ajuste para a posição correta do tiro
    tirolaser.y = laserGun.y;
    app.stage.addChild(tirolaser);

    // Animação de movimento do tiro laser
    const targetX = app.screen.width + 100; // Posição final do tiro
    const duration = 1.5 * 60; // 1.5 segundos * 60 frames/segundo
    const speedX = (targetX - tirolaser.x) / duration;
    let elapsedFrames = 0;

    app.ticker.add(() => {
        elapsedFrames++;
        tirolaser.x += speedX;

        // Remover o tiro após terminar a animação
        if (elapsedFrames >= duration) {
            app.stage.removeChild(tirolaser);
        }
        if (sprite && tirolaser.x > sprite.x && tirolaser.x < sprite.x + sprite.width &&
            tirolaser.y > sprite.y && tirolaser.y < sprite.y + sprite.height) {
            app.stage.removeChild(sprite); // Remove o sprite ao ser atingido pelo tiro
            app.stage.removeChild(tirolaser); // Remove o tiro
            showLoseText();
        }
    });
}
async function launchMeteor() {
    await PIXI.Assets.load(['meteoro.png']); // Carregar textura do meteoro
    const meteor = PIXI.Sprite.from('meteoro.png'); // Criar sprite do meteoro
    meteor.anchor.set(0.5);
    meteor.scale.set(0.5); // Ajuste a escala conforme necessário
    meteor.x = app.screen.width; // Posição X inicial - canto direito
    meteor.y = 0; // Posição Y inicial - canto superior
    app.stage.addChild(meteor);

    // Animação de movimento do meteoro
    const targetX = 0; // Posição final do meteoro - canto esquerdo
    const targetY = app.screen.height; // Posição final do meteoro - canto inferior
    const duration = 3 * 60; // 3 segundos * 60 frames/segundo
    const speedX = (targetX - meteor.x) / duration;
    const speedY = (targetY - meteor.y) / duration;
    let elapsedFrames = 0;

    app.ticker.add(() => {
        elapsedFrames++;
        meteor.x += speedX;
        meteor.y += speedY;

        // Remover o meteoro após terminar a animação
        if (elapsedFrames >= duration) {
            app.stage.removeChild(meteor);
        }

        // Verificar colisão com o sprite do foguete
        if (sprite && meteor.x > sprite.x && meteor.x < sprite.x + sprite.width &&
            meteor.y > sprite.y && meteor.y < sprite.y + sprite.height) {
            app.stage.removeChild(sprite); // Remover o sprite do foguete
            showLoseText();
        }
    });
}
async function launchCatIris() {
    await PIXI.Assets.load(['catiris.png']); // Carregar a textura do catiris
    const catIris = PIXI.Sprite.from('catiris.png'); // Criar o sprite do catiris
    catIris.anchor.set(0.5);
    catIris.scale.set(0.2); // Ajustar a escala conforme necessário
    catIris.x = 0; // Posição X inicial - canto esquerdo
    catIris.y = app.screen.height - 100; // Posição Y - 100 pixels acima da parte inferior
    app.stage.addChild(catIris);

    const catIrisSpeed = 4; // Velocidade do movimento do catiris

    app.ticker.add(() => {
        catIris.x += catIrisSpeed;

        // Verificar colisão com o sprite principal
        if (sprite && catIris.x > sprite.x && catIris.x < sprite.x + sprite.width &&
            catIris.y > sprite.y && catIris.y < sprite.y + sprite.height) {
            app.stage.removeChild(sprite); // Remover o sprite principal
            showLoseText();
        }

        // Remover o catiris após passar pela tela
        if (catIris.x > app.screen.width) {
            app.stage.removeChild(catIris);
        }
    });
}

// Lançar o catiris a cada 30 segundos
setInterval(() => {
    launchCatIris();
}, 30000);

// Lança o meteoro a cada 20 segundos
setInterval(() => {
    launchMeteor();
}, 20000);

function restartGame() {
     // Reiniciar todas as variáveis necessárias
    window.location.reload();
}


await init();
