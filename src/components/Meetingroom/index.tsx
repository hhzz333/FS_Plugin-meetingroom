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
  showSingleRoom: boolean;
  selectedRoomId: string;
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
    showSingleRoom: false,
    selectedRoomId: '',
  };

  const [config, setConfig] = useState<IMeetingRoomConfig>(defaultConfig);
  const [tables, setTables] = useState<{id: string, name: string}[]>([]);
  const [roomFields, setRoomFields] = useState<IFieldInfo[]>([]);
  const [bookingFields, setBookingFields] = useState<IFieldInfo[]>([]);
  const [meetingRooms, setMeetingRooms] = useState<IMeetingRoom[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [allRooms, setAllRooms] = useState<IMeetingRoom[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isCreate = dashboard.state === DashboardState.Create;
  const isConfig = dashboard.state === DashboardState.Config || isCreate;

  // 使用 ref 来跟踪配置状态变化
  const configRef = useRef(config);
  const isConfigRef = useRef(isConfig);

  useEffect(() => {
    configRef.current = config;
    isConfigRef.current = isConfig;
  }, [config, isConfig]);

  // 监听全屏状态变化 - 修复版本
  useEffect(() => {
    const checkFullscreen = () => {
      try {
        const fullscreenState = dashboard.state === DashboardState.FullScreen;
        setIsFullscreen(fullscreenState);
        console.log('全屏状态:', fullscreenState, '当前状态:', dashboard.state);
      } catch (error) {
        console.error('检查全屏状态失败:', error);
      }
    };

    // 初始检查
    checkFullscreen();

    // 使用轮询方式检测全屏状态变化（最可靠的方式）
    const interval = setInterval(checkFullscreen, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isCreate) {
      setConfig(defaultConfig);
    }
  }, [i18n.language, isCreate]);

  const timer = useRef<number | null>(null);

  const updateConfig = useCallback((res: IConfig) => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    
    try {
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
          showSingleRoom: typeof customConfig.showSingleRoom === 'boolean' ? customConfig.showSingleRoom : defaultConfig.showSingleRoom,
          selectedRoomId: typeof customConfig.selectedRoomId === 'string' ? customConfig.selectedRoomId : defaultConfig.selectedRoomId,
        };
        
        setConfig(validatedConfig);
        setDataLoaded(false);
        
        timer.current = window.setTimeout(() => {
          dashboard.setRendered();
          timer.current = null;
        }, 3000);
      } else {
        setConfig(defaultConfig);
        setDataLoaded(false);
      }
    } catch (error) {
      console.error('配置解析失败:', error);
      setConfig(defaultConfig);
      setDataLoaded(false);
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
      [FieldType.SingleLink]: '单向关联',
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
      [FieldType.DuplexLink]: '双向关联'
    };
    
    return typeMap[type] || `未知类型(${type})`;
  };

  /** 从两个表加载会议室和会议数据 */
  const loadMeetingData = useCallback(async (showToast: boolean = false) => {
    // 使用 ref 来获取最新的配置状态，避免闭包问题
    const currentIsConfig = isConfigRef.current;
    const currentConfig = configRef.current;

    // 在配置模式下不加载数据
    if (currentIsConfig && !showToast) {
      console.log('配置模式下跳过数据加载');
      return;
    }

    try {
      if (!currentConfig.roomTableId || !currentConfig.bookingTableId || 
          !currentConfig.roomNameFieldId || !currentConfig.bookingRoomFieldId || 
          !currentConfig.startTimeFieldId || !currentConfig.endTimeFieldId) {
        console.log('配置不完整，跳过数据加载');
        return;
      }
      
      setLoading(true);
      console.log('开始加载会议数据...', new Date().toISOString());
      
      // 1. 从会议室表加载所有会议室
      const roomTable = await bitable.base.getTableById(currentConfig.roomTableId);
      let roomRecords;
      
      if (currentConfig.roomViewId) {
        try {
          roomRecords = await (roomTable as any).getRecordList({ viewId: currentConfig.roomViewId });
        } catch (viewError) {
          console.warn('使用会议室视图获取记录失败，使用默认方式:', viewError);
          roomRecords = await roomTable.getRecordList();
        }
      } else {
        roomRecords = await roomTable.getRecordList();
      }
      
      // 修复：正确获取记录数量
      const roomRecordsLength = Array.isArray(roomRecords) ? roomRecords.length : 0;
      console.log(`找到 ${roomRecordsLength} 个会议室记录`);
      
      const rooms: IMeetingRoom[] = [];
      const roomNameMap = new Map<string, IMeetingRoom>();
      
      for (const record of roomRecords) {
        try {
          // 获取会议室名称
          const roomNameCell = await roomTable.getCellValue(currentConfig.roomNameFieldId, record.id);
          const roomName = extractTextFromCell(roomNameCell);
          
          if (!roomName) {
            console.log(`记录 ${record.id} 没有会议室名称，跳过`);
            continue;
          }
          
          console.log(`处理会议室: ${roomName}`);
          
          const room: IMeetingRoom = {
            id: record.id,
            name: roomName,
            roomId: record.id,
            todayMeetings: [],
            status: 'available'
          };
          
          rooms.push(room);
          roomNameMap.set(roomName, room);
        } catch (cellError) {
          console.warn('读取会议室记录失败:', cellError);
        }
      }
      
      console.log(`成功加载 ${rooms.length} 个会议室`);
      
      // 2. 从预定表加载今日预定
      const bookingTable = await bitable.base.getTableById(currentConfig.bookingTableId);
      let bookingRecords;
      
      if (currentConfig.bookingViewId) {
        try {
          bookingRecords = await (bookingTable as any).getRecordList({ viewId: currentConfig.bookingViewId });
        } catch (viewError) {
          console.warn('使用预定视图获取记录失败，使用默认方式:', viewError);
          bookingRecords = await bookingTable.getRecordList();
        }
      } else {
        bookingRecords = await bookingTable.getRecordList();
      }
      
      // 修复：正确获取记录数量
      const bookingRecordsLength = Array.isArray(bookingRecords) ? bookingRecords.length : 0;
      console.log(`找到 ${bookingRecordsLength} 个预定记录`);
      
      const allMeetings: IMeeting[] = [];
      let matchedCount = 0;
      
      for (const record of bookingRecords) {
        try {
          // 获取关联的会议室 - 通过文本内容匹配
          const bookingRoomCell = await bookingTable.getCellValue(currentConfig.bookingRoomFieldId, record.id);
          
          // 从预定表的会议室字段提取文本内容
          const bookingRoomName = extractTextFromCell(bookingRoomCell);
          
          if (!bookingRoomName) {
            console.log(`预定记录 ${record.id} 没有会议室名称，跳过`);
            continue;
          }
          
          // 通过名称匹配会议室
          const matchedRoom = roomNameMap.get(bookingRoomName);
          
          if (!matchedRoom) {
            console.log(`预定记录 ${record.id} 的会议室 "${bookingRoomName}" 未匹配到任何会议室`);
            continue;
          }
          
          console.log(`成功匹配会议室: ${bookingRoomName} -> ${matchedRoom.name}`);
          
          // 获取会议标题
          const meetingTitleCell = currentConfig.meetingTitleFieldId ? 
            await bookingTable.getCellValue(currentConfig.meetingTitleFieldId, record.id) : null;
          const meetingTitle = extractTextFromCell(meetingTitleCell) || '未命名会议';
          
          // 获取开始时间
          const startTimeCell = await bookingTable.getCellValue(currentConfig.startTimeFieldId, record.id);
          const startTime = extractDateTimeFromCell(startTimeCell);
          
          // 获取结束时间
          const endTimeCell = await bookingTable.getCellValue(currentConfig.endTimeFieldId, record.id);
          const endTime = extractDateTimeFromCell(endTimeCell);
          
          // 获取组织者
          let organizer = '未知';
          if (currentConfig.organizerFieldId) {
            const organizerCell = await bookingTable.getCellValue(currentConfig.organizerFieldId, record.id);
            organizer = extractTextFromCell(organizerCell) || '未知';
          }
          
          if (startTime && endTime) {
            // 只处理今天的会议
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (startTime >= today && startTime < tomorrow) {
              const meeting: IMeeting = {
                id: record.id,
                title: meetingTitle,
                startTime,
                endTime,
                organizer,
                roomName: matchedRoom.name,
                roomId: matchedRoom.roomId,
                status: getMeetingStatus(startTime, endTime, currentTime)
              };
              
              allMeetings.push(meeting);
              matchedRoom.todayMeetings.push(meeting);
              matchedCount++;
            }
          }
        } catch (cellError) {
          console.warn('读取预定记录失败:', cellError, record.id);
        }
      }
      
      console.log(`成功匹配 ${matchedCount} 个预定到会议室`);
      
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

      // 保存所有会议室用于选择
      setAllRooms(updatedRooms);
      
      // 4. 如果启用了单一会议室显示，过滤数据
      let finalRooms = updatedRooms;

      if (currentConfig.showSingleRoom && currentConfig.selectedRoomId) {
        console.log('启用单一会议室显示，选择ID:', currentConfig.selectedRoomId);
        
        // 查找选定的会议室
        const selectedRoom = updatedRooms.find(room => 
          room.id === currentConfig.selectedRoomId || room.roomId === currentConfig.selectedRoomId
        );
        
        if (selectedRoom) {
          finalRooms = [selectedRoom];
        } else {
          console.log('未找到选定的会议室，显示所有会议室');
          finalRooms = updatedRooms;
        }
      }
      
      setMeetingRooms(finalRooms);
      setDataLoaded(true);
      
      // 只在配置界面刷新数据时显示提示，或者有错误时才显示
      if (showToast) {
        if (updatedRooms.length === 0) {
          Toast.warning(t('meetingRoom.noRoomsData'));
        } else if (allMeetings.length === 0) {
          // 找到会议室但没有今日预定，显示信息性提示而不是警告
          Toast.info('找到会议室但今日暂无预定');
        } else {
          Toast.success(`加载成功: ${finalRooms.length}个会议室, ${allMeetings.length}个预定`);
        }
      } else {
        // 非配置界面，只在有错误时显示提示
        if (updatedRooms.length === 0) {
          Toast.warning(t('meetingRoom.noRoomsData'));
        }
        // 没有预定记录是正常情况，不显示提示
      }
    } catch (error) {
      console.error('加载会议数据失败:', error);
      // 错误提示在任何模式下都显示
      Toast.error(t('meetingRoom.loadDataFailed'));
    } finally {
      setLoading(false);
    }
  }, [currentTime, t]);

  // 辅助函数：从单元格提取文本
  const extractTextFromCell = (cellValue: any): string => {
    if (!cellValue) return '';
    
    // 如果是字符串，直接返回
    if (typeof cellValue === 'string') {
      return cellValue.trim();
    }
    
    // 如果是对象且有text属性
    if (cellValue && typeof cellValue === 'object') {
      if (cellValue.text) {
        return String(cellValue.text).trim();
      }
      
      // 处理单选字段
      if (cellValue.name) {
        return String(cellValue.name).trim();
      }
      
      // 处理关联字段
      if (Array.isArray(cellValue) && cellValue.length > 0) {
        const firstItem = cellValue[0];
        if (firstItem && firstItem.text) {
          return String(firstItem.text).trim();
        } else if (firstItem && firstItem.name) {
          return String(firstItem.name).trim();
        } else if (typeof firstItem === 'string') {
          return firstItem.trim();
        }
      }
    }
    
    // 其他情况转为字符串
    return String(cellValue).trim();
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

  // 主要的数据加载逻辑
  useEffect(() => {
    console.log('主要数据加载 useEffect 触发', { isConfig, dataLoaded });
    
    // 在配置模式下不加载数据
    if (isConfig) {
      console.log('配置模式下跳过数据加载');
      return;
    }

    // 检查必要的配置是否完整
    const hasRequiredConfig = 
      config.roomTableId && 
      config.bookingTableId && 
      config.roomNameFieldId && 
      config.bookingRoomFieldId && 
      config.startTimeFieldId && 
      config.endTimeFieldId;
    
    if (!hasRequiredConfig) {
      console.log('配置不完整，跳过数据加载');
      return;
    }

    // 如果数据已经加载过，避免重复加载
    if (dataLoaded) {
      console.log('数据已加载，跳过重复加载');
      return;
    }

    console.log('触发数据加载');
    loadMeetingData(false); // 非配置界面不显示成功提示
  }, [
    isConfig,
    config.roomTableId,
    config.bookingTableId,
    config.roomNameFieldId,
    config.bookingRoomFieldId,
    config.startTimeFieldId,
    config.endTimeFieldId,
    dataLoaded,
    loadMeetingData
  ]);

  // 定期刷新数据 - 只在非配置模式下运行
  useEffect(() => {
    console.log('定时刷新 useEffect 触发', { isConfig, dataLoaded });
    
    if (isConfig) {
      console.log('配置模式下不启动定时刷新');
      return;
    }

    // 检查必要的配置是否完整且数据已加载
    const hasRequiredConfig = 
      config.roomTableId && 
      config.bookingTableId && 
      config.roomNameFieldId && 
      config.bookingRoomFieldId && 
      config.startTimeFieldId && 
      config.endTimeFieldId;
    
    if (!hasRequiredConfig || !dataLoaded) {
      console.log('配置不完整或数据未加载，不启动定时刷新');
      return;
    }
    
    console.log('启动数据定时刷新，间隔30秒');
    
    const interval = window.setInterval(() => {
      console.log('定时刷新会议数据...', new Date().toISOString());
      loadMeetingData(false); // 定时刷新不显示提示
    }, 30000);
    
    return () => {
      console.log('清理数据刷新定时器');
      clearInterval(interval);
    };
  }, [
    isConfig,
    config.roomTableId,
    config.bookingTableId,
    config.roomNameFieldId,
    config.bookingRoomFieldId,
    config.startTimeFieldId,
    config.endTimeFieldId,
    dataLoaded,
    loadMeetingData
  ]);

  return (
    <main 
      style={{
        backgroundColor: props.bgColor,
        paddingRight: isConfig ? '400px' : '0',
        minHeight: '100vh',
        position: 'relative',
        transition: 'padding-right 0.3s ease'
      }} 
      className={classnames({
        'main-config': isConfig, 
        'main': true,
        'fullscreen-mode': isFullscreen
      })}
    >
      <div className='content'>
        <MeetingRoomView
          t={t}
          config={config}
          meetingRooms={meetingRooms}
          currentTime={currentTime}
          isConfig={isConfig}
          isFullscreen={isFullscreen}
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
          allRooms={allRooms}
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
  isFullscreen: boolean;
  loading: boolean;
  t: any;
}

function MeetingRoomView({ config, meetingRooms, currentTime, isConfig, isFullscreen, loading, t }: IMeetingRoomView) {
  const { color, showDate, showCurrentMeeting, title, showSingleRoom } = config;
  
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
    <div className={classnames("meeting-room-board", {
      "single-room-mode": showSingleRoom && meetingRooms.length === 1,
      "fullscreen-mode": isFullscreen
    })}>
      {/* 标题区域 */}
      <div className="board-header" style={{ color }}>
        <h1 className="board-title">{title}</h1>
        {showDate && (
          <div className="current-date-time">
            <div className="current-date">{formatDate(currentTime)}</div>
            <div className="current-time">{formatTime(currentTime)}</div>
          </div>
        )}
        {/* 全屏状态指示器 */}
        {isFullscreen && (
          <div className="fullscreen-indicator">
            🚀 全屏演示模式
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
            <h2 className="section-title">
              {t('meetingRoom.roomStatus')}
              {showSingleRoom && meetingRooms.length === 1 && (
                <span style={{ 
                  fontSize: '14px', 
                  color: '#666', 
                  marginLeft: '12px',
                  fontWeight: 'normal'
                }}>
                  (单一会议室模式)
                </span>
              )}
            </h2>
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
                  {/* 单一会议室模式的状态指示器 */}
                  {showSingleRoom && meetingRooms.length === 1 && (
                    <div className={classnames('room-status-indicator', room.status)}>
                      {room.status === 'available' && '🟢 ' + t('meetingRoom.available')}
                      {room.status === 'in-use' && '🔴 ' + t('meetingRoom.inUse')}
                      {room.status === 'soon' && '🟡 ' + t('meetingRoom.soon')}
                    </div>
                  )}
                  
                  <div className={classnames('room-header', {
                    'single-room-header': showSingleRoom && meetingRooms.length === 1
                  })}>
                    <h3 className="room-name">{room.name}</h3>
                    {(!showSingleRoom || meetingRooms.length > 1) && (
                      <div className="room-status">
                        {room.status === 'available' && '🟢 ' + t('meetingRoom.available')}
                        {room.status === 'in-use' && '🔴 ' + t('meetingRoom.inUse')}
                        {room.status === 'soon' && '🟡 ' + t('meetingRoom.soon')}
                      </div>
                    )}
                  </div>
                  
                  {showCurrentMeeting && room.currentMeeting && (
                    <div className={classnames('current-meeting', {
                      'single-room-current-meeting': showSingleRoom && meetingRooms.length === 1
                    })}>
                      <div className="meeting-title">{room.currentMeeting.title}</div>
                      <div className="meeting-time">
                        {formatTime(room.currentMeeting.startTime)} - {formatTime(room.currentMeeting.endTime)}
                      </div>
                      <div className="meeting-organizer">{t('meetingRoom.organizer')}: {room.currentMeeting.organizer}</div>
                      <div className={classnames('meeting-progress', {
                        'single-room-progress': showSingleRoom && meetingRooms.length === 1
                      })}>
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
                    <div className={classnames('next-meeting', {
                      'single-room-next-meeting': showSingleRoom && meetingRooms.length === 1
                    })}>
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

                  {/* 单一会议室模式：显示今日会议统计 */}
                  {showSingleRoom && meetingRooms.length === 1 && (
                    <div className="room-summary">
                      <div className="summary-item">
                        <span className="summary-label">今日会议总数:</span>
                        <span className="summary-value">{room.todayMeetings.length} 个</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">进行中:</span>
                        <span className="summary-value">
                          {room.todayMeetings.filter(m => m.status === 'ongoing').length} 个
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">待开始:</span>
                        <span className="summary-value">
                          {room.todayMeetings.filter(m => m.status === 'upcoming').length} 个
                        </span>
                      </div>
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
  allRooms: IMeetingRoom[];
  loading: boolean;
  onRefreshData: (showToast: boolean) => void;
  t: any;
}) {
  const { config, setConfig, tables, roomFields, bookingFields, allRooms, loading, onRefreshData, t } = props;

  const onSaveConfig = () => {
    try {
      // 确保配置数据是有效的
      const configToSave = {
        color: config.color || DEFAULT_COLOR,
        roomTableId: config.roomTableId || '',
        roomViewId: config.roomViewId || '',
        bookingTableId: config.bookingTableId || '',
        bookingViewId: config.bookingViewId || '',
        roomNameFieldId: config.roomNameFieldId || '',
        roomIdFieldId: config.roomIdFieldId || '',
        bookingRoomFieldId: config.bookingRoomFieldId || '',
        meetingTitleFieldId: config.meetingTitleFieldId || '',
        startTimeFieldId: config.startTimeFieldId || '',
        endTimeFieldId: config.endTimeFieldId || '',
        organizerFieldId: config.organizerFieldId || '',
        showDate: config.showDate !== undefined ? config.showDate : true,
        showCurrentMeeting: config.showCurrentMeeting !== undefined ? config.showCurrentMeeting : true,
        title: config.title || t('meetingRoom.boardTitle', '会议室状态看板'),
        showSingleRoom: config.showSingleRoom !== undefined ? config.showSingleRoom : false,
        selectedRoomId: config.selectedRoomId || '',
      };

      console.log('保存配置:', configToSave);

      dashboard.saveConfig({
        customConfig: configToSave,
        dataConditions: [],
      }).then(() => {
        Toast.success(t('confirm', '配置保存成功'));
      }).catch((error: any) => {
        console.error('保存配置失败:', error);
        Toast.error('保存配置失败: ' + (error.message || '未知错误'));
      });
    } catch (error) {
      console.error('配置序列化失败:', error);
      Toast.error('配置保存失败');
    }
  };

  const handleRoomTableChange = (value: any) => {
    const roomTableId = String(value);
    setConfig({
      ...config,
      roomTableId,
      roomViewId: '',
      roomNameFieldId: '',
      roomIdFieldId: '',
      selectedRoomId: '',
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

          {/* 单一会议室选择 */}
          <div className='config-subsection'>
            <h4 style={{ 
              margin: '24px 0 12px 0', 
              color: '#333', 
              fontSize: '14px', 
              fontWeight: '600',
              padding: '8px 12px',
              background: '#fff2e8',
              borderRadius: '4px'
            }}>
              显示设置
            </h4>
            
            <div className='config-item'>
              <label className='config-label'>显示单一会议室</label>
              <div className='config-content'>
                <input
                  type="checkbox"
                  checked={config.showSingleRoom}
                  onChange={(e) => setConfig({...config, showSingleRoom: e.target.checked})}
                />
                <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                  启用后只显示选定的会议室
                </span>
              </div>
            </div>

            {config.showSingleRoom && (
              <div className='config-item'>
                <label className='config-label'>选择会议室</label>
                <div className='config-content'>
                  <Select
                    value={config.selectedRoomId}
                    onChange={(value) => setConfig({...config, selectedRoomId: String(value)})}
                    style={{ width: '100%' }}
                    placeholder="请选择要显示的会议室"
                    disabled={allRooms.length === 0}
                    loading={loading}
                  >
                    {allRooms.map((room) => (
                      <Select.Option key={room.id} value={room.id}>
                        {room.name}
                      </Select.Option>
                    ))}
                  </Select>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {allRooms.length === 0 ? '请先加载数据' : `共 ${allRooms.length} 个会议室可选`}
                  </div>
                </div>
              </div>
            )}
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
                      field.type.includes('单选') ||
                      field.type.includes('文本')
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
                  onClick={() => onRefreshData(true)}
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
                        • 预定表: {tables.find(t => t.id === config.bookingTableId)?.name}<br/>
                        • 显示模式: {config.showSingleRoom ? '单一会议室' : '所有会议室'}
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