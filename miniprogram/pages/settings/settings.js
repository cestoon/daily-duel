// pages/settings/settings.js
const app = getApp()

Page({
  data: {
    user: null,
    userId: '',
    partner: null,
    partnerId: '',
    reminderEnabled: false,
    reminderTime: '21:00',
    showBindModal: false,
    showAboutModal: false,
    bindCode: ''
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    try {
      await Promise.all([
        this.getUserInfo(),
        this.getPartnerInfo(),
        this.getReminderConfig()
      ])
    } catch (e) {
      console.error('加载数据失败', e)
    }
  },

  async getUserInfo() {
    if (app.globalData.user) {
      this.setData({
        user: app.globalData.user,
        userId: app.globalData.user._id?.slice(-6) || ''
      })
    } else {
      const res = await wx.cloud.callFunction({
        name: 'user-getInfo'
      })
      if (res.result.success) {
        app.globalData.user = res.result.data
        app.saveLoginInfo()
        this.setData({
          user: res.result.data,
          userId: res.result.data._id?.slice(-6) || ''
        })
      }
    }
  },

  async getPartnerInfo() {
    if (app.globalData.partner) {
      this.setData({
        partner: app.globalData.partner,
        partnerId: app.globalData.partner._id?.slice(-6) || ''
      })
    } else {
      const res = await wx.cloud.callFunction({
        name: 'user-getPartner'
      })
      if (res.result.success) {
        app.globalData.partner = res.result.data
        app.saveLoginInfo()
        this.setData({
          partner: res.result.data,
          partnerId: res.result.data?._id?.slice(-6) || ''
        })
      }
    }
  },

  async getReminderConfig() {
    // 模拟提醒配置
    const savedConfig = wx.getStorageSync('reminderConfig') || {
      enabled: true,
      time: '21:00'
    }
    this.setData({
      reminderEnabled: savedConfig.enabled,
      reminderTime: savedConfig.time
    })
  },

  showBindModal() {
    this.setData({
      showBindModal: true,
      bindCode: ''
    })
  },

  hideBindModal() {
    this.setData({ showBindModal: false })
  },

  onBindCodeInput(e) {
    this.setData({
      bindCode: e.detail.value
    })
  },

  async bindPartner() {
    const code = this.data.bindCode.trim()
    
    if (!code) {
      wx.showToast({
        title: '请输入邀请码',
        icon: 'none'
      })
      return
    }
    
    // 检查是否为6位数字
    if (!/^\d{6}$/.test(code)) {
      wx.showToast({
        title: '邀请码格式错误',
        icon: 'none',
        duration: 2000
      })
      return
    }

    try {
      const res = await wx.cloud.callFunction({
        name: 'user-bindPartner',
        data: { partnerCode: code }
      })

      if (res.result.success) {
        wx.showToast({
          title: '绑定成功',
          icon: 'success'
        })
        this.hideBindModal()
        this.getPartnerInfo()
      } else {
        wx.showToast({
          title: res.result.message || '绑定失败',
          icon: 'none',
          duration: 2000
        })
      }
    } catch (e) {
      console.error('绑定失败', e)
      wx.showToast({
        title: '绑定失败',
        icon: 'error'
      })
    }
  },
  
  copyInviteCode() {
    const code = this.data.user?.inviteCode
    if (!code) {
      wx.showToast({
        title: '邀请码加载中',
        icon: 'none'
      })
      return
    }
    
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({
          title: '邀请码已复制',
          icon: 'success'
        })
      }
    })
  },

  async unbindPartner() {
    const confirmed = await wx.showModal({
      title: '确认解绑',
      content: '确定要解除与搭档的绑定关系吗？'
    })

    if (!confirmed.confirm) return

    // 这里需要调用解绑云函数
    wx.showToast({
      title: '解绑成功',
      icon: 'success'
    })

    app.globalData.partner = null
    app.saveLoginInfo()
    this.setData({
      partner: null,
      partnerId: ''
    })
  },

  toggleReminder(e) {
    const enabled = e.detail.value
    this.setData({ reminderEnabled: enabled })

    const config = {
      enabled,
      time: this.data.reminderTime
    }
    wx.setStorageSync('reminderConfig', config)

    wx.showToast({
      title: enabled ? '提醒已开启' : '提醒已关闭',
      icon: 'success'
    })
  },

  onReminderTimeChange(e) {
    this.setData({ reminderTime: e.detail.value })

    const config = {
      enabled: this.data.reminderEnabled,
      time: e.detail.value
    }
    wx.setStorageSync('reminderConfig', config)
  },

  showAbout() {
    this.setData({ showAboutModal: true })
  },

  hideAboutModal() {
    this.setData({ showAboutModal: false })
  },

  stopPropagation() {
    // 阻止冒泡
  },

  clearCache() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.showToast({
            title: '缓存已清除',
            icon: 'success'
          })
        }
      }
    })
  }
})
