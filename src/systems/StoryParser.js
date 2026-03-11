import yaml from 'js-yaml'

export class StoryParser {
  constructor() {
    this.dialogueData = {}
  }

  parse(yamlContent) {
    try {
      const story = yaml.load(yamlContent)
      this.dialogueData = this.convertToDialogueData(story)
      return this.dialogueData
    } catch (e) {
      console.error('Failed to parse YAML:', e)
      return null
    }
  }

  convertToDialogueData(story) {
    const result = {}
    
    if (!story.chapters) {
      console.error('No chapters found in story')
      return result
    }

    for (const [chapterId, chapter] of Object.entries(story.chapters)) {
      const nodes = this.convertScenes(chapter.scenes || [], chapterId)
      const startNode = chapter.start_node || chapter.startNode || (nodes[0]?.id ?? null)

      result[chapterId] = {
        id: chapterId,
        name: chapter.name || chapterId,
        nextDialogue: chapter.next || null,
        startNode,
        nodes
      }
    }

    return result
  }

  convertScenes(scenes, chapterId) {
    const nodes = []
    let nodeIndex = 0

    for (const scene of scenes) {
      const node = this.convertScene(scene, chapterId, nodeIndex)
      if (Array.isArray(node)) {
        nodes.push(...node)
      } else {
        nodes.push(node)
      }
      nodeIndex++
    }

    return nodes
  }

  convertScene(scene, chapterId, index) {
    const sceneType = scene.type || 'dialogue'

    switch (sceneType) {
      case 'dialogue':
        return this.convertDialogueScene(scene, chapterId, index)
      
      case 'choice':
        return this.convertChoiceScene(scene, chapterId, index)
      
      case 'condition':
        return this.convertConditionScene(scene, chapterId, index)
      
      case 'minigame':
        return this.convertMinigameScene(scene, chapterId, index)
      
      case 'evidence':
        return this.convertEvidenceScene(scene, chapterId, index)
      
      case 'ending':
        return this.convertEndingScene(scene, chapterId, index)
      
      default:
        return this.convertDialogueScene(scene, chapterId, index)
    }
  }

  convertDialogueScene(scene, chapterId, index) {
    const node = {
      id: scene.id || `${chapterId}_${index}`,
      type: 'dialogue',
      background: scene.background || null,
      character: scene.character || null,
      speaker: scene.speaker || '',
      text: this.processText(scene.text || '')
    }

    const next = scene.goto || scene.next
    if (next) {
      node.next = next
    }

    return node
  }

  convertChoiceScene(scene, chapterId, index) {
    const rawOptions = scene.options || scene.choices || []
    const choices = rawOptions.map((option, optIndex) => {
      const choice = {
        text: option.text || ''
      }

      if (option.affection != null) {
        choice.addAffection = this.parseAffection(option.affection)
      }

      if (option.flag) {
        const [flagName, flagValue] = option.flag.split('=')
        choice.setFlag = flagName
        choice.flagValue = flagValue === 'true' ? true : flagValue === 'false' ? false : flagValue
      }

      if (Array.isArray(option.effects)) {
        for (const effect of option.effects) {
          if (!effect || typeof effect !== 'object') continue
          if (effect.add_affection != null || effect.addAffection != null) {
            choice.addAffection = this.parseAffection(effect.add_affection ?? effect.addAffection)
          }
          if (effect.set_flag != null || effect.setFlag != null) {
            const sf = effect.set_flag ?? effect.setFlag
            if (typeof sf === 'string') {
              const [flagName, flagValue] = sf.split('=')
              choice.setFlag = flagName
              choice.flagValue = flagValue === 'true' ? true : flagValue === 'false' ? false : flagValue
            } else if (sf && typeof sf === 'object') {
              choice.setFlag = sf.key
              choice.flagValue = sf.value
            }
          }
          if (effect.add_evidence != null || effect.addEvidence != null) {
            const ev = effect.add_evidence ?? effect.addEvidence
            if (typeof ev === 'string') {
              choice.addEvidence = { id: ev, name: ev, description: '' }
            } else if (ev && typeof ev === 'object') {
              choice.addEvidence = {
                id: ev.id,
                name: ev.name ?? ev.id,
                description: ev.description ?? ''
              }
            }
          }
        }
      }

      const next = option.goto || option.next
      if (next) {
        choice.next = next
      }

      return choice
    })

    return {
      id: scene.id || `${chapterId}_choice_${index}`,
      type: 'choice',
      prompt: scene.prompt || '',
      choices: choices
    }
  }

  convertConditionScene(scene, chapterId, index) {
    const condition = this.parseCondition(scene.check || '')
    
    return {
      id: scene.id || `${chapterId}_condition_${index}`,
      type: 'condition',
      condition: condition,
      trueNext: scene.true_goto || scene.trueGoto || null,
      falseNext: scene.false_goto || scene.falseGoto || null
    }
  }

  convertMinigameScene(scene, chapterId, index) {
    const gameType = scene.game || 'quiz'
    
    return {
      id: scene.id || `${chapterId}_minigame_${index}`,
      type: 'action',
      miniGame: {
        type: gameType,
        question: scene.question || '',
        options: scene.options || [],
        correctIndex: scene.correct || 0,
        successAffection: this.parseAffection(scene.success_affection || 0),
        failAffection: this.parseAffection(scene.fail_affection || 0)
      }
    }
  }

  convertEvidenceScene(scene, chapterId, index) {
    return {
      id: scene.id || `${chapterId}_evidence_${index}`,
      type: 'action',
      addEvidence: {
        id: scene.id || `evidence_${index}`,
        name: scene.name || '未知物品',
        description: scene.description || ''
      }
    }
  }

  convertEndingScene(scene, chapterId, index) {
    return {
      id: scene.id || `${chapterId}_ending_${index}`,
      type: 'ending',
      endingId: scene.ending || 'normal'
    }
  }

  parseAffection(value) {
    if (typeof value === 'number') {
      return value
    }
    if (typeof value === 'string') {
      const match = value.match(/^([+-]?\d+)/)
      if (match) {
        return parseInt(match[1], 10)
      }
    }
    return 0
  }

  parseCondition(checkStr) {
    const affectionMatch = checkStr.match(/affection\s*([><=!]+)\s*(\d+)/)
    if (affectionMatch) {
      const operator = affectionMatch[1]
      const value = parseInt(affectionMatch[2], 10)
      
      if (operator === '>=') {
        return { type: 'affection', value: value }
      } else if (operator === '>') {
        return { type: 'affection', value: value + 1 }
      } else if (operator === '<=') {
        return { type: 'affection', value: value, inverse: true }
      } else if (operator === '<') {
        return { type: 'affection', value: value - 1, inverse: true }
      } else if (operator === '==' || operator === '=') {
        return { type: 'affection', value: value, exact: true }
      }
    }

    const flagMatch = checkStr.match(/flag\s+['"]?(\w+)['"]?\s*=\s*['"]?(\w+)['"]?/)
    if (flagMatch) {
      return { 
        type: 'flag', 
        flagName: flagMatch[1], 
        flagValue: flagMatch[2] === 'true' ? true : flagMatch[2] === 'false' ? false : flagMatch[2]
      }
    }

    const evidenceMatch = checkStr.match(/has_evidence\s+['"]?(\w+)['"]?/)
    if (evidenceMatch) {
      return { type: 'hasEvidence', evidenceId: evidenceMatch[1] }
    }

    return { type: 'unknown' }
  }

  processText(text) {
    if (typeof text !== 'string') return ''
    return text.trim()
  }

  getDialogueData() {
    return this.dialogueData
  }

  validate() {
    const errors = []
    
    for (const [chapterId, chapter] of Object.entries(this.dialogueData)) {
      const nodeIds = new Set()
      
      if (chapter.startNode && !chapter.nodes.some(n => n.id === chapter.startNode)) {
        errors.push(`Chapter ${chapterId} has non-existent start_node: ${chapter.startNode}`)
      }

      for (const node of chapter.nodes) {
        if (nodeIds.has(node.id)) {
          errors.push(`Duplicate node ID: ${node.id} in chapter ${chapterId}`)
        }
        nodeIds.add(node.id)
      }

      for (const node of chapter.nodes) {
        if (node.type === 'choice') {
          for (const choice of node.choices) {
            if (choice.next && !this.nodeExists(choice.next, chapterId)) {
              errors.push(`Choice in ${node.id} references non-existent node: ${choice.next}`)
            }
          }
        }
        
        if (node.next && !this.nodeExists(node.next, chapterId)) {
          errors.push(`Node ${node.id} references non-existent node: ${node.next}`)
        }

        if (node.type === 'condition') {
          if (node.trueNext && !this.nodeExists(node.trueNext, chapterId)) {
            errors.push(`Condition ${node.id} references non-existent node: ${node.trueNext}`)
          }
          if (node.falseNext && !this.nodeExists(node.falseNext, chapterId)) {
            errors.push(`Condition ${node.id} references non-existent node: ${node.falseNext}`)
          }
        }
      }
    }

    return errors
  }

  nodeExists(nodeId, chapterId) {
    const chapter = this.dialogueData[chapterId]
    if (!chapter) return false
    
    if (chapter.nodes.some(n => n.id === nodeId)) {
      return true
    }

    return false
  }
}

export const storyParser = new StoryParser()
