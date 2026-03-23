/**
 * 表格信息
 */
export interface TableInfo {
  id: string;
  name: string;
}

/**
 * 字段信息
 */
export interface FieldInfo {
  id: string;
  name: string;
  type: string;
  property?: Record<string, any>;
}

/**
 * 记录信息
 */
export interface RecordInfo {
  id: string;
  fields: Record<string, any>;
  createdTime?: number;
  updatedTime?: number;
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
  tmpUrl?: string;
  localPath?: string;
}

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
  organizerFieldId: string;
  bookingStatusFieldId: string;
  bookingStatusValue: string;
  showDate: boolean;
  showCurrentMeeting: boolean;
  title: string;
  isDefaultMode: boolean;
  selectedRoomId: string;
  mediaAttachmentsFieldId: string;
  videoMuted: boolean;
  enableVideoPlayer: boolean;
}

/**
 * API 响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * 请求上下文
 */
export interface RequestContext {
  appToken: string;
  personalBaseToken: string;
}
