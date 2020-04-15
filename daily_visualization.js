const KEYS = {
    TOTAL_CONFIRMED: "totalconfirmed",
    TOTAL_DECEASED: "totaldeceased",
    TOTAL_RECOVERED: "totalrecovered",
    DAILY_CONFIRMED: "dailyconfirmed",
    DAILY_DECEASED: "dailydeceased",
    DAILY_RECOVERED: "dailyrecovered"
}

const backgrounds = ['#2196f3', '#4caf50', '#f44336']

var w = window.innerWidth
var h = window.innerHeight

window.onresize = () => {
    w = window.innerWidth
    h = window.innerHeight
}

const delay = 10
const scSpeed = 0.02
const gap = (0.75 * h) / 3
const lineHeight = 0.1 * h
const startY = 0.1 * h

class MainData {

    current = 0
    prev = 0
    data = []

    setData(data) {
        this.data = data["cases_time_series"]
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
        this.text.innerHTML = `${this.tag}: ${this.count}`
        this.prevW = parseFloat(this.div.style.width)
    }

    initStyle() {
        const fontSize = 0.04 * h
        this.div = document.createElement('div')
        this.text = document.createElement('div')

        this.text.style.position = 'absolute'
        this.text.style.top = `${startY + (this.i + 1) * gap - 1.5 * fontSize}px`
        this.text.style.left = '0px'
        this.div.style.position = 'absolute'
        this.div.style.top = `${startY + (this.i + 1) * gap}px`
        this.div.style.left = '0px'
        this.div.style.height = `${lineHeight}px`
        this.div.style.width = `${0}px`
        this.div.style.background = backgrounds[this.i]
        this.text.style.color = 'black'
        this.text.style.fontSize = `${fontSize}px`
        this.text.style.display = 'inline'
        this.text.innerHTML = `${this.tag}: ${this.count}`
        this.prevW = 0
        document.body.appendChild(this.div)
        document.body.appendChild(this.text)
    }

    update(scale, i) {
        const delta = this.finalW * scale * (this.data[i] / this.total)
        this.div.style.width = `${this.prevW + delta}px`
    }
}

class TextNode {

    constructor(text) {
        this.initDom(text)
    }

    initDom(text) {
        this.prevW = 1.1 * w
        this.div = document.createElement('div')
        this.div.style.color = '#212121'
        this.div.style.fontSize = `${Math.min(w, h) * 0.05}px`
        this.div.style.position = 'absolute'
        this.div.style.left = `${this.prevW}px`
        this.div.style.top = `${0.1 * h}px`
        this.div.innerHTML = text
        this.div.style.display = 'inline'
        document.body.appendChild(this.div)
    }

    update(scale) {
        const delta = w * 0.65 * scale
        this.div.style.left = `${this.prevW - delta}px`
    }

    setPrevW() {
        this.prevW = parseFloat(this.div.style.left)
    }
}

const confirmedLineNode = new LineNode(0, KEYS.DAILY_CONFIRMED, "confirmed")
const recoveredLineNode = new LineNode(1, KEYS.DAILY_RECOVERED, "recovered")
const deathLineNode = new LineNode(2, KEYS.DAILY_DECEASED, "deceased")
var prev = null, curr = null

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
        if (prev != null) {
            prev.update(state.scale)
        }
        if (curr != null) {
            curr.update(state.scale)
        }
        state.update(() => {
            loop.stop()
            confirmedLineNode.setCount(i)
            recoveredLineNode.setCount(i)
            deathLineNode.setCount(i)
            curr.update(1)
            curr.setPrevW()
            if (prev != null) {
                document.body.removeChild(prev.div)
            }
            prev = curr
            i++
            setTimeout(() => {
                if (i < limit) {
                    curr = new TextNode(mainData.get(i).date)
                    start()
                }
            }, 1000)

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
        curr = new TextNode(mainData.get(i).date)
        start()
    })
}
