// pages/checkin/checkin.js
const { getToday, formatDate } = require('../../utils/util')

Page({
  data: {
    currentDate: '',
    isToday: true,
    items: [],
    loading: true,
    showModal: false,
    newItem: {
      title: '',
      points: 1,
      time: '00:00'
    }
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

        // 获取打卡记录
        if (this.data.isToday) {
          const recordsRes = await wx.cloud.callFunction({
            name: 'checkin-getTodayRecords'
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
              }
            })
          }
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

    if (!item || item.checked || !this.data.isToday) {
      return
    }

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

    if (isToday) {
      this.loadData()
    } else {
      // 历史日期只显示条目，不显示打卡状态
      this.loadItemsOnly()
    }
  },

  async loadItemsOnly() {
    try {
      const itemsRes = await wx.cloud.callFunction({
        name: 'checkin-getItems'
      })

      if (itemsRes.result.success) {
        const items = itemsRes.result.data.map(item => ({
          ...item,
          checked: false,
          statusText: '历史数据',
          status: 'pending'
        }))

        this.setData({ items })
      }
    } catch (e) {
      console.error('加载条目失败', e)
    }
  },

  showAddModal() {
    this.setData({
      showModal: true,
      newItem: {
        title: '',
        points: 1,
        time: '00:00'
      }
    })
  },

  hideModal() {
    this.setData({ showModal: false })
  },

  stopPropagation() {
    // 阻止冒泡
  },

  onTitleInput(e) {
    this.setData({
      'newItem.title': e.detail.value
    })
  },

  onPointsInput(e) {
    this.setData({
      'newItem.points': parseInt(e.detail.value) || 1
    })
  },

  onTimeChange(e) {
    this.setData({
      'newItem.time': e.detail.value
    })
  },

  async addItem() {
    const { title, points, time } = this.data.newItem

    if (!title.trim()) {
      wx.showToast({
        title: '请输入条目标题',
        icon: 'none'
      })
      return
    }

    try {
      const res = await wx.cloud.callFunction({
        name: 'checkin-addItem',
        data: { title, points, time }
      })

      if (res.result.success) {
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        })
        this.hideModal()
        this.loadData()
      } else {
        wx.showToast({
          title: res.result.message || '添加失败',
          icon: 'error'
        })
      }
    } catch (e) {
      console.error('添加条目失败', e)
      wx.showToast({
        title: '添加失败',
        icon: 'error'
      })
    }
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
