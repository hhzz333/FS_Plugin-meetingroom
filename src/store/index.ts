import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Preferences } from '@capacitor/preferences';

/**
 * 判断是否在 Capacitor 环境中
 */
const isCapacitor = () => {
  return typeof (window as any).Capacitor !== 'undefined';
};

/**
 * Capacitor Storage 适配器
 */
const capacitorStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (!isCapacitor()) {
      return localStorage.getItem(name);
    }
    const { value } = await Preferences.get({ key: name });
    return value;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (!isCapacitor()) {
      localStorage.setItem(name, value);
      return;
    }
    await Preferences.set({ key: name, value });
  },
  removeItem: async (name: string): Promise<void> => {
    if (!isCapacitor()) {
      localStorage.removeItem(name);
      return;
    }
    await Preferences.remove({ key: name });
  },
};

/**
 * 会议室配置
 */
export interface MeetingRoomConfig {
  color: string;
  roomTableId: string;
  roomViewId: string;
  bookingTableId: string;
  bookingViewId: string;
  roomNameFieldId: string;
  bookingRoomFieldId: string;
  meetingTitleFieldId: string;
  startTimeFieldId: string;
  endTimeFieldId: string;
  endTimeFieldName: string;
  organizerFieldId: string;
  participantsFieldId: string;  // 参与人字段ID
  bookingStatusFieldId: string;
  bookingStatusValue: string;
  usageStatusFieldId: string;
  usageStatusFieldName: string;
  showDate: boolean;
  showCurrentMeeting: boolean;
  title: string;
  isDefaultMode: boolean;
  selectedRoomId: string;
  mediaAttachmentsFieldId: string;
  videoMuted: boolean;
  enableVideoPlayer: boolean;
  quickBookOrganizerId: string;  // 默认快速预定人ID
  quickBookOrganizerName: string;  // 默认快速预定人名称
  // 字段名称（用于创建记录时使用）
  meetingTitleFieldName: string;
  bookingRoomFieldName: string;
  organizerFieldName: string;
  participantsFieldName: string;
  startTimeFieldName: string;
}

/**
 * 会议室信息
 */
export interface MeetingRoom {
  id: string;
  name: string;
  roomId: string;
  currentMeeting?: Meeting;
  todayMeetings: Meeting[];
  status: 'available' | 'in-use' | 'soon';
  attachments?: AttachmentInfo[];
}

/**
 * 会议信息
 */
export interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  organizer: string;
  roomName: string;
  roomId: string;
  status: 'ongoing' | 'upcoming' | 'completed';
}

/**
 * 附件信息
 */
export interface AttachmentInfo {
  token: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

/**
 * 认证信息
 */
export interface AuthInfo {
  appToken: string;
  personalBaseToken: string;
}

/**
 * 应用状态
 */
interface AppState {
  // 认证信息
  auth: AuthInfo | null;
  setAuth: (auth: AuthInfo | null) => void;

  // 配置
  config: MeetingRoomConfig;
  setConfig: (config: Partial<MeetingRoomConfig>) => void;
  resetConfig: () => void;

  // 数据
  meetingRooms: MeetingRoom[];
  setMeetingRooms: (rooms: MeetingRoom[]) => void;

  // 加载状态
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // 错误信息
  error: string | null;
  setError: (error: string | null) => void;

  // 当前时间
  currentTime: Date;
  updateCurrentTime: () => void;

  // 界面锁定功能
  lockPassword: string;
  setLockPassword: (password: string) => void;
  isLockEnabled: boolean;
  setIsLockEnabled: (enabled: boolean) => void;
}

/**
 * 默认配置
 */
const defaultConfig: MeetingRoomConfig = {
  color: 'var(--ccm-chart-N700)',
  roomTableId: '',
  roomViewId: '',
  bookingTableId: '',
  bookingViewId: '',
  roomNameFieldId: '',
  bookingRoomFieldId: '',
  meetingTitleFieldId: '',
  startTimeFieldId: '',
  endTimeFieldId: '',
  endTimeFieldName: '',
  organizerFieldId: '',
  participantsFieldId: '',
  bookingStatusFieldId: '',
  bookingStatusValue: '已预订',
  usageStatusFieldId: '',
  usageStatusFieldName: '',
  showDate: true,
  showCurrentMeeting: true,
  title: '会议室状态看板',
  isDefaultMode: true,
  selectedRoomId: '',
  mediaAttachmentsFieldId: '',
  videoMuted: true,
  enableVideoPlayer: true,
  quickBookOrganizerId: '',
  quickBookOrganizerName: '',
  meetingTitleFieldName: '',
  bookingRoomFieldName: '',
  organizerFieldName: '',
  participantsFieldName: '',
  startTimeFieldName: '',
};

/**
 * 创建状态管理 store
 */
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 认证信息
      auth: null,
      setAuth: (auth) => set({ auth }),

      // 配置
      config: defaultConfig,
      setConfig: (partialConfig) =>
        set((state) => ({
          config: { ...state.config, ...partialConfig },
        })),
      resetConfig: () => set({ config: defaultConfig }),

      // 数据
      meetingRooms: [],
      setMeetingRooms: (meetingRooms) => set({ meetingRooms }),

      // 加载状态
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),

      // 错误信息
      error: null,
      setError: (error) => set({ error }),

      // 当前时间
      currentTime: new Date(),
      updateCurrentTime: () => set({ currentTime: new Date() }),

      // 界面锁定功能
      lockPassword: '',
      setLockPassword: (lockPassword) => set({ lockPassword }),
      isLockEnabled: false,
      setIsLockEnabled: (isLockEnabled) => set({ isLockEnabled }),
    }),
    {
      name: 'meetingroom-storage',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        auth: state.auth,
        config: state.config,
        lockPassword: state.lockPassword,
        isLockEnabled: state.isLockEnabled,
      }),
    }
  )
);

export default useAppStore;
