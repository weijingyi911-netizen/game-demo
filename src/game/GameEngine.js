export class GameEngine {
  constructor(config) {
    this.previewMode = config.previewMode || false
    this.chapterId = config.chapterId || 'start'
    this.elements = config.elements
    
    this.state = {
      affection: 0,
      currentNodeId: null,
      flags: {},
      evidences: []
    }
    
    this.nodes = []
    this.nodesMap = {}
    this.chapters = []
    this.currentChapter = null
    
    this.isShowingChoices = false
    this.isMenuOpen = false
    this.isEnding = false
    
    this.assetsById = this.loadAssetsById()
  }

  async start() {
    await this.loadData()
    
    // 始终尝试加载编辑器数据，以便“开始游戏”也能玩到编辑的内容
    this.loadPreviewData()
    
    // 如果有存档且当前节点有效，则继续游戏
    if (this.state.currentNodeId && this.nodesMap[this.state.currentNodeId]) {
      this.goToNode(this.state.currentNodeId)
    } else {
      // 否则从头开始
      const startNode = this.findStartNode()
      if (startNode) {
        this.goToNode(startNode.id)
      } else {
        this.showMessage('没有找到起始节点')
      }
    }
  }

  async loadData() {
    const saved = localStorage.getItem('gameSave')
    if (saved) {
      const saveData = JSON.parse(saved)
      this.state = { ...this.state, ...saveData }
    }
  }
  
  loadAssetsById() {
    const raw = localStorage.getItem('assets_v1')
    if (!raw) return {}
    try {
      const list = JSON.parse(raw) || []
      const map = {}
      list.forEach(a => {
        if (a && a.id) map[a.id] = a
      })
      return map
    } catch {
      return {}
    }
  }

  loadPreviewData() {
    const editorData = localStorage.getItem('editor_data_v4')
    if (editorData) {
      try {
        const data = JSON.parse(editorData)
        this.chapters = data.chapters || []
        this.currentChapter = this.chapters.find(c => c.id === this.chapterId) || this.chapters[0]
        
        const nodesByChapter = data.nodesByChapter || {}
        this.nodes = nodesByChapter[this.currentChapter?.id] || []
        
        this.buildNodesMap()
      } catch (e) {
        console.error('Failed to load preview data:', e)
        this.loadDefaultData()
      }
    } else {
      this.loadDefaultData()
    }
  }

  loadDefaultData() {
    this.chapters = [{ id: 'start', name: '序章' }]
    this.currentChapter = this.chapters[0]
    
    this.nodes = [
      {
        id: 'scene_1',
        type: 'dialogue',
        data: {
          speaker: '旁白',
          text: '这是一个阳光明媚的早晨...',
          background: 'bg_street',
          character: null,
          goto: 'scene_2'
        }
      },
      {
        id: 'scene_2',
        type: 'dialogue',
        data: {
          speaker: '???',
          text: '哇啊！对不起对不起！',
          background: 'bg_street',
          character: 'char_heroine_normal',
          goto: 'scene_3'
        }
      },
      {
        id: 'scene_3',
        type: 'dialogue',
        data: {
          speaker: '小雪',
          text: '你是...新搬来的邻居吗？我叫小雪！',
          background: 'bg_street',
          character: 'char_heroine_normal',
          goto: 'choice_1'
        }
      },
      {
        id: 'choice_1',
        type: 'choice',
        data: {
          choices: [
            { text: '是的，我刚搬来不久。你好！', affection: 5, goto: 'friendly_response' },
            { text: '嗯...你撞到我了。', affection: -3, goto: 'cold_response' }
          ]
        }
      },
      {
        id: 'friendly_response',
        type: 'dialogue',
        data: {
          speaker: '小雪',
          text: '太好了！以后我们就是朋友啦！',
          background: 'bg_street',
          character: 'char_heroine_happy',
          goto: 'ending_1'
        }
      },
      {
        id: 'cold_response',
        type: 'dialogue',
        data: {
          speaker: '小雪',
          text: '啊...真的对不起！',
          background: 'bg_street',
          character: 'char_heroine_shy',
          goto: 'ending_1'
        }
      },
      {
        id: 'ending_1',
        type: 'ending',
        data: {
          endingType: 'normal'
        }
      }
    ]
    
    this.buildNodesMap()
  }

  buildNodesMap() {
    this.nodesMap = {}
    this.nodes.forEach(node => {
      this.nodesMap[node.id] = node
    })
  }

  findStartNode() {
    if (this.currentChapter?.startNode) {
      return this.nodesMap[this.currentChapter.startNode]
    }
    return this.nodes.find(n => n.type === 'dialogue') || this.nodes[0]
  }

  goToNode(nodeId) {
    const node = this.nodesMap[nodeId]
    if (!node) {
      console.error(`Node not found: ${nodeId}`)
      this.showMessage('节点未找到: ' + nodeId)
      return
    }
    
    this.state.currentNodeId = nodeId
    this.renderNode(node)
  }

  renderNode(node) {
    this.hideChoices()
    
    switch (node.type) {
      case 'dialogue':
        this.renderDialogue(node)
        break
      case 'choice':
        this.renderChoice(node)
        break
      case 'condition':
        this.renderCondition(node)
        break
      case 'ending':
        this.renderEnding(node)
        break
      default:
        console.error(`Unknown node type: ${node.type}`)
    }
  }

  renderDialogue(node) {
    const data = node.data
    
    this.setBackground(data.background)
    this.setCharacter(data.character)
    this.setSpeaker(data.speaker)
    this.setText(data.text)
    this.showDialogueBox()
  }

  renderChoice(node) {
    const data = node.data
    
    this.setBackground(data.background || null)
    this.setSpeaker('选择')
    this.setText('请做出你的选择...')
    
    if (!Array.isArray(data.choices) || data.choices.length === 0) {
      this.hideChoices()
      this.setSpeaker('提示')
      this.setText('该选项节点未配置选项')
      this.showDialogueBox()
      return
    }
    
    this.showChoices(data.choices)
  }

  renderCondition(node) {
    const data = node.data
    
    let conditionMet = false
    if (data.conditionType === 'affection') {
      conditionMet = this.state.affection >= data.conditionValue
    }
    
    const nextNodeId = conditionMet ? data.trueGoto : data.falseGoto
    if (nextNodeId) {
      this.goToNode(nextNodeId)
    }
  }

  renderEnding(node) {
    const data = node.data
    this.isEnding = true
    
    const endings = {
      good: { title: '完美结局', desc: '你们幸福地在一起了！', color: '#00b894' },
      normal: { title: '普通结局', desc: '你们成为了好朋友。', color: '#fdcb6e' },
      bad: { title: '坏结局', desc: '你们渐行渐远...', color: '#ff6b6b' }
    }
    
    const ending = endings[data.endingType] || endings.normal
    
    this.elements.endingTitle.textContent = ending.title
    this.elements.endingTitle.style.color = ending.color
    this.elements.endingDesc.textContent = ending.desc
    this.elements.endingOverlay.style.display = 'flex'
  }

  advance() {
    if (this.isEnding || this.isShowingChoices || this.isMenuOpen) {
      return
    }
    
    const currentNode = this.nodesMap[this.state.currentNodeId]
    if (!currentNode) return
    
    if (currentNode.type === 'dialogue' && currentNode.data.goto) {
      this.goToNode(currentNode.data.goto)
    }
  }

  selectChoice(choice) {
    if (choice.affection) {
      this.state.affection += choice.affection
      this.updateAffectionUI()
    }
    
    this.hideChoices()
    
    if (choice.goto) {
      this.goToNode(choice.goto)
    }
  }

  setBackground(backgroundId) {
    const asset = backgroundId ? this.assetsById[backgroundId] : null
    if (asset && asset.type === 'background' && (asset.url || asset.dataUrl)) {
      this.elements.background.src = asset.url || asset.dataUrl
      return
    }
    const backgrounds = {
      bg_street: 'https://placehold.co/1280x720/6c5ce7/ffffff?text=Street',
      bg_cafe: 'https://placehold.co/1280x720/2d3436/ffffff?text=Cafe',
      bg_park: 'https://placehold.co/1280x720/00b894/ffffff?text=Park',
      bg_default: 'https://placehold.co/1280x720/1a1a2e/ffffff?text=Default'
    }
    
    const url = backgrounds[backgroundId] || backgrounds.bg_default
    this.elements.background.src = url
  }

  setCharacter(characterId) {
    const characters = {
      char_heroine_normal: 'https://placehold.co/300x500/e17055/ffffff?text=Heroine',
      char_heroine_happy: 'https://placehold.co/300x500/00b894/ffffff?text=Happy',
      char_heroine_shy: 'https://placehold.co/300x500/fdcb6e/ffffff?text=Shy'
    }
    
    if (characterId && characterId !== 'null' && characterId !== 'char_none') {
      const asset = this.assetsById[characterId]
      const url = asset && asset.type === 'character' && (asset.url || asset.dataUrl) ? (asset.url || asset.dataUrl) : (characters[characterId] || characters.char_heroine_normal)
      this.elements.character.src = url
      this.elements.character.style.display = 'block'
    } else {
      this.elements.character.style.display = 'none'
    }
  }

  setSpeaker(name) {
    this.elements.speakerName.textContent = name || '???'
  }

  setText(text) {
    this.elements.dialogueText.textContent = text || ''
  }

  showDialogueBox() {
    this.elements.dialogueContainer.style.display = 'block'
  }

  hideDialogueBox() {
    this.elements.dialogueContainer.style.display = 'none'
  }

  showChoices(choices) {
    if (!Array.isArray(choices) || choices.length === 0) {
      this.isShowingChoices = false
      this.elements.choiceContainer.style.display = 'none'
      this.elements.choiceContainer.innerHTML = ''
      this.setSpeaker('提示')
      this.setText('该选项节点未配置选项')
      this.showDialogueBox()
      return
    }
    this.isShowingChoices = true
    this.hideDialogueBox()
    
    this.elements.choiceContainer.innerHTML = ''
    this.elements.choiceContainer.style.display = 'flex'
    
    choices.forEach((choice, index) => {
      const btn = document.createElement('button')
      btn.className = 'choice-btn'
      btn.textContent = choice.text
      btn.addEventListener('click', () => this.selectChoice(choice))
      this.elements.choiceContainer.appendChild(btn)
    })
  }

  hideChoices() {
    this.isShowingChoices = false
    this.elements.choiceContainer.style.display = 'none'
    this.elements.choiceContainer.innerHTML = ''
  }

  updateAffectionUI() {
    const maxAffection = 100
    const percentage = Math.min(100, Math.max(0, (this.state.affection / maxAffection) * 100))
    this.elements.affectionBar.style.width = percentage + '%'
    this.elements.affectionValue.textContent = this.state.affection
  }

  showMenu() {
    this.isMenuOpen = true
    this.elements.menuOverlay.style.display = 'flex'
  }

  hideMenu() {
    this.isMenuOpen = false
    this.elements.menuOverlay.style.display = 'none'
  }

  showEvidence() {
    if (this.state.evidences.length === 0) {
      this.showMessage('暂无证据')
      return
    }
    
    const evidenceList = this.state.evidences.map(e => e.name).join(', ')
    this.showMessage('证据: ' + evidenceList)
  }

  save() {
    const saveData = {
      affection: this.state.affection,
      currentNodeId: this.state.currentNodeId,
      flags: this.state.flags,
      evidences: this.state.evidences,
      chapterId: this.currentChapter?.id
    }
    
    localStorage.setItem('gameSave', JSON.stringify(saveData))
    this.showMessage('保存成功！')
  }

  showMessage(text) {
    this.elements.messageToast.textContent = text
    this.elements.messageToast.style.display = 'block'
    
    setTimeout(() => {
      this.elements.messageToast.style.display = 'none'
    }, 2000)
  }
}
