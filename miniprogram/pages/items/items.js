// pages/items/items.js
Page({
  data: {
    currentTab: 'my',
    items: [],
    loading: true,
    showModal: false,
    isEdit: false,
    editId: null,
    canEdit: true,
    newItem: {
      title: '',
      points: 10
    }
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  switchTab(e) {
    const { tab } = e.currentTarget.dataset
    this.setData({
      currentTab: tab,
      canEdit: tab === 'my'
    })
    // 延迟一下等待 setData 完成
    setTimeout(() => {
      this.loadData()
    }, 50)
  },

  async loadData() {
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'checkin-getItems',
        data: { partnerItems: this.data.currentTab === 'partner' }
      })

      if (res.result.success) {
        this.setData({ items: res.result.data || [] })
      } else {
        // 如果获取失败（如未绑定伙伴），清空列表并提示
        if (this.data.currentTab === 'partner') {
          this.setData({ items: [] })
          if (res.result.message) {
            wx.showToast({
              title: res.result.message,
              icon: 'none'
            })
          }
        }
      }
    } catch (e) {
      console.error('加载数据失败', e)
      if (this.data.currentTab === 'partner') {
        this.setData({ items: [] })
      }
    } finally {
      this.setData({ loading: false })
    }
  },

  async toggleEnable(e) {
    if (!this.canEdit) return

    const { id } = e.currentTarget.dataset
    const item = this.data.items.find(i => i._id === id)
    const newStatus = !item.enabled

    try {
      const res = await wx.cloud.callFunction({
        name: 'checkin-updateItem',
        data: { itemId: id, enabled: newStatus }
      })

      if (res.result.success) {
        wx.showToast({
          title: newStatus ? '已启用' : '已禁用',
          icon: 'success'
        })
        // 重新加载数据，确保状态正确
        this.loadData()
      } else {
        wx.showToast({
          title: res.result.message || '操作失败',
          icon: 'error'
        })
      }
    } catch (e) {
      console.error('切换状态失败', e)
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      })
    }
  },

  showAddModal() {
    this.setData({
      showModal: true,
      isEdit: false,
      editId: null,
      newItem: {
        title: '',
        points: 10
      }
    })
  },

  editItem(e) {
    const { id } = e.currentTarget.dataset
    const item = this.data.items.find(i => i._id === id)

    this.setData({
      showModal: true,
      isEdit: true,
      editId: id,
      newItem: {
        title: item.title,
        points: item.points
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
      'newItem.points': parseInt(e.detail.value) || 10
    })
  },

  async saveItem() {
    const { title, points } = this.data.newItem

    if (!title.trim()) {
      wx.showToast({
        title: '请输入条目标题',
        icon: 'none'
      })
      return
    }

    try {
      if (this.data.isEdit) {
        await wx.cloud.callFunction({
          name: 'checkin-updateItem',
          data: {
            itemId: this.data.editId,
            title,
            points
          }
        })
      } else {
        await wx.cloud.callFunction({
          name: 'checkin-addItem',
          data: { title, points }
        })
      }

      wx.showToast({
        title: this.data.isEdit ? '修改成功' : '添加成功',
        icon: 'success'
      })

      this.hideModal()
      this.loadData()
    } catch (e) {
      console.error('保存失败', e)
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      })
    }
  },

  async deleteItem(e) {
    const { id } = e.currentTarget.dataset

    const confirmed = await wx.showModal({
      title: '确认删除',
      content: '确定要删除这个条目吗？'
    })

    if (!confirmed.confirm) return

    try {
      await wx.cloud.callFunction({
        name: 'checkin-deleteItem',
        data: { itemId: id }
      })

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })

      this.loadData()
    } catch (e) {
      console.error('删除失败', e)
      wx.showToast({
        title: '删除失败',
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
