// utils/util.js
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const formatDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${[year, month, day].map(formatNumber).join('-')}`
}

const getToday = () => {
  return formatDate(new Date())
}

const getMondayOfWeek = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

const getSundayOfWeek = (date) => {
  const monday = getMondayOfWeek(date)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return sunday
}

const isSameWeek = (date1, date2) => {
  const week1 = getMondayOfWeek(date1)
  const week2 = getMondayOfWeek(date2)
  return week1.getTime() === week2.getTime()
}

const getWeekNumber = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return weekNo
}

const debounce = (func, wait) => {
  let timeout
  return function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

const throttle = (func, wait) => {
  let timeout
  return function (...args) {
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null
        func.apply(this, args)
      }, wait)
    }
  }
}

const showToast = (title, icon = 'none', duration = 2000) => {
  wx.showToast({
    title,
    icon,
    duration
  })
}

const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title,
    mask: true
  })
}

const hideLoading = () => {
  wx.hideLoading()
}

const showConfirm = (content) => {
  return new Promise((resolve) => {
    wx.showModal({
      title: '提示',
      content,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

const navigateTo = (url) => {
  wx.navigateTo({ url })
}

const redirectTo = (url) => {
  wx.redirectTo({ url })
}

const switchTab = (url) => {
  wx.switchTab({ url })
}

const getStorageSync = (key) => {
  try {
    return wx.getStorageSync(key)
  } catch (e) {
    return null
  }
}

const setStorageSync = (key, value) => {
  try {
    wx.setStorageSync(key, value)
  } catch (e) {
    console.error('存储失败', e)
  }
}

const removeStorageSync = (key) => {
  try {
    wx.removeStorageSync(key)
  } catch (e) {
    console.error('删除存储失败', e)
  }
}

module.exports = {
  formatTime,
  formatDate,
  formatNumber,
  getToday,
  getMondayOfWeek,
  getSundayOfWeek,
  isSameWeek,
  getWeekNumber,
  debounce,
  throttle,
  showToast,
  showLoading,
  hideLoading,
  showConfirm,
  navigateTo,
  redirectTo,
  switchTab,
  getStorageSync,
  setStorageSync,
  removeStorageSync
}
