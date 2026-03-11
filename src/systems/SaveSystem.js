export class SaveSystem {
  constructor(scene) {
    this.scene = scene
    this.saveKey = 'gameSave'
    this.flags = {}
  }

  save() {
    const saveData = {
      timestamp: Date.now(),
      currentDialogueId: this.scene.currentDialogueId,
      currentIndex: this.scene.dialogueSystem.currentIndex,
      affection: this.scene.systems.affection.serialize(),
      evidence: this.scene.systems.evidence.serialize(),
      flags: this.flags
    }

    localStorage.setItem(this.saveKey, JSON.stringify(saveData))
    console.log('Game saved:', saveData)
    return true
  }

  load() {
    const saveDataStr = localStorage.getItem(this.saveKey)
    if (!saveDataStr) {
      console.log('No save data found')
      return false
    }

    try {
      const saveData = JSON.parse(saveDataStr)
      
      if (saveData.affection) {
        this.scene.systems.affection.deserialize(saveData.affection)
      }
      
      if (saveData.evidence) {
        this.scene.systems.evidence.deserialize(saveData.evidence)
      }
      
      if (saveData.flags) {
        this.flags = saveData.flags
      }

      console.log('Game loaded:', saveData)
      return true
    } catch (e) {
      console.error('Failed to load save:', e)
      return false
    }
  }

  hasSave() {
    return !!localStorage.getItem(this.saveKey)
  }

  deleteSave() {
    localStorage.removeItem(this.saveKey)
    this.flags = {}
    console.log('Save deleted')
  }

  setFlag(name, value = true) {
    this.flags[name] = value
    this.autoSave()
  }

  getFlag(name) {
    return this.flags[name]
  }

  hasFlag(name) {
    return name in this.flags
  }

  clearFlag(name) {
    delete this.flags[name]
  }

  clearAllFlags() {
    this.flags = {}
  }

  autoSave() {
    this.save()
  }

  getSaveInfo() {
    const saveDataStr = localStorage.getItem(this.saveKey)
    if (!saveDataStr) return null

    try {
      const saveData = JSON.parse(saveDataStr)
      return {
        timestamp: saveData.timestamp,
        dialogueId: saveData.currentDialogueId,
        affection: saveData.affection?.value || 0
      }
    } catch (e) {
      return null
    }
  }

  formatTimestamp(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}
