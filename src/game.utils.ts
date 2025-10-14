import { Application, Graphics, BlurFilter, Text } from "pixi.js";
import { GameConstants } from "./GameConstants";

export function scalePx(
  basePx: number,
  screenWidth: number,
  screenHeight: number,
  refWidth = GameConstants.getRefWidth(),
  refHeight = GameConstants.getRefHeight()
): number {
  const scaleX = screenWidth / refWidth;
  const scaleY = screenHeight / refHeight;
  const scale = Math.min(scaleX, scaleY);
  return basePx * scale;
}



  function getMessage(text: string, x: number, y: number)
  {
      const message = new Text({ text: text, style: {
        fontFamily: "Roboto, Arial, sans-serif",
        fontSize: 24,
        fontWeight: "400",
        fill: 0xffffff
      }});
      message.x = x;
      message.y = y;
      message.anchor.set(0.5);
      return message;
  }
  function getTitleMessage(text: string, x: number, y: number)
  {
      const message = new Text({ text: text, style: {
        fontFamily: "Roboto, Arial, sans-serif",
        fontSize: 24,
        fontWeight: "400",
        fill: 0xCD5C08
      }});
      message.x = x;
      message.y = y;
      message.anchor.set(0.5);
      return message;
  }

export function errorBox(app: Application, text: string, type: number = 0) {
  const errorBox = new Graphics();
  const shadowBox = new Graphics();
  const message = getMessage(text, app.screen.width / 2, app.screen.height / 2);
  const blur = new BlurFilter();

  const ErrorBoxW = scalePx(750, app.screen.width, app.screen.height);
  const ErrorBoxH = scalePx(225, app.screen.width, app.screen.height);

  const y = (app.screen.height - ErrorBoxH) / 2;
  const x = (app.screen.width - ErrorBoxW) / 2;

  const upMessage = getTitleMessage("WHOOPS!", app.screen.width / 2, y + ErrorBoxH * 0.20);

  
  blur.strength = 8;
  shadowBox.filters = [blur];
  shadowBox.roundRect(x + 25, y + 25, ErrorBoxW, ErrorBoxH, 1);
  shadowBox.fill({ color: 0x000000, alpha: 0.3 });

  errorBox.roundRect(x, y, ErrorBoxW, ErrorBoxH, 1);
  errorBox.fill(0x2a1c14);
  errorBox.stroke({ width: 3, color: 0xCD5C08, alpha: 1 });

  app.stage.addChild(errorBox);
  app.stage.addChild(upMessage);
  app.stage.addChild(message);

  if (type == 1) {
	const button = new Graphics();
	const btnWidth = 200;
	const btnHeight = 60;

	const btnX = app.screen.width / 2 - btnWidth / 2;
	const btnY = y + ErrorBoxH - btnHeight - 20;

	button.roundRect(btnX, btnY, btnWidth, btnHeight, 5);
	button.fill({ color: 0xcd5c08 });
	button.interactive = true;
	button.cursor = "pointer";
	button.on("pointertap", () => {
		window.location.href = GameConstants.home_url;
	});

	const buttonText = getMessage("Return to Home", btnX + btnWidth / 2, btnY + btnHeight / 2);

    app.stage.addChild(button);
    app.stage.addChild(buttonText);
  }

  if (text == "Unable to Load Game!") {
    app.stage.addChildAt(shadowBox, 1);
    setTimeout(() => {
      window.location.reload();
    }, 5000);
  }
}
