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
      if (this.data.isToday) {
        // ========== 今日：查询启用的条目 + 打卡记录 ==========
        const itemsRes = await wx.cloud.callFunction({
          name: 'checkin-getItems'
        })

        if (itemsRes.result.success) {
          let items = itemsRes.result.data.map(item => ({
            ...item,
            checked: false,
            statusText: '待完成',
            status: 'pending'
          }))

          // 获取今日打卡记录
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
                item.statusText = record.status === 'completed' ? '已完成' : '漏卡'
              }
            })
          }

          this.setData({ items })
        }
      } else {
        // ========== 历史日期：查询所有条目 + 该日期的打卡记录 ==========
        // 1. 获取所有启用的条目
        const itemsRes = await wx.cloud.callFunction({
          name: 'checkin-getItems'
        })

        if (!itemsRes.result.success) {
          this.setData({ items: [] })
          return
        }

        let items = itemsRes.result.data.map(item => ({
          ...item,
          checked: false,
          statusText: '未打卡',
          status: 'pending',
          isHistorical: true
        }))

        // 2. 获取该日期的打卡记录
        const recordsRes = await wx.cloud.callFunction({
          name: 'checkin-getRecordsByDate',
          data: { date: this.data.currentDate }
        })

        if (recordsRes.result.success) {
          const records = recordsRes.result.data
          
          // 3. 合并记录到条目
          items.forEach(item => {
            const record = records.find(r => r.itemId === item._id)
            if (record) {
              item.checked = record.status === 'completed'
              item.status = record.status
              item.statusText = record.status === 'completed' ? '已完成' : '漏卡'
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

    if (!item) return

    // 历史日期：显示操作选项（标记为已打卡/未打卡）
    if (!this.data.isToday) {
      wx.showActionSheet({
        itemList: ['标记为已打卡', '标记为未打卡（漏卡）'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 标记为已打卡
            this.markHistoricalCheckin(id, 'completed')
          } else if (res.tapIndex === 1) {
            // 标记为未打卡（漏卡）
            this.markHistoricalCheckin(id, 'missed')
          }
        }
      })
      return
    }

    // 今日：正常打卡/取消打卡逻辑
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

  // 标记历史打卡记录
  async markHistoricalCheckin(itemId, status) {
    try {
      wx.showLoading({ title: '处理中...' })

      const res = await wx.cloud.callFunction({
        name: 'checkin-markHistorical',
        data: {
          itemId,
          date: this.data.currentDate,
          status  // 'completed' 或 'missed'
        }
      })

      wx.hideLoading()

      if (res.result.success) {
        wx.showToast({
          title: status === 'completed' ? '已标记为已打卡' : '已标记为漏卡',
          icon: 'success'
        })
        this.loadData()
      } else {
        wx.showToast({
          title: res.result.message || '操作失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('标记历史打卡失败:', error)
      wx.showToast({
        title: '操作失败',
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
