const KEYS = {
    TOTAL_CONFIRMED: "totalconfirmed",
    TOTAL_DECEASED: "totaldeceased",
    TOTAL_RECOVERED: "totalrecovered",
    DAILY_CONFIRMED: "dailyconfirmed",
    DAILY_DECEASED: "dailydeceased",
    DAILY_RECOVERED: "dailyrecovered"
}
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

    getDeceasedCases() {
        return this.getFilteredCases(KEYS.DAILY_DECEASED)
    }
}

var mainData = new MainData()

window.onload = () => {
    fetch(APIS.DATA).then(res=>res.json()).then(data => {
        mainData.setData(data)
        console.log("received data")
    })
}
