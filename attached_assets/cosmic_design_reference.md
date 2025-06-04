# Cosmic Bitcoin Theme - Design Reference Guide

This document provides a comprehensive reference of the styling and design elements used in the Cosmic Bitcoin Vault application. Use this as a guide when you want to maintain consistent styling across your project or apply similar cosmic themes to future projects.

## Table of Contents
1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Background Effects](#background-effects)
4. [UI Components](#ui-components)
5. [Animations](#animations)
6. [Icons](#icons)
7. [Complete CSS](#complete-css)
8. [HTML Structure](#html-structure)

## Color Palette

The cosmic theme uses these key colors:

```css
:root {
    --cosmic-black: #0a0a0a;      /* Main background color */
    --space-purple: #8a2be2;      /* Purple accent color */
    --cyber-gold: #ffd700;        /* Gold accent color */
    --deep-space: #111122;        /* Secondary background color */
    --nebula-pink: #c71585;       /* Pink accent for alerts */
    --stellar-blue: #4b0082;      /* Deep blue/indigo color */
    --dark-matter: #1a1a2e;       /* Tertiary background color */
    --light-gold: #ffe066;        /* Lighter gold for hover states */
}
```

## Typography

The theme uses two Google Fonts:

1. **Orbitron**: A geometric sans-serif with a technological/futuristic feel
   - Used for headings, titles, and important UI elements
   - Weights: 400 (regular), 500 (medium), 700 (bold), 900 (black)
   
2. **Rajdhani**: A contemporary sans-serif with a technical aesthetic
   - Used for body text, tables, and general content
   - Weights: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap">
```

## Background Effects

### Starry Background
The background features a starry space effect with twinkling animations:

```css
body {
    background-color: var(--cosmic-black);
    background-image: 
        radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px),
        radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 30px),
        radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 40px);
    background-size: 550px 550px, 350px 350px, 250px 250px;
    background-position: 0 0, 40px 60px, 130px 270px;
}
```

### Additional Stars Animation
For more dynamic stars that twinkle:

```css
.stars {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background-image: 
        radial-gradient(2px 2px at 20px 30px, var(--cyber-gold), rgba(0,0,0,0)),
        radial-gradient(2px 2px at 40px 70px, var(--light-gold), rgba(0,0,0,0)),
        radial-gradient(2px 2px at 50px 160px, var(--cyber-gold), rgba(0,0,0,0)),
        radial-gradient(2px 2px at 90px 40px, var(--space-purple), rgba(0,0,0,0)),
        radial-gradient(2px 2px at 130px 80px, var(--light-gold), rgba(0,0,0,0)),
        radial-gradient(2px 2px at 160px 120px, var(--cyber-gold), rgba(0,0,0,0));
    background-repeat: repeat;
    background-size: 200px 200px;
    animation: twinkle 8s ease-in-out infinite;
}

@keyframes twinkle {
    0% { opacity: 0.3; }
    50% { opacity: 0.8; }
    100% { opacity: 0.3; }
}
```

## UI Components

### Cards
```css
.card {
    background: linear-gradient(135deg, rgba(26, 26, 46, 0.9), rgba(10, 10, 10, 0.95));
    border: 1px solid var(--space-purple);
    border-radius: 10px;
    box-shadow: 0 0 30px rgba(138, 43, 226, 0.2);
    overflow: hidden;
}

.card-header {
    background: linear-gradient(45deg, var(--stellar-blue), var(--space-purple));
    color: var(--cyber-gold);
    border-bottom: 2px solid var(--cyber-gold);
    padding: 15px 20px;
}
```

### Standard Buttons
```css
.btn-primary {
    background: linear-gradient(45deg, var(--stellar-blue), var(--space-purple));
    border-color: var(--cyber-gold);
    color: var(--cyber-gold);
    font-family: 'Orbitron', sans-serif;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
    transition: all 0.3s ease;
}

.btn-primary:hover {
    background: linear-gradient(45deg, var(--space-purple), var(--stellar-blue));
    border-color: var(--light-gold);
    box-shadow: 0 0 15px rgba(138, 43, 226, 0.7);
    transform: translateY(-2px);
}
```

### Ultra-Flashy Main Buttons
```css
/* Ultra Flashy Main Call-to-Action Buttons */
.cosmic-main-btn {
    position: relative;
    overflow: hidden;
    padding: 15px 30px;
    border-radius: 12px;
    border: 2px solid var(--cyber-gold);
    background: linear-gradient(
        45deg,
        rgba(138, 43, 226, 0.7),
        rgba(75, 0, 130, 0.8),
        rgba(25, 25, 112, 0.9)
    );
    background-size: 300% 100%;
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    font-size: 1.2rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--cyber-gold);
    animation: ultra-glow 3s infinite, nebula-shift 6s infinite;
    margin: 15px 0;
    transition: all 0.4s ease;
    transform-style: preserve-3d;
    box-shadow: 
        0 10px 15px rgba(0, 0, 0, 0.4),
        0 0 30px 5px rgba(138, 43, 226, 0.3);
}

.cosmic-main-btn:hover {
    transform: translateY(-5px) scale(1.03);
    animation: ultra-glow 1.5s infinite, nebula-shift 3s infinite;
    color: white;
    text-shadow: 
        0 0 10px var(--cyber-gold),
        0 0 20px var(--cyber-gold);
}

.cosmic-main-btn:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg, 
        transparent,
        rgba(255, 255, 255, 0.4),
        transparent
    );
    animation: cosmic-rays 2s infinite;
    z-index: 1;
}

.cosmic-main-btn:hover:before {
    animation: cosmic-rays 1s infinite;
}

.cosmic-main-btn span {
    position: relative;
    z-index: 2;
}

@keyframes ultra-glow {
    0% {
        box-shadow: 
            0 0 30px 5px rgba(255, 215, 0, 0.7), 
            0 0 40px 10px rgba(138, 43, 226, 0.4),
            inset 0 0 15px 2px rgba(255, 215, 0, 0.5);
    }
    50% {
        box-shadow: 
            0 0 50px 10px rgba(255, 215, 0, 0.9), 
            0 0 60px 15px rgba(138, 43, 226, 0.6),
            inset 0 0 20px 5px rgba(255, 215, 0, 0.7);
    }
    100% {
        box-shadow: 
            0 0 30px 5px rgba(255, 215, 0, 0.7), 
            0 0 40px 10px rgba(138, 43, 226, 0.4),
            inset 0 0 15px 2px rgba(255, 215, 0, 0.5);
    }
}

@keyframes nebula-shift {
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
}

@keyframes cosmic-rays {
    0% {
        opacity: 0.2;
        transform: scaleX(0) translateX(-100%);
    }
    20% {
        opacity: 0.8;
        transform: scaleX(1) translateX(0);
    }
    100% {
        opacity: 0;
        transform: scaleX(1) translateX(100%);
    }
}
```

### Action Buttons (Search, Browse Database)
```css
/* Search & Browse Database Buttons - Extra Special Styling */
.cosmic-action-btn {
    position: relative;
    overflow: hidden;
    width: 100%;
    padding: 16px;
    margin: 10px 0;
    border-radius: 8px;
    border: 2px solid;
    border-image: linear-gradient(45deg, var(--cyber-gold), var(--space-purple), #ff00cc, var(--cyber-gold)) 1;
    background: linear-gradient(
        45deg,
        rgba(25, 25, 112, 0.9),
        rgba(75, 0, 130, 0.8),
        rgba(138, 43, 226, 0.7)
    );
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    font-size: 1.1rem;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--cyber-gold);
    transition: all 0.3s ease;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    box-shadow: 
        0 8px 15px rgba(0, 0, 0, 0.3),
        0 0 20px 5px rgba(138, 43, 226, 0.2),
        inset 0 0 15px rgba(255, 215, 0, 0.2);
}

.cosmic-action-btn:hover {
    transform: translateY(-5px);
    color: white;
    background: linear-gradient(
        45deg,
        rgba(138, 43, 226, 0.8),
        rgba(75, 0, 130, 0.9),
        rgba(25, 25, 112, 1)
    );
    box-shadow: 
        0 15px 25px rgba(0, 0, 0, 0.4),
        0 0 30px 10px rgba(138, 43, 226, 0.4),
        inset 0 0 20px rgba(255, 215, 0, 0.4);
    text-shadow: 
        0 0 10px white,
        0 0 20px var(--cyber-gold);
}

.cosmic-action-btn:before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
        transparent,
        rgba(255, 215, 0, 0.2),
        transparent,
        transparent
    );
    animation: rotate 4s linear infinite;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.cosmic-action-btn:hover:before {
    opacity: 1;
}

@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
```

### Navigation Links
```css
header nav a {
    font-family: 'Orbitron', sans-serif;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-right: 20px;
    padding: 5px 15px;
    border-radius: 20px;
    transition: all 0.3s ease;
    background: var(--dark-matter);
    color: var(--cyber-gold);
    border: 1px solid var(--cyber-gold);
    display: inline-block;
}

header nav a:hover {
    background: var(--cyber-gold);
    color: var(--cosmic-black);
    text-decoration: none;
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
    transform: translateY(-2px);
}
```

### Tables
```css
table {
    font-family: 'Rajdhani', monospace;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    margin: 20px 0;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--space-purple);
    box-shadow: 0 0 20px rgba(138, 43, 226, 0.2);
}

td, th {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid rgba(138, 43, 226, 0.3);
}

th {
    font-family: 'Orbitron', sans-serif;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
}

thead tr th {
    background: linear-gradient(45deg, var(--dark-matter), var(--stellar-blue));
    color: var(--cyber-gold);
    border-bottom: 2px solid var(--cyber-gold);
}

tbody tr:nth-child(odd) {
    background-color: rgba(26, 26, 46, 0.6);
}

tbody tr:nth-child(even) {
    background-color: rgba(26, 26, 46, 0.3);
}

table tr:hover td {
    background: rgba(138, 43, 226, 0.2);
}
```

### Forms
```css
.form-control {
    background-color: rgba(26, 26, 46, 0.7);
    border: 1px solid var(--space-purple);
    color: #e0e0e0;
    transition: all 0.3s ease;
}

.form-control:focus {
    background-color: rgba(26, 26, 46, 0.9);
    border-color: var(--cyber-gold);
    color: white;
    box-shadow: 0 0 15px rgba(138, 43, 226, 0.5);
}

.form-text {
    color: #a0a0a0;
}
```

### Pagination
```css
.pagination {
    margin: 20px 0;
    text-align: center;
}

.page-link {
    background-color: var(--dark-matter);
    color: var(--cyber-gold);
    border: 1px solid var(--space-purple);
    transition: all 0.3s ease;
}

.page-link:hover {
    background-color: var(--space-purple);
    color: var(--cyber-gold);
    border-color: var(--cyber-gold);
    box-shadow: 0 0 10px rgba(138, 43, 226, 0.5);
}

.page-item.disabled .page-link {
    background-color: rgba(26, 26, 46, 0.4);
    color: rgba(255, 215, 0, 0.5);
    border-color: rgba(138, 43, 226, 0.3);
}
```

### Alerts
```css
.alert-success {
    background-color: rgba(19, 78, 94, 0.7);
    border-color: var(--cyber-gold);
    color: var(--light-gold);
}

.alert-danger {
    background-color: rgba(94, 19, 78, 0.7);
    border-color: var(--nebula-pink);
    color: #ffe0f0;
}
```

### Cosmic Dividers
```css
.cosmic-divider {
    display: flex;
    align-items: center;
    margin: 15px 0;
}

.cosmic-line {
    flex-grow: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--space-purple), transparent);
}

.cosmic-icon {
    padding: 0 15px;
    font-size: 1.2rem;
}
```

## Animations

### Rotating Bitcoin Icon
```css
@keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.fa-bitcoin {
    color: var(--cyber-gold);
    animation: rotate 20s linear infinite;
    display: inline-block;
}
```

### Glowing Meteor Icon
```css
@keyframes meteor-glow {
    0% { color: var(--cyber-gold); text-shadow: 0 0 5px var(--cyber-gold); }
    50% { color: var(--space-purple); text-shadow: 0 0 15px var(--space-purple); }
    100% { color: var(--cyber-gold); text-shadow: 0 0 5px var(--cyber-gold); }
}

.fa-meteor {
    color: var(--cyber-gold);
    animation: meteor-glow 4s ease-in-out infinite;
    display: inline-block;
}
```

### Futuristic Scrollbar
```css
::-webkit-scrollbar {
    width: 10px;
    height: 10px;
}

::-webkit-scrollbar-track {
    background: var(--cosmic-black);
}

::-webkit-scrollbar-thumb {
    background: linear-gradient(var(--space-purple), var(--cyber-gold));
    border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(var(--cyber-gold), var(--space-purple));
}
```

## Icons

The theme uses Font Awesome 6 icons:

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

Key icons used:
- `fa-bitcoin` - For Bitcoin symbol
- `fa-meteor` - For cosmic accent
- `fa-home` - For home/command center
- `fa-database` - For the key vault
- `fa-dice` - For lottery
- `fa-search` - For search
- `fa-mug-hot` - For Space Mining Café
- `fa-coins` - For mining element
- `fa-puzzle-piece` - For Crypto Puzzles
- `fa-filter` - For puzzles filter
- `fa-key` - For divider accent
- `fa-code` - For footer divider
- `fa-github` - For GitHub link

### Space Mining Café Icons

```css
/* Cosmic Café animation */
@keyframes steam-rise {
    0% { transform: translateY(0) scale(1); opacity: 0.8; }
    50% { transform: translateY(-5px) scale(1.2); opacity: 0.5; }
    100% { transform: translateY(-10px) scale(0.8); opacity: 0; }
}

@keyframes coin-shine {
    0% { color: var(--cyber-gold); text-shadow: 0 0 3px var(--cyber-gold); }
    50% { color: #FFD700; text-shadow: 0 0 8px #FFD700; transform: translateY(-2px); }
    100% { color: var(--cyber-gold); text-shadow: 0 0 3px var(--cyber-gold); }
}

.cosmic-cafe .fa-mug-hot {
    position: relative;
    color: var(--cyber-gold);
}

.cosmic-cafe .fa-coins {
    color: var(--cyber-gold);
    animation: coin-shine 3s ease-in-out infinite;
    display: inline-block;
}

.cosmic-cafe .fa-mug-hot:after {
    content: "~";
    position: absolute;
    top: -5px;
    right: -2px;
    font-size: 10px;
    color: var(--cyber-gold);
    opacity: 0;
    animation: steam-rise 2s ease-out infinite;
}
```

### Crypto Puzzles Icon

```css
/* Crypto Puzzles animation */
@keyframes puzzle-glow {
    0% { color: var(--cyber-gold); text-shadow: 0 0 3px var(--cyber-gold); }
    50% { color: var(--space-purple); text-shadow: 0 0 8px var(--space-purple); }
    100% { color: var(--cyber-gold); text-shadow: 0 0 3px var(--cyber-gold); }
}

.cosmic-puzzles .fa-puzzle-piece {
    color: var(--cyber-gold);
    animation: puzzle-glow 3s ease-in-out infinite;
    display: inline-block;
}
```

## Complete CSS

For the complete CSS, refer to the `static/css/styles.css` file in your project.

## HTML Structure

### Base Layout

```html
<!doctype html>
<html lang="en" data-bs-theme="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Cosmic Bitcoin Database</title>
    <link rel="stylesheet" href="https://cdn.replit.com/agent/bootstrap-agent-dark-theme.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" type="text/css" href="/static/css/styles.css">
</head>
<body>
    <!-- Stars background effect -->
    <div class="stars"></div>
    
    <div class="container my-4">
        <header class="mb-5 py-3">
            <h1 class="display-4 mt-4">
                <i class="fas fa-bitcoin me-2"></i>
                COSMIC BITCOIN VAULT
                <i class="fas fa-meteor ms-2"></i>
            </h1>
            <p class="text-center mb-4" style="color: var(--cyber-gold); font-family: 'Orbitron', sans-serif; letter-spacing: 2px;">
                EXPLORING THE DIGITAL UNIVERSE
            </p>
            
            <nav class="mt-4 mb-4 d-flex justify-content-center flex-wrap">
                <a href="https://kloudbugscafe.com" target="_blank" class="me-3 mb-2 cosmic-cafe">
                    <i class="fas fa-mug-hot me-1"></i><i class="fas fa-coins me-1"></i> Space Mining Café
                </a>
                <a href="/" class="me-3 mb-2">
                    <i class="fas fa-home me-1"></i> Command Center
                </a>
                <a href="/page/1" class="me-3 mb-2">
                    <i class="fas fa-database me-1"></i> Key Vault
                </a>
                <a href="/puzzles" class="me-3 mb-2 cosmic-puzzles">
                    <i class="fas fa-puzzle-piece me-1"></i> Crypto Puzzles
                </a>
                <a href="/lottery" class="me-3 mb-2">
                    <i class="fas fa-dice me-1"></i> Quantum Lottery
                </a>
                <a href="/search" class="me-3 mb-2">
                    <i class="fas fa-search me-1"></i> Cosmic Search
                </a>
            </nav>
            
            <div class="cosmic-divider">
                <div class="cosmic-line"></div>
                <div class="cosmic-icon"><i class="fas fa-key" style="color: var(--cyber-gold);"></i></div>
                <div class="cosmic-line"></div>
            </div>
        </header>
        
        <main>
            <!-- Content goes here -->
        </main>
        
        <footer class="mt-5 pt-4 text-center">
            <div class="cosmic-divider mb-4">
                <div class="cosmic-line"></div>
                <div class="cosmic-icon"><i class="fas fa-code" style="color: var(--cyber-gold);"></i></div>
                <div class="cosmic-line"></div>
            </div>
            <p>
                <a href="https://github.com/YourUsername/YourRepo" target="_blank">
                    <i class="fab fa-github me-1"></i> Source Code
                </a><br/>
                <small class="text-muted">Your cosmic footer text here</small>
            </p>
            <p class="mt-2 mb-0">
                <small class="text-muted">STARDATE: 2025.05.04</small>
            </p>
        </footer>
    </div>
</body>
</html>
```

## Summary

This cosmic Bitcoin theme combines:

1. A dark, starry space background
2. Futuristic typography with Orbitron and Rajdhani fonts
3. A color scheme featuring black, gold, and purple
4. Animated elements (rotating Bitcoin, glowing meteor)
5. Cosmic-styled components (cards, tables, buttons)
6. Space-themed iconography

You can adapt this theme for other projects by using the same color palette, fonts, and styling principles. The futuristic space aesthetic works particularly well for crypto, technology, gaming, and sci-fi themed applications.