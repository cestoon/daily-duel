// pages/index/index.js
const app = getApp()

Page({
  data: {
    logining: false,
    showLogin: false,  // 控制登录弹窗
    avatarUrl: '',     // 用户头像
    nickName: ''       // 用户昵称
  },

  onLoad() {
    // 如果已登录，直接跳转到PK页
    if (app.globalData.user) {
      wx.switchTab({
        url: '/pages/pk/pk'
      })
      return
    }
    
    this.checkLogin()
  },

  checkLogin() {
    // 不需要了，已登录的话会直接跳转
  },



  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({
      avatarUrl
    })
  },

  // 昵称输入
  onNicknameBlur(e) {
    this.setData({
      nickName: e.detail.value.trim()
    })
  },

  async handleLogin() {
    if (this.data.logining) return

    // 检查头像和昵称
    if (!this.data.avatarUrl || !this.data.nickName) {
      wx.showToast({
        title: '请完善头像和昵称',
        icon: 'none'
      })
      return
    }

    this.setData({ logining: true })

    try {
      // 调用登录云函数
      const res = await wx.cloud.callFunction({
        name: 'user-login',
        data: {
          nickName: this.data.nickName,
          avatarUrl: this.data.avatarUrl
        }
      })

      if (res.result.success) {
        app.globalData.user = res.result.data
        app.saveLoginInfo()

        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        })

        // 登录成功后跳转到PK页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/pk/pk'
          })
        }, 1500)
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

  // 显示登录弹窗
  showLoginModal() {
    this.setData({
      showLogin: true
    })
  },

  // 隐藏登录弹窗
  hideLoginModal() {
    this.setData({
      showLogin: false
    })
  },

  // 阻止冒泡
  stopPropagation() {
    // 空函数，阻止点击弹窗内容时关闭
  }
})
