import './App.scss';
import './locales/i18n';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
import MeetingRoomBoard from './components/Meetingroom';
import { useTheme } from './hooks';
import { useAppStore } from './store/index.js';
import AuthConfig from './components/AuthConfig/index.js';
import TableConfig from './components/TableConfig/index.js';
import { Button, Empty, Typography, Space } from '@douyinfe/semi-ui';

const { Title, Text } = Typography;

export default function App() {
  const { bgColor } = useTheme();
  const auth = useAppStore((state) => state.auth);

  // 如果没有认证信息，显示配置界面
  if (!auth) {
    return (
      <div
        className="app-container"
        style={{
          backgroundColor: bgColor,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <Empty
          title="欢迎使用会议室看板"
          description={
            <div style={{ textAlign: 'center' }}>
              <Text>请先配置飞书认证信息以开始使用</Text>
              <br />
              <Text type="secondary">
                需要 AppToken 和 PersonalBaseToken
              </Text>
              <div style={{ marginTop: 24 }}>
                <AuthConfig />
              </div>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="app-container" style={{ backgroundColor: bgColor }}>
      <MeetingRoomBoard bgColor={bgColor} />
    </div>
  );
}
