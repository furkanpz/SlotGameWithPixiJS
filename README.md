
# Lair of Riches - HTML5 Slot Game Prototype

Lair of Riches is a 5x5 "Bonus Buy" slot game prototype developed with PixiJS (HTML5). This project showcases several features found in modern slot games, including a configurable RTP (Return to Player), an "Expanding Multiplier Wild" mechanic, and a complete, data-driven user interface flow.

This project marks my first comprehensive venture into game development. It has been a significant learning journey, covering everything from conceptualizing game mechanics to implementing the mathematical model into a functional UI. While it began as an amateur endeavor, the goal was to deliver a product that adheres to professional standards.


[DEMO LINK](https://furkanpz.github.io/lairofriches/)
## Gameplay Showcase

<p align="center">
  <strong>Loading Screen</strong>
</p>
<p align="center">
  <a href="https://ibb.co/PGWy1YHz"><img src="https://i.ibb.co/qYg8mnQF/game0.jpg" alt="game0" border="0"></a>
</p>

<p align="center">
  <strong>Start Screen</strong>
</p>
<p align="center">
  <a href="https://ibb.co/sds6ybGS"><img src="https://i.ibb.co/Pv19wFnp/game1.jpg" alt="game1" border="0"></a>
</p>

<p align="center">
  <strong>Main Game Screen</strong>
</p>
<p align="center">
  <a href="https://ibb.co/dTntqpv"><img src="https://i.ibb.co/mjQ0wyK/game2.jpg" alt="game2" border="0"></a>
</p>

<p align="center">
  <strong>Bonus Buy Screen</strong>
</p>
<p align="center">
  <a href="https.ibb.co/d06Dh7yM"><img src="https://i.ibb.co/MDp7X9LS/game3.jpg" alt="game3" border="0"></a>
</p>

<p align="center">
  <strong>Bonus Win Screen</strong>
</p>
<p align="center">
  <a href="https.ibb.co/fVymJCFN"><img src="https://i.ibb.co/Y41vgtQd/game4.jpg" alt="game4" border="0"></a>
</p>

<p align="center">
  <strong>Bonus Game Screen</strong>
</p>
<p align="center">
  <a href="https://ibb.co/gqyQPSZ"><img src="https://i.ibb.co/FZ6c054/game5.jpg" alt="game5" border="0"></a>
</p>


## INSTALL

## CLONE REPO
```bash
  git clone https://github.com/furkanpz/SlotGameWithPixiJS
  cd SlotGameWithPixiJS
```
### FRONTEND
```bash
  cd src
  npm install
  npm run dev
```

### BACKEND
```bash
  cd backend
  npm install
  npm run dev
```

## DETAILS
Game Engine: Built with TypeScript and PixiJS, featuring a fully responsive design.

### Advanced Game Mechanics

#### Expanding Multiplier Wolf Wild
When a Wild symbol lands, it can expand to cover the entire reel and award a random multiplier ranging from 2x to 200x.

#### Free Spins Bonus
A bonus round with enhanced features, triggered by landing 3 or more Scatter symbols.

#### Bonus Buy Feature
Allows players to purchase direct entry into the Free Spins round.

#### Dynamic & Data-Driven UI:
All game statistics, the paytable, and in-depth simulation reports are dynamically generated from a central data source.

#### Statistical Confidence
The game's entire mathematical model is backed by data from a 500 Million spin simulation, ensuring high accuracy for critical metrics like RTP and volatility.

#### Zero Visual Dependencies
Instead of relying on external sprite sheets or image files, symbols are rendered programmatically on a Canvas. This makes the project self-contained and improves load times.

### Game Mechanics & Mathematical Model

| Metric            | Value                | Description                                             |
| ----------------- | -------------------- | ------------------------------------------- |
| Total RTP	 | 96.92% | 	The theoretical percentage of wagers that is expected to be paid back to players over the long term. |
| RTP Structure	| 70.38% (Base Game) / 26.55% (Bonus) | Indicates that the majority of payouts originate from the base game. |
| Max Win | 15,000x | 	The maximum possible win from a single spin, as a multiplier of the bet. |
| Hit Frequency | 	27.69% | The probability of landing any winning combination. |
| Bonus Trigger Probability | 	~1 in 305 spins (0.328%) | The average frequency at which the Free Spins bonus is triggered. |
| Volatility Index | 	Very High | Signifies that wins are infrequent but have a higher potential for being large. |


## THANKS 
Thank you for checking out this project! I am open to all feedback and contributions.
-Furkan Uyar


