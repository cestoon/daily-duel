// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'your-env-id', // 替换为你的云环境ID
        traceUser: true
      })
    }

    this.globalData = {
      user: null,
      partner: null,
      currentPeriod: null
    }

    // 检查登录状态
    this.checkLogin()
  },

  async checkLogin() {
    const loginInfo = wx.getStorageSync('loginInfo')
    if (loginInfo) {
      this.globalData.user = loginInfo.user
      this.globalData.partner = loginInfo.partner
      this.globalData.currentPeriod = loginInfo.currentPeriod

      // 刷新用户信息
      await this.refreshUserInfo()
    }
  },

  async refreshUserInfo() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'user/getInfo'
      })
      if (res.result.success) {
        this.globalData.user = res.result.data
        this.saveLoginInfo()
      }
    } catch (e) {
      console.error('刷新用户信息失败', e)
    }
  },

  saveLoginInfo() {
    wx.setStorageSync('loginInfo', {
      user: this.globalData.user,
      partner: this.globalData.partner,
      currentPeriod: this.globalData.currentPeriod
    })
  },

  logout() {
    this.globalData.user = null
    this.globalData.partner = null
    this.globalData.currentPeriod = null
    wx.removeStorageSync('loginInfo')
    wx.redirectTo({
      url: '/pages/index/index'
    })
  }
})
