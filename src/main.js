import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { DialogueScene } from './scenes/DialogueScene.js'
import { MenuScene } from './scenes/MenuScene.js'
import { DeveloperScene } from './scenes/DeveloperScene.js'
import { VisualEditorScene } from './scenes/VisualEditorScene.js'

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  dom: {
    createContainer: true
  },
  scene: [BootScene, MenuScene, DialogueScene, DeveloperScene, VisualEditorScene]
}

const game = new Phaser.Game(config)

window.game = game
