const gridColor = 'rgba(30,30,46,0.35)'
const tickColor = 'rgba(139,136,152,0.45)'
const purple = '#7c6bf0'
const purpleLight = '#9d8df7'
const purpleBg = 'rgba(124,107,240,0.12)'
const green = '#4ade80'
const greenBg = 'rgba(74,222,128,0.12)'

Chart.defaults.color = tickColor
Chart.defaults.font.family = "'Inter', system-ui, sans-serif"
Chart.defaults.font.size = 11
Chart.defaults.font.weight = 400

new Chart(document.getElementById('radarChart'), {
  type: 'radar',
  data: {
    labels: ['Calm', 'Sad', 'Energized', 'Stressed', 'Anxious'],
    datasets: [{
      label: 'This Week',
      data: [82, 18, 65, 45, 30],
      borderColor: purple,
      backgroundColor: purpleBg,
      pointBackgroundColor: purpleLight,
      pointBorderColor: '#161618',
      pointBorderWidth: 2,
      pointRadius: 4,
      borderWidth: 2,
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 25,
          display: false,
        },
        grid: {
          color: gridColor,
        },
        angleLines: {
          color: gridColor,
        },
        pointLabels: {
          color: 'rgba(232,230,240,0.65)',
          font: { size: 12, weight: 400 },
        },
      }
    }
  }
})

new Chart(document.getElementById('barChart'), {
  type: 'bar',
  data: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [{
      label: 'Stress Level',
      data: [78, 42, 35, 48, 30],
      backgroundColor: [
        'rgba(240,116,116,0.5)',
        purpleBg,
        purpleBg,
        purpleBg,
        purpleBg,
      ],
      borderColor: [
        'rgba(240,116,116,0.7)',
        'rgba(124,107,240,0.3)',
        'rgba(124,107,240,0.3)',
        'rgba(124,107,240,0.3)',
        'rgba(124,107,240,0.3)',
      ],
      borderWidth: 1,
      borderRadius: 8,
      borderSkipped: false,
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: gridColor },
        ticks: { stepSize: 25 },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        border: { display: false },
      }
    }
  }
})

new Chart(document.getElementById('donutChart'), {
  type: 'doughnut',
  data: {
    labels: ['Helped', 'No change'],
    datasets: [{
      data: [73, 27],
      backgroundColor: [green, 'rgba(30,30,46,0.5)'],
      borderColor: ['transparent', 'transparent'],
      borderWidth: 0,
    }]
  },
  options: {
    responsive: true,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  }
})

new Chart(document.getElementById('lineChart'), {
  type: 'line',
  data: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [{
      label: 'Intentionality',
      data: [10, 28, 45, 62, 80],
      borderColor: green,
      backgroundColor: greenBg,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: green,
      pointBorderColor: '#161618',
      pointBorderWidth: 2,
      pointRadius: 5,
      borderWidth: 2.5,
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: gridColor },
        ticks: {
          stepSize: 25,
          callback: v => v + '%',
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        border: { display: false },
      }
    }
  }
})
