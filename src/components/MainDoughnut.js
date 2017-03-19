import { Doughnut } from 'vue-chartjs'

export default Doughnut.extend({
  props: ['minutesFairlyActive', 'minutesVeryActive'],
  mounted () {
    if (this.minutesFairlyActive !== 0 && this.minutesVeryActive !== 0) {
      var goal = 300 - this.minutesFairlyActive - this.minutesVeryActive
      if (goal < 0) {
        goal = 0
      }
      this.renderChart({
        labels: ['minutesFairlyActive', 'minutesVeryActive', 'goal'],
        datasets: [
          {
            backgroundColor: [
              '#41B883',
              '#E46651',
              '#00D8FF'
            ],
            data: [
              this.minutesFairlyActive,
              this.minutesVeryActive,
              goal
            ]
          }
        ]
      }, {responsive: true, maintainAspectRatio: false})
    }
  }
})
