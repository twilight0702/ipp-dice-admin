// 房间相关API接口
export interface CreateRoomRequest {
  name: string
  ttl: number
  round: number
}

export interface CreateRoomResponse {
  code: number
  message: string
  data: {
    roomId: string
  }
}

export interface UpdateRoundRequest {
  roomId: string
  round: number
}

export interface UpdateRoundResponse {
  code: number
  message: string
  data: object | null
}

export interface GetRoomInfoResponse {
  code: number
  message: string
  data: {
    roomId: string
    name: string
    ttl: number
    round: number
  } | null
}

// 获取API基础URL，支持环境变量配置
const getApiBaseUrl = (): string => {
  // 优先使用环境变量
  // if (import.meta.env.VITE_API_BASE_URL) {
  //   return import.meta.env.VITE_API_BASE_URL
  // }
  
  // // 开发环境默认配置
  // if (import.meta.env.DEV) {
  //   //return 'http://localhost:8080'
  //   return '/api'
  // }
  
  // // 生产环境使用相对路径
  // return ''
  return '/api'
}

// 创建房间API
export const createRoom = async (data: CreateRoomRequest): Promise<CreateRoomResponse> => {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/room/create`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result: CreateRoomResponse = await response.json()
    
    // 检查业务状态码
    if (result.code !== 200) {
      throw new Error(result.message || '创建房间失败')
    }
    
    return result
  } catch (error) {
    console.error('创建房间API调用失败:', error)
    throw error
  }
}

// 获取房间详情API
export const getRoomInfo = async (roomId: string): Promise<GetRoomInfoResponse> => {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/room/info/${encodeURIComponent(roomId)}`
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    // 特殊处理404错误
    if (response.status === 404) {
      throw new Error('房间不存在')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result: GetRoomInfoResponse = await response.json()
    
    // 检查业务状态码
    if (result.code !== 200) {
      throw new Error(result.message || '获取房间信息失败')
    }
    
    return result
  } catch (error) {
    console.error('获取房间信息API调用失败:', error)
    throw error
  }
}

// 修改轮次API
export const updateRoomRound = async (roomId: string, round: number): Promise<UpdateRoundResponse> => {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/room/round?roomId=${encodeURIComponent(roomId)}&round=${round}`
  
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result: UpdateRoundResponse = await response.json()
    
    // 检查业务状态码
    if (result.code !== 200) {
      throw new Error(result.message || '修改轮次失败')
    }
    
    return result
  } catch (error) {
    console.error('修改轮次API调用失败:', error)
    throw error
  }
}

// 排行榜相关接口
export interface PlayerRecordVO {
  playerId: number
  cardnum: string
  name: string
  round: number
  dice: string
  diceOutcome: string
  score: number
  rollTime: string
}

export interface RoomRankVO {
  playerRecords: PlayerRecordVO[]
}

export interface GetRoomRankResponse {
  code: number
  message: string
  data: RoomRankVO
}

// 获取房间排行榜API
export const getRoomRank = async (roomId: string, roleType: number): Promise<GetRoomRankResponse> => {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/room/rank?roomId=${encodeURIComponent(roomId)}&roleType=${roleType}`
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result: GetRoomRankResponse = await response.json()
    
    // 检查业务状态码
    if (result.code !== 200) {
      throw new Error(result.message || '获取排行榜失败')
    }
    
    return result
  } catch (error) {
    console.error('获取排行榜API调用失败:', error)
    throw error
  }
}

// 开启房间API
export const openRoom = async (roomId: string): Promise<UpdateRoundResponse> => {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/room/open?roomId=${encodeURIComponent(roomId)}`
  
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result: UpdateRoundResponse = await response.json()
    
    // 检查业务状态码
    if (result.code !== 200) {
      throw new Error(result.message || '开启房间失败')
    }
    
    return result
  } catch (error) {
    console.error('开启房间API调用失败:', error)
    throw error
  }
}

// 关闭房间API
export const closeRoom = async (roomId: string): Promise<UpdateRoundResponse> => {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/room/close?roomId=${encodeURIComponent(roomId)}`
  
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result: UpdateRoundResponse = await response.json()
    
    // 检查业务状态码
    if (result.code !== 200) {
      throw new Error(result.message || '关闭房间失败')
    }
    
    return result
  } catch (error) {
    console.error('关闭房间API调用失败:', error)
    throw error
  }
}

// 房间信息接口返回数据类型
export interface RoomInfoVO {
  id: number
  name: string
  expireTime: string
  round: number
  isOpen: number
  isDel: number
  createTime: string
  updateTime: string
}

export interface GetRoomInfoVOResponse {
  code: number
  message: string
  data: RoomInfoVO | null
}

// 获取房间详细信息API（包含isOpen字段）
export const getRoomInfoVO = async (roomId: string): Promise<GetRoomInfoVOResponse> => {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/room/info/${encodeURIComponent(roomId)}`
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    // 特殊处理404错误
    if (response.status === 404) {
      throw new Error('房间不存在')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result: GetRoomInfoVOResponse = await response.json()
    
    // 检查业务状态码
    if (result.code !== 200) {
      throw new Error(result.message || '获取房间信息失败')
    }
    
    return result
  } catch (error) {
    console.error('获取房间信息API调用失败:', error)
    throw error
  }
}
