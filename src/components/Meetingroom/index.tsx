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
  bookingStatusFieldId: string; // 新增：预定状态字段
  bookingStatusValue: string; // 新增：预定状态值
  showDate: boolean;
  showCurrentMeeting: boolean;
  title: string;
  isDefaultMode: boolean;
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
  displayStatus?: 'upcoming' | 'pending' | 'completed'; // 添加显示状态字段
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
    bookingStatusFieldId: '', // 新增：预定状态字段
    bookingStatusValue: '已预订', // 新增：默认预定状态值
    showDate: true,
    showCurrentMeeting: true,
    title: t('meetingRoom.boardTitle', '会议室状态看板'),
    isDefaultMode: true,
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

  // 监听全屏状态变化 - 使用优化的轮询方案
  useEffect(() => {
    const checkFullscreen = () => {
      try {
        const fullscreenState = dashboard.state === DashboardState.FullScreen;
        
        // 只在状态变化时更新，避免不必要的重渲染
        if (fullscreenState !== isFullscreen) {
          setIsFullscreen(fullscreenState);
          console.log('全屏状态变化:', fullscreenState);
        }
      } catch (error) {
        console.error('检查全屏状态失败:', error);
      }
    };

    // 初始检查
    checkFullscreen();

    // 使用轮询方式检测全屏状态变化
    const interval = setInterval(checkFullscreen, 500); // 提高检测频率

    return () => {
      clearInterval(interval);
    };
  }, [isFullscreen]);

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
          bookingStatusFieldId: typeof customConfig.bookingStatusFieldId === 'string' ? customConfig.bookingStatusFieldId : defaultConfig.bookingStatusFieldId,
          bookingStatusValue: typeof customConfig.bookingStatusValue === 'string' ? customConfig.bookingStatusValue : defaultConfig.bookingStatusValue,
          showDate: typeof customConfig.showDate === 'boolean' ? customConfig.showDate : defaultConfig.showDate,
          showCurrentMeeting: typeof customConfig.showCurrentMeeting === 'boolean' ? customConfig.showCurrentMeeting : defaultConfig.showCurrentMeeting,
          title: typeof customConfig.title === 'string' ? customConfig.title : defaultConfig.title,
          isDefaultMode: typeof customConfig.showSingleRoom === 'boolean' ? customConfig.showSingleRoom : true,
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

  // 辅助函数：获取会议状态（使用实时时间）
  const getMeetingStatus = (startTime: Date, endTime: Date): 'ongoing' | 'upcoming' | 'completed' => {
    const now = new Date(); // 使用实时时间而不是缓存的 currentTime
    if (now >= startTime && now <= endTime) {
      return 'ongoing';
    } else if (now < startTime) {
      return 'upcoming';
    } else {
      return 'completed';
    }
  };

  /** 从两个表加载会议室和会议数据 */
  const loadMeetingData = useCallback(async (showToast: boolean = false) => {
    const currentIsConfig = isConfigRef.current;
    const currentConfig = configRef.current;

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
      
      // 只有用户手动刷新或首次加载时才显示 loading
      if (showToast || !dataLoaded) {
        setLoading(true);
      }
      
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
      
      const roomRecordsLength = Array.isArray(roomRecords) ? roomRecords.length : 0;
      console.log(`找到 ${roomRecordsLength} 个会议室记录`);
      
      const rooms: IMeetingRoom[] = [];
      const roomNameMap = new Map<string, IMeetingRoom>();
      
      for (const record of roomRecords) {
        try {
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
      
      const bookingRecordsLength = Array.isArray(bookingRecords) ? bookingRecords.length : 0;
      console.log(`找到 ${bookingRecordsLength} 个预定记录`);
      
      const allMeetings: IMeeting[] = [];
      let matchedCount = 0;
      let statusFilteredCount = 0;
      
      for (const record of bookingRecords) {
        try {
          // 检查预定状态筛选条件
          if (currentConfig.bookingStatusFieldId) {
            const bookingStatusCell = await bookingTable.getCellValue(currentConfig.bookingStatusFieldId, record.id);
            const bookingStatus = extractTextFromCell(bookingStatusCell);
            
            // 如果配置了预定状态筛选，且当前记录的预定状态不等于配置的值，则跳过
            if (bookingStatus !== currentConfig.bookingStatusValue) {
              statusFilteredCount++;
              continue;
            }
          }
          
          const bookingRoomCell = await bookingTable.getCellValue(currentConfig.bookingRoomFieldId, record.id);
          const bookingRoomName = extractTextFromCell(bookingRoomCell);
          
          if (!bookingRoomName) {
            console.log(`预定记录 ${record.id} 没有会议室名称，跳过`);
            continue;
          }
          
          const matchedRoom = roomNameMap.get(bookingRoomName);
          
          if (!matchedRoom) {
            console.log(`预定记录 ${record.id} 的会议室 "${bookingRoomName}" 未匹配到任何会议室`);
            continue;
          }
          
          console.log(`成功匹配会议室: ${bookingRoomName} -> ${matchedRoom.name}`);
          
          const meetingTitleCell = currentConfig.meetingTitleFieldId ? 
            await bookingTable.getCellValue(currentConfig.meetingTitleFieldId, record.id) : null;
          const meetingTitle = extractTextFromCell(meetingTitleCell) || '未命名会议';
          
          const startTimeCell = await bookingTable.getCellValue(currentConfig.startTimeFieldId, record.id);
          const startTime = extractDateTimeFromCell(startTimeCell);
          
          const endTimeCell = await bookingTable.getCellValue(currentConfig.endTimeFieldId, record.id);
          const endTime = extractDateTimeFromCell(endTimeCell);
          
          let organizer = '未知';
          if (currentConfig.organizerFieldId) {
            const organizerCell = await bookingTable.getCellValue(currentConfig.organizerFieldId, record.id);
            organizer = extractTextFromCell(organizerCell) || '未知';
          }
          
          if (startTime && endTime) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (startTime >= today && startTime < tomorrow) {
              // 使用实时时间计算会议状态
              const meeting: IMeeting = {
                id: record.id,
                title: meetingTitle,
                startTime,
                endTime,
                organizer,
                roomName: matchedRoom.name,
                roomId: matchedRoom.roomId,
                status: getMeetingStatus(startTime, endTime) // 移除 currentTime 参数
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
      if (currentConfig.bookingStatusFieldId) {
        console.log(`根据预定状态筛选排除了 ${statusFilteredCount} 条记录`);
      }
      
      // 3. 更新每个会议室的当前会议和状态（使用实时时间）
      const updatedRooms = rooms.map(room => {
        room.todayMeetings.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        
        // 使用实时时间判断当前会议
        const now = new Date();
        const currentMeeting = room.todayMeetings.find(meeting => {
          const status = getMeetingStatus(meeting.startTime, meeting.endTime);
          return status === 'ongoing';
        });
        
        if (currentMeeting) {
          room.currentMeeting = currentMeeting;
          room.status = 'in-use';
        } else {
          // 检查是否有即将开始的会议（15分钟内）
          const soonMeeting = room.todayMeetings.find(meeting => {
            const timeUntilStart = meeting.startTime.getTime() - now.getTime();
            return meeting.status === 'upcoming' && timeUntilStart <= 15 * 60 * 1000; // 15分钟内
          });
          
          room.currentMeeting = undefined;
          room.status = soonMeeting ? 'soon' : 'available';
        }
        
        return room;
      });

      setAllRooms(updatedRooms);
      
      // 4. 单一会议室显示逻辑
      let finalRooms = updatedRooms;

      if (currentConfig.selectedRoomId) {
        console.log('启用单一会议室显示，选择ID:', currentConfig.selectedRoomId);
        
        const selectedRoom = updatedRooms.find(room => 
          room.id === currentConfig.selectedRoomId || room.roomId === currentConfig.selectedRoomId
        );
        
        if (selectedRoom) {
          finalRooms = [selectedRoom];
        } else if (updatedRooms.length > 0) {
          finalRooms = [updatedRooms[0]];
        }
      } else if (updatedRooms.length > 0) {
        finalRooms = [updatedRooms[0]];
      }
      
      setMeetingRooms(finalRooms);
      setDataLoaded(true);
      
      if (showToast) {
        if (updatedRooms.length === 0) {
          Toast.warning(t('meetingRoom.noRoomsData'));
        } else if (allMeetings.length === 0) {
          let message = '找到会议室但今日暂无预定';
          if (currentConfig.bookingStatusFieldId) {
            message += ` (已筛选预定状态为"${currentConfig.bookingStatusValue}")`;
          }
          Toast.info(message);
        } else {
          let message = `加载成功: ${finalRooms.length}个会议室, ${allMeetings.length}个预定`;
          if (currentConfig.bookingStatusFieldId) {
            message += ` (预定状态: ${currentConfig.bookingStatusValue})`;
          }
          Toast.success(message);
        }
      } else {
        if (updatedRooms.length === 0) {
          Toast.warning(t('meetingRoom.noRoomsData'));
        }
      }
    } catch (error) {
      console.error('加载会议数据失败:', error);
      if (showToast) {
        Toast.error(t('meetingRoom.loadDataFailed'));
      }
    } finally {
      // 只有用户手动刷新或首次加载时才隐藏 loading
      if (showToast || !dataLoaded) {
        setLoading(false);
      }
    }
  }, [t, dataLoaded]); // 添加 dataLoaded 依赖

  // 辅助函数：从单元格提取文本
  const extractTextFromCell = (cellValue: any): string => {
    if (!cellValue) return '';
    
    if (typeof cellValue === 'string') {
      return cellValue.trim();
    }
    
    if (cellValue && typeof cellValue === 'object') {
      if (cellValue.text) {
        return String(cellValue.text).trim();
      }
      
      if (cellValue.name) {
        return String(cellValue.name).trim();
      }
      
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
    console.log('主要数据加载 useEffect 触发', { isConfig });
    
    if (isConfig) {
      console.log('配置模式下跳过数据加载');
      return;
    }

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

    console.log('触发数据加载');
    loadMeetingData(false);
  }, [
    isConfig,
    config.roomTableId,
    config.bookingTableId,
    config.roomNameFieldId,
    config.bookingRoomFieldId,
    config.startTimeFieldId,
    config.endTimeFieldId,
    config.bookingStatusFieldId, // 新增依赖
    config.bookingStatusValue, // 新增依赖
    loadMeetingData
  ]);

  // 定期刷新数据 - 只在非配置模式下运行（缩短间隔到10秒）
  useEffect(() => {
    console.log('定时刷新 useEffect 触发', { isConfig });
    
    if (isConfig) {
      console.log('配置模式下不启动定时刷新');
      return;
    }

    const hasRequiredConfig = 
      config.roomTableId && 
      config.bookingTableId && 
      config.roomNameFieldId && 
      config.bookingRoomFieldId && 
      config.startTimeFieldId && 
      config.endTimeFieldId;
    
    if (!hasRequiredConfig) {
      console.log('配置不完整，不启动定时刷新');
      return;
    }
    
    console.log('启动数据定时刷新，间隔10秒');
    
    const interval = window.setInterval(() => {
      console.log('定时刷新会议数据...', new Date().toISOString());
      loadMeetingData(false); // 不显示 toast，不设置 loading 状态
    }, 10000); // 从30秒改为10秒
    
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
    config.bookingStatusFieldId, // 新增依赖
    config.bookingStatusValue, // 新增依赖
    loadMeetingData
  ]);

  return (
    <main 
      style={{
        backgroundColor: props.bgColor,
        paddingRight: isConfig ? '400px' : '0',
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

// MeetingRoomView 组件
function MeetingRoomView({ config, meetingRooms, currentTime, isConfig, isFullscreen, loading, t }: IMeetingRoomView) {
  const { showDate, showCurrentMeeting } = config;
  
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

  // 处理右侧会议列表数据：只显示已结束和未开始的会议，进行中的不显示
  // 并区分"即将开始"和"待开始"状态
  const filteredMeetings = meetingRooms.flatMap(room => {
    const nonOngoingMeetings = room.todayMeetings.filter(meeting => meeting.status !== 'ongoing');
    
    // 找到每个会议室时间最近的未开始会议
    const upcomingMeetings = nonOngoingMeetings.filter(meeting => meeting.status === 'upcoming');
    const nearestUpcomingMeeting = upcomingMeetings.length > 0 
      ? upcomingMeetings.reduce((nearest, current) => 
          current.startTime.getTime() < nearest.startTime.getTime() ? current : nearest
        )
      : null;

    return nonOngoingMeetings.map(meeting => {
      let displayStatus: 'upcoming' | 'pending' | 'completed' = meeting.status as any;
      
      if (meeting.status === 'upcoming') {
        // 检查是否是时间最近的会议且在开始前30分钟内
        const timeUntilStart = meeting.startTime.getTime() - currentTime.getTime();
        const isNearestMeeting = meeting.id === nearestUpcomingMeeting?.id;
        const isWithin30Minutes = timeUntilStart <= 30 * 60 * 1000;
        
        // 只有时间最近的会议且在开始前30分钟内才显示为"即将开始"
        displayStatus = isNearestMeeting && isWithin30Minutes ? 'upcoming' : 'pending';
      }
      
      return {
        ...meeting,
        roomName: room.name,
        displayStatus
      };
    });
  }).sort((a, b) => {
    // 排序：已完成的在最后，未完成的按时间排序
    if (a.displayStatus === 'completed' && b.displayStatus !== 'completed') return 1;
    if (a.displayStatus !== 'completed' && b.displayStatus === 'completed') return -1;
    return a.startTime.getTime() - b.startTime.getTime();
  });

  // 获取当前显示的会议室名称（用于标题）
  const currentRoomName = meetingRooms.length > 0 ? meetingRooms[0].name : '会议室';

  return (
    <div className={classnames("meeting-room-board", {
      "default-mode": config.isDefaultMode,
      "fullscreen-mode": isFullscreen
    })}>
      {/* 标题区域 - 显示会议室名称 */}
      <div className="board-header">
        <h1 className="board-title">{currentRoomName}</h1>
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
            <div className="rooms-grid">
              {meetingRooms.map(room => (
                <div 
                  key={room.id} 
                  className={classnames('room-card', {
                    'available': room.status === 'available' || room.status === 'soon',
                    'in-use': room.status === 'in-use'
                  })}
                >
                  <div className="status-title">当前会议室状态</div>
                  
                  {/* 统一的大号状态显示 - 靠左对齐 */}
                  <div className="room-status-display">
                    <div className="status-text">
                      {(room.status === 'available' || room.status === 'soon') && '🟢 空闲'}
                      {room.status === 'in-use' && '🔴 进行中'}
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
                </div>
              ))}
            </div>
          </div>

          {/* 右侧：今日会议列表 */}
          <div className="meetings-list">
            <h2 className="section-title">{t('meetingRoom.todaySchedule')}</h2>
            <div className="meetings-timeline">
              {filteredMeetings.length > 0 ? (
                filteredMeetings.map((meeting, index) => (
                  <div 
                    key={`${meeting.id}-${index}`} 
                    className={classnames('meeting-item', {
                      'upcoming': meeting.displayStatus === 'upcoming',
                      'pending': meeting.displayStatus === 'pending',
                      'completed': meeting.displayStatus === 'completed'
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
                      {meeting.displayStatus === 'upcoming' && t('meetingRoom.upcoming')}
                      {meeting.displayStatus === 'pending' && t('meetingRoom.pending')}
                      {meeting.displayStatus === 'completed' && t('meetingRoom.completed')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-meetings-message">
                  今日暂无其他会议安排
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ConfigPanel 组件 - 添加预定状态筛选配置
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
        bookingStatusFieldId: config.bookingStatusFieldId || '', // 新增
        bookingStatusValue: config.bookingStatusValue || '已预定', // 新增
        showDate: config.showDate !== undefined ? config.showDate : true,
        showCurrentMeeting: config.showCurrentMeeting !== undefined ? config.showCurrentMeeting : true,
        title: config.title || t('meetingRoom.boardTitle', '会议室状态看板'),
        isDefaultMode: true,
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
      bookingStatusFieldId: '', // 重置预定状态字段
      bookingStatusValue: '已预定', // 重置预定状态值
    });
  };

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
              <label className='config-label'>显示日期时间</label>
              <div className='config-content'>
                <input
                  type="checkbox"
                  checked={config.showDate}
                  onChange={(e) => setConfig({...config, showDate: e.target.checked})}
                />
              </div>
            </div>

            <div className='config-item'>
              <label className='config-label'>显示当前会议</label>
              <div className='config-content'>
                <input
                  type="checkbox"
                  checked={config.showCurrentMeeting}
                  onChange={(e) => setConfig({...config, showCurrentMeeting: e.target.checked})}
                />
              </div>
            </div>
          </div>

          {/* 会议室选择 */}
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
              会议室选择
            </h4>
            
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
              会议室表配置
            </h4>
            
            <div className='config-item'>
              <label className='config-label'>选择会议室表</label>
              <div className='config-content'>
                <Select
                  value={config.roomTableId}
                  onChange={handleRoomTableChange}
                  style={{ width: '100%' }}
                  placeholder="请选择会议室表"
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
              <label className='config-label'>会议室名称字段</label>
              <div className='config-content'>
                <Select
                  value={config.roomNameFieldId}
                  onChange={(value) => setConfig({...config, roomNameFieldId: String(value)})}
                  style={{ width: '100%' }}
                  placeholder="请选择会议室名称字段"
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
              预定表配置
            </h4>

            <div className='config-item'>
              <label className='config-label'>选择预定表</label>
              <div className='config-content'>
                <Select
                  value={config.bookingTableId}
                  onChange={handleBookingTableChange}
                  style={{ width: '100%' }}
                  placeholder="请选择会议预定表"
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
              <label className='config-label'>关联会议室字段</label>
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
              <label className='config-label'>会议标题字段</label>
              <div className='config-content'>
                <Select
                  value={config.meetingTitleFieldId}
                  onChange={(value) => setConfig({...config, meetingTitleFieldId: String(value)})}
                  style={{ width: '100%' }}
                  placeholder="请选择会议标题字段"
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
              <label className='config-label'>开始时间字段</label>
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
              <label className='config-label'>结束时间字段</label>
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
              <label className='config-label'>组织者字段</label>
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
                    .filter(field => field.type.includes('文本') || field.type.includes('人员') || field.type.includes('创建人') )
                    .map((field) => (
                    <Select.Option key={field.id} value={field.id}>
                      {field.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>

            {/* 新增：预定状态筛选配置 */}
            <div className='config-item'>
              <label className='config-label'>预定状态字段</label>
              <div className='config-content'>
                <Select
                  value={config.bookingStatusFieldId}
                  onChange={(value) => setConfig({...config, bookingStatusFieldId: String(value)})}
                  style={{ width: '100%' }}
                  placeholder="请选择预定状态字段（可选）"
                  disabled={!config.bookingTableId}
                  loading={loading}
                >
                  <Select.Option value="">不选择</Select.Option>
                  {bookingFields
                    .filter(field => field.type.includes('单选'))
                    .map((field) => (
                    <Select.Option key={field.id} value={field.id}>
                      {field.name}
                    </Select.Option>
                  ))}
                </Select>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  可选：用于筛选特定状态的预定记录
                </div>
              </div>
            </div>

            {config.bookingStatusFieldId && (
              <div className='config-item'>
                <label className='config-label'>预定状态值</label>
                <div className='config-content'>
                  <input
                    type="text"
                    value={config.bookingStatusValue}
                    onChange={(e) => setConfig({...config, bookingStatusValue: e.target.value})}
                    placeholder="请输入要筛选的预定状态值"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    例如：已预定、已确认、有效等
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 数据预览 */}
          <div className='config-subsection'>
            <h4 style={{ 
              margin: '24px 0 12px 0', 
              color: '#333', 
              fontSize: '14px', 
              fontWeight: '600' 
            }}>
              数据预览
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
                  刷新数据
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
                        • 当前会议室: {allRooms.find(r => r.id === config.selectedRoomId)?.name || '未选择'}<br/>
                        {config.bookingStatusFieldId && (
                          <>
                            • 预定状态筛选: {config.bookingStatusValue}<br/>
                          </>
                        )}
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
        保存配置
      </Button>
    </div>
  );
}