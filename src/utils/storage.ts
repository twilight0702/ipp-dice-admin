// 本地存储工具类
export class LocalStorage {
  // 保存房间ID
  static saveRoomId(roomId: number): void {
    try {
      localStorage.setItem('currentRoomId', roomId.toString())
    } catch (error) {
      console.error('保存房间ID失败:', error)
    }
  }
  
  // 获取房间ID
  static getRoomId(): number | null {
    try {
      const roomId = localStorage.getItem('currentRoomId')
      return roomId ? parseInt(roomId, 10) : null
    } catch (error) {
      console.error('获取房间ID失败:', error)
      return null
    }
  }
  
  // 清除房间ID
  static clearRoomId(): void {
    try {
      localStorage.removeItem('currentRoomId')
    } catch (error) {
      console.error('清除房间ID失败:', error)
    }
  }
  
  // 保存房间信息
  static saveRoomInfo(roomInfo: { roomId: number; name: string; ttl: number; round: number }): void {
    try {
      localStorage.setItem('currentRoomInfo', JSON.stringify(roomInfo))
    } catch (error) {
      console.error('保存房间信息失败:', error)
    }
  }
  
  // 获取房间信息
  static getRoomInfo(): { roomId: number; name: string; ttl: number; round: number } | null {
    try {
      const roomInfo = localStorage.getItem('currentRoomInfo')
      return roomInfo ? JSON.parse(roomInfo) : null
    } catch (error) {
      console.error('获取房间信息失败:', error)
      return null
    }
  }
  
  // 清除房间信息
  static clearRoomInfo(): void {
    try {
      localStorage.removeItem('currentRoomInfo')
    } catch (error) {
      console.error('清除房间信息失败:', error)
    }
  }
}