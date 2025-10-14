#  Lair of Riches — HTML5 Slot Game Prototype

**Lair of Riches** is a 5x5 “Bonus Buy” slot game prototype developed with **PixiJS (HTML5)**.  
The project replicates key features of modern slot games, including a configurable **RTP (Return to Player)**, an **Expanding Multiplier Wild** mechanic, and a fully **data-driven user interface flow**.

This prototype represents my **first full-scale game development project** — covering everything from designing game mechanics and balancing math models to implementing a responsive, performant front-end.  
Although it began as a personal experiment, the ultimate goal was to meet **professional production standards** and create a **technically robust, visually complete** experience.

 **[Play the Demo](https://furkanpz.github.io/lairofriches/)**

---

##  Gameplay Showcase

| Stage | Preview |
|-------|----------|
| **Loading Screen** | ![Loading Screen](https://i.ibb.co/qYg8mnQF/game0.jpg) |
| **Start Screen** | ![Start Screen](https://i.ibb.co/Pv19wFnp/game1.jpg) |
| **Main Game Screen** | ![Main Game Screen](https://i.ibb.co/mjQ0wyK/game2.jpg) |
| **Bonus Buy Screen** | ![Bonus Buy Screen](https://i.ibb.co/MDp7X9LS/game3.jpg) |
| **Bonus Win Screen** | ![Bonus Win Screen](https://i.ibb.co/Y41vgtQd/game4.jpg) |
| **Bonus Game Screen** | ![Bonus Game Screen](https://i.ibb.co/FZ6c054/game5.jpg) |

---

##  Installation

### Clone the Repository
```bash
git clone https://github.com/furkanpz/SlotGameWithPixiJS
cd SlotGameWithPixiJS
```

### Frontend
```bash
cd src
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

---

##  Project Overview

**Game Engine:** TypeScript + PixiJS  
**Design:** Fully responsive, self-contained, and asset-light

###  Core Features

#### • Expanding Multiplier “Wolf Wild”
When a Wild symbol lands, it expands to fill the reel and applies a random multiplier between **2x and 200x**.

#### • Free Spins Bonus
Triggered by **3 or more Scatter symbols**, the bonus round includes enhanced payout features.

#### • Bonus Buy
Players can directly purchase access to the **Free Spins** round for testing or high-volatility gameplay.

#### • Data-Driven Architecture
All statistics, paytables, and UI elements are dynamically rendered from a **centralized data model** — no hardcoded values.

#### • Statistical Validation
The game math model has been verified through a **500M-spin simulation**, ensuring accurate RTP and volatility outcomes.

#### • Zero External Assets
All symbols are **programmatically rendered on canvas**, eliminating external image dependencies for faster loading and portability.

---

##  Mathematical Model

| Metric | Value | Description |
|--------|--------|-------------|
| **Total RTP** | 96.92% | Theoretical long-term return percentage. |
| **RTP Structure** | 70.38% (Base) / 26.55% (Bonus) | Most payouts originate from the base game. |
| **Max Win** | 15,000x | Maximum win multiplier per spin. |
| **Hit Frequency** | 27.69% | Probability of any winning combination. |
| **Bonus Trigger** | ~1 in 305 spins (0.328%) | Average rate of Free Spins activation. |
| **Volatility** | Very High | Infrequent wins with large potential payouts. |

---

##  Acknowledgements

Thank you for taking the time to explore **Lair of Riches**!  
This project is open for feedback, discussion, and potential collaboration.  
— **Furkan Uyar**
