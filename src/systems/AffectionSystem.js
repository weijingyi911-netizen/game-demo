export class AffectionSystem {
  constructor(scene) {
    this.scene = scene
    this.value = 0
    this.maxValue = 100
    this.minValue = 0
    this.listeners = []
  }

  getValue() {
    return this.value
  }

  setValue(value) {
    this.value = Math.max(this.minValue, Math.min(this.maxValue, value))
    this.notifyListeners()
  }

  add(amount) {
    this.value = Math.max(this.minValue, Math.min(this.maxValue, this.value + amount))
    this.notifyListeners()
    console.log(`Affection changed: ${amount > 0 ? '+' : ''}${amount}, total: ${this.value}`)
  }

  getLevel() {
    if (this.value >= 80) return 'high'
    if (this.value >= 40) return 'medium'
    return 'low'
  }

  isMaxed() {
    return this.value >= this.maxValue
  }

  isMin() {
    return this.value <= this.minValue
  }

  addListener(callback) {
    this.listeners.push(callback)
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback)
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.value))
  }

  reset() {
    this.value = 0
    this.notifyListeners()
  }

  serialize() {
    return {
      value: this.value
    }
  }

  deserialize(data) {
    if (data) {
      this.value = data.value || 0
      this.notifyListeners()
    }
  }
}
