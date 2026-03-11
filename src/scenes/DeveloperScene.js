import Phaser from 'phaser'
import { StoryParser } from '../systems/StoryParser.js'
import defaultStory from '../data/story.yaml?raw'

export class DeveloperScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DeveloperScene' })
    this.parser = new StoryParser()
    this.currentYaml = defaultStory
  }

  create() {
    const { width, height } = this.cameras.main

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    this.add.text(width / 2, 30, '开发者后台 - 剧情编辑器', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#4ecdc4'
    }).setOrigin(0.5)

    this.createEditor(width, height)
    this.createButtons(width, height)
    this.createStatusBar(width, height)

    this.loadSavedYaml()
  }

  createEditor(width, height) {
    const editorWidth = width - 100
    const editorHeight = height - 200
    const editorX = 50
    const editorY = 70

    this.editorBg = this.add.rectangle(
      editorX + editorWidth / 2,
      editorY + editorHeight / 2,
      editorWidth,
      editorHeight,
      0x2d3436
    )
    this.editorBg.setStrokeStyle(2, 0x4ecdc4)

    const editorHtml = `
      <textarea id="yaml-editor" style="
        width: ${editorWidth - 20}px;
        height: ${editorHeight - 20}px;
        background: #2d3436;
        color: #ffffff;
        border: none;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 14px;
        padding: 10px;
        resize: none;
        outline: none;
        line-height: 1.5;
      ">${this.escapeHtml(this.currentYaml)}</textarea>
    `

    this.editorElement = this.add.dom(
      editorX + editorWidth / 2,
      editorY + editorHeight / 2
    ).createFromHTML(editorHtml)

    this.editorElement.addListener('input')
    this.editorElement.on('input', () => {
      const textarea = document.getElementById('yaml-editor')
      if (textarea) {
        this.currentYaml = textarea.value
        this.autoSave()
      }
    })
  }

  createButtons(width, height) {
    const buttonY = height - 100
    const buttonSpacing = 150
    const startX = width / 2 - buttonSpacing * 1.5

    this.createButton(startX, buttonY, '解析并验证', 0x4ecdc4, () => {
      this.parseAndValidate()
    })

    this.createButton(startX + buttonSpacing, buttonY, '预览游戏', 0x6c5ce7, () => {
      this.previewGame()
    })

    this.createButton(startX + buttonSpacing * 2, buttonY, '导出 YAML', 0xfdcb6e, () => {
      this.exportYaml()
    })

    this.createButton(startX + buttonSpacing * 3, buttonY, '返回菜单', 0xff6b6b, () => {
      this.scene.start('MenuScene')
    })
  }

  createButton(x, y, text, color, callback) {
    const button = this.add.rectangle(x, y, 130, 45, color)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => button.setFillStyle(this.lightenColor(color)))
      .on('pointerout', () => button.setFillStyle(color))
      .on('pointerdown', callback)

    this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)

    return button
  }

  createStatusBar(width, height) {
    const barY = height - 40

    this.statusBar = this.add.rectangle(width / 2, barY, width - 100, 30, 0x222222)

    this.statusText = this.add.text(60, barY, '就绪', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#888888'
    }).setOrigin(0, 0.5)

    this.charCount = this.add.text(width - 60, barY, '0 字符', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#888888'
    }).setOrigin(1, 0.5)

    this.updateCharCount()
  }

  parseAndValidate() {
    this.updateStatus('解析中...', '#fdcb6e')

    this.time.delayedCall(100, () => {
      try {
        const result = this.parser.parse(this.currentYaml)
        
        if (!result) {
          this.updateStatus('解析失败：无效的 YAML 格式', '#ff6b6b')
          return
        }

        const errors = this.parser.validate()
        
        if (errors.length > 0) {
          this.updateStatus(`发现 ${errors.length} 个问题`, '#ff6b6b')
          this.showErrors(errors)
        } else {
          this.updateStatus('✓ 解析成功，无错误', '#00b894')
          this.showSuccess()
        }
      } catch (e) {
        this.updateStatus(`解析错误：${e.message}`, '#ff6b6b')
      }
    })
  }

  previewGame() {
    try {
      const result = this.parser.parse(this.currentYaml)
      
      if (!result) {
        this.updateStatus('请先解析并修复错误', '#ff6b6b')
        return
      }

      const errors = this.parser.validate()
      if (errors.length > 0) {
        this.updateStatus('存在错误，无法预览', '#ff6b6b')
        return
      }

      this.scene.start('DialogueScene', { 
        dialogueId: 'start',
        dialogueData: result
      })
    } catch (e) {
      this.updateStatus(`预览失败：${e.message}`, '#ff6b6b')
    }
  }

  exportYaml() {
    const blob = new Blob([this.currentYaml], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'story.yaml'
    a.click()
    URL.revokeObjectURL(url)
    this.updateStatus('已导出 story.yaml', '#00b894')
  }

  showErrors(errors) {
    const { width, height } = this.cameras.main

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)

    const panel = this.add.rectangle(width / 2, height / 2, 600, 400, 0x2d3436)

    const title = this.add.text(width / 2, height / 2 - 160, '验证错误', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ff6b6b'
    }).setOrigin(0.5)

    const errorText = this.add.text(width / 2, height / 2, errors.join('\n\n'), {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      wordWrap: { width: 550 },
      lineSpacing: 8
    }).setOrigin(0.5)

    const closeBtn = this.add.rectangle(width / 2, height / 2 + 160, 100, 40, 0xff6b6b)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        overlay.destroy()
        panel.destroy()
        title.destroy()
        errorText.destroy()
        closeBtn.destroy()
        closeBtnText.destroy()
      })

    const closeBtnText = this.add.text(width / 2, height / 2 + 160, '关闭', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)
  }

  showSuccess() {
    const { width, height } = this.cameras.main

    const successText = this.add.text(width / 2, height / 2, '✓ 验证通过！', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#00b894',
      backgroundColor: '#2d3436',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5)

    this.time.delayedCall(1500, () => {
      successText.destroy()
    })
  }

  updateStatus(text, color = '#888888') {
    this.statusText.setText(text)
    this.statusText.setColor(color)
  }

  updateCharCount() {
    const count = this.currentYaml.length
    this.charCount.setText(`${count} 字符`)
  }

  autoSave() {
    localStorage.setItem('dev_yaml_content', this.currentYaml)
    this.updateCharCount()
  }

  loadSavedYaml() {
    const saved = localStorage.getItem('dev_yaml_content')
    if (saved) {
      this.currentYaml = saved
      const textarea = document.getElementById('yaml-editor')
      if (textarea) {
        textarea.value = saved
      }
    }
  }

  lightenColor(color) {
    const r = (color >> 16) & 0xff
    const g = (color >> 8) & 0xff
    const b = color & 0xff
    
    const lighter = (c) => Math.min(255, c + 30)
    
    return (lighter(r) << 16) | (lighter(g) << 8) | lighter(b)
  }

  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }
}
