import { useState } from 'react';
import { Button, Modal, Input, Switch, Toast, Space, Typography } from '@douyinfe/semi-ui';
import { IconLock, IconUnlock } from '@douyinfe/semi-icons';
import { useAppStore } from '../../store/index.js';

const { Text } = Typography;

/**
 * 界面锁定设置组件
 */
export default function LockSettings() {
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);

  // 从全局状态获取锁定配置
  const lockPassword = useAppStore((state) => state.lockPassword);
  const isLockEnabled = useAppStore((state) => state.isLockEnabled);
  const setLockPassword = useAppStore((state) => state.setLockPassword);
  const setIsLockEnabled = useAppStore((state) => state.setIsLockEnabled);

  const hasPassword = !!lockPassword;

  /**
   * 保存密码（首次设置）
   */
  const handleSavePassword = () => {
    if (!password.trim()) {
      Toast.error('请输入密码');
      return;
    }
    if (password.length < 4) {
      Toast.error('密码至少需要4位');
      return;
    }
    if (password !== confirmPassword) {
      Toast.error('两次输入的密码不一致');
      return;
    }

    setLockPassword(password);
    Toast.success('密码设置成功');
    setPassword('');
    setConfirmPassword('');
  };

  /**
   * 验证原密码并修改
   */
  const handleChangePassword = () => {
    // 验证原密码
    if (oldPassword !== lockPassword) {
      Toast.error('原密码错误');
      return;
    }

    // 验证新密码
    if (!password.trim()) {
      Toast.error('请输入新密码');
      return;
    }
    if (password.length < 4) {
      Toast.error('密码至少需要4位');
      return;
    }
    if (password !== confirmPassword) {
      Toast.error('两次输入的新密码不一致');
      return;
    }

    setLockPassword(password);
    Toast.success('密码修改成功');
    setOldPassword('');
    setPassword('');
    setConfirmPassword('');
    setShowChangePassword(false);
  };

  /**
   * 切换锁定开关
   */
  const handleToggleLock = (checked: boolean) => {
    if (checked && !hasPassword) {
      Toast.error('请先设置密码');
      return;
    }
    setIsLockEnabled(checked);
    Toast.success(checked ? '界面锁定已开启' : '界面锁定已关闭');
  };

  /**
   * 关闭弹窗时重置状态
   */
  const handleClose = () => {
    setVisible(false);
    setPassword('');
    setConfirmPassword('');
    setOldPassword('');
    setShowChangePassword(false);
  };

  return (
    <>
      <Button
        type="tertiary"
        icon={isLockEnabled ? <IconLock /> : <IconUnlock />}
        onClick={() => setVisible(true)}
      >
        界面锁定
      </Button>

      <Modal
        title="界面锁定设置"
        visible={visible}
        onCancel={handleClose}
        footer={null}
        width={400}
      >
        <div style={{ padding: '20px 0' }}>
          {/* 锁定开关 */}
          <div style={{ marginBottom: 24 }}>
            <Space align="center">
              <Switch
                checked={isLockEnabled}
                onChange={handleToggleLock}
              />
              <Text strong>
                {isLockEnabled ? '界面锁定已开启' : '界面锁定已关闭'}
              </Text>
            </Space>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              开启后，进入单一会议室看板需要输入密码才能返回
            </Text>
          </div>

          {/* 密码设置区域 */}
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--semi-color-border)' }}>
            {!hasPassword ? (
              // 首次设置密码
              <>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>
                  设置密码
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <Text style={{ display: 'block', marginBottom: 8 }}>密码</Text>
                    <Input
                      type="password"
                      value={password}
                      onChange={(value) => setPassword(value)}
                      placeholder="请输入密码（至少4位）"
                      showClear
                    />
                  </div>
                  <div>
                    <Text style={{ display: 'block', marginBottom: 8 }}>确认密码</Text>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(value) => setConfirmPassword(value)}
                      placeholder="请再次输入密码"
                      showClear
                    />
                  </div>
                  <Button
                    type="primary"
                    theme="solid"
                    block
                    onClick={handleSavePassword}
                  >
                    保存密码
                  </Button>
                </div>
              </>
            ) : !showChangePassword ? (
              // 已设置密码，显示修改按钮
              <>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>
                  密码已设置
                </Text>
                <Button
                  type="primary"
                  theme="solid"
                  block
                  onClick={() => setShowChangePassword(true)}
                >
                  修改密码
                </Button>
              </>
            ) : (
              // 修改密码界面
              <>
                <Text strong style={{ display: 'block', marginBottom: 16 }}>
                  修改密码
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <Text style={{ display: 'block', marginBottom: 8 }}>原密码</Text>
                    <Input
                      type="password"
                      value={oldPassword}
                      onChange={(value) => setOldPassword(value)}
                      placeholder="请输入原密码"
                      showClear
                    />
                  </div>
                  <div>
                    <Text style={{ display: 'block', marginBottom: 8 }}>新密码</Text>
                    <Input
                      type="password"
                      value={password}
                      onChange={(value) => setPassword(value)}
                      placeholder="请输入新密码（至少4位）"
                      showClear
                    />
                  </div>
                  <div>
                    <Text style={{ display: 'block', marginBottom: 8 }}>确认新密码</Text>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(value) => setConfirmPassword(value)}
                      placeholder="请再次输入新密码"
                      showClear
                    />
                  </div>
                  <Space style={{ width: '100%' }}>
                    <Button
                      type="tertiary"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setShowChangePassword(false);
                        setOldPassword('');
                        setPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      取消
                    </Button>
                    <Button
                      type="primary"
                      theme="solid"
                      style={{ flex: 1 }}
                      onClick={handleChangePassword}
                    >
                      确认修改
                    </Button>
                  </Space>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
