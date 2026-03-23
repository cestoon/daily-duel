// pages/checkin/checkin.js
const { getToday, formatDate } = require('../../utils/util')

Page({
  data: {
    currentDate: '',
    isToday: true,
    items: [],
    loading: true
  },

  onLoad() {
    const today = new Date()
    this.setData({
      currentDate: getToday(),
      isToday: true
    })
    this.loadData()
  },

  onShow() {
    if (this.data.isToday) {
      this.loadData()
    }
  },

  async loadData() {
    this.setData({ loading: true })

    try {
      // 获取条目列表
      const itemsRes = await wx.cloud.callFunction({
        name: 'checkin-getItems'
      })

      if (itemsRes.result.success) {
        const items = itemsRes.result.data.map(item => ({
          ...item,
          checked: false,
          statusText: '待完成',
          status: 'pending'
        }))

        // 获取打卡记录（今日或历史日期）
        const functionName = this.data.isToday ? 'checkin-getTodayRecords' : 'checkin-getRecordsByDate'
        const params = this.data.isToday ? {} : { date: this.data.currentDate }
        
        const recordsRes = await wx.cloud.callFunction({
          name: functionName,
          data: params
        })

        if (recordsRes.result.success) {
          const records = recordsRes.result.data
          items.forEach(item => {
            const record = records.find(r => r.itemId === item._id)
            if (record) {
              item.checked = record.status === 'completed'
              item.status = record.status
              if (record.status === 'completed') {
                item.statusText = '已完成'
              } else if (record.status === 'missed') {
                item.statusText = '漏卡'
              }
            } else if (!this.data.isToday) {
              // 历史日期，如果没有记录，说明当天没有这个条目或者还没启用
              item.statusText = '无记录'
              item.status = 'no-record'
            }
          })
        }

        this.setData({ items })
      }
    } catch (e) {
      console.error('加载数据失败', e)
    } finally {
      this.setData({ loading: false })
    }
  },

  async handleCheckin(e) {
    const { id } = e.currentTarget.dataset
    const item = this.data.items.find(i => i._id === id)

    // 历史日期不可操作
    if (!item || !this.data.isToday) {
      if (!this.data.isToday) {
        wx.showToast({
          title: '历史数据不可修改',
          icon: 'none'
        })
      }
      return
    }

    // 如果已打卡，则取消打卡
    if (item.checked) {
      try {
        const res = await wx.cloud.callFunction({
          name: 'checkin-cancel',
          data: { itemId: id }
        })

        if (res.result.success) {
          wx.showToast({
            title: '已取消打卡',
            icon: 'success'
          })
          this.loadData()
        } else {
          wx.showToast({
            title: res.result.message || '取消打卡失败',
            icon: 'error'
          })
        }
      } catch (e) {
        console.error('取消打卡失败', e)
        wx.showToast({
          title: '取消打卡失败',
          icon: 'error'
        })
      }
    } else {
      // 如果未打卡，则打卡
      try {
        const res = await wx.cloud.callFunction({
          name: 'checkin-submit',
          data: { itemId: id }
        })

        if (res.result.success) {
          wx.showToast({
            title: '打卡成功',
            icon: 'success'
          })
          this.loadData()
        } else {
          wx.showToast({
            title: res.result.message || '打卡失败',
            icon: 'error'
          })
        }
      } catch (e) {
        console.error('打卡失败', e)
        wx.showToast({
          title: '打卡失败',
          icon: 'error'
        })
      }
    }
  },

  changeDate(e) {
    const { type } = e.currentTarget.dataset

    if (type === 'next' && this.data.isToday) {
      return
    }

    const current = new Date(this.data.currentDate)
    const offset = type === 'next' ? 1 : -1
    current.setDate(current.getDate() + offset)

    const newDate = formatDate(current)
    const today = getToday()
    const isToday = newDate === today

    this.setData({
      currentDate: newDate,
      isToday
    })

    // 无论是今日还是历史日期，都加载完整数据
    this.loadData()
  },

  goToItems() {
    wx.switchTab({
      url: '/pages/items/items'
    })
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
