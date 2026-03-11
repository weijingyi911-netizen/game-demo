export class DialogueSystem {
  constructor(scene, dialogueData, systems) {
    this.scene = scene
    this.dialogueData = dialogueData
    this.systems = systems
    this.currentDialogue = null
    this.currentIndex = 0
    this.isTyping = false
    this.typingTimer = null
  }

  startDialogue(dialogueId) {
    this.currentDialogueId = dialogueId
    this.currentDialogue = this.dialogueData[dialogueId]
    
    if (!this.currentDialogue) {
      console.error(`Dialogue not found: ${dialogueId}`)
      return
    }

    const startNode = this.currentDialogue.startNode
    if (startNode) {
      const startIndex = this.currentDialogue.nodes.findIndex(n => n.id === startNode)
      this.currentIndex = startIndex === -1 ? 0 : startIndex
    } else {
      this.currentIndex = 0
    }
    this.processCurrentNode()
  }

  processCurrentNode() {
    if (!this.currentDialogue || this.currentIndex >= this.currentDialogue.nodes.length) {
      return
    }

    const node = this.currentDialogue.nodes[this.currentIndex]

    switch (node.type) {
      case 'dialogue':
        this.processDialogueNode(node)
        break
      case 'choice':
        this.processChoiceNode(node)
        break
      case 'action':
        this.processActionNode(node)
        break
      case 'condition':
        this.processConditionNode(node)
        break
      case 'ending':
        this.processEndingNode(node)
        break
      default:
        this.advance()
    }
  }

  processDialogueNode(node) {
    if (node.background) {
      this.scene.setBackground(node.background)
    }

    if (node.character) {
      this.scene.setCharacter(node.character)
    } else {
      this.scene.setCharacter(null)
    }

    this.scene.showDialogue(node.speaker, node.text)
  }

  processChoiceNode(node) {
    const availableChoices = node.choices.filter(choice => {
      if (choice.condition) {
        return this.checkCondition(choice.condition)
      }
      return true
    })

    this.scene.showChoices(availableChoices)
  }

  processActionNode(node) {
    if (node.addAffection) {
      this.systems.affection.add(node.addAffection)
      this.scene.updateAffectionUI()
    }

    if (node.addEvidence) {
      this.systems.evidence.add(node.addEvidence)
      this.scene.showMessage(`获得证据：${node.addEvidence.name}`)
    }

    if (node.setFlag) {
      this.systems.save.setFlag(node.setFlag, node.flagValue || true)
    }

    if (node.miniGame) {
      this.startMiniGame(node.miniGame)
      return
    }

    this.advance()
  }

  processConditionNode(node) {
    const result = this.checkCondition(node.condition)
    const nextId = result ? node.trueNext : node.falseNext
    
    if (nextId) {
      this.jumpToNode(nextId)
    } else {
      this.advance()
    }
  }

  processEndingNode(node) {
    this.scene.triggerEnding(node.endingId)
  }

  checkCondition(condition) {
    switch (condition.type) {
      case 'affection':
        return this.systems.affection.getValue() >= condition.value
      case 'hasEvidence':
        return this.systems.evidence.has(condition.evidenceId)
      case 'flag':
        return this.systems.save.getFlag(condition.flagName) === condition.flagValue
      default:
        return true
    }
  }

  selectChoice(choice) {
    if (choice.addAffection) {
      this.systems.affection.add(choice.addAffection)
      this.scene.updateAffectionUI()
    }

    if (choice.addEvidence) {
      this.systems.evidence.add(choice.addEvidence)
      this.scene.showMessage(`获得证据：${choice.addEvidence.name}`)
    }

    if (choice.setFlag) {
      this.systems.save.setFlag(choice.setFlag, choice.flagValue || true)
    }

    if (choice.next) {
      this.jumpToNode(choice.next)
    } else {
      this.advance()
    }
  }

  jumpToNode(nodeId) {
    const index = this.currentDialogue.nodes.findIndex(n => n.id === nodeId)
    if (index !== -1) {
      this.currentIndex = index
      this.processCurrentNode()
    }
  }

  advance() {
    if (!this.currentDialogue || this.currentIndex >= this.currentDialogue.nodes.length) {
      return
    }

    const node = this.currentDialogue.nodes[this.currentIndex]
    if (node && node.next) {
      this.jumpToNode(node.next)
      return
    }

    this.currentIndex++
    
    if (this.currentIndex >= this.currentDialogue.nodes.length) {
      if (this.currentDialogue.nextDialogue) {
        this.startDialogue(this.currentDialogue.nextDialogue)
      } else {
        console.log('Dialogue ended')
      }
      return
    }

    this.processCurrentNode()
  }

  startMiniGame(miniGameConfig) {
    switch (miniGameConfig.type) {
      case 'memory':
        this.startMemoryGame(miniGameConfig)
        break
      case 'quiz':
        this.startQuizGame(miniGameConfig)
        break
      default:
        this.advance()
    }
  }

  startMemoryGame(config) {
    const { width, height } = this.scene.cameras.main
    
    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9)
    
    const title = this.scene.add.text(width / 2, height / 2 - 150, '记忆游戏', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#4ecdc4'
    }).setOrigin(0.5)

    const sequence = []
    const playerSequence = []
    const colors = [0xff6b6b, 0x4ecdc4, 0xfdcb6e, 0x6c5ce7]
    const sequenceLength = config.difficulty || 4

    for (let i = 0; i < sequenceLength; i++) {
      sequence.push(Math.floor(Math.random() * 4))
    }

    const buttons = []
    const buttonSize = 80
    const startX = width / 2 - (buttonSize * 2 + 30)
    const startY = height / 2

    for (let i = 0; i < 4; i++) {
      const x = startX + i * (buttonSize + 20)
      const btn = this.scene.add.rectangle(x, startY, buttonSize, buttonSize, colors[i])
        .setInteractive({ useHandCursor: true })
      buttons.push(btn)
    }

    const instruction = this.scene.add.text(width / 2, height / 2 + 100, '记住顺序！', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5)

    let showingSequence = true
    let currentShowIndex = 0

    const showSequence = () => {
      if (currentShowIndex < sequence.length) {
        const btn = buttons[sequence[currentShowIndex]]
        const originalColor = colors[sequence[currentShowIndex]]
        btn.setFillStyle(0xffffff)
        
        this.scene.time.delayedCall(500, () => {
          btn.setFillStyle(originalColor)
          currentShowIndex++
          this.scene.time.delayedCall(300, showSequence)
        })
      } else {
        showingSequence = false
        instruction.setText('请按顺序点击！')
        enablePlayerInput()
      }
    }

    const enablePlayerInput = () => {
      buttons.forEach((btn, index) => {
        btn.on('pointerdown', () => {
          playerSequence.push(index)
          
          if (playerSequence[playerSequence.length - 1] !== sequence[playerSequence.length - 1]) {
            endGame(false)
          } else if (playerSequence.length === sequence.length) {
            endGame(true)
          }
        })
      })
    }

    const endGame = (success) => {
      overlay.destroy()
      title.destroy()
      instruction.destroy()
      buttons.forEach(b => b.destroy())

      if (success) {
        if (config.successAffection) {
          this.systems.affection.add(config.successAffection)
          this.scene.updateAffectionUI()
        }
        this.scene.showMessage('成功！')
      } else {
        if (config.failAffection) {
          this.systems.affection.add(config.failAffection)
          this.scene.updateAffectionUI()
        }
        this.scene.showMessage('失败...')
      }

      this.scene.time.delayedCall(1000, () => {
        this.advance()
      })
    }

    this.scene.time.delayedCall(500, showSequence)
  }

  startQuizGame(config) {
    const { width, height } = this.scene.cameras.main
    
    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9)
    
    const title = this.scene.add.text(width / 2, height / 2 - 150, config.question, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      wordWrap: { width: width - 100 }
    }).setOrigin(0.5)

    const options = config.options || []
    const correctIndex = config.correctIndex || 0

    options.forEach((option, index) => {
      const y = height / 2 - 50 + index * 60
      const btn = this.scene.add.rectangle(width / 2, y, 400, 50, 0x2d3436)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => btn.setFillStyle(0x4a5459))
        .on('pointerout', () => btn.setFillStyle(0x2d3436))
        .on('pointerdown', () => {
          overlay.destroy()
          title.destroy()
          options.forEach((_, i) => {
            this.scene.children.getByName(`quiz_opt_${i}`)?.destroy()
            this.scene.children.getByName(`quiz_btn_${i}`)?.destroy()
          })

          if (index === correctIndex) {
            if (config.successAffection) {
              this.systems.affection.add(config.successAffection)
              this.scene.updateAffectionUI()
            }
            this.scene.showMessage('回答正确！')
          } else {
            if (config.failAffection) {
              this.systems.affection.add(config.failAffection)
              this.scene.updateAffectionUI()
            }
            this.scene.showMessage('回答错误...')
          }

          this.scene.time.delayedCall(1000, () => {
            this.advance()
          })
        })

      btn.setName(`quiz_btn_${index}`)

      const text = this.scene.add.text(width / 2, y, option, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffffff'
      }).setOrigin(0.5)
      text.setName(`quiz_opt_${index}`)
    })
  }
}
