import './style.scss';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button, Typography, Toast, Modal, Space } from '@douyinfe/semi-ui';
import { IconArrowLeft } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { baseApi, meetingRoomApi } from '../../api/client';
import { useAppStore } from '../../store';

const { Title } = Typography;

/** 会议信息接口 */
interface IMeeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  organizer: string;
  roomName: string;
  roomId: string;
  status: 'ongoing' | 'upcoming' | 'completed';
}

/** 附件文件接口 */
interface IAttachmentFile {
  token: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

/** 会议室信息接口 */
interface IMeetingRoom {
  id: string;
  name: string;
  roomId: string;
  currentMeeting?: IMeeting;
  todayMeetings: IMeeting[];
  status: 'available' | 'in-use';
  attachments?: IAttachmentFile[];
  hasUpcomingMeetingSoon?: boolean;
}

/** 组件属性接口 */
interface ISingleMeetingRoomViewProps {
  room: IMeetingRoom;
  onBack: () => void;
  showDate?: boolean;
  showCurrentMeeting?: boolean;
  enableVideoPlayer?: boolean;
  videoMuted?: boolean;
}

// 时间轴每小时间隔的像素高度
const HOUR_HEIGHT = 60;
// 时间轴开始时间（小时）
const START_HOUR = 8;
// 时间轴结束时间（小时）
const END_HOUR = 20;

/**
 * 单一会议室视图组件 - 电子门牌风格
 * 全屏状态展示，高对比度，远距离可读
 */
export default function SingleMeetingRoomView({
  room: initialRoom,
  onBack,
  showDate = true,
  showCurrentMeeting = true,
  enableVideoPlayer = true,
  videoMuted = true,
}: ISingleMeetingRoomViewProps) {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const videoRef = useRef<HTMLVideoElement>(null);
  const config = useAppStore((state) => state.config);
  
  // 会议室数据状态
  const [room, setRoom] = useState<IMeetingRoom>(initialRoom);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // 结束会议相关状态
  const [showEndMeetingModal, setShowEndMeetingModal] = useState(false);
  const [endingMeeting, setEndingMeeting] = useState(false);

  // 界面锁定相关状态
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockInputPassword, setLockInputPassword] = useState('');
  const isLockEnabled = useAppStore((state) => state.isLockEnabled);
  const lockPassword = useAppStore((state) => state.lockPassword);

  // 快速预定相关状态
  const [showQuickBookModal, setShowQuickBookModal] = useState(false);
  const [quickBooking, setQuickBooking] = useState(false);
  const [quickBookDuration, setQuickBookDuration] = useState(30); // 默认30分钟
  const [quickBookTitle, setQuickBookTitle] = useState('快速会议');
  const [editingTitle, setEditingTitle] = useState(false);

  // 视频播放相关状态
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoLoadFailed, setVideoLoadFailed] = useState(false);

  // 过滤出视频文件 - 使用 useMemo 避免不必要的重新计算
  const videoFiles = useMemo(() => {
    return room.attachments?.filter(file => {
      if (!file || !file.type) return false;
      return file.type.startsWith('video/');
    }) || [];
  }, [room.attachments]);

  // 判断是否需要显示视频（空闲且没有即将开始的会议）
  const shouldShowVideo = enableVideoPlayer && 
    room.status === 'available' && 
    !room.hasUpcomingMeetingSoon &&
    videoFiles.length > 0 &&
    !videoLoadFailed;

  // 重新获取附件 URL
  const refreshAttachments = useCallback(async () => {
    if (!config.mediaAttachmentsFieldId || !room.id) {
      return;
    }

    setLoadingAttachments(true);
    try {
      const attachments = await baseApi.getAttachmentUrls(
        config.roomTableId,
        room.id,
        config.mediaAttachmentsFieldId
      );

      // 只在附件真正变化时才更新，避免不必要的重新渲染
      setRoom(prev => {
        // 检查附件是否有变化（比较 token 和 url）
        const currentTokens = prev.attachments?.map(a => a.token).sort().join(',');
        const newTokens = attachments.map(a => a.token).sort().join(',');
        
        if (currentTokens === newTokens) {
          // 附件没有变化，保持原有引用
          return prev;
        }
        
        return {
          ...prev,
          attachments
        };
      });
    } catch (error) {
      // 静默处理
    } finally {
      setLoadingAttachments(false);
    }
  }, [config.mediaAttachmentsFieldId, config.roomTableId, room.id]);

  // 组件挂载时刷新附件
  useEffect(() => {
    if (room.id && config.mediaAttachmentsFieldId) {
      refreshAttachments();
    }
  }, [room.id, config.mediaAttachmentsFieldId, refreshAttachments]);

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 定时刷新会议室数据（每30秒）
  useEffect(() => {
    const refreshRoomData = async () => {
      if (!room.id) return;
      try {
        const data = await meetingRoomApi.getMeetingRoomData(room.id);
        if (data.room) {
          // 将后端返回的 soon 状态转换为 available
          const normalizedRoom = {
            ...data.room,
            status: data.room.status === 'soon' ? 'available' : data.room.status as 'available' | 'in-use',
            // 保留现有的附件，避免视频重新加载
            attachments: room.attachments || data.room.attachments,
          };
          setRoom(normalizedRoom);
        }
      } catch (error) {
        // 静默处理，避免频繁报错
        console.error('刷新会议室数据失败:', error);
      }
    };

    // 立即执行一次
    refreshRoomData();

    // 每30秒刷新一次
    const timer = setInterval(refreshRoomData, 30000);
    return () => clearInterval(timer);
  }, [room.id, room.attachments]);

  // 格式化时间
  const formatTime = useCallback((time: string) => {
    return dayjs(time).format('HH:mm');
  }, []);

  // 格式化日期
  const formatDate = useCallback((date: Date) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    return `${dayjs(date).format('MM月DD日')} ${weekday}`;
  }, []);

  // 格式化会议时间范围
  const formatMeetingTimeRange = useCallback((startTime: string, endTime: string) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  }, [formatTime]);

  // 计算已进行时间
  const getElapsedTime = useCallback((startTime: string) => {
    const start = dayjs(startTime);
    const now = dayjs();
    const diffMinutes = now.diff(start, 'minute');
    
    if (diffMinutes < 60) {
      return `${diffMinutes}分钟`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
    }
  }, []);

  // 计算剩余时间
  const getTimeRemaining = useCallback((endTime: string) => {
    const end = dayjs(endTime);
    const now = dayjs();
    const diffMinutes = end.diff(now, 'minute');
    
    if (diffMinutes <= 0) {
      return '即将结束';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
    }
  }, []);

  // 计算空闲时长
  const getAvailableDuration = useCallback(() => {
    const now = dayjs();
    const upcomingMeetings = room.todayMeetings
      .filter(m => m.status === 'upcoming')
      .sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());
    
    if (upcomingMeetings.length === 0) {
      return '全天';
    }
    
    const nextMeeting = upcomingMeetings[0];
    const diffMinutes = dayjs(nextMeeting.startTime).diff(now, 'minute');
    
    if (diffMinutes < 60) {
      return `${diffMinutes}分钟`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
    }
  }, [room.todayMeetings]);

  // 计算距下次会议开始时间
  const getTimeUntilNextMeeting = useCallback(() => {
    const now = dayjs();
    const upcomingMeetings = room.todayMeetings
      .filter(m => m.status === 'upcoming')
      .sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());
    
    if (upcomingMeetings.length === 0) {
      return null;
    }
    
    const nextMeeting = upcomingMeetings[0];
    const diffMinutes = dayjs(nextMeeting.startTime).diff(now, 'minute');
    
    if (diffMinutes < 60) {
      return `${diffMinutes}分钟`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
    }
  }, [room.todayMeetings]);

  // 视频播放结束处理
  const handleVideoEnded = useCallback(() => {
    if (videoFiles.length > 1) {
      setCurrentVideoIndex((prev) => (prev + 1) % videoFiles.length);
    } else {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [videoFiles.length]);

  // 视频错误处理
  const handleVideoError = useCallback((e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    if (videoFiles.length > 1 && currentVideoIndex < videoFiles.length - 1) {
      setCurrentVideoIndex((prev) => prev + 1);
    } else {
      setVideoLoadFailed(true);
    }
  }, [videoFiles.length, currentVideoIndex]);

  // 结束会议处理
  const handleEndMeeting = useCallback(async () => {
    if (!room.currentMeeting) {
      Toast.error('当前没有进行中的会议');
      return;
    }

    setEndingMeeting(true);
    try {
      await meetingRoomApi.endMeeting({
        bookingTableId: config.bookingTableId,
        recordId: room.currentMeeting.id,
        endTimeFieldId: config.endTimeFieldId,
        usageStatusFieldId: config.usageStatusFieldId,
        endTimeFieldName: config.endTimeFieldName,
        usageStatusFieldName: config.usageStatusFieldName,
      });

      Toast.success('会议已结束');
      setShowEndMeetingModal(false);
      
      // 立即更新本地状态，让界面立即响应
      const now = new Date().toISOString();
      setRoom(prev => ({
        ...prev,
        status: 'available',
        currentMeeting: undefined,
        todayMeetings: prev.todayMeetings.map(m => 
          m.id === room.currentMeeting?.id 
            ? { ...m, status: 'completed', endTime: now }
            : m
        ),
      }));
      
      // 然后从服务器获取最新数据
      const data = await meetingRoomApi.getMeetingRoomData(room.id);
      if (data.room) {
        // 将后端返回的 soon 状态转换为 available
        const normalizedRoom = {
          ...data.room,
          status: data.room.status === 'soon' ? 'available' : data.room.status as 'available' | 'in-use',
        };
        setRoom(normalizedRoom);
      }
    } catch (error: any) {
      console.error('结束会议失败:', error);
      Toast.error(error.message || '结束会议失败');
    } finally {
      setEndingMeeting(false);
    }
  }, [room.currentMeeting, room.id, config.bookingTableId, config.endTimeFieldId, config.usageStatusFieldId, config.endTimeFieldName, config.usageStatusFieldName]);

  // 快速预定处理
  const handleQuickBook = useCallback(async () => {
    if (!config.quickBookOrganizerId) {
      Toast.error('请先配置默认快速预定人');
      return;
    }

    setQuickBooking(true);
    try {
      const now = Date.now();
      const endTime = now + quickBookDuration * 60 * 1000;

      await meetingRoomApi.quickBook({
        bookingTableId: config.bookingTableId,
        roomId: room.roomId,
        roomName: room.name,
        title: quickBookTitle,
        organizerId: config.quickBookOrganizerId,
        organizerName: config.quickBookOrganizerName || config.quickBookOrganizerId,
        participantsFieldId: config.participantsFieldId,
        startTime: now,
        endTime,
        meetingTitleFieldId: config.meetingTitleFieldId,
        bookingRoomFieldId: config.bookingRoomFieldId,
        organizerFieldId: config.organizerFieldId,
        startTimeFieldId: config.startTimeFieldId,
        endTimeFieldId: config.endTimeFieldId,
        // 字段名称（用于创建记录）
        meetingTitleFieldName: config.meetingTitleFieldName,
        bookingRoomFieldName: config.bookingRoomFieldName,
        organizerFieldName: config.organizerFieldName,
        participantsFieldName: config.participantsFieldName,
        startTimeFieldName: config.startTimeFieldName,
        endTimeFieldName: config.endTimeFieldName,
      });

      Toast.success('预定成功');
      setShowQuickBookModal(false);
      
      // 刷新会议室数据
      const data = await meetingRoomApi.getMeetingRoomData(room.id);
      if (data.room) {
        const normalizedRoom = {
          ...data.room,
          status: data.room.status === 'soon' ? 'available' : data.room.status as 'available' | 'in-use',
        };
        setRoom(normalizedRoom);
      }
    } catch (error: any) {
      console.error('快速预定失败:', error);
      if (error.message?.includes('冲突')) {
        Toast.error('该时间段与现有会议冲突');
      } else {
        Toast.error(error.message || '快速预定失败');
      }
    } finally {
      setQuickBooking(false);
    }
  }, [room.roomId, room.name, quickBookDuration, quickBookTitle, config, room.id]);

  // 获取状态文本
  const getStatusText = () => {
    switch (room.status) {
      case 'available':
        return { zh: '空闲', en: 'Available' };
      case 'in-use':
        return { zh: '使用中', en: 'In Use' };
      default:
        return { zh: '空闲', en: 'Available' };
    }
  };

  // 获取状态描述
  const getStatusDescription = () => {
    switch (room.status) {
      case 'available':
        return `可预订 ${getAvailableDuration()}`;
      case 'in-use':
        return room.currentMeeting ? `剩余 ${getTimeRemaining(room.currentMeeting.endTime)}` : '会议进行中';
      default:
        return '';
    }
  };

  const statusText = getStatusText();
  const statusDescription = getStatusDescription();

  // 生成时间刻度
  const timeSlots = useMemo(() => {
    const slots = [];
    const currentHour = currentTime.getHours();
    
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
      slots.push({
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
        isCurrent: hour === currentHour,
      });
    }
    return slots;
  }, [currentTime]);

  // 计算当前时间线位置
  const currentTimeLinePosition = useMemo(() => {
    const now = dayjs();
    const currentHour = now.hour();
    const currentMinute = now.minute();
    
    if (currentHour < START_HOUR || currentHour > END_HOUR) {
      return null;
    }
    
    const hourOffset = (currentHour - START_HOUR) * HOUR_HEIGHT;
    const minuteOffset = (currentMinute / 60) * HOUR_HEIGHT;
    return hourOffset + minuteOffset;
  }, [currentTime]);

  // 计算会议卡片位置和高度
  const getMeetingCardStyle = (meeting: IMeeting) => {
    const start = dayjs(meeting.startTime);
    const end = dayjs(meeting.endTime);
    
    const startHour = start.hour() + start.minute() / 60;
    const endHour = end.hour() + end.minute() / 60;
    
    const top = (startHour - START_HOUR) * HOUR_HEIGHT;
    const height = (endHour - startHour) * HOUR_HEIGHT;
    
    return {
      top: `${top}px`,
      height: `${Math.max(height - 4, 40)}px`, // 最小高度40px，留出间隙
    };
  };

  return (
    <div className={classnames('single-meeting-room-view', {
      'status-available': room.status === 'available',
      'status-in-use': room.status === 'in-use',
    })}>
      {/* 头部 */}
      <div className="view-header">
        <button
          className="back-btn"
          onClick={() => {
            if (isLockEnabled) {
              setShowLockModal(true);
              setLockInputPassword('');
            } else {
              onBack();
            }
          }}
          aria-label="返回"
        >
          <IconArrowLeft />
        </button>
        {showDate && (
          <div className="current-date-time">
            <span className="current-date">{formatDate(currentTime)}</span>
            <span className="current-time">{dayjs(currentTime).format('HH:mm')}</span>
          </div>
        )}
      </div>

      {/* 主体内容 */}
      <div className="view-content">
        {/* 左侧：主要状态区域 */}
        <div className="room-status-section">
          {/* 会议室名称 */}
          <div className="room-title-section">
            <div className="room-name">{room.name}</div>
            {/* 播放视频时显示会议情况 */}
            {shouldShowVideo && (
              <div className="room-meeting-info">
                {(() => {
                  const timeUntil = getTimeUntilNextMeeting();
                  if (timeUntil) {
                    return `距下次会议开始还有${timeUntil}`;
                  } else {
                    return '今日暂无会议安排';
                  }
                })()}
              </div>
            )}
          </div>

          {/* 状态卡片 */}
          <div className="status-card">
            {shouldShowVideo ? (
              // 视频模式
              <div className="video-mode">
                <video
                  key={videoFiles[currentVideoIndex]?.token || 'video'}
                  ref={videoRef}
                  src={videoFiles[currentVideoIndex]?.url}
                  muted={videoMuted}
                  autoPlay
                  playsInline
                  crossOrigin="anonymous"
                  onEnded={handleVideoEnded}
                  onError={handleVideoError}
                />
              </div>
            ) : (
              // 状态显示模式
              <>
                {/* 状态显示 */}
                <div className="status-display">
                  <div className="status-text">{statusText.zh}</div>
                  <div className="status-text-en">/ {statusText.en}</div>
                </div>

                {/* 状态描述 */}
                <div className="status-description">{statusDescription}</div>

                {/* 当前会议信息 */}
                {showCurrentMeeting && room.currentMeeting && (
                  <div className="current-meeting-info">
                    <div className="meeting-title">{room.currentMeeting.title}</div>
                    
                    <div className="meeting-meta">
                      <div className="meeting-time">
                        {formatMeetingTimeRange(room.currentMeeting.startTime, room.currentMeeting.endTime)}
                      </div>
                      <div className="meeting-organizer">
                        {room.currentMeeting.organizer}
                      </div>
                    </div>

                    {room.status === 'in-use' && (
                      <div className="meeting-progress">
                        <div className="progress-item">
                          <span className="progress-label">已进行</span>
                          <span className="progress-value">{getElapsedTime(room.currentMeeting.startTime)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 右侧：日历式时间轴 */}
        <div className="meetings-list-section">
          <div className="calendar-timeline">
            {/* 标题 */}
            <div className="timeline-header">
              <span className="timeline-title">今日会议</span>
            </div>
            
            {/* 时间轴主体 */}
            <div className="timeline-body">
              {/* 左侧时间刻度 */}
              <div className="time-scale">
                {timeSlots.map((slot) => (
                  <div 
                    key={slot.hour}
                    className={classnames('time-slot', { 'current': slot.isCurrent })}
                  >
                    {slot.label}
                  </div>
                ))}
              </div>

              {/* 右侧会议区域 */}
              <div className="meetings-area" style={{ height: `${(END_HOUR - START_HOUR + 1) * HOUR_HEIGHT}px` }}>
                {/* 时间网格线 */}
                <div className="time-grid">
                  {timeSlots.map((slot, index) => (
                    <div 
                      key={slot.hour}
                      className="grid-line"
                      style={{ top: `${index * HOUR_HEIGHT}px` }}
                    />
                  ))}
                </div>

                {/* 当前时间线 */}
                {currentTimeLinePosition !== null && (
                  <div 
                    className="current-time-line"
                    style={{ top: `${currentTimeLinePosition}px` }}
                  />
                )}

                {/* 会议卡片 */}
                {room.todayMeetings.length > 0 ? (
                  room.todayMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className={classnames('meeting-card', {
                        'current': meeting.status === 'ongoing',
                        'upcoming': meeting.status === 'upcoming',
                        'completed': meeting.status === 'completed'
                      })}
                      style={getMeetingCardStyle(meeting)}
                    >
                      <div className="meeting-title">{meeting.title}</div>
                      <div className="meeting-organizer">{meeting.organizer}</div>
                      <div className="meeting-time">
                        {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                      </div>
                    </div>
                  ))
                ) : null}
              </div>
            </div>

            {/* 快速预定按钮 - 仅在空闲时显示 */}
            {room.status === 'available' && config.quickBookOrganizerId && (
              <div className="quick-book-section">
                <button
                  className="quick-book-btn"
                  onClick={() => {
                    setShowQuickBookModal(true);
                    setQuickBookTitle('快速会议');
                    setQuickBookDuration(30);
                    setEditingTitle(false);
                  }}
                >
                  <span className="quick-book-icon">+</span>
                  <span className="quick-book-text">快速预定</span>
                </button>
              </div>
            )}

            {/* 结束会议按钮 - 仅在使用中时显示 */}
            {room.status === 'in-use' && (
              <div className="quick-book-section">
                <button
                  className="quick-book-btn end-meeting"
                  onClick={() => setShowEndMeetingModal(true)}
                >
                  <span className="quick-book-icon">−</span>
                  <span className="quick-book-text">结束会议</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 结束会议确认弹窗 */}
      <Modal
        title="结束会议"
        visible={showEndMeetingModal}
        onCancel={() => setShowEndMeetingModal(false)}
        footer={
          <Space>
            <Button type="tertiary" onClick={() => setShowEndMeetingModal(false)}>
              取消
            </Button>
            <Button
              type="danger"
              theme="solid"
              loading={endingMeeting}
              onClick={handleEndMeeting}
            >
              确认结束
            </Button>
          </Space>
        }
      >
        <div style={{ padding: '20px 0' }}>
          <p>确定要提前结束当前会议吗？</p>
          {room.currentMeeting && (
            <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f3f4f6', borderRadius: 8 }}>
              <p><strong>会议：</strong>{room.currentMeeting.title}</p>
              <p><strong>组织者：</strong>{room.currentMeeting.organizer}</p>
              <p><strong>当前时间：</strong>{dayjs().format('HH:mm')}</p>
            </div>
          )}
          <p style={{ marginTop: 16, color: '#6b7280', fontSize: 14 }}>
            结束后，会议结束时间将更新为当前时间。
          </p>
        </div>
      </Modal>

      {/* 锁定密码验证弹窗 */}
      <Modal
        title="请输入解锁密码"
        visible={showLockModal}
        onCancel={() => {
          setShowLockModal(false);
          setLockInputPassword('');
        }}
        footer={
          <Space>
            <Button
              type="tertiary"
              onClick={() => {
                setShowLockModal(false);
                setLockInputPassword('');
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              theme="solid"
              onClick={() => {
                if (lockInputPassword === lockPassword) {
                  setShowLockModal(false);
                  setLockInputPassword('');
                  onBack();
                } else {
                  Toast.error('密码错误');
                  setLockInputPassword('');
                }
              }}
            >
              确认
            </Button>
          </Space>
        }
      >
        <div style={{ padding: '20px 0' }}>
          <p>界面已锁定，请输入密码返回主界面</p>
          <input
            type="password"
            value={lockInputPassword}
            onChange={(e) => setLockInputPassword(e.target.value)}
            placeholder="请输入密码"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '16px',
              border: '1px solid var(--semi-color-border)',
              borderRadius: '8px',
              marginTop: '16px',
              boxSizing: 'border-box',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (lockInputPassword === lockPassword) {
                  setShowLockModal(false);
                  setLockInputPassword('');
                  onBack();
                } else {
                  Toast.error('密码错误');
                  setLockInputPassword('');
                }
              }
            }}
          />
        </div>
      </Modal>

      {/* 快速预定弹窗 */}
      <Modal
        title="快速预定"
        visible={showQuickBookModal}
        onCancel={() => setShowQuickBookModal(false)}
        footer={
          <Space>
            <Button type="tertiary" onClick={() => setShowQuickBookModal(false)}>
              取消
            </Button>
            <Button
              type="primary"
              theme="solid"
              loading={quickBooking}
              onClick={handleQuickBook}
            >
              确定
            </Button>
          </Space>
        }
      >
        <div style={{ padding: '20px 0' }}>
          {/* 可预定时间 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>可预定时间</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#10b981' }}>
              {(() => {
                const timeUntil = getTimeUntilNextMeeting();
                if (timeUntil) {
                  return `距下次会议开始还有${timeUntil}`;
                } else {
                  return '均可预定';
                }
              })()}
            </div>
          </div>

          {/* 会议时长 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>会议时长</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { value: 30, label: '30分钟' },
                { value: 60, label: '1小时' },
                { value: 90, label: '1.5小时' },
                { value: 120, label: '2小时' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setQuickBookDuration(option.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: quickBookDuration === option.value ? 'var(--semi-color-primary)' : '#e5e7eb',
                    backgroundColor: quickBookDuration === option.value ? 'var(--semi-color-primary)' : '#ffffff',
                    color: quickBookDuration === option.value ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 会议名称 */}
          <div>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>会议名称</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {editingTitle ? (
                <input
                  type="text"
                  value={quickBookTitle}
                  onChange={(e) => setQuickBookTitle(e.target.value)}
                  onBlur={() => {
                    if (!quickBookTitle.trim()) {
                      setQuickBookTitle('快速会议');
                    }
                    setEditingTitle(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (!quickBookTitle.trim()) {
                        setQuickBookTitle('快速会议');
                      }
                      setEditingTitle(false);
                    }
                  }}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    fontSize: 14,
                    border: '1px solid var(--semi-color-primary)',
                    borderRadius: 6,
                    outline: 'none',
                  }}
                />
              ) : (
                <div
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    fontSize: 14,
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    backgroundColor: '#f9fafb',
                    color: '#374151',
                  }}
                >
                  {quickBookTitle}
                </div>
              )}
              <button
                onClick={() => setEditingTitle(!editingTitle)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#6b7280',
                }}
                title="编辑会议名称"
              >
                ✎
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
