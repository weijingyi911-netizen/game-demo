export class EvidenceSystem {
  constructor(scene) {
    this.scene = scene
    this.evidences = {}
    this.listeners = []
  }

  add(evidence) {
    if (!this.evidences[evidence.id]) {
      this.evidences[evidence.id] = {
        id: evidence.id,
        name: evidence.name,
        description: evidence.description,
        obtainedAt: Date.now()
      }
      this.notifyListeners()
      console.log(`Evidence obtained: ${evidence.name}`)
      return true
    }
    return false
  }

  remove(evidenceId) {
    if (this.evidences[evidenceId]) {
      delete this.evidences[evidenceId]
      this.notifyListeners()
      return true
    }
    return false
  }

  has(evidenceId) {
    return !!this.evidences[evidenceId]
  }

  get(evidenceId) {
    return this.evidences[evidenceId] || null
  }

  getAll() {
    return Object.values(this.evidences)
  }

  getCount() {
    return Object.keys(this.evidences).length
  }

  clear() {
    this.evidences = {}
    this.notifyListeners()
  }

  addListener(callback) {
    this.listeners.push(callback)
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback)
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.getAll()))
  }

  serialize() {
    return {
      evidences: this.evidences
    }
  }

  deserialize(data) {
    if (data && data.evidences) {
      this.evidences = data.evidences
      this.notifyListeners()
    }
  }
}
