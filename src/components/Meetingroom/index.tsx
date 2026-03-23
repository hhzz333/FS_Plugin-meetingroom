import './style.scss';
import { Button, Toast, Spin, Typography, Tag, Space } from '@douyinfe/semi-ui';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/index.js';
import { meetingRoomApi } from '../../api/client.js';
import { useCurrentTime } from '../../hooks';
import SingleMeetingRoomView from '../SingleMeetingRoomView/index.js';
import TableConfig from '../TableConfig/index.js';
import AuthConfig from '../AuthConfig/index.js';
import LockSettings from '../LockSettings/index.js';
import dayjs from 'dayjs';
import classnames from 'classnames';

const { Title, Text } = Typography;

/** 附件文件接口 */
interface IAttachmentFile {
  token: string;
  name: string;
  type: string;
  size: number;
  mimeType: string;
  url?: string;
}

/** 会议信息接口 */
interface IMeeting {
  id: string;
  title: string;
  startTime: string; // ISO 格式
  endTime: string;   // ISO 格式
  organizer: string;
  roomName: string;
  roomId: string;
  status: 'ongoing' | 'upcoming' | 'completed';
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

/** 会议室看板主组件 */
export default function MeetingRoomBoard(props: { bgColor: string }) {
  const { t } = useTranslation();
  const currentTime = useCurrentTime();

  // 从全局状态获取配置
  const config = useAppStore((state) => state.config);
  const auth = useAppStore((state) => state.auth);

  // 本地状态
  const [meetingRooms, setMeetingRooms] = useState<IMeetingRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<IMeetingRoom | null>(null);

  // 视频相关状态
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * 获取会议状态（使用实时时间）
   */
  const getMeetingStatus = useCallback((startTime: string, endTime: string): 'ongoing' | 'upcoming' | 'completed' => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now >= start && now <= end) {
      return 'ongoing';
    } else if (now < start) {
      return 'upcoming';
    } else {
      return 'completed';
    }
  }, []);

  /**
   * 加载会议室数据
   */
  const loadMeetingData = useCallback(async (showToast: boolean = false) => {
    if (!auth) {
      if (showToast) Toast.error('请先配置认证信息');
      return;
    }

    // 检查必要配置
    const hasRequiredConfig =
      config.roomTableId &&
      config.bookingTableId &&
      config.roomNameFieldId &&
      config.bookingRoomFieldId &&
      config.startTimeFieldId &&
      config.endTimeFieldId;

    if (!hasRequiredConfig) {
      if (showToast) Toast.error('配置不完整，请先完成配置');
      return;
    }

    try {
      if (showToast || !dataLoaded) {
        setLoading(true);
      }

      const data = await meetingRoomApi.loadMeetingData(config);

      // 转换数据格式
      const rooms: IMeetingRoom[] = data.rooms.map(room => ({
        ...room,
        // 将后端返回的 soon 状态转换为 available
        status: room.status === 'soon' ? 'available' : room.status as 'available' | 'in-use',
        todayMeetings: room.todayMeetings.map(meeting => ({
          ...meeting,
          status: getMeetingStatus(meeting.startTime, meeting.endTime),
        })),
      }));

      setMeetingRooms(rooms);
      setDataLoaded(true);

      if (showToast) {
        if (rooms.length === 0) {
          Toast.warning('没有找到会议室数据');
        } else {
          Toast.success(`加载成功: ${rooms.length}个会议室`);
        }
      }
    } catch (error: any) {
      console.error('加载会议室数据失败:', error);
      if (showToast) {
        Toast.error(error.message || '加载数据失败');
      }
    } finally {
      if (showToast || !dataLoaded) {
        setLoading(false);
      }
    }
  }, [config, auth, dataLoaded, getMeetingStatus]);

  /**
   * 初始加载和定时刷新
   * 当显示单一会议室视图时暂停刷新，避免重复请求
   */
  useEffect(() => {
    if (!auth) return;
    // 如果正在显示单一会议室视图，暂停主界面的定时刷新
    if (selectedRoom) return;

    loadMeetingData(false);

    const interval = setInterval(() => {
      loadMeetingData(false);
    }, 60000); // 每分钟刷新一次

    return () => clearInterval(interval);
  }, [loadMeetingData, auth, selectedRoom]);

  /**
   * 监听全屏状态变化
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  /**
   * 进入全屏
   */
  const enterFullscreen = useCallback(() => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => {
        console.error('进入全屏失败:', err);
      });
    }
  }, []);

  /**
   * 退出全屏
   */
  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => {
        console.error('退出全屏失败:', err);
      });
    }
  }, []);

  /**
   * 格式化时间显示
   */
  const formatTime = useCallback((dateStr: string) => {
    return dayjs(dateStr).format('HH:mm');
  }, []);

  /**
   * 格式化日期时间显示
   */
  const formatDateTime = useCallback((dateStr: string) => {
    return dayjs(dateStr).format('MM-DD HH:mm');
  }, []);

  /**
   * 获取状态颜色
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'green';
      case 'in-use':
        return 'red';
      default:
        return 'default';
    }
  };

  /**
   * 获取状态文本
   */
  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return '空闲';
      case 'in-use':
        return '使用中';
      default:
        return '未知';
    }
  };

  /**
   * 渲染会议室卡片
   */
  const renderRoomCard = (room: IMeetingRoom) => {
    const isAvailable = room.status === 'available';
    const hasVideo = config.enableVideoPlayer &&
                      room.attachments &&
                      room.attachments.length > 0 &&
                      isAvailable;

    return (
      <div
        key={room.id}
        className={classnames('room-card', {
          'room-card-available': room.status === 'available',
          'room-card-in-use': room.status === 'in-use',
          'room-card-clickable': true,
        })}
        onClick={() => setSelectedRoom(room)}
      >
        <div className="room-header">
          <div className="room-name">
            <Title heading={3}>{room.name}</Title>
          </div>
          <Tag
            color={getStatusColor(room.status) as any}
            size="large"
          >
            {getStatusText(room.status)}
          </Tag>
        </div>

        <div className="room-content">
          <div className="today-meetings-count">
            <Text type="secondary">今日会议: {room.todayMeetings.length} 个</Text>
          </div>
        </div>
      </div>
    );
  };

  // 如果没有认证信息，显示提示
  if (!auth) {
    return (
      <main className="meeting-room-board" style={{ backgroundColor: props.bgColor }}>
        <div className="no-auth-message">
          <Title heading={4}>未配置认证信息</Title>
          <Text type="secondary">请先点击右上角「配置认证」按钮设置飞书 Token</Text>
        </div>
      </main>
    );
  }

  // 检查必要配置
  const hasRequiredConfig =
    config.roomTableId &&
    config.bookingTableId &&
    config.roomNameFieldId &&
    config.bookingRoomFieldId &&
    config.startTimeFieldId &&
    config.endTimeFieldId;

  // 如果选择了单个会议室，显示单一视图
  if (selectedRoom) {
    return (
      <SingleMeetingRoomView
        room={selectedRoom}
        onBack={() => setSelectedRoom(null)}
        showDate={config.showDate}
        showCurrentMeeting={config.showCurrentMeeting}
        enableVideoPlayer={config.enableVideoPlayer}
        videoMuted={config.videoMuted}
      />
    );
  }

  return (
    <main
      className={classnames('meeting-room-board', {
        'fullscreen-mode': isFullscreen,
      })}
      style={{ backgroundColor: props.bgColor }}
    >
      {/* 顶部工具栏 */}
      <div className="board-header">
        {config.showDate && (
          <div className="current-datetime">
            <Title heading={3}>{dayjs(currentTime).format('MM月DD日')}</Title>
            <Text type="secondary">{
              (() => {
                const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
                return weekdays[dayjs(currentTime).day()] + dayjs(currentTime).format(' HH:mm:ss');
              })()
            }</Text>
          </div>
        )}

        <Title heading={2} className="board-title">
          {config.title}
        </Title>

        <div className="board-actions">
          <Space>
            <LockSettings />
            <TableConfig />
            <AuthConfig />
            <Button
              type="tertiary"
              onClick={() => loadMeetingData(true)}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              type="tertiary"
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
            >
              {isFullscreen ? '退出全屏' : '全屏'}
            </Button>
          </Space>
        </div>
      </div>

      {/* 会议室列表 */}
      <div className="rooms-container">
        {loading && !dataLoaded ? (
          <div className="loading-container">
            <Spin size="large" />
            <Text type="secondary">加载中...</Text>
          </div>
        ) : meetingRooms.length === 0 ? (
          <div className="empty-container">
            <Title heading={4}>暂无会议室数据</Title>
            <Text type="secondary">请检查配置是否正确</Text>
          </div>
        ) : (
          <div className="rooms-grid">
            {meetingRooms.map(renderRoomCard)}
          </div>
        )}
      </div>
    </main>
  );
}
