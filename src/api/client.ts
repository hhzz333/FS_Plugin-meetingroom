/**
 * API 客户端配置
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * 认证信息
 */
interface AuthInfo {
  appToken: string;
  personalBaseToken: string;
}

/**
 * 判断是否在 Capacitor 环境中
 */
const isCapacitor = () => {
  return typeof (window as any).Capacitor !== 'undefined';
};

/**
 * 获取存储的认证信息
 */
async function getAuthInfo(): Promise<AuthInfo | null> {
  if (isCapacitor()) {
    // 在 Capacitor 环境中使用 Preferences
    const { Preferences } = await import('@capacitor/preferences');
    const { value } = await Preferences.get({ key: 'meetingroom_auth' });
    return value ? JSON.parse(value) : null;
  } else {
    // 在浏览器环境中使用 localStorage
    const auth = localStorage.getItem('meetingroom_auth');
    return auth ? JSON.parse(auth) : null;
  }
}

/**
 * 保存认证信息
 */
export async function saveAuthInfo(auth: AuthInfo): Promise<void> {
  if (isCapacitor()) {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key: 'meetingroom_auth', value: JSON.stringify(auth) });
  } else {
    localStorage.setItem('meetingroom_auth', JSON.stringify(auth));
  }
}

/**
 * 清除认证信息
 */
export async function clearAuthInfo(): Promise<void> {
  if (isCapacitor()) {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.remove({ key: 'meetingroom_auth' });
  } else {
    localStorage.removeItem('meetingroom_auth');
  }
}

/**
 * API 请求封装
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const auth = await getAuthInfo();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  // 添加认证头
  if (auth) {
    headers['x-app-token'] = auth.appToken;
    headers['x-personal-base-token'] = auth.personalBaseToken;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `请求失败: ${response.status}`);
  }

  if (data.code !== 0) {
    throw new Error(data.message || 'API 错误');
  }

  return data.data;
}

/**
 * Base API
 */
export const baseApi = {
  /**
   * 获取表格列表
   */
  async getTableList(): Promise<Array<{ id: string; name: string }>> {
    return request('/base/tables');
  },

  /**
   * 获取字段列表
   */
  async getFieldList(tableId: string): Promise<Array<{ id: string; name: string; type: number }>> {
    return request(`/base/tables/${tableId}/fields`);
  },

  /**
   * 获取记录列表
   */
  async getRecordList(
    tableId: string,
    options?: { viewId?: string; filter?: string }
  ): Promise<Array<{ id: string; fields: Record<string, any> }>> {
    const params = new URLSearchParams();
    if (options?.viewId) params.append('viewId', options.viewId);
    if (options?.filter) params.append('filter', options.filter);

    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/base/tables/${tableId}/records${query}`);
  },

  /**
   * 获取单个记录
   */
  async getRecord(tableId: string, recordId: string): Promise<{ id: string; fields: Record<string, any> }> {
    return request(`/base/tables/${tableId}/records/${recordId}`);
  },

  /**
   * 获取单元格值
   */
  async getCellValue(tableId: string, recordId: string, fieldId: string): Promise<any> {
    const result = await request<{ value: any }>(`/base/tables/${tableId}/records/${recordId}/fields/${fieldId}`);
    return result.value;
  },

  /**
   * 获取附件 URL
   */
  async getAttachmentUrls(
    tableId: string,
    recordId: string,
    fieldId: string
  ): Promise<Array<{ token: string; name: string; type: string; size: number; url: string }>> {
    return request(`/base/tables/${tableId}/records/${recordId}/attachments?fieldId=${fieldId}`);
  },
};

/**
 * 会议室 API
 */
export const meetingRoomApi = {
  /**
   * 加载会议室数据
   */
  async loadMeetingData(config: any): Promise<{
    rooms: Array<{
      id: string;
      name: string;
      roomId: string;
      currentMeeting?: any;
      todayMeetings: any[];
      status: 'available' | 'in-use' | 'soon';
      attachments?: any[];
    }>;
    allMeetings: any[];
  }> {
    return request('/meetingroom/data', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  /**
   * 获取单个会议室数据
   */
  async getMeetingRoomData(roomId: string): Promise<{
    room: {
      id: string;
      name: string;
      roomId: string;
      currentMeeting?: any;
      todayMeetings: any[];
      status: 'available' | 'in-use' | 'soon';
      attachments?: any[];
    };
  }> {
    const auth = await getAuthInfo();
    if (!auth) {
      throw new Error('请先配置认证信息');
    }

    let config = {};
    try {
      if (isCapacitor()) {
        const { Preferences } = await import('@capacitor/preferences');
        const { value } = await Preferences.get({ key: 'meetingroom-storage' });
        if (value) {
          const storage = JSON.parse(value);
          config = storage.state?.config || {};
        }
      } else {
        const storage = localStorage.getItem('meetingroom-storage');
        if (storage) {
          const parsed = JSON.parse(storage);
          config = parsed.state?.config || {};
        }
      }
    } catch (error) {
      console.warn('获取配置失败:', error);
    }

    const data = await this.loadMeetingData(config);
    const room = data.rooms.find((r: any) => r.id === roomId);
    
    if (!room) {
      throw new Error('会议室不存在');
    }
    
    return { room };
  },

  /**
   * 结束会议
   */
  async endMeeting(params: {
    bookingTableId: string;
    recordId: string;
    endTimeFieldId: string;
    usageStatusFieldId?: string;
    endTimeFieldName?: string;
    usageStatusFieldName?: string;
  }): Promise<{ success: boolean; message: string }> {
    return request('/meetingroom/end', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * 快速预定
   */
  async quickBook(params: {
    bookingTableId: string;
    roomId: string;
    roomName: string;
    title: string;
    organizerId: string;
    organizerName: string;
    participantsFieldId?: string;
    startTime: number;
    endTime: number;
    meetingTitleFieldId?: string;
    bookingRoomFieldId?: string;
    organizerFieldId?: string;
    startTimeFieldId: string;
    endTimeFieldId: string;
    // 字段名称
    meetingTitleFieldName?: string;
    bookingRoomFieldName?: string;
    organizerFieldName?: string;
    participantsFieldName?: string;
    startTimeFieldName?: string;
    endTimeFieldName?: string;
  }): Promise<{ success: boolean; message: string; recordId?: string }> {
    return request('/meetingroom/quick-book', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};

export default {
  base: baseApi,
  meetingRoom: meetingRoomApi,
  saveAuthInfo,
  clearAuthInfo,
  getAuthInfo,
};
