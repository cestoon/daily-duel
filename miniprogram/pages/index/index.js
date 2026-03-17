// pages/index/index.js
const app = getApp()

Page({
  data: {
    hasLogin: false,
    logining: false,
    user: null,
    partner: null
  },

  onLoad() {
    this.checkLogin()
  },

  checkLogin() {
    if (app.globalData.user) {
      this.setData({
        hasLogin: true,
        user: app.globalData.user,
        partner: app.globalData.partner
      })

      if (!app.globalData.partner) {
        this.getPartnerInfo()
      }
    }
  },

  async getPartnerInfo() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'user/getPartner'
      })
      if (res.result.success && res.result.data) {
        app.globalData.partner = res.result.data
        app.saveLoginInfo()
        this.setData({
          partner: res.result.data
        })
      }
    } catch (e) {
      console.error('获取伙伴信息失败', e)
    }
  },

  async handleLogin() {
    if (this.data.logining) return

    this.setData({ logining: true })

    try {
      // 获取用户信息
      const userInfoRes = await wx.getUserProfile({
        desc: '用于完善用户资料'
      })

      // 调用登录云函数
      const res = await wx.cloud.callFunction({
        name: 'user/login',
        data: {
          nickName: userInfoRes.userInfo.nickName,
          avatarUrl: userInfoRes.userInfo.avatarUrl
        }
      })

      if (res.result.success) {
        app.globalData.user = res.result.data
        app.saveLoginInfo()

        this.setData({
          hasLogin: true,
          user: res.result.data,
          logining: false
        })

        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: res.result.message || '登录失败',
          icon: 'error'
        })
        this.setData({ logining: false })
      }
    } catch (e) {
      console.error('登录失败', e)
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'error'
      })
      this.setData({ logining: false })
    }
  },

  goToPK() {
    wx.switchTab({
      url: '/pages/pk/pk'
    })
  }
})
