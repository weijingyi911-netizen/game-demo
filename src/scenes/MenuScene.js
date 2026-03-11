import Phaser from 'phaser'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    const { width, height } = this.cameras.main

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    this.add.text(width / 2, height / 3, '恋爱冒险游戏', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 3 + 60, '像素风格 · 轻松恋爱', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#4ecdc4'
    }).setOrigin(0.5)

    this.createButton(width / 2, height / 2 + 50, '开始游戏', () => {
      this.startNewGame()
    })

    this.createButton(width / 2, height / 2 + 120, '继续游戏', () => {
      this.continueGame()
    })

    this.createButton(width / 2, height / 2 + 190, '剧情编辑器', () => {
      window.location.href = '/editor.html'
    })

    const hasSave = localStorage.getItem('gameSave')
    if (!hasSave) {
      this.continueButton.setAlpha(0.5)
      this.continueButton.disableInteractive()
    }
  }

  createButton(x, y, text, callback) {
    const button = this.add.rectangle(x, y, 200, 50, 0x4ecdc4)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => button.setFillStyle(0x45b7aa))
      .on('pointerout', () => button.setFillStyle(0x4ecdc4))
      .on('pointerdown', callback)

    this.add.text(x, y, text, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)

    if (text === '继续游戏') {
      this.continueButton = button
    }

    return button
  }

  startNewGame() {
    localStorage.removeItem('gameSave')
    this.scene.start('DialogueScene', { dialogueId: 'start' })
  }

  continueGame() {
    const saveData = localStorage.getItem('gameSave')
    if (saveData) {
      const save = JSON.parse(saveData)
      this.scene.start('DialogueScene', { 
        dialogueId: save.currentDialogueId,
        loadSave: true 
      })
    }
  }
}
