import './style.scss';
import React from 'react';
import { dashboard, bitable, DashboardState, IConfig, FieldType } from "@lark-base-open/js-sdk";
import { Button, Select, Toast } from '@douyinfe/semi-ui';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useConfig } from '../../hooks';
import classnames from 'classnames'
import { useTranslation } from 'react-i18next';

/** 字段信息接口 */
interface IFieldInfo {
  id: string;
  name: string;
  type: string;
}

/** 会议室配置接口 */
interface IMeetingRoomConfig {
  color: string;
  roomTableId: string;
  roomViewId: string;
  bookingTableId: string;
  bookingViewId: string;
  roomNameFieldId: string;
  roomIdFieldId: string;
  bookingRoomFieldId: string;
  meetingTitleFieldId: string;
  startTimeFieldId: string;
  endTimeFieldId: string;
  organizerFieldId: string;
  showDate: boolean;
  showCurrentMeeting: boolean;
  title: string;
}

/** 会议室信息接口 */
interface IMeetingRoom {
  id: string;
  name: string;
  roomId: string;
  currentMeeting?: IMeeting;
  todayMeetings: IMeeting[];
  status: 'available' | 'in-use' | 'soon';
}

/** 会议信息接口 */
interface IMeeting {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  organizer: string;
  roomName: string;
  roomId: string;
  status: 'ongoing' | 'upcoming' | 'completed';
}

const DEFAULT_COLOR = 'var(--ccm-chart-N700)';

/** 会议室签到板主组件 */
export default function MeetingRoomBoard(props: { bgColor: string }) {
  const { t, i18n } = useTranslation();

  const defaultConfig: IMeetingRoomConfig = {
    color: DEFAULT_COLOR,
    roomTableId: '',
    roomViewId: '',
    bookingTableId: '',
    bookingViewId: '',
    roomNameFieldId: '',
    roomIdFieldId: '',
    bookingRoomFieldId: '',
    meetingTitleFieldId: '',
    startTimeFieldId: '',
    endTimeFieldId: '',
    organizerFieldId: '',
    showDate: true,
    showCurrentMeeting: true,
    title: t('meetingRoom.boardTitle', '会议室状态看板'),
  };

  const [config, setConfig] = useState<IMeetingRoomConfig>(defaultConfig);
  const [tables, setTables] = useState<{id: string, name: string}[]>([]);
  const [roomFields, setRoomFields] = useState<IFieldInfo[]>([]);
  const [bookingFields, setBookingFields] = useState<IFieldInfo[]>([]);
  const [meetingRooms, setMeetingRooms] = useState<IMeetingRoom[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  const isCreate = dashboard.state === DashboardState.Create;
  const isConfig = dashboard.state === DashboardState.Config || isCreate;

  useEffect(() => {
    if (isCreate) {
      setConfig(defaultConfig);
    }
  }, [i18n.language, isCreate]);

  const timer = useRef<number | null>(null);

  const updateConfig = useCallback((res: IConfig) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    const { customConfig } = res;
    
    if (customConfig) {
      console.log('收到配置更新:', customConfig);
      
      const validatedConfig: IMeetingRoomConfig = {
        color: typeof customConfig.color === 'string' ? customConfig.color : defaultConfig.color,
        roomTableId: typeof customConfig.roomTableId === 'string' ? customConfig.roomTableId : defaultConfig.roomTableId,
        roomViewId: typeof customConfig.roomViewId === 'string' ? customConfig.roomViewId : defaultConfig.roomViewId,
        bookingTableId: typeof customConfig.bookingTableId === 'string' ? customConfig.bookingTableId : defaultConfig.bookingTableId,
        bookingViewId: typeof customConfig.bookingViewId === 'string' ? customConfig.bookingViewId : defaultConfig.bookingViewId,
        roomNameFieldId: typeof customConfig.roomNameFieldId === 'string' ? customConfig.roomNameFieldId : defaultConfig.roomNameFieldId,
        roomIdFieldId: typeof customConfig.roomIdFieldId === 'string' ? customConfig.roomIdFieldId : defaultConfig.roomIdFieldId,
        bookingRoomFieldId: typeof customConfig.bookingRoomFieldId === 'string' ? customConfig.bookingRoomFieldId : defaultConfig.bookingRoomFieldId,
        meetingTitleFieldId: typeof customConfig.meetingTitleFieldId === 'string' ? customConfig.meetingTitleFieldId : defaultConfig.meetingTitleFieldId,
        startTimeFieldId: typeof customConfig.startTimeFieldId === 'string' ? customConfig.startTimeFieldId : defaultConfig.startTimeFieldId,
        endTimeFieldId: typeof customConfig.endTimeFieldId === 'string' ? customConfig.endTimeFieldId : defaultConfig.endTimeFieldId,
        organizerFieldId: typeof customConfig.organizerFieldId === 'string' ? customConfig.organizerFieldId : defaultConfig.organizerFieldId,
        showDate: typeof customConfig.showDate === 'boolean' ? customConfig.showDate : defaultConfig.showDate,
        showCurrentMeeting: typeof customConfig.showCurrentMeeting === 'boolean' ? customConfig.showCurrentMeeting : defaultConfig.showCurrentMeeting,
        title: typeof customConfig.title === 'string' ? customConfig.title : defaultConfig.title,
      };
      
      setConfig(validatedConfig);
      timer.current = window.setTimeout(() => {
        dashboard.setRendered();
      }, 3000);
    } else {
      setConfig(defaultConfig);
    }
  }, [defaultConfig]);

  useConfig(updateConfig);

  // 实时时钟更新
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadTables = useCallback(async () => {
    try {
      setLoading(true);
      const tableList = await bitable.base.getTableList();
      
      const tablesWithNames = await Promise.all(
        tableList.map(async (table) => {
          try {
            const name = await table.getName();
            return { id: table.id, name };
          } catch (error) {
            console.warn(`获取表格名称失败:`, error);
            return { id: table.id, name: `表格-${table.id}` };
          }
        })
      );
      
      setTables(tablesWithNames);
    } catch (error) {
      console.error('获取表格列表失败:', error);
      Toast.error(t('meetingRoom.loadTableFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadRoomFields = useCallback(async (tableId: string) => {
    try {
      if (!tableId) {
        setRoomFields([]);
        return;
      }
      
      const table = await bitable.base.getTableById(tableId);
      const fieldList = await table.getFieldList();
      
      const fieldsWithInfo: IFieldInfo[] = await Promise.all(
        fieldList.map(async (field) => {
          try {
            const name = await field.getName();
            const type = await field.getType();
            return { 
              id: field.id, 
              name: `${name} (${getFieldTypeName(type)})`,
              type: getFieldTypeName(type)
            };
          } catch (error) {
            console.warn(`获取字段信息失败:`, error);
            return { 
              id: field.id, 
              name: `字段-${field.id}`,
              type: 'Unknown'
            };
          }
        })
      );
      
      setRoomFields(fieldsWithInfo);
    } catch (error) {
      console.error('获取会议室表字段列表失败:', error);
      Toast.error(t('meetingRoom.loadFieldFailed'));
    }
  }, [t]);

  const loadBookingFields = useCallback(async (tableId: string) => {
    try {
      if (!tableId) {
        setBookingFields([]);
        return;
      }
      
      const table = await bitable.base.getTableById(tableId);
      const fieldList = await table.getFieldList();
      
      const fieldsWithInfo: IFieldInfo[] = await Promise.all(
        fieldList.map(async (field) => {
          try {
            const name = await field.getName();
            const type = await field.getType();
            return { 
              id: field.id, 
              name: `${name} (${getFieldTypeName(type)})`,
              type: getFieldTypeName(type)
            };
          } catch (error) {
            console.warn(`获取字段信息失败:`, error);
            return { 
              id: field.id, 
              name: `字段-${field.id}`,
              type: 'Unknown'
            };
          }
        })
      );
      
      setBookingFields(fieldsWithInfo);
    } catch (error) {
      console.error('获取预定表字段列表失败:', error);
      Toast.error(t('meetingRoom.loadFieldFailed'));
    }
  }, [t]);

  // 辅助函数：获取字段类型名称
  const getFieldTypeName = (type: FieldType): string => {
    const typeMap: Record<number, string> = {
      [FieldType.Text]: '文本',
      [FieldType.Number]: '数字',
      [FieldType.SingleSelect]: '单选',
      [FieldType.MultiSelect]: '多选',
      [FieldType.DateTime]: '日期时间',
      [FieldType.Checkbox]: '复选框',
      [FieldType.User]: '人员',
      [FieldType.Phone]: '电话',
      [FieldType.Url]: 'URL',
      [FieldType.Attachment]: '附件',
      [FieldType.SingleLink]: '单向关联',  // 使用正确的字段类型
      [FieldType.Lookup]: '查找引用',
      [FieldType.Formula]: '公式',
      [FieldType.CreatedTime]: '创建时间',
      [FieldType.ModifiedTime]: '修改时间',
      [FieldType.CreatedUser]: '创建人',
      [FieldType.ModifiedUser]: '修改人',
      [FieldType.AutoNumber]: '自动编号',
      [FieldType.Barcode]: '条码',
      [FieldType.Currency]: '货币',
      [FieldType.Progress]: '进度',
      [FieldType.Rating]: '评分',
      [FieldType.Location]: '地理位置',
      [FieldType.GroupChat]: '群组',
      [FieldType.DuplexLink]: '双向关联'  // 双向关联字段
    };
    
    return typeMap[type] || `未知类型(${type})`;
  };

  /** 从两个表加载会议室和会议数据 */
  const loadMeetingData = useCallback(async () => {
    try {
      if (!config.roomTableId || !config.bookingTableId || 
          !config.roomNameFieldId || !config.bookingRoomFieldId || 
          !config.startTimeFieldId || !config.endTimeFieldId) {
        return;
      }
      
      setLoading(true);
      
      // 1. 从会议室表加载所有会议室
      const roomTable = await bitable.base.getTableById(config.roomTableId);
      let roomRecords;
      
      if (config.roomViewId) {
        try {
          roomRecords = await (roomTable as any).getRecordList({ viewId: config.roomViewId });
        } catch (viewError) {
          console.warn('使用会议室视图获取记录失败，使用默认方式:', viewError);
          roomRecords = await roomTable.getRecordList();
        }
      } else {
        roomRecords = await roomTable.getRecordList();
      }
      
      const rooms: IMeetingRoom[] = [];
      const roomIdMap = new Map<string, IMeetingRoom>();
      
      for (const record of roomRecords) {
        try {
          // 获取会议室名称
          const roomNameCell = await roomTable.getCellValue(config.roomNameFieldId, record.id);
          const roomName = extractTextFromCell(roomNameCell);
          
          if (!roomName) continue;
          
          // 获取会议室ID（如果配置了ID字段，否则使用记录ID）
          let roomId = record.id;
          if (config.roomIdFieldId) {
            const roomIdCell = await roomTable.getCellValue(config.roomIdFieldId, record.id);
            const customRoomId = extractTextFromCell(roomIdCell);
            if (customRoomId) {
              roomId = customRoomId;
            }
          }
          
          const room: IMeetingRoom = {
            id: record.id,
            name: roomName,
            roomId: roomId,
            todayMeetings: [],
            status: 'available'
          };
          
          rooms.push(room);
          roomIdMap.set(roomId, room);
        } catch (cellError) {
          console.warn('读取会议室记录失败:', cellError);
        }
      }
      
      // 2. 从预定表加载今日预定
      const bookingTable = await bitable.base.getTableById(config.bookingTableId);
      let bookingRecords;
      
      if (config.bookingViewId) {
        try {
          bookingRecords = await (bookingTable as any).getRecordList({ viewId: config.bookingViewId });
        } catch (viewError) {
          console.warn('使用预定视图获取记录失败，使用默认方式:', viewError);
          bookingRecords = await bookingTable.getRecordList();
        }
      } else {
        bookingRecords = await bookingTable.getRecordList();
      }
      
      const allMeetings: IMeeting[] = [];
      
      for (const record of bookingRecords) {
        try {
          // 获取关联的会议室
          const bookingRoomCell = await bookingTable.getCellValue(config.bookingRoomFieldId, record.id);
          const bookingRoomId = extractReferenceFromCell(bookingRoomCell);
          
          if (!bookingRoomId) continue;
          
          // 获取会议标题
          const meetingTitleCell = config.meetingTitleFieldId ? 
            await bookingTable.getCellValue(config.meetingTitleFieldId, record.id) : null;
          const meetingTitle = extractTextFromCell(meetingTitleCell) || '未命名会议';
          
          // 获取开始时间
          const startTimeCell = await bookingTable.getCellValue(config.startTimeFieldId, record.id);
          const startTime = extractDateTimeFromCell(startTimeCell);
          
          // 获取结束时间
          const endTimeCell = await bookingTable.getCellValue(config.endTimeFieldId, record.id);
          const endTime = extractDateTimeFromCell(endTimeCell);
          
          // 获取组织者
          let organizer = '未知';
          if (config.organizerFieldId) {
            const organizerCell = await bookingTable.getCellValue(config.organizerFieldId, record.id);
            organizer = extractTextFromCell(organizerCell) || '未知';
          }
          
          if (startTime && endTime) {
            // 只处理今天的会议
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (startTime >= today && startTime < tomorrow) {
              const room = Array.from(roomIdMap.values()).find(r => 
                r.roomId === bookingRoomId || r.id === bookingRoomId
              );
              
              if (room) {
                const meeting: IMeeting = {
                  id: record.id,
                  title: meetingTitle,
                  startTime,
                  endTime,
                  organizer,
                  roomName: room.name,
                  roomId: room.roomId,
                  status: getMeetingStatus(startTime, endTime, currentTime)
                };
                
                allMeetings.push(meeting);
                room.todayMeetings.push(meeting);
              }
            }
          }
        } catch (cellError) {
          console.warn('读取预定记录失败:', cellError);
        }
      }
      
      // 3. 更新每个会议室的当前会议和状态
      const updatedRooms = rooms.map(room => {
        room.todayMeetings.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        
        // 查找当前正在进行的会议
        const currentMeeting = room.todayMeetings.find(meeting => 
          meeting.status === 'ongoing'
        );
        
        if (currentMeeting) {
          room.currentMeeting = currentMeeting;
          room.status = 'in-use';
        } else {
          // 检查是否有即将开始的会议（15分钟内）
          const nextMeeting = room.todayMeetings.find(meeting => 
            meeting.status === 'upcoming' && 
            (meeting.startTime.getTime() - currentTime.getTime()) <= 15 * 60 * 1000
          );
          room.status = nextMeeting ? 'soon' : 'available';
        }
        
        return room;
      });
      
      setMeetingRooms(updatedRooms);
      
      if (updatedRooms.length === 0) {
        Toast.warning(t('meetingRoom.noRoomsData'));
      } else if (allMeetings.length === 0) {
        Toast.warning(t('meetingRoom.noBookingsData'));
      } else {
        Toast.success(t('meetingRoom.loadSuccess', { 
          roomCount: updatedRooms.length, 
          bookingCount: allMeetings.length 
        }));
      }
    } catch (error) {
      console.error('加载会议数据失败:', error);
      Toast.error(t('meetingRoom.loadDataFailed'));
    } finally {
      setLoading(false);
    }
  }, [config, currentTime, t]);

  // 辅助函数：从单元格提取文本
  const extractTextFromCell = (cellValue: any): string => {
    if (!cellValue) return '';
    
    if (typeof cellValue === 'string') {
      return cellValue.trim();
    } else if (cellValue && typeof cellValue === 'object') {
      if (cellValue.text) {
        return String(cellValue.text).trim();
      } else if (Array.isArray(cellValue) && cellValue.length > 0) {
        const firstItem = cellValue[0];
        if (firstItem && firstItem.text) {
          return String(firstItem.text).trim();
        } else if (typeof firstItem === 'string') {
          return firstItem.trim();
        }
      }
    }
    return '';
  };

  // 辅助函数：从关联字段提取引用ID
  const extractReferenceFromCell = (cellValue: any): string => {
    if (!cellValue) return '';
    
    if (Array.isArray(cellValue) && cellValue.length > 0) {
      const firstItem = cellValue[0];
      if (firstItem && firstItem.id) {
        return firstItem.id;
      } else if (typeof firstItem === 'string') {
        return firstItem;
      }
    } else if (cellValue && typeof cellValue === 'object' && cellValue.id) {
      return cellValue.id;
    } else if (typeof cellValue === 'string') {
      return cellValue;
    }
    
    return '';
  };

  // 辅助函数：从单元格提取日期时间
  const extractDateTimeFromCell = (cellValue: any): Date | null => {
    if (!cellValue) return null;
    
    try {
      if (typeof cellValue === 'number') {
        return new Date(cellValue);
      } else if (typeof cellValue === 'string') {
        const date = new Date(cellValue);
        return isNaN(date.getTime()) ? null : date;
      } else if (cellValue && typeof cellValue === 'object') {
        if (cellValue.timestamp) {
          return new Date(cellValue.timestamp);
        }
      }
    } catch (error) {
      console.warn('日期解析失败:', error);
    }
    return null;
  };

  // 辅助函数：获取会议状态
  const getMeetingStatus = (startTime: Date, endTime: Date, currentTime: Date): 'ongoing' | 'upcoming' | 'completed' => {
    if (currentTime >= startTime && currentTime <= endTime) {
      return 'ongoing';
    } else if (currentTime < startTime) {
      return 'upcoming';
    } else {
      return 'completed';
    }
  };

  // 初始化加载表格列表
  useEffect(() => {
    if (isConfig) {
      loadTables();
    }
  }, [isConfig, loadTables]);

  // 当会议室表选择变化时加载字段
  useEffect(() => {
    if (config.roomTableId && isConfig) {
      loadRoomFields(config.roomTableId);
    }
  }, [config.roomTableId, isConfig, loadRoomFields]);

  // 当预定表选择变化时加载字段
  useEffect(() => {
    if (config.bookingTableId && isConfig) {
      loadBookingFields(config.bookingTableId);
    }
  }, [config.bookingTableId, isConfig, loadBookingFields]);

  // 当配置变化时加载会议数据
  useEffect(() => {
    if (config.roomTableId && config.bookingTableId && 
        config.roomNameFieldId && config.bookingRoomFieldId && 
        config.startTimeFieldId && config.endTimeFieldId) {
      loadMeetingData();
    }
  }, [
    config.roomTableId, config.bookingTableId,
    config.roomNameFieldId, config.bookingRoomFieldId,
    config.startTimeFieldId, config.endTimeFieldId,
    isConfig, loadMeetingData
  ]);

  // 定期刷新数据
  useEffect(() => {
    const interval = setInterval(() => {
      if (config.roomTableId && config.bookingTableId && 
          config.roomNameFieldId && config.bookingRoomFieldId && 
          config.startTimeFieldId && config.endTimeFieldId && !isConfig) {
        loadMeetingData();
      }
    }, 30000); // 每30秒刷新一次
    
    return () => clearInterval(interval);
  }, [config, isConfig, loadMeetingData]);

  return (
    <main 
      style={{
        backgroundColor: props.bgColor,
        paddingRight: isConfig ? '400px' : '0',
        minHeight: '100vh',
        position: 'relative',
        transition: 'padding-right 0.3s ease'
      }} 
      className={classnames({'main-config': isConfig, 'main': true})}
    >
      <div className='content'>
        <MeetingRoomView
          t={t}
          config={config}
          meetingRooms={meetingRooms}
          currentTime={currentTime}
          isConfig={isConfig}
          loading={loading}
        />
      </div>
      
      {isConfig && (
        <ConfigPanel 
          t={t} 
          config={config} 
          setConfig={setConfig}
          tables={tables}
          roomFields={roomFields}
          bookingFields={bookingFields}
          loading={loading}
          onRefreshData={loadMeetingData}
        />
      )}
    </main>
  );
}

// MeetingRoomView 组件
interface IMeetingRoomView {
  config: IMeetingRoomConfig;
  meetingRooms: IMeetingRoom[];
  currentTime: Date;
  isConfig: boolean;
  loading: boolean;
  t: any;
}

function MeetingRoomView({ config, meetingRooms, currentTime, isConfig, loading, t }: IMeetingRoomView) {
  const { color, showDate, showCurrentMeeting, title } = config;
  
  // 格式化时间显示
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 计算会议剩余时间
  const getTimeRemaining = (endTime: Date): string => {
    const diff = endTime.getTime() - currentTime.getTime();
    if (diff <= 0) return '已结束';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}小时${remainingMinutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  // 计算会议已进行时间
  const getElapsedTime = (startTime: Date): string => {
    const diff = currentTime.getTime() - startTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}小时${remainingMinutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  if (meetingRooms.length === 0 && !isConfig) {
    return (
      <div className="no-meeting-rooms">
        <div className="no-data-text">{t('meetingRoom.noData')}</div>
        <div className="no-data-hint">{t('meetingRoom.configHint')}</div>
      </div>
    );
  }

  return (
    <div className="meeting-room-board">
      {/* 标题区域 */}
      <div className="board-header" style={{ color }}>
        <h1 className="board-title">{title}</h1>
        {showDate && (
          <div className="current-date-time">
            <div className="current-date">{formatDate(currentTime)}</div>
            <div className="current-time">{formatTime(currentTime)}</div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">{t('meetingRoom.loading')}</div>
        </div>
      ) : (
        <div className="board-content">
          {/* 左侧：会议室状态概览 */}
          <div className="rooms-overview">
            <h2 className="section-title">{t('meetingRoom.roomStatus')}</h2>
            <div className="rooms-grid">
              {meetingRooms.map(room => (
                <div 
                  key={room.id} 
                  className={classnames('room-card', {
                    'available': room.status === 'available',
                    'in-use': room.status === 'in-use',
                    'soon': room.status === 'soon'
                  })}
                >
                  <div className="room-header">
                    <h3 className="room-name">{room.name}</h3>
                    <div className="room-status">
                      {room.status === 'available' && '🟢 ' + t('meetingRoom.available')}
                      {room.status === 'in-use' && '🔴 ' + t('meetingRoom.inUse')}
                      {room.status === 'soon' && '🟡 ' + t('meetingRoom.soon')}
                    </div>
                  </div>
                  
                  {showCurrentMeeting && room.currentMeeting && (
                    <div className="current-meeting">
                      <div className="meeting-title">{room.currentMeeting.title}</div>
                      <div className="meeting-time">
                        {formatTime(room.currentMeeting.startTime)} - {formatTime(room.currentMeeting.endTime)}
                      </div>
                      <div className="meeting-organizer">{t('meetingRoom.organizer')}: {room.currentMeeting.organizer}</div>
                      <div className="meeting-progress">
                        <div className="progress-text">
                          {t('meetingRoom.elapsedTime')}: {getElapsedTime(room.currentMeeting.startTime)}
                        </div>
                        <div className="progress-text">
                          {t('meetingRoom.remainingTime')}: {getTimeRemaining(room.currentMeeting.endTime)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {room.status === 'soon' && !room.currentMeeting && room.todayMeetings.length > 0 && (
                    <div className="next-meeting">
                      <div className="next-meeting-label">{t('meetingRoom.nextMeeting')}:</div>
                      {room.todayMeetings.find(m => m.status === 'upcoming') && (
                        <div className="next-meeting-info">
                          <div className="meeting-title">
                            {room.todayMeetings.find(m => m.status === 'upcoming')?.title}
                          </div>
                          <div className="meeting-time">
                            {formatTime(room.todayMeetings.find(m => m.status === 'upcoming')!.startTime)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 右侧：今日会议列表 */}
          <div className="meetings-list">
            <h2 className="section-title">{t('meetingRoom.todaySchedule')}</h2>
            <div className="meetings-timeline">
              {meetingRooms.flatMap(room => 
                room.todayMeetings.map(meeting => ({
                  ...meeting,
                  roomName: room.name
                }))
              )
              .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
              .map((meeting, index) => (
                <div 
                  key={`${meeting.id}-${index}`} 
                  className={classnames('meeting-item', {
                    'ongoing': meeting.status === 'ongoing',
                    'upcoming': meeting.status === 'upcoming',
                    'completed': meeting.status === 'completed'
                  })}
                >
                  <div className="meeting-time-range">
                    {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                  </div>
                  <div className="meeting-details">
                    <div className="meeting-title">{meeting.title}</div>
                    <div className="meeting-meta">
                      <span className="room-name">{meeting.roomName}</span>
                      <span className="organizer">{meeting.organizer}</span>
                    </div>
                  </div>
                  <div className="meeting-status">
                    {meeting.status === 'ongoing' && '🟢 ' + t('meetingRoom.ongoing')}
                    {meeting.status === 'upcoming' && '⏰ ' + t('meetingRoom.upcoming')}
                    {meeting.status === 'completed' && '✅ ' + t('meetingRoom.completed')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ConfigPanel 组件
function ConfigPanel(props: {
  config: IMeetingRoomConfig;
  setConfig: React.Dispatch<React.SetStateAction<IMeetingRoomConfig>>;
  tables: {id: string, name: string}[];
  roomFields: IFieldInfo[];
  bookingFields: IFieldInfo[];
  loading: boolean;
  onRefreshData: () => void;
  t: any;
}) {
  const { config, setConfig, tables, roomFields, bookingFields, loading, onRefreshData, t } = props;

  const onSaveConfig = () => {
    dashboard.saveConfig({
      customConfig: config,
      dataConditions: [],
    } as any).then(() => {
      Toast.success(t('confirm', '配置保存成功'));
    }).catch((error: any) => {
      console.error('保存配置失败:', error);
      Toast.error('保存配置失败');
    });
  };

  const handleRoomTableChange = (value: any) => {
    const roomTableId = String(value);
    setConfig({
      ...config,
      roomTableId,
      roomViewId: '',
      roomNameFieldId: '',
      roomIdFieldId: '',
    });
  };

  const handleBookingTableChange = (value: any) => {
    const bookingTableId = String(value);
    setConfig({
      ...config,
      bookingTableId,
      bookingViewId: '',
      bookingRoomFieldId: '',
      meetingTitleFieldId: '',
      startTimeFieldId: '',
      endTimeFieldId: '',
      organizerFieldId: '',
    });
  };

  // 修复 Select filter 函数的类型问题
  const filterOption = (input: string, option: any): boolean => {
    if (option && option.children) {
      return String(option.children).toLowerCase().includes(input.toLowerCase());
    }
    return false;
  };

  return (
    <div className='config-panel' style={{
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: '400px',
      background: '#f8f9fa',
      borderLeft: '1px solid #e1e5e9',
      zIndex: 1000,
      overflowY: 'auto',
      padding: '20px',
      boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)'
    }}>
      <div className='form'>
        <div className='config-section'>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            color: '#1a1a1a', 
            fontSize: '18px', 
            fontWeight: '600',
            borderBottom: '2px solid #1890ff', 
            paddingBottom: '10px' 
          }}>
            会议室看板配置
          </h3>
          
          {/* 基础设置 */}
          <div className='config-subsection'>
            <h4 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '14px', fontWeight: '600' }}>
              基础设置
            </h4>
            
            <div className='config-item'>
              <label className='config-label'>{t('meetingRoom.showTitle')}</label>
              <div className='config-content'>
                <input
                  type="checkbox"
                  checked={config.showDate}
                  onChange={(e) => setConfig({...config, showDate: e.target.checked})}
                />
              </div>
            </div>

            <div className='config-item'>
              <label className='config-label'>看板标题</label>
              <div className='config-content'>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({...config, title: e.target.value})}
                  className='config-input'
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }}
                />
              </div>
            </div>
          </div>

          {/* 会议室表配置 */}
          <div className='config-subsection'>
            <h4 style={{ 
              margin: '24px 0 12px 0', 
              color: '#333', 
              fontSize: '14px', 
              fontWeight: '600',
              padding: '8px 12px',
              background: '#e6f7ff',
              borderRadius: '4px'
            }}>
              {t('meetingRoom.roomTableConfig')}
            </h4>
            
            <div className='config-item'>
              <label className='config-label'>{t('meetingRoom.selectRoomTable')}</label>
              <div className='config-content'>
                <Select
                  value={config.roomTableId}
                  onChange={handleRoomTableChange}
                  style={{ width: '100%' }}
                  placeholder={t('meetingRoom.selectTablePlaceholder')}
                  loading={loading}
                >
                  {tables.map((table) => (
                    <Select.Option key={table.id} value={table.id}>
                      {table.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>

            <div className='config-item'>
              <label className='config-label'>{t('meetingRoom.roomNameField')}</label>
              <div className='config-content'>
                <Select
                  value={config.roomNameFieldId}
                  onChange={(value) => setConfig({...config, roomNameFieldId: String(value)})}
                  style={{ width: '100%' }}
                  placeholder={t('meetingRoom.selectFieldPlaceholder')}
                  disabled={!config.roomTableId}
                  loading={loading}
                  filter={filterOption}
                >
                  {roomFields
                    .filter(field => field.type.includes('文本') || field.type.includes('单选'))
                    .map((field) => (
                    <Select.Option key={field.id} value={field.id}>
                      {field.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>

            <div className='config-item'>
              <label className='config-label'>{t('meetingRoom.roomIdField')}（可选）</label>
              <div className='config-content'>
                <Select
                  value={config.roomIdFieldId}
                  onChange={(value) => setConfig({...config, roomIdFieldId: String(value)})}
                  style={{ width: '100%' }}
                  placeholder="请选择会议室ID字段（用于精确匹配）"
                  disabled={!config.roomTableId}
                  loading={loading}
                >
                  <Select.Option value="">使用记录ID</Select.Option>
                  {roomFields
                    .filter(field => field.type.includes('文本') || field.type.includes('自动编号'))
                    .map((field) => (
                    <Select.Option key={field.id} value={field.id}>
                      {field.name}
                    </Select.Option>
                  ))}
                </Select>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  如不选择，将使用记录ID进行匹配
                </div>
              </div>
            </div>
          </div>

          {/* 预定表配置 */}
          <div className='config-subsection'>
            <h4 style={{ 
              margin: '24px 0 12px 0', 
              color: '#333', 
              fontSize: '14px', 
              fontWeight: '600',
              padding: '8px 12px',
              background: '#f6ffed',
              borderRadius: '4px'
            }}>
              {t('meetingRoom.bookingTableConfig')}
            </h4>

            <div className='config-item'>
              <label className='config-label'>{t('meetingRoom.selectBookingTable')}</label>
              <div className='config-content'>
                <Select
                  value={config.bookingTableId}
                  onChange={handleBookingTableChange}
                  style={{ width: '100%' }}
                  placeholder={t('meetingRoom.selectTablePlaceholder')}
                  loading={loading}
                >
                  {tables.map((table) => (
                    <Select.Option key={table.id} value={table.id}>
                      {table.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>

            <div className='config-item'>
              <label className='config-label'>{t('meetingRoom.bookingRoomField')}</label>
              <div className='config-content'>
                <Select
                  value={config.bookingRoomFieldId}
                  onChange={(value) => setConfig({...config, bookingRoomFieldId: String(value)})}
                  style={{ width: '100%' }}
                  placeholder="请选择关联会议室的字段"
                  disabled={!config.bookingTableId}
                  loading={loading}
                  filter={filterOption}
                >
                  {bookingFields
                    .filter(field => 
                      field.type.includes('单向关联') || 
                      field.type.includes('双向关联') || 
                      field.type.includes('单选')
                    )
                    .map((field) => (
                    <Select.Option key={field.id} value={field.id}>
                      {field.name}
                    </Select.Option>
                  ))}
                </Select>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  请选择关联到会议室表的字段
                </div>
              </div>
            </div>

            <div className='config-item'>
              <label className='config-label'>{t('meetingRoom.meetingTitleField')}</label>
              <div className='config-content'>
                <Select
                  value={config.meetingTitleFieldId}
                  onChange={(value) => setConfig({...config, meetingTitleFieldId: String(value)})}
                  style={{ width: '100%' }}
                  placeholder={t('meetingRoom.selectFieldPlaceholder')}
                  disabled={!config.bookingTableId}
                  loading={loading}
                >
                  {bookingFields
                    .filter(field => field.type.includes('文本'))
                    .map((field) => (
                    <Select.Option key={field.id} value={field.id}>
                      {field.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>

            <div className='config-item'>
              <label className='config-label'>{t('meetingRoom.startTimeField')}</label>
              <div className='config-content'>
                <Select
                  value={config.startTimeFieldId}
                  onChange={(value) => setConfig({...config, startTimeFieldId: String(value)})}
                  style={{ width: '100%' }}
                  placeholder="请选择开始时间字段"
                  disabled={!config.bookingTableId}
                  loading={loading}
                >
                  {bookingFields
                    .filter(field => field.type.includes('日期时间'))
                    .map((field) => (
                    <Select.Option key={field.id} value={field.id}>
                      {field.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>

            <div className='config-item'>
              <label className='config-label'>{t('meetingRoom.endTimeField')}</label>
              <div className='config-content'>
                <Select
                  value={config.endTimeFieldId}
                  onChange={(value) => setConfig({...config, endTimeFieldId: String(value)})}
                  style={{ width: '100%' }}
                  placeholder="请选择结束时间字段"
                  disabled={!config.bookingTableId}
                  loading={loading}
                >
                  {bookingFields
                    .filter(field => field.type.includes('日期时间'))
                    .map((field) => (
                    <Select.Option key={field.id} value={field.id}>
                      {field.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>

            <div className='config-item'>
              <label className='config-label'>{t('meetingRoom.organizerField')}（可选）</label>
              <div className='config-content'>
                <Select
                  value={config.organizerFieldId}
                  onChange={(value) => setConfig({...config, organizerFieldId: String(value)})}
                  style={{ width: '100%' }}
                  placeholder="请选择组织者字段"
                  disabled={!config.bookingTableId}
                  loading={loading}
                >
                  <Select.Option value="">不选择</Select.Option>
                  {bookingFields
                    .filter(field => field.type.includes('文本') || field.type.includes('人员'))
                    .map((field) => (
                    <Select.Option key={field.id} value={field.id}>
                      {field.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* 数据预览 */}
          <div className='config-subsection'>
            <h4 style={{ 
              margin: '24px 0 12px 0', 
              color: '#333', 
              fontSize: '14px', 
              fontWeight: '600' 
            }}>
              {t('meetingRoom.dataPreview')}
            </h4>
            
            <div className='config-item'>
              <label className='config-label'>
                数据状态
                <Button 
                  size="small" 
                  onClick={onRefreshData}
                  disabled={!config.roomTableId || !config.bookingTableId || 
                           !config.roomNameFieldId || !config.bookingRoomFieldId || 
                           !config.startTimeFieldId || !config.endTimeFieldId}
                  loading={loading}
                  style={{ marginLeft: '8px' }}
                >
                  {t('meetingRoom.refresh')}
                </Button>
              </label>
              <div className='config-content'>
                <div className='data-preview'>
                  {config.roomTableId && config.bookingTableId && 
                   config.roomNameFieldId && config.bookingRoomFieldId && 
                   config.startTimeFieldId && config.endTimeFieldId ? (
                    <div className='preview-info'>
                      <div className='preview-count' style={{ background: '#52c41a' }}>
                        配置完整，点击刷新按钮加载数据
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        • 会议室表: {tables.find(t => t.id === config.roomTableId)?.name}<br/>
                        • 预定表: {tables.find(t => t.id === config.bookingTableId)?.name}
                      </div>
                    </div>
                  ) : (
                    <div className='no-data-preview'>
                      请先完成以上所有必要字段的配置
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 主题颜色 */}
          <div className='config-item'>
            <label className='config-label'>{t('meetingRoom.color')}</label>
            <div className='config-content'>
              <input
                type="color"
                value={config.color}
                onChange={(e) => setConfig({...config, color: e.target.value})}
                className='color-input'
                style={{ 
                  width: '60px', 
                  height: '40px', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '4px', 
                  cursor: 'pointer' 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <Button
        className='btn'
        theme='solid'
        onClick={onSaveConfig}
        disabled={!config.roomTableId || !config.bookingTableId || 
                 !config.roomNameFieldId || !config.bookingRoomFieldId || 
                 !config.startTimeFieldId || !config.endTimeFieldId}
        style={{ 
          width: '100%', 
          marginTop: '24px', 
          height: '40px', 
          fontWeight: '500',
          fontSize: '14px'
        }}
      >
        {t('confirm')}
      </Button>
    </div>
  );
}