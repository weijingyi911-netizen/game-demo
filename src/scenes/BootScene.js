import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    this.createLoadingBar()
    
    this.load.on('progress', (value) => {
      this.progressBar.clear()
      this.progressBar.fillStyle(0x4ecdc4, 1)
      this.progressBar.fillRect(
        this.cameras.main.width / 4,
        this.cameras.main.height / 2 - 15,
        (this.cameras.main.width / 2) * value,
        30
      )
    })

    this.load.on('complete', () => {
      this.progressBar.destroy()
      this.progressBox.destroy()
      this.loadingText.destroy()
    })

    this.loadAssets()
  }

  createLoadingBar() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    this.progressBox = this.add.graphics()
    this.progressBox.fillStyle(0x222222, 0.8)
    this.progressBox.fillRect(width / 4 - 10, height / 2 - 25, width / 2 + 20, 50)

    this.progressBar = this.add.graphics()

    this.loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      font: '20px monospace',
      fill: '#ffffff'
    })
    this.loadingText.setOrigin(0.5, 0.5)
  }

  loadAssets() {
    // 占位图片 - 实际使用时替换为真实资源
    this.load.image('bg_cafe', 'https://placehold.co/1280x720/2d3436/ffffff?text=Cafe')
    this.load.image('bg_park', 'https://placehold.co/1280x720/00b894/ffffff?text=Park')
    this.load.image('bg_street', 'https://placehold.co/1280x720/6c5ce7/ffffff?text=Street')
    
    // 角色占位图
    this.load.image('char_heroine_normal', 'https://placehold.co/300x500/e17055/ffffff?text=Heroine')
    this.load.image('char_heroine_happy', 'https://placehold.co/300x500/00b894/ffffff?text=Happy')
    this.load.image('char_heroine_shy', 'https://placehold.co/300x500/fdcb6e/ffffff?text=Shy')
    
    // UI元素
    this.load.image('dialogue_box', 'https://placehold.co/1200x200/2d3436/ffffff?text=Dialogue')
  }

  create() {
    const params = new URLSearchParams(window.location.search)
    const preview = params.get('preview')
    if (preview === 'true' || preview === '1') {
      const chapter = params.get('chapter') || 'start'
      this.scene.start('DialogueScene', { dialogueId: chapter, usePreviewYaml: true })
      return
    }

    this.scene.start('MenuScene')
  }
}
