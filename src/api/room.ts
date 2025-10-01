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