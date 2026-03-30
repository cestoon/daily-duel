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
    weekendSkip: false,  // 周末免打卡
    showBindModal: false,
    showAboutModal: false,
    bindCode: '',
    isDev: true  // 开发模式，上线前改为 false
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
        this.getReminderConfig(),
        this.getWeekendSkipConfig()
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

  async getWeekendSkipConfig() {
    // 从用户信息中读取周末免打卡配置
    if (app.globalData.user?.weekendSkip !== undefined) {
      this.setData({
        weekendSkip: app.globalData.user.weekendSkip
      })
    } else {
      // 如果用户数据中没有，从云端获取
      const res = await wx.cloud.callFunction({
        name: 'user-getInfo'
      })
      if (res.result.success && res.result.data.weekendSkip !== undefined) {
        this.setData({
          weekendSkip: res.result.data.weekendSkip
        })
      }
    }
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

  async toggleWeekendSkip(e) {
    const enabled = e.detail.value
    this.setData({ weekendSkip: enabled })

    try {
      // 调用云函数更新配置
      const res = await wx.cloud.callFunction({
        name: 'user-updateWeekendSkip',
        data: { weekendSkip: enabled }
      })

      if (res.result.success) {
        // 更新本地缓存
        if (app.globalData.user) {
          app.globalData.user.weekendSkip = enabled
          app.saveLoginInfo()
        }

        wx.showToast({
          title: enabled ? '已开启周末免打卡' : '已关闭周末免打卡',
          icon: 'success'
        })
      } else {
        // 恢复原状态
        this.setData({ weekendSkip: !enabled })
        wx.showToast({
          title: '设置失败，请重试',
          icon: 'none'
        })
      }
    } catch (e) {
      console.error('更新周末免打卡配置失败', e)
      // 恢复原状态
      this.setData({ weekendSkip: !enabled })
      wx.showToast({
        title: '设置失败，请重试',
        icon: 'error'
      })
    }
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
  },

  // 🧪 运行测试
  runTests() {
    const testCases = [
      { id: 'daily-check-normal', name: '正常打卡无漏卡' },
      { id: 'daily-check-missed', name: '部分打卡有漏卡' },
      { id: 'daily-check-disabled', name: '禁用条目不算漏卡' },
      { id: 'daily-check-duplicate', name: '已有漏卡记录不重复' },
      { id: 'weekly-settlement-normal', name: '正常周期结算' },
      { id: 'weekly-settlement-cap', name: '封顶机制测试' },
      { id: 'all', name: '运行所有测试' }
    ]

    wx.showActionSheet({
      itemList: testCases.map(t => t.name),
      success: (res) => {
        const testCase = testCases[res.tapIndex]
        this.executeTest(testCase.id, testCase.name)
      }
    })
  },

  async executeTest(testCase, testName) {
    wx.showLoading({ title: '测试中...' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'test-settlement',
        data: { 
          testCase,
          userId: this.data.user?._id  // 传入当前用户ID（可选）
        }
      })

      wx.hideLoading()

      if (res.result.success) {
        // 成功
        if (testCase === 'all') {
          // 显示汇总报告
          const { summary } = res.result
          wx.showModal({
            title: '✅ 测试报告',
            content: `总计: ${summary.total}\n通过: ${summary.passed}\n失败: ${summary.failed}\n通过率: ${summary.passRate}`,
            showCancel: false,
            confirmText: '查看详情',
            success: (modalRes) => {
              if (modalRes.confirm) {
                console.log('详细结果:', res.result.results)
                wx.showToast({
                  title: '详情已输出到控制台',
                  icon: 'none'
                })
              }
            }
          })
        } else {
          // 单个测试
          wx.showModal({
            title: '✅ 测试通过',
            content: res.result.message || testName,
            showCancel: false
          })
        }
      } else {
        // 失败
        wx.showModal({
          title: '❌ 测试失败',
          content: res.result.message || '测试未通过',
          showCancel: false
        })
      }

      console.log('测试结果:', res.result)
    } catch (error) {
      wx.hideLoading()
      console.error('测试执行失败:', error)
      wx.showModal({
        title: '❌ 测试执行失败',
        content: error.message || '未知错误',
        showCancel: false
      })
    }
  }
})
