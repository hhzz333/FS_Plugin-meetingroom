import { useState } from 'react';
import { Button, Input, Modal, Typography, Toast } from '@douyinfe/semi-ui';
import { useAppStore } from '../../store/index.js';
import { saveAuthInfo, clearAuthInfo } from '../../api/client.js';
import './style.scss';

const { Title, Text } = Typography;

/**
 * 认证配置组件
 */
export default function AuthConfig() {
  const auth = useAppStore((state) => state.auth);
  const setAuth = useAppStore((state) => state.setAuth);

  const [visible, setVisible] = useState(false);
  const [appToken, setAppToken] = useState(auth?.appToken || '');
  const [personalBaseToken, setPersonalBaseToken] = useState(auth?.personalBaseToken || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!appToken.trim() || !personalBaseToken.trim()) {
      Toast.error('请填写完整的认证信息');
      return;
    }

    setLoading(true);

    try {
      const newAuth = {
        appToken: appToken.trim(),
        personalBaseToken: personalBaseToken.trim(),
      };

      await saveAuthInfo(newAuth);
      setAuth(newAuth);
      Toast.success('认证信息保存成功');
      setVisible(false);
    } catch (error) {
      Toast.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    await clearAuthInfo();
    setAuth(null);
    setAppToken('');
    setPersonalBaseToken('');
    Toast.info('认证信息已清除');
  };

  return (
    <>
      <Button
        theme={auth ? 'light' : 'solid'}
        type={auth ? 'tertiary' : 'primary'}
        onClick={() => setVisible(true)}
      >
        {auth ? '已配置认证' : '配置认证'}
      </Button>

      <Modal
        title="配置飞书认证信息"
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={500}
      >
        <div className="auth-config-content">
          <div className="auth-info-section">
            <Title heading={5}>如何获取认证信息</Title>
            <Text type="secondary">
              1. 打开飞书多维表格，点击右上角「...」→「开发工具」
            </Text>
            <br />
            <Text type="secondary">
              2. 复制 AppToken（BaseId）和 PersonalBaseToken
            </Text>
            <br />
            <Text type="secondary">
              3. 参考文档：
              <a
                href="https://feishu.feishu.cn/docx/RlrpdAGwnoONCaxmIVQcD7MZnug"
                target="_blank"
                rel="noopener noreferrer"
              >
                BaseOpenSDK 官方文档
              </a>
            </Text>
          </div>

          <div className="auth-form">
            <div className="form-item">
              <label>AppToken (BaseId)</label>
              <Input
                value={appToken}
                onChange={(value) => setAppToken(value)}
                placeholder="请输入 AppToken"
                showClear
              />
            </div>

            <div className="form-item">
              <label>PersonalBaseToken</label>
              <Input
                value={personalBaseToken}
                onChange={(value) => setPersonalBaseToken(value)}
                placeholder="请输入 PersonalBaseToken"
                type="password"
                showClear
              />
            </div>
          </div>

          <div className="auth-actions">
            <Button type="primary" loading={loading} onClick={handleSave}>
              保存
            </Button>
            {auth && (
              <Button type="danger" onClick={handleClear}>
                清除认证
              </Button>
            )}
            <Button onClick={() => setVisible(false)}>取消</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
