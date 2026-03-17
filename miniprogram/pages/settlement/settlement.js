// pages/settlement/settlement.js
const app = getApp()

Page({
  data: {
    settlements: [],
    userId: null,
    loading: true
  },

  onLoad() {
    this.getUserId()
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  async getUserId() {
    if (app.globalData.user) {
      this.setData({ userId: app.globalData.user._id })
    } else {
      const res = await wx.cloud.callFunction({
        name: 'user/getInfo'
      })
      if (res.result.success) {
        app.globalData.user = res.result.data
        app.saveLoginInfo()
        this.setData({ userId: res.result.data._id })
      }
    }
  },

  async loadData() {
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'settlement/getList'
      })

      if (res.result.success) {
        const settlements = res.result.data.map(item => ({
          ...item,
          periodDate: this.formatPeriodDate(item.createdAt),
          statusText: item.status === 'completed' ? '已完成' : '待确认'
        }))

        this.setData({ settlements })
      }
    } catch (e) {
      console.error('加载数据失败', e)
    } finally {
      this.setData({ loading: false })
    }
  },

  formatPeriodDate(date) {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
  },

  async confirmPayment(e) {
    const { id, role } = e.currentTarget.dataset

    try {
      const res = await wx.cloud.callFunction({
        name: 'settlement/confirmPayment',
        data: { settlementId: id }
      })

      if (res.result.success) {
        wx.showToast({
          title: '确认成功',
          icon: 'success'
        })
        this.loadData()
      } else {
        wx.showToast({
          title: res.result.message || '确认失败',
          icon: 'error'
        })
      }
    } catch (e) {
      console.error('确认失败', e)
      wx.showToast({
        title: '确认失败',
        icon: 'error'
      })
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
