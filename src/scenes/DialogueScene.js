import Phaser from 'phaser'
import { DialogueSystem } from '../systems/DialogueSystem.js'
import { AffectionSystem } from '../systems/AffectionSystem.js'
import { EvidenceSystem } from '../systems/EvidenceSystem.js'
import { SaveSystem } from '../systems/SaveSystem.js'
import { StoryParser } from '../systems/StoryParser.js'
import { dialogueData as defaultDialogueData } from '../data/dialogues/index.js'

export class DialogueScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DialogueScene' })
  }

  init(data) {
    this.currentDialogueId = data.dialogueId || 'start'
    this.loadSave = data.loadSave || false
    this.usePreviewYaml = data.usePreviewYaml || false
    this.customDialogueData = null
  }

  create() {
    const { width, height } = this.cameras.main

    this.background = this.add.image(width / 2, height / 2, 'bg_cafe')
    this.background.setDisplaySize(width, height)

    this.characterSprite = this.add.image(width * 0.7, height * 0.4, 'char_heroine_normal')
    this.characterSprite.setScale(1.2)

    this.systems = {
      affection: new AffectionSystem(this),
      evidence: new EvidenceSystem(this),
      save: new SaveSystem(this)
    }

    let dialogueDataToUse = defaultDialogueData

    if (this.usePreviewYaml) {
      const yamlContent = localStorage.getItem('preview_yaml')
      if (yamlContent) {
        const parser = new StoryParser()
        const parsedData = parser.parse(yamlContent)
        if (parsedData) {
          dialogueDataToUse = parsedData
          this.customDialogueData = parsedData
        }
      }
    } else if (this.customDialogueData) {
      dialogueDataToUse = this.customDialogueData
    }

    this.dialogueSystem = new DialogueSystem(this, dialogueDataToUse, this.systems)

    if (this.loadSave) {
      this.systems.save.load()
    }

    this.createUI()

    this.dialogueSystem.startDialogue(this.currentDialogueId)

    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.choiceContainer?.visible) return
      this.dialogueSystem.advance()
    })

    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.choiceContainer?.visible) return
      this.dialogueSystem.advance()
    })

    this.input.on('pointerdown', () => {
      if (this.choiceContainer?.visible) return
      this.dialogueSystem.advance()
    })
  }

  createUI() {
    const { width, height } = this.cameras.main

    this.dialogueBox = this.add.graphics()
    this.dialogueBox.fillStyle(0x000000, 0.7)
    this.dialogueBox.fillRoundedRect(40, height - 220, width - 80, 180, 10)
    this.dialogueBox.lineStyle(2, 0x4ecdc4)
    this.dialogueBox.strokeRoundedRect(40, height - 220, width - 80, 180, 10)

    this.speakerName = this.add.text(70, height - 200, '', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#4ecdc4',
      fontStyle: 'bold'
    })

    this.dialogueText = this.add.text(70, height - 160, '', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
      wordWrap: { width: width - 160 },
      lineSpacing: 8
    })

    this.choiceContainer = this.add.container(0, 0)
    this.choiceContainer.setVisible(false)

    this.createAffectionUI()
    this.createEvidenceButton()
    this.createMenuButton()
  }

  createAffectionUI() {
    const { width } = this.cameras.main

    this.add.text(width - 200, 20, '好感度', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    })

    this.affectionBarBg = this.add.rectangle(width - 120, 50, 150, 20, 0x333333)
    this.affectionBar = this.add.rectangle(width - 195, 50, 0, 16, 0xff6b6b)
    this.affectionBar.setOrigin(0, 0.5)

    this.affectionText = this.add.text(width - 120, 50, '0', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.updateAffectionUI()
  }

  createEvidenceButton() {
    const evidenceBtn = this.add.rectangle(100, 50, 120, 40, 0x6c5ce7)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => evidenceBtn.setFillStyle(0x5a4fcf))
      .on('pointerout', () => evidenceBtn.setFillStyle(0x6c5ce7))
      .on('pointerdown', () => this.showEvidenceMenu())

    this.add.text(100, 50, '证据列表', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)
  }

  createMenuButton() {
    const menuBtn = this.add.rectangle(240, 50, 80, 40, 0x636e72)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => menuBtn.setFillStyle(0x4a5459))
      .on('pointerout', () => menuBtn.setFillStyle(0x636e72))
      .on('pointerdown', () => this.showMenu())

    this.add.text(240, 50, '菜单', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)
  }

  updateAffectionUI() {
    const affection = this.systems.affection.getValue()
    const maxAffection = 100
    const barWidth = Math.min(150, (affection / maxAffection) * 150)
    
    this.affectionBar.setSize(barWidth, 16)
    this.affectionText.setText(affection.toString())
  }

  showChoices(choices) {
    const { width, height } = this.cameras.main
    
    this.choiceContainer.removeAll(true)
    this.choiceContainer.setVisible(true)
    this.dialogueBox.setVisible(false)
    this.dialogueText.setVisible(false)
    this.speakerName.setVisible(false)

    choices.forEach((choice, index) => {
      const y = height / 2 - 80 + index * 60
      
      const button = this.add.rectangle(width / 2, y, 400, 50, 0x2d3436)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => button.setFillStyle(0x4ecdc4))
        .on('pointerout', () => button.setFillStyle(0x2d3436))
        .on('pointerdown', () => {
          this.hideChoices()
          this.dialogueSystem.selectChoice(choice)
        })

      const text = this.add.text(width / 2, y, choice.text, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffffff'
      }).setOrigin(0.5)

      this.choiceContainer.add([button, text])
    })
  }

  hideChoices() {
    this.choiceContainer.setVisible(false)
    this.dialogueBox.setVisible(true)
    this.dialogueText.setVisible(true)
    this.speakerName.setVisible(true)
  }

  showEvidenceMenu() {
    const { width, height } = this.cameras.main
    
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
    
    const panel = this.add.rectangle(width / 2, height / 2, 600, 400, 0x2d3436)
    
    const title = this.add.text(width / 2, height / 2 - 170, '证据列表', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#4ecdc4'
    }).setOrigin(0.5)

    const evidences = this.systems.evidence.getAll()
    const evidenceContainer = this.add.container(0, 0)

    evidences.forEach((evidence, index) => {
      const y = height / 2 - 100 + index * 50
      const item = this.add.rectangle(width / 2, y, 500, 40, 0x4a5459)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => item.setFillStyle(0x636e72))
        .on('pointerout', () => item.setFillStyle(0x4a5459))
        .on('pointerdown', () => {
          this.showEvidenceDetail(evidence)
        })

      const itemText = this.add.text(width / 2, y, evidence.name, {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#ffffff'
      }).setOrigin(0.5)

      evidenceContainer.add([item, itemText])
    })

    const closeBtn = this.add.rectangle(width / 2, height / 2 + 160, 100, 40, 0xff6b6b)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        overlay.destroy()
        panel.destroy()
        title.destroy()
        closeBtn.destroy()
        closeBtnText.destroy()
        evidenceContainer.destroy()
      })

    const closeBtnText = this.add.text(width / 2, height / 2 + 160, '关闭', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)
  }

  showEvidenceDetail(evidence) {
    const { width, height } = this.cameras.main
    
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9)
    
    const panel = this.add.rectangle(width / 2, height / 2, 500, 300, 0x2d3436)
    
    const title = this.add.text(width / 2, height / 2 - 100, evidence.name, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#4ecdc4'
    }).setOrigin(0.5)

    const desc = this.add.text(width / 2, height / 2, evidence.description, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      wordWrap: { width: 450 },
      align: 'center'
    }).setOrigin(0.5)

    const closeBtn = this.add.rectangle(width / 2, height / 2 + 110, 100, 40, 0xff6b6b)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        overlay.destroy()
        panel.destroy()
        title.destroy()
        desc.destroy()
        closeBtn.destroy()
        closeBtnText.destroy()
      })

    const closeBtnText = this.add.text(width / 2, height / 2 + 110, '关闭', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)
  }

  showMenu() {
    const { width, height } = this.cameras.main
    
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
    
    const panel = this.add.rectangle(width / 2, height / 2, 400, 300, 0x2d3436)
    
    const title = this.add.text(width / 2, height / 2 - 100, '菜单', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#4ecdc4'
    }).setOrigin(0.5)

    const saveBtn = this.add.rectangle(width / 2, height / 2 - 30, 200, 40, 0x4ecdc4)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.systems.save.save()
        this.showMessage('保存成功！')
      })
    const saveBtnText = this.add.text(width / 2, height / 2 - 30, '保存游戏', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)

    const titleBtn = this.add.rectangle(width / 2, height / 2 + 40, 200, 40, 0x6c5ce7)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('MenuScene')
      })
    const titleBtnText = this.add.text(width / 2, height / 2 + 40, '返回标题', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)

    const closeBtn = this.add.rectangle(width / 2, height / 2 + 110, 200, 40, 0xff6b6b)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        overlay.destroy()
        panel.destroy()
        title.destroy()
        saveBtn.destroy()
        saveBtnText.destroy()
        titleBtn.destroy()
        titleBtnText.destroy()
        closeBtn.destroy()
        closeBtnText.destroy()
      })
    const closeBtnText = this.add.text(width / 2, height / 2 + 110, '关闭', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)
  }

  showMessage(text) {
    const { width, height } = this.cameras.main
    
    const msgBg = this.add.rectangle(width / 2, height / 2, 300, 60, 0x000000, 0.8)
    const msgText = this.add.text(width / 2, height / 2, text, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#4ecdc4'
    }).setOrigin(0.5)

    this.time.delayedCall(1500, () => {
      msgBg.destroy()
      msgText.destroy()
    })
  }

  setCharacter(imageKey) {
    if (imageKey) {
      this.characterSprite.setTexture(imageKey)
      this.characterSprite.setVisible(true)
    } else {
      this.characterSprite.setVisible(false)
    }
  }

  setBackground(imageKey) {
    if (imageKey) {
      this.background.setTexture(imageKey)
    }
  }

  showDialogue(speaker, text) {
    this.speakerName.setText(speaker || '')
    this.dialogueText.setText(text)
  }

  triggerEnding(endingId) {
    const { width, height } = this.cameras.main
    
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9)
    
    const endingTexts = {
      'good': { title: '完美结局', desc: '你们幸福地在一起了！', color: '#00b894' },
      'normal': { title: '普通结局', desc: '你们成为了好朋友。', color: '#fdcb6e' },
      'bad': { title: '坏结局', desc: '你们渐行渐远...', color: '#ff6b6b' }
    }

    const ending = endingTexts[endingId] || endingTexts['normal']

    this.add.text(width / 2, height / 2 - 50, ending.title, {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: ending.color,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 30, ending.desc, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)

    const restartBtn = this.add.rectangle(width / 2, height / 2 + 120, 200, 50, 0x4ecdc4)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        localStorage.removeItem('gameSave')
        this.scene.start('MenuScene')
      })

    this.add.text(width / 2, height / 2 + 120, '重新开始', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)
  }
}
