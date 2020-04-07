const KEYS = {
    TOTAL_CONFIRMED: "totalconfirmed",
    TOTAL_DECEASED: "totaldeceased",
    TOTAL_RECOVERED: "totalrecovered",
    DAILY_CONFIRMED: "dailyconfirmed",
    DAILY_DECEASED: "dailydeceased",
    DAILY_RECOVERED: "dailyrecovered"
}

const backgrounds = ['#2196f3', '#4caf50', '#f44336']

const w = window.innerWidth
const h = window.innerHeight
const delay = 20
const scSpeed = 0.1
const gap = (0.75 * h) / 3
const lineHeight = 0.1 * h
const startY = 0.2 * h

class MainData {

    current = 0
    prev = 0
    data = []

    setData(data) {
        this.data = data["cases_time_series"]
        this.data.splice(0, 20)
    }

    getLength() {
        return this.data.length
    }

    get(i) {
        return this.data[i]
    }

    getFilteredCases(key) {
        return this.data.map(entry => parseInt(entry[key])).reduce((a, b) => a + b)
    }

    getConfirmedCases() {
        return this.getFilteredCases(KEYS.DAILY_CONFIRMED)
    }

    getRecoveredCases() {
        return this.getFilteredCases(KEYS.DAILY_RECOVERED)
    }

    getTotal() {
        return this.getConfirmedCases() + this.getRecoveredCases() + this.getDeceasedCases();
    }

    getDeceasedCases() {
        return this.getFilteredCases(KEYS.DAILY_DECEASED)
    }

    getDataPoint(key) {
        return this.data.map(entry => parseInt(entry[key]))
    }
}

var mainData = new MainData()

class Loop {

    animated = false
    start(cb) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, delay)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class State {
    scale = 0

    update(cb) {
        this.scale += scSpeed
        if (this.scale > 1) {
            cb()
            this.scale = 0
        }
    }
}

class LineNode {
    count = 0
    constructor(i, key, tag) {
        this.i = i
        this.tag = tag
        this.key = key
        this.initStyle()

    }

    setDataPoint() {
        this.data = mainData.getDataPoint(this.key)
        console.log(this.key, this.data)
        this.total = mainData.getFilteredCases(this.key)
        this.finalW = w * (this.total) / mainData.getTotal()
        console.log(this.tag, this.finalW)
    }

    setCount(i) {
        this.count += this.data[i]
        this.div.innerHTML = `${this.tag}: ${this.count}`
        this.prevW = parseFloat(this.div.style.width)
    }

    initStyle() {
        this.div = document.createElement('div')
        this.div.style.position = 'absolute'
        this.div.style.top = `${startY + (this.i + 1) * gap}px`
        this.div.style.left = '0px'
        this.div.style.height = `${lineHeight}px`
        this.div.style.width = `${0}px`
        this.div.style.background = backgrounds[this.i]
        this.div.style.color = 'black'
        this.div.style.fontSize = `${0.09 * h}px`
        this.div.innerHTML = `${this.tag}: ${this.count}`
        this.prevW = 0
        document.body.appendChild(this.div)
    }

    update(scale, i) {
        const delta = this.finalW * (this.data[i] / this.total)
        this.div.style.width = `${this.prevW + delta}px`
    }
}

const confirmedLineNode = new LineNode(0, KEYS.DAILY_CONFIRMED, "confirmed")
const recoveredLineNode = new LineNode(2, KEYS.DAILY_RECOVERED, "recovered")
const deathLineNode = new LineNode(1, KEYS.DAILY_DECEASED, "deceased")

const loop = new Loop()
const state = new State()
var i = 0
var limit = mainData.getLength()
function start() {
    console.log(`looping for ${i}`)
    loop.start(() => {
        confirmedLineNode.update(state.scale, i)
        recoveredLineNode.update(state.scale, i)
        deathLineNode.update(state.scale, i)
        state.update(() => {
            loop.stop()
            confirmedLineNode.setCount(i)
            recoveredLineNode.setCount(i)
            deathLineNode.setCount(i)
            i++
            if (i < limit) {
                start()
            }
        })
    })
}

window.onload = () => {
    fetch(APIS.DATA).then(res=>res.json()).then(data => {
        mainData.setData(data)
        console.log("received data")
        confirmedLineNode.setDataPoint()
        recoveredLineNode.setDataPoint()
        deathLineNode.setDataPoint()
        limit = mainData.getLength()
        start()
    })
}
