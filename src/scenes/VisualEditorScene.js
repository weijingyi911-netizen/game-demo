import Phaser from 'phaser'

export class VisualEditorScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VisualEditorScene' })
    
    this.storyData = {
      chapters: [],
      currentChapterId: null
    }
    
    this.nodes = []
    this.selectedNode = null
    this.nodeIdCounter = 0
    this.hoveredNode = null
    this.canvasOffsetX = 220
    this.canvasOffsetY = 50
  }

  create() {
    const { width, height } = this.cameras.main

    this.createLayout(width, height)
    this.loadStoryYaml()
    this.loadSavedEditorData()
  }

  createLayout(width, height) {
    this.createTopBar(width)
    this.createCanvas(width, height)
    this.createLeftPanel(width, height)
    this.createRightPanel(width, height)
  }

  createTopBar(width) {
    const topBar = this.add.rectangle(width / 2, 25, width, 50, 0x2d3436)
    topBar.setStrokeStyle(2, 0x4ecdc4)
    topBar.setDepth(100)

    this.add.text(20, 25, '可视化剧情编辑器', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)

    this.createPixelButton(width - 180, 25, '预览', 0x6c5ce7, () => this.previewStory())
    this.createPixelButton(width - 90, 25, '导出', 0x4ecdc4, () => this.exportStory())
    this.createPixelButton(width - 10, 25, '返回', 0xff6b6b, () => this.scene.start('MenuScene'))
  }

  createPixelButton(x, y, text, color, callback) {
    const btn = this.add.rectangle(x, y, 70, 32, color)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.highlightButton(btn, color, true))
      .on('pointerout', () => this.highlightButton(btn, color, false))
      .on('pointerdown', callback)

    this.add.text(x, y, text, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    return btn
  }

  highlightButton(btn, color, highlight) {
    if (highlight) {
      const r = (color >> 16) & 0xff
      const g = (color >> 8) & 0xff
      const b = color & 0xff
      const brighter = (c) => Math.min(255, c + 40)
      btn.setFillStyle((brighter(r) << 16) | (brighter(g) << 8) | brighter(b))
    } else {
      btn.setFillStyle(color)
    }
  }

  createLeftPanel(width, height) {
    const panelWidth = 220
    const panelX = panelWidth / 2
    const panelY = height / 2 + 25

    const panel = this.add.rectangle(panelX, panelY, panelWidth, height - 50, 0x1e272e)
    panel.setStrokeStyle(2, 0x4a5459)
    panel.setDepth(10)

    this.add.text(panelX, 80, '章节列表', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#4ecdc4',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.chapterListContainer = this.add.container(0, 0)
    this.chapterListContainer.setDepth(11)

    const addBtn = this.createPixelButton(panelX, height - 80, '+ 章节', 0x4ecdc4, () => this.showAddChapterDialog())
    addBtn.setSize(160, 32)
  }

  createCanvas(width, height) {
    const canvasWidth = width - 220 - 280
    const canvasHeight = height - 50

    const canvasBg = this.add.rectangle(
      this.canvasOffsetX + canvasWidth / 2,
      this.canvasOffsetY + canvasHeight / 2,
      canvasWidth,
      canvasHeight,
      0x0a0a0f
    )
    canvasBg.setStrokeStyle(2, 0x4a5459)
    canvasBg.setDepth(0)

    this.createCanvasControls(this.canvasOffsetX, canvasWidth)
  }

  createCanvasControls(canvasX, canvasWidth) {
    const y = this.canvasOffsetY + 30

    this.createAddNodeButton(canvasX + 70, y, '对话', 0x00b894, 'dialogue')
    this.createAddNodeButton(canvasX + 170, y, '选项', 0xfdcb6e, 'choice')
    this.createAddNodeButton(canvasX + 270, y, '条件', 0x6c5ce7, 'condition')
    this.createAddNodeButton(canvasX + 370, y, '结局', 0xff6b6b, 'ending')
  }

  createAddNodeButton(x, y, text, color, type) {
    const btn = this.add.rectangle(x, y, 90, 32, color)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.highlightButton(btn, color, true))
      .on('pointerout', () => this.highlightButton(btn, color, false))
      .on('pointerdown', () => this.addNode(type))

    this.add.text(x, y, text, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: type === 'choice' ? '#000000' : '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
  }

  createRightPanel(width, height) {
    const panelWidth = 280
    const panelX = width - panelWidth / 2
    const panelY = height / 2 + 25

    const panel = this.add.rectangle(panelX, panelY, panelWidth, height - 50, 0x1e272e)
    panel.setStrokeStyle(2, 0x4a5459)
    panel.setDepth(10)

    this.add.text(panelX, 80, '属性编辑', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#4ecdc4',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.propertyPanelContainer = this.add.container(0, 0)
    this.propertyPanelContainer.setDepth(11)
    this.showEmptyPropertyPanel()
  }

  showEmptyPropertyPanel() {
    this.propertyPanelContainer.removeAll(true)
    
    const { width } = this.cameras.main
    const panelX = width - 140

    const text = this.add.text(panelX, 250, '选择一个节点\n进行编辑', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#888888',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.propertyPanelContainer.add(text)
  }

  addNode(type) {
    const { width } = this.cameras.main
    const canvasWidth = width - 220 - 280
    const canvasHeight = 720 - 50
    
    const centerX = this.canvasOffsetX + canvasWidth / 2
    const centerY = this.canvasOffsetY + canvasHeight / 2

    const node = {
      id: `node_${this.nodeIdCounter++}`,
      type: type,
      x: centerX + Math.random() * 100 - 50,
      y: centerY + Math.random() * 100 - 50,
      data: this.getDefaultNodeData(type)
    }

    this.nodes.push(node)
    this.renderNode(node)
    this.selectNode(node)
    this.saveEditorData()
  }

  getDefaultNodeData(type) {
    switch (type) {
      case 'dialogue':
        return {
          speaker: '',
          text: '',
          background: 'bg_default',
          character: 'char_none',
          next: null
        }
      case 'choice':
        return {
          choices: [
            { text: '选项1', next: null, affection: 0 },
            { text: '选项2', next: null, affection: 0 }
          ]
        }
      case 'condition':
        return {
          conditionType: 'affection',
          conditionValue: 50,
          trueNext: null,
          falseNext: null
        }
      case 'ending':
        return {
          endingType: 'normal'
        }
      default:
        return {}
    }
  }

  renderNode(node) {
    const colors = {
      dialogue: 0x00b894,
      choice: 0xfdcb6e,
      condition: 0x6c5ce7,
      ending: 0xff6b6b
    }

    const labels = {
      dialogue: '对话',
      choice: '选项',
      condition: '条件',
      ending: '结局'
    }

    const nodeWidth = 180
    const nodeHeight = 90

    const bg = this.add.rectangle(node.x, node.y, nodeWidth, nodeHeight, colors[node.type])
    bg.setStrokeStyle(3, 0xffffff, 0.5)
    bg.setInteractive({ useHandCursor: true, draggable: true })

    const label = this.add.text(node.x, node.y - 28, labels[node.type], {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: node.type === 'choice' ? '#000000' : '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const preview = this.add.text(node.x, node.y + 5, this.getNodePreview(node), {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: node.type === 'choice' ? '#333333' : '#ffffff',
      wordWrap: { width: nodeWidth - 20 },
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    bg.on('pointerdown', () => {
      this.selectNode(node)
    })

    bg.on('pointerover', () => {
      if (this.hoveredNode !== node) {
        this.hoveredNode = node
        if (this.selectedNode !== node) {
          bg.setStrokeStyle(4, 0xffffff, 0.8)
        }
      }
    })

    bg.on('pointerout', () => {
      if (this.hoveredNode === node) {
        this.hoveredNode = null
        if (this.selectedNode !== node) {
          bg.setStrokeStyle(3, 0xffffff, 0.5)
        }
      }
    })

    bg.on('drag', (pointer, dragX, dragY) => {
      node.x = dragX
      node.y = dragY
      bg.setPosition(dragX, dragY)
      label.setPosition(dragX, dragY - 28)
      preview.setPosition(dragX, dragY + 5)
    })

    bg.on('dragend', () => {
      this.saveEditorData()
    })

    node.graphics = { bg, label, preview }
  }

  getNodePreview(node) {
    switch (node.type) {
      case 'dialogue':
        return node.data.speaker ? node.data.speaker : '未设置说话人'
      case 'choice':
        return `${node.data.choices.length} 个选项`
      case 'condition':
        return `好感度 ${node.data.conditionType === 'affection' ? '≥' : ''} ${node.data.conditionValue}`
      case 'ending':
        return node.data.endingType === 'good' ? '好结局' : 
               node.data.endingType === 'bad' ? '坏结局' : '普通结局'
      default:
        return ''
    }
  }

  selectNode(node) {
    if (this.selectedNode && this.selectedNode.graphics) {
      this.selectedNode.graphics.bg.setStrokeStyle(3, 0xffffff, 0.5)
    }

    this.selectedNode = node
    node.graphics.bg.setStrokeStyle(4, 0x4ecdc4, 1)

    this.showPropertyPanel(node)
  }

  deselectNode() {
    if (this.selectedNode && this.selectedNode.graphics) {
      this.selectedNode.graphics.bg.setStrokeStyle(3, 0xffffff, 0.5)
    }
    this.selectedNode = null
    this.showEmptyPropertyPanel()
  }

  showPropertyPanel(node) {
    this.propertyPanelContainer.removeAll(true)
    
    const { width } = this.cameras.main
    const panelX = width - 140
    let currentY = 120

    const typeLabels = {
      dialogue: '对话节点',
      choice: '选项节点',
      condition: '条件节点',
      ending: '结局节点'
    }

    this.propertyPanelContainer.add(
      this.add.text(panelX, currentY, typeLabels[node.type], {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5)
    )
    currentY += 40

    switch (node.type) {
      case 'dialogue':
        this.renderDialogueProperties(node, panelX, currentY)
        break
      case 'choice':
        this.renderChoiceProperties(node, panelX, currentY)
        break
      case 'condition':
        this.renderConditionProperties(node, panelX, currentY)
        break
      case 'ending':
        this.renderEndingProperties(node, panelX, currentY)
        break
    }

    currentY = this.lastPropertyY || currentY
    currentY += 20

    const deleteBtn = this.createPixelButton(panelX, currentY, '删除节点', 0xff6b6b, () => this.deleteNode(node))
    deleteBtn.setSize(140, 32)
  }

  renderDialogueProperties(node, panelX, startY) {
    let y = startY

    this.propertyPanelContainer.add(
      this.add.text(panelX - 120, y, '说话人：', {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#4ecdc4',
        fontStyle: 'bold'
      })
    )
    y += 20

    const speakerInput = this.createInputField(panelX, y, 220, node.data.speaker || '', (value) => {
      node.data.speaker = value
      node.graphics.preview.setText(this.getNodePreview(node))
      this.saveEditorData()
    })
    this.propertyPanelContainer.add(speakerInput)
    y += 35

    this.propertyPanelContainer.add(
      this.add.text(panelX - 120, y, '对话内容：', {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#4ecdc4',
        fontStyle: 'bold'
      })
    )
    y += 20

    const textInput = this.createTextArea(panelX, y, 220, 80, node.data.text || '', (value) => {
      node.data.text = value
      this.saveEditorData()
    })
    this.propertyPanelContainer.add(textInput)
    y += 95

    this.propertyPanelContainer.add(
      this.add.text(panelX - 120, y, '背景图片：', {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#4ecdc4',
        fontStyle: 'bold'
      })
    )
    y += 20

    const bgSelect = this.createSelectField(panelX, y, 220, [
      { value: 'bg_default', label: '默认背景' },
      { value: 'bg_cafe', label: '咖啡店' },
      { value: 'bg_park', label: '公园' },
      { value: 'bg_street', label: '街道' }
    ], node.data.background, (value) => {
      node.data.background = value
      this.saveEditorData()
    })
    this.propertyPanelContainer.add(bgSelect)
    y += 35

    this.propertyPanelContainer.add(
      this.add.text(panelX - 120, y, '角色立绘：', {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#4ecdc4',
        fontStyle: 'bold'
      })
    )
    y += 20

    const charSelect = this.createSelectField(panelX, y, 220, [
      { value: 'char_none', label: '无角色' },
      { value: 'char_heroine_normal', label: '默认' },
      { value: 'char_heroine_happy', label: '开心' },
      { value: 'char_heroine_shy', label: '害羞' }
    ], node.data.character, (value) => {
      node.data.character = value
      this.saveEditorData()
    })
    this.propertyPanelContainer.add(charSelect)

    this.lastPropertyY = y + 40
  }

  renderChoiceProperties(node, panelX, startY) {
    let y = startY

    this.propertyPanelContainer.add(
      this.add.text(panelX - 120, y, '选项列表：', {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#4ecdc4',
        fontStyle: 'bold'
      })
    )
    y += 20

    node.data.choices.forEach((choice, index) => {
      this.propertyPanelContainer.add(
        this.add.text(panelX - 120, y, `选项 ${index + 1}：`, {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#888888',
          fontStyle: 'bold'
        })
      )
      y += 18

      const choiceInput = this.createInputField(panelX, y, 220, choice.text, (value) => {
        choice.text = value
        this.saveEditorData()
      })
      this.propertyPanelContainer.add(choiceInput)
      y += 32

      this.propertyPanelContainer.add(
        this.add.text(panelX - 120, y, '好感度：', {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#888888',
          fontStyle: 'bold'
        })
      )
      y += 18

      const affectionInput = this.createInputField(panelX, y, 80, String(choice.affection || 0), (value) => {
        choice.affection = parseInt(value) || 0
        this.saveEditorData()
      })
      this.propertyPanelContainer.add(affectionInput)
      y += 35
    })

    const addChoiceBtn = this.createPixelButton(panelX, y, '+ 添加选项', 0x4a5459, () => {
      node.data.choices.push({ text: '新选项', next: null, affection: 0 })
      this.showPropertyPanel(node)
      this.saveEditorData()
    })
    addChoiceBtn.setSize(180, 28)

    this.lastPropertyY = y + 40
  }

  renderConditionProperties(node, panelX, startY) {
    let y = startY

    this.propertyPanelContainer.add(
      this.add.text(panelX - 120, y, '条件类型：', {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#4ecdc4',
        fontStyle: 'bold'
      })
    )
    y += 20

    const typeSelect = this.createSelectField(panelX, y, 220, [
      { value: 'affection', label: '好感度判断' },
      { value: 'flag', label: '标记判断' }
    ], node.data.conditionType, (value) => {
      node.data.conditionType = value
      node.graphics.preview.setText(this.getNodePreview(node))
      this.saveEditorData()
    })
    this.propertyPanelContainer.add(typeSelect)
    y += 35

    if (node.data.conditionType === 'affection') {
      this.propertyPanelContainer.add(
        this.add.text(panelX - 120, y, '好感度阈值：', {
          fontSize: '13px',
          fontFamily: 'Arial',
          color: '#4ecdc4',
          fontStyle: 'bold'
        })
      )
      y += 18

      const valueInput = this.createInputField(panelX, y, 80, String(node.data.conditionValue), (value) => {
        node.data.conditionValue = parseInt(value) || 0
        node.graphics.preview.setText(this.getNodePreview(node))
        this.saveEditorData()
      })
      this.propertyPanelContainer.add(valueInput)
    }

    this.lastPropertyY = y + 40
  }

  renderEndingProperties(node, panelX, startY) {
    let y = startY

    this.propertyPanelContainer.add(
      this.add.text(panelX - 120, y, '结局类型：', {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#4ecdc4',
        fontStyle: 'bold'
      })
    )
    y += 20

    const typeSelect = this.createSelectField(panelX, y, 220, [
      { value: 'good', label: '好结局' },
      { value: 'normal', label: '普通结局' },
      { value: 'bad', label: '坏结局' }
    ], node.data.endingType, (value) => {
      node.data.endingType = value
      node.graphics.preview.setText(this.getNodePreview(node))
      this.saveEditorData()
    })
    this.propertyPanelContainer.add(typeSelect)

    this.lastPropertyY = y + 40
  }

  createInputField(x, y, width, defaultValue, onChange) {
    const container = this.add.container(x - width / 2, y)

    const bg = this.add.rectangle(width / 2, 12, width, 28, 0x2d3436)
    bg.setStrokeStyle(2, 0x4ecdc4)
    bg.setInteractive({ useHandCursor: true })

    const text = this.add.text(10, 12, defaultValue || '点击输入...', {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: defaultValue ? '#ffffff' : '#888888',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)

    container.add([bg, text])

    bg.on('pointerdown', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.value = defaultValue
      input.style.cssText = `
        position: fixed;
        left: ${this.game.canvas.getBoundingClientRect().left + x - width / 2}px;
        top: ${this.game.canvas.getBoundingClientRect().top + y}px;
        width: ${width}px;
        height: 28px;
        background: #2d3436;
        border: 2px solid #4ecdc4;
        color: white;
        font-size: 13px;
        font-family: Arial;
        font-weight: bold;
        padding: 0 10px;
        z-index: 1000;
        border-radius: 4px;
      `
      document.body.appendChild(input)
      input.focus()
      input.select()

      const finish = () => {
        text.setText(input.value || '点击输入...')
        text.setColor(input.value ? '#ffffff' : '#888888')
        onChange(input.value)
        document.body.removeChild(input)
      }

      input.addEventListener('blur', finish)
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          finish()
        }
      })
    })

    return container
  }

  createTextArea(x, y, width, height, defaultValue, onChange) {
    const container = this.add.container(x - width / 2, y)

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x2d3436)
    bg.setStrokeStyle(2, 0x4ecdc4)
    bg.setInteractive({ useHandCursor: true })

    const text = this.add.text(10, 8, defaultValue || '点击输入对话内容...', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: defaultValue ? '#ffffff' : '#888888',
      fontStyle: 'bold',
      wordWrap: { width: width - 20 },
      align: 'left'
    })

    container.add([bg, text])

    bg.on('pointerdown', () => {
      const textarea = document.createElement('textarea')
      textarea.value = defaultValue
      textarea.style.cssText = `
        position: fixed;
        left: ${this.game.canvas.getBoundingClientRect().left + x - width / 2}px;
        top: ${this.game.canvas.getBoundingClientRect().top + y}px;
        width: ${width}px;
        height: ${height}px;
        background: #2d3436;
        border: 2px solid #4ecdc4;
        color: white;
        font-size: 12px;
        font-family: Arial;
        font-weight: bold;
        padding: 8px;
        resize: none;
        z-index: 1000;
        border-radius: 4px;
      `
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()

      const finish = () => {
        text.setText(textarea.value || '点击输入对话内容...')
        text.setColor(textarea.value ? '#ffffff' : '#888888')
        onChange(textarea.value)
        document.body.removeChild(textarea)
      }

      textarea.addEventListener('blur', finish)
    })

    return container
  }

  createSelectField(x, y, width, options, defaultValue, onChange) {
    const container = this.add.container(x - width / 2, y)

    const bg = this.add.rectangle(width / 2, 12, width, 28, 0x2d3436)
    bg.setStrokeStyle(2, 0x4ecdc4)
    bg.setInteractive({ useHandCursor: true })

    const selectedOption = options.find(o => o.value === defaultValue) || options[0]
    const text = this.add.text(10, 12, selectedOption.label, {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)

    const arrow = this.add.text(width - 20, 12, '▼', {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#4ecdc4',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    container.add([bg, text, arrow])

    let isOpen = false
    let dropdownContainer = null

    bg.on('pointerdown', () => {
      if (isOpen) {
        if (dropdownContainer) {
          dropdownContainer.destroy()
          dropdownContainer = null
        }
        isOpen = false
        return
      }

      isOpen = true
      dropdownContainer = this.add.container(x - width / 2, y + 28)

      options.forEach((option, index) => {
        const optBg = this.add.rectangle(width / 2, 14 + index * 30, width, 30, 0x2d3436)
          .setInteractive({ useHandCursor: true })
          .on('pointerover', () => optBg.setFillStyle(0x4a5459))
          .on('pointerout', () => optBg.setFillStyle(0x2d3436))
          .on('pointerdown', () => {
            text.setText(option.label)
            onChange(option.value)
            dropdownContainer.destroy()
            dropdownContainer = null
            isOpen = false
          })

        const optText = this.add.text(10, 14 + index * 30, option.label, {
          fontSize: '13px',
          fontFamily: 'Arial',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0, 0.5)

        dropdownContainer.add([optBg, optText])
      })

      this.propertyPanelContainer.add(dropdownContainer)
    })

    return container
  }

  deleteNode(node) {
    const index = this.nodes.indexOf(node)
    if (index > -1) {
      this.nodes.splice(index, 1)
      
      if (node.graphics) {
        node.graphics.bg.destroy()
        node.graphics.label.destroy()
        node.graphics.preview.destroy()
      }

      if (this.selectedNode === node) {
        this.selectedNode = null
        this.showEmptyPropertyPanel()
      }

      this.saveEditorData()
    }
  }

  renderChapterList() {
    this.chapterListContainer.removeAll(true)

    const { height } = this.cameras.main
    let y = 120

    this.storyData.chapters.forEach((chapter, index) => {
      const isSelected = chapter.id === this.storyData.currentChapterId

      const item = this.add.rectangle(110, y, 180, 36, isSelected ? 0x4ecdc4 : 0x2d3436)
      item.setStrokeStyle(2, isSelected ? 0x4ecdc4 : 0x4a5459)
      item.setInteractive({ useHandCursor: true })

      item.on('pointerover', () => {
        if (!isSelected) item.setFillStyle(0x4a5459)
      })
      item.on('pointerout', () => {
        if (!isSelected) item.setFillStyle(0x2d3436)
      })
      item.on('pointerdown', () => {
        this.storyData.currentChapterId = chapter.id
        this.renderChapterList()
      })

      const text = this.add.text(110, y, chapter.name, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: isSelected ? '#000000' : '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5)

      this.chapterListContainer.add([item, text])
      y += 45
    })
  }

  showAddChapterDialog() {
    const { width, height } = this.cameras.main

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9)

    const dialog = this.add.rectangle(width / 2, height / 2, 400, 200, 0x2d3436)
    dialog.setStrokeStyle(3, 0x4ecdc4)

    const title = this.add.text(width / 2, height / 2 - 70, '添加新章节', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#4ecdc4',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    let chapterName = ''

    const inputContainer = this.add.container(width / 2, height / 2 - 20)
    const inputBg = this.add.rectangle(0, 0, 300, 40, 0x1e272e)
    inputBg.setStrokeStyle(2, 0x4ecdc4)
    const inputText = this.add.text(0, 0, '点击输入章节名称...', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#888888',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    inputContainer.add([inputBg, inputText])

    inputBg.setInteractive({ useHandCursor: true })
    inputBg.on('pointerdown', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.value = chapterName
      input.style.cssText = `
        position: fixed;
        left: ${this.game.canvas.getBoundingClientRect().left + width / 2 - 150}px;
        top: ${this.game.canvas.getBoundingClientRect().top + height / 2 - 40}px;
        width: 300px;
        height: 40px;
        background: #1e272e;
        border: 2px solid #4ecdc4;
        color: white;
        font-size: 14px;
        font-family: Arial;
        font-weight: bold;
        padding: 0 15px;
        z-index: 1000;
        border-radius: 4px;
      `
      document.body.appendChild(input)
      input.focus()

      input.addEventListener('input', () => {
        chapterName = input.value
        inputText.setText(chapterName || '点击输入章节名称...')
        inputText.setColor(chapterName ? '#ffffff' : '#888888')
      })

      input.addEventListener('blur', () => {
        document.body.removeChild(input)
      })

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          document.body.removeChild(input)
        }
      })
    })

    const closeDialog = () => {
      overlay.destroy()
      dialog.destroy()
      title.destroy()
      inputContainer.destroy()
      confirmBtn.destroy()
      cancelBtn.destroy()
    }

    const confirmBtn = this.createPixelButton(width / 2 - 70, height / 2 + 60, '确定', 0x4ecdc4, () => {
      if (chapterName.trim()) {
        this.storyData.chapters.push({
          id: `chapter_${Date.now()}`,
          name: chapterName.trim()
        })
        this.renderChapterList()
        this.saveEditorData()
        closeDialog()
      }
    })
    confirmBtn.setSize(100, 36)

    const cancelBtn = this.createPixelButton(width / 2 + 70, height / 2 + 60, '取消', 0x636e72, closeDialog)
    cancelBtn.setSize(100, 36)
  }

  previewStory() {
    if (this.nodes.length === 0) {
      this.showMessage('请先添加对话节点')
      return
    }

    const yamlContent = this.generateYaml()
    localStorage.setItem('preview_yaml', yamlContent)
    this.scene.start('DialogueScene', { dialogueId: 'start', usePreviewYaml: true })
  }

  exportStory() {
    if (this.nodes.length === 0) {
      this.showMessage('没有可导出的内容')
      return
    }

    const yamlContent = this.generateYaml()
    const blob = new Blob([yamlContent], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'story.yaml'
    a.click()
    URL.revokeObjectURL(url)
    this.showMessage('导出成功！')
  }

  generateYaml() {
    if (this.nodes.length === 0) return null

    const startNode = this.nodes[0]?.id
    let yaml = 'chapters:\n  start:\n    name: 第一章\n'
    if (startNode) {
      yaml += `    start_node: ${startNode}\n`
    }
    yaml += '    scenes:\n'

    this.nodes.forEach((node, index) => {
      yaml += this.nodeToYaml(node, index)
    })

    return yaml
  }

  nodeToYaml(node, index) {
    let yaml = `      - id: ${node.id}\n`

    switch (node.type) {
      case 'dialogue':
        yaml += `        type: dialogue\n`
        yaml += `        background: ${node.data.background}\n`
        yaml += `        character: ${node.data.character}\n`
        yaml += `        speaker: "${node.data.speaker || ''}"\n`
        yaml += `        text: |\n`
        const lines = (node.data.text || '').split('\n')
        lines.forEach(line => {
          yaml += `          ${line}\n`
        })
        if (node.data.goto) {
          yaml += `        goto: ${node.data.goto}\n`
        }
        break
      case 'choice':
        yaml += `        type: choice\n`
        yaml += `        options:\n`
        node.data.choices.forEach(choice => {
          yaml += `          - text: "${choice.text}"\n`
          if (choice.affection) {
            yaml += `            affection: ${choice.affection}\n`
          }
          if (choice.goto) {
            yaml += `            goto: ${choice.goto}\n`
          }
        })
        break
      case 'condition':
        yaml += `        type: condition\n`
        yaml += `        check: affection >= ${node.data.conditionValue}\n`
        if (node.data.trueGoto) {
          yaml += `        true_goto: ${node.data.trueGoto}\n`
        }
        if (node.data.falseGoto) {
          yaml += `        false_goto: ${node.data.falseGoto}\n`
        }
        break
      case 'ending':
        yaml += `        type: ending\n`
        yaml += `        ending: ${node.data.endingType}\n`
        break
    }

    return yaml
  }

  showMessage(text) {
    const { width, height } = this.cameras.main

    const msgBg = this.add.rectangle(width / 2, height / 2, 300, 60, 0x000000, 0.95)
    const msgText = this.add.text(width / 2, height / 2, text, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#4ecdc4',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.time.delayedCall(2000, () => {
      msgBg.destroy()
      msgText.destroy()
    })
  }

  saveEditorData() {
    const data = {
      chapters: this.storyData.chapters,
      nodes: this.nodes.map(n => ({
        id: n.id,
        type: n.type,
        x: n.x,
        y: n.y,
        data: n.data
      })),
      currentChapterId: this.storyData.currentChapterId
    }
    localStorage.setItem('visual_editor_data', JSON.stringify(data))
  }

  loadSavedEditorData() {
    const saved = localStorage.getItem('visual_editor_data')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        this.storyData.chapters = data.chapters || []
        this.storyData.currentChapterId = data.currentChapterId
        
        if (data.nodes) {
          data.nodes.forEach(nodeData => {
            const node = {
              id: nodeData.id,
              type: nodeData.type,
              x: nodeData.x,
              y: nodeData.y,
              data: nodeData.data,
              graphics: null
            }
            this.nodes.push(node)
            this.renderNode(node)
          })
        }

        this.renderChapterList()
      } catch (e) {
        console.error('Failed to load saved data:', e)
      }
    }
  }

  loadStoryYaml() {
    const yamlContent = localStorage.getItem('preview_yaml')
    if (yamlContent) {
      try {
        const yaml = this.parseYamlToNodes(yamlContent)
        if (yaml && yaml.scenes && yaml.scenes.length > 0) {
          this.nodes.forEach(node => {
            if (node.graphics) {
              node.graphics.bg.destroy()
              node.graphics.label.destroy()
              node.graphics.preview.destroy()
            }
          })
          this.nodes = []
          
          let nodeIdCounter = 0
          const { width } = this.cameras.main
          const canvasWidth = width - 220 - 280
          const canvasCenterX = this.canvasOffsetX + canvasWidth / 2
          
          yaml.scenes.forEach((scene, index) => {
            const node = {
              id: scene.id || `node_${nodeIdCounter++}`,
              type: scene.type || 'dialogue',
              x: canvasCenterX + (index % 3) * 200 - 200,
              y: this.canvasOffsetY + 150 + Math.floor(index / 3) * 150,
              data: this.sceneToNodeData(scene),
              graphics: null
            }
            this.nodes.push(node)
            this.renderNode(node)
          })

          this.saveEditorData()
        }
      } catch (e) {
        console.error('Failed to load YAML:', e)
      }
    }
  }

  parseYamlToNodes(yamlContent) {
    const result = { scenes: [] }
    const lines = yamlContent.split('\n')
    let currentScene = null
    let inMultilineText = false
    let multilineText = ''

    lines.forEach(line => {
      const trimmed = line.trim()
      
      if (trimmed.startsWith('- id:')) {
        if (currentScene) {
          result.scenes.push(currentScene)
        }
        currentScene = { id: trimmed.split(':')[1].trim() }
        inMultilineText = false
      } else if (trimmed.startsWith('type:')) {
        if (currentScene) {
          currentScene.type = trimmed.split(':')[1].trim()
        }
      } else if (trimmed.startsWith('speaker:')) {
        if (currentScene) {
          currentScene.speaker = trimmed.split(':')[1].trim().replace(/"/g, '')
        }
      } else if (trimmed.startsWith('text: |')) {
        inMultilineText = true
        multilineText = ''
      } else if (inMultilineText) {
        if (trimmed.startsWith('- ') || trimmed.startsWith('  - ')) {
          inMultilineText = false
          if (currentScene) {
            currentScene.text = multilineText.trim()
          }
        } else {
          multilineText += line.replace(/^      /, '') + '\n'
        }
      } else if (trimmed.startsWith('background:')) {
        if (currentScene) {
          currentScene.background = trimmed.split(':')[1].trim()
        }
      } else if (trimmed.startsWith('character:')) {
        if (currentScene) {
          currentScene.character = trimmed.split(':')[1].trim()
        }
      } else if (trimmed.startsWith('options:')) {
        if (currentScene) {
          currentScene.options = []
        }
      } else if (trimmed.startsWith('- text:')) {
        if (currentScene && currentScene.options) {
          const option = { text: trimmed.split(':')[1].trim().replace(/"/g, '') }
          currentScene.options.push(option)
        }
      } else if (trimmed.startsWith('affection:')) {
        if (currentScene && currentScene.options && currentScene.options.length > 0) {
          currentScene.options[currentScene.options.length - 1].affection = parseInt(trimmed.split(':')[1].trim())
        }
      } else if (trimmed.startsWith('check:')) {
        if (currentScene) {
          currentScene.check = trimmed.split(':')[1].trim()
        }
      } else if (trimmed.startsWith('ending:')) {
        if (currentScene) {
          currentScene.ending = trimmed.split(':')[1].trim()
        }
      }
    })

    if (currentScene) {
      result.scenes.push(currentScene)
    }

    return result
  }

  sceneToNodeData(scene) {
    switch (scene.type) {
      case 'dialogue':
        return {
          speaker: scene.speaker || '',
          text: scene.text || '',
          background: scene.background || 'bg_default',
          character: scene.character || 'char_none',
          next: null
        }
      case 'choice':
        return {
          choices: scene.options || [
            { text: '选项1', next: null, affection: 0 },
            { text: '选项2', next: null, affection: 0 }
          ]
        }
      case 'condition':
        const match = scene.check ? scene.check.match(/affection\s*([><=!]+)\s*(\d+)/) : null
        return {
          conditionType: 'affection',
          conditionValue: match ? parseInt(match[2]) : 50,
          trueNext: null,
          falseNext: null
        }
      case 'ending':
        return {
          endingType: scene.ending || 'normal'
        }
      default:
        return {
          speaker: '',
          text: '',
          background: 'bg_default',
          character: 'char_none',
          next: null
        }
    }
  }
}
