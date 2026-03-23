import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Button,
  Typography,
  Divider,
  Toast,
  Spin,
  Row,
  Col,
  Card,
  Space,
  Popconfirm,
} from '@douyinfe/semi-ui';
import { IconSetting, IconVideo, IconCalendar, IconDelete, IconRefresh } from '@douyinfe/semi-icons';
import { useAppStore } from '../../store';
import { baseApi } from '../../api/client';
import './style.scss';

const { Title, Text } = Typography;
const { Option } = Select;

interface TableInfo {
  id: string;
  name: string;
}

interface FieldInfo {
  id: string;
  name: string;
  type: number;
}

/**
 * 表格配置组件
 * 用于配置会议室表和预订表的字段映射
 */
export default function TableConfig() {
  const [visible, setVisible] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [roomFields, setRoomFields] = useState<FieldInfo[]>([]);
  const [bookingFields, setBookingFields] = useState<FieldInfo[]>([]);
  const [fetchingTables, setFetchingTables] = useState(false);
  const [fetchingRoomFields, setFetchingRoomFields] = useState(false);
  const [fetchingBookingFields, setFetchingBookingFields] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  const config = useAppStore((state) => state.config);
  const setConfig = useAppStore((state) => state.setConfig);
  const auth = useAppStore((state) => state.auth);

  // 清除所有视频缓存
  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const response = await fetch('/api/cache/status');
      const data = await response.json();
      
      if (data.data?.files?.length > 0) {
        // 删除所有缓存文件
        for (const file of data.data.files) {
          const fileToken = file.name.split('-')[0];
          await fetch(`/api/cache/video/${fileToken}`, { method: 'DELETE' });
        }
        Toast.success(`已清除 ${data.data.files.length} 个视频缓存`);
      } else {
        Toast.info('没有视频缓存需要清除');
      }
    } catch (error) {
      Toast.error('清除缓存失败');
    } finally {
      setClearingCache(false);
    }
  };

  // 加载表格列表
  const loadTables = async () => {
    if (!auth) {
      Toast.error('请先配置认证信息');
      return;
    }

    setFetchingTables(true);
    try {
      const tableList = await baseApi.getTableList();
      setTables(tableList);
    } catch (error: any) {
      Toast.error(error.message || '获取表格列表失败');
    } finally {
      setFetchingTables(false);
    }
  };

  // 加载字段列表
  const loadFields = async (tableId: string, type: 'room' | 'booking') => {
    if (!tableId || !auth) return;

    if (type === 'room') {
      setFetchingRoomFields(true);
    } else {
      setFetchingBookingFields(true);
    }

    try {
      const fieldList = await baseApi.getFieldList(tableId);
      if (type === 'room') {
        setRoomFields(fieldList);
      } else {
        setBookingFields(fieldList);
      }
    } catch (error: any) {
      Toast.error(error.message || '获取字段列表失败');
    } finally {
      if (type === 'room') {
        setFetchingRoomFields(false);
      } else {
        setFetchingBookingFields(false);
      }
    }
  };

  // 打开弹窗时加载数据
  useEffect(() => {
    if (visible && auth) {
      loadTables();
      // 如果已有表格配置，加载对应的字段
      if (config.roomTableId) {
        loadFields(config.roomTableId, 'room');
      }
      if (config.bookingTableId) {
        loadFields(config.bookingTableId, 'booking');
      }
    }
  }, [visible]);

  // 保存配置
  const handleSubmit = (values: any) => {
    // 验证必填字段
    const requiredFields = [
      { key: 'roomTableId', label: '会议室表' },
      { key: 'bookingTableId', label: '预订表' },
      { key: 'roomNameFieldId', label: '会议室名称字段' },
      { key: 'bookingRoomFieldId', label: '预订会议室字段' },
      { key: 'startTimeFieldId', label: '开始时间字段' },
      { key: 'endTimeFieldId', label: '结束时间字段' },
    ];

    const missingFields = requiredFields.filter(
      (field) => !values[field.key]
    );

    if (missingFields.length > 0) {
      Toast.error(`请配置以下必填项: ${missingFields.map((f) => f.label).join(', ')}`);
      return;
    }

    // 查找字段名称
    const endTimeField = bookingFields.find(f => f.id === values.endTimeFieldId);
    const usageStatusField = bookingFields.find(f => f.id === values.usageStatusFieldId);
    const meetingTitleField = bookingFields.find(f => f.id === values.meetingTitleFieldId);
    const bookingRoomField = bookingFields.find(f => f.id === values.bookingRoomFieldId);
    const organizerField = bookingFields.find(f => f.id === values.organizerFieldId);
    const participantsField = bookingFields.find(f => f.id === values.participantsFieldId);
    const startTimeField = bookingFields.find(f => f.id === values.startTimeFieldId);

    const configToSave = {
      ...values,
      endTimeFieldName: endTimeField?.name || '',
      usageStatusFieldName: usageStatusField?.name || '',
      meetingTitleFieldName: meetingTitleField?.name || '',
      bookingRoomFieldName: bookingRoomField?.name || '',
      organizerFieldName: organizerField?.name || '',
      participantsFieldName: participantsField?.name || '',
      startTimeFieldName: startTimeField?.name || '',
    };

    setConfig(configToSave);
    Toast.success('配置保存成功');
    setVisible(false);
  };

  // 检查配置是否完整
  const isConfigComplete = () => {
    return (
      config.roomTableId &&
      config.bookingTableId &&
      config.roomNameFieldId &&
      config.bookingRoomFieldId &&
      config.startTimeFieldId &&
      config.endTimeFieldId
    );
  };

  // 表单默认值
  const initialValues = {
    roomTableId: config.roomTableId,
    bookingTableId: config.bookingTableId,
    roomNameFieldId: config.roomNameFieldId,
    bookingRoomFieldId: config.bookingRoomFieldId,
    meetingTitleFieldId: config.meetingTitleFieldId,
    startTimeFieldId: config.startTimeFieldId,
    endTimeFieldId: config.endTimeFieldId,
    organizerFieldId: config.organizerFieldId,
    participantsFieldId: config.participantsFieldId,
    bookingStatusFieldId: config.bookingStatusFieldId,
    bookingStatusValue: config.bookingStatusValue || '已预订',
    usageStatusFieldId: config.usageStatusFieldId,
    mediaAttachmentsFieldId: config.mediaAttachmentsFieldId,
    enableVideoPlayer: config.enableVideoPlayer ?? true,
    videoMuted: config.videoMuted ?? true,
    quickBookOrganizerId: config.quickBookOrganizerId,
    quickBookOrganizerName: config.quickBookOrganizerName,
    meetingTitleFieldName: config.meetingTitleFieldName,
    bookingRoomFieldName: config.bookingRoomFieldName,
    organizerFieldName: config.organizerFieldName,
    participantsFieldName: config.participantsFieldName,
    startTimeFieldName: config.startTimeFieldName,
    endTimeFieldName: config.endTimeFieldName,
  };

  return (
    <>
      <Button
        type={isConfigComplete() ? 'tertiary' : 'primary'}
        icon={<IconSetting />}
        onClick={() => setVisible(true)}
      >
        {isConfigComplete() ? '修改配置' : '配置表格'}
      </Button>

      <Modal
        title="表格字段配置"
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={900}
        maskClosable={false}
        className="table-config-modal"
      >
        <Spin spinning={fetchingTables}>
          <Form
            layout="vertical"
            initValues={initialValues}
            onSubmit={handleSubmit}
            onValueChange={(values) => {
              // 当表格选择变化时，加载对应字段
              if (values.roomTableId && values.roomTableId !== config.roomTableId) {
                loadFields(values.roomTableId, 'room');
              }
              if (values.bookingTableId && values.bookingTableId !== config.bookingTableId) {
                loadFields(values.bookingTableId, 'booking');
              }
            }}
          >
            <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 13 }}>
              请配置会议室表和预订表的字段映射关系，带 <Text type="danger">*</Text> 的为必填项
            </Text>

            {/* 会议室表配置 */}
            <Card
              title={
                <Space>
                  <IconVideo style={{ color: 'var(--semi-color-primary)' }} />
                  <span style={{ fontWeight: 600 }}>会议室表配置</span>
                </Space>
              }
              style={{ marginBottom: 24 }}
              bodyStyle={{ padding: 24 }}
            >
              <Row gutter={[24, 20]}>
                <Col span={12}>
                  <Form.Select
                    field="roomTableId"
                    label="选择会议室表"
                    placeholder="请选择会议室表"
                    style={{ width: '100%' }}
                    optionList={tables.map((t) => ({ label: t.name, value: t.id }))}
                    rules={[{ required: true, message: '请选择会议室表' }]}
                    showClear
                  />
                </Col>
                <Col span={12}>
                  <Spin spinning={fetchingRoomFields} wrapperClassName="field-select-spin">
                    <Form.Select
                      field="roomNameFieldId"
                      label="会议室名称字段"
                      placeholder="请选择字段"
                      style={{ width: '100%' }}
                      optionList={roomFields.map((f) => ({ label: f.name, value: f.id }))}
                      rules={[{ required: true, message: '请选择会议室名称字段' }]}
                      disabled={!roomFields.length}
                      showClear
                    />
                  </Spin>
                </Col>
              </Row>

              <Row gutter={[24, 20]}>
                <Col span={24}>
                  <Spin spinning={fetchingRoomFields} wrapperClassName="field-select-spin">
                    <Form.Select
                      field="mediaAttachmentsFieldId"
                      label="视频附件字段（可选）"
                      placeholder="请选择附件字段，用于空闲时播放视频"
                      style={{ width: '100%' }}
                      optionList={roomFields.map((f) => ({ label: f.name, value: f.id }))}
                      disabled={!roomFields.length}
                      showClear
                    />
                  </Spin>
                </Col>
              </Row>

              <Divider style={{ margin: '20px 0' }} />

              <Row gutter={[24, 20]}>
                <Col span={12}>
                  <div className="switch-field-wrapper">
                    <Form.Checkbox
                      field="enableVideoPlayer"
                      noLabel
                    >
                      启用视频播放器
                    </Form.Checkbox>
                    <Text type="secondary" className="switch-hint">
                      开启后，会议室空闲时将自动播放视频附件
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="switch-field-wrapper">
                    <Form.Checkbox
                      field="videoMuted"
                      noLabel
                    >
                      视频静音播放
                    </Form.Checkbox>
                    <Text type="secondary" className="switch-hint">
                      建议开启静音，避免干扰
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* 预订表配置 */}
            <Card
              title={
                <Space>
                  <IconCalendar style={{ color: 'var(--semi-color-success)' }} />
                  <span style={{ fontWeight: 600 }}>预订表配置</span>
                </Space>
              }
              style={{ marginBottom: 24 }}
              bodyStyle={{ padding: 24 }}
            >
              <Row gutter={[24, 20]}>
                <Col span={12}>
                  <Form.Select
                    field="bookingTableId"
                    label="选择预订表"
                    placeholder="请选择预订表"
                    style={{ width: '100%' }}
                    optionList={tables.map((t) => ({ label: t.name, value: t.id }))}
                    rules={[{ required: true, message: '请选择预订表' }]}
                    showClear
                  />
                </Col>
                <Col span={12}>
                  <Spin spinning={fetchingBookingFields} wrapperClassName="field-select-spin">
                    <Form.Select
                      field="bookingRoomFieldId"
                      label="预订会议室字段"
                      placeholder="请选择字段"
                      style={{ width: '100%' }}
                      optionList={bookingFields.map((f) => ({ label: f.name, value: f.id }))}
                      rules={[{ required: true, message: '请选择预订会议室字段' }]}
                      disabled={!bookingFields.length}
                      showClear
                    />
                  </Spin>
                </Col>
              </Row>

              <Row gutter={[24, 20]}>
                <Col span={12}>
                  <Spin spinning={fetchingBookingFields} wrapperClassName="field-select-spin">
                    <Form.Select
                      field="meetingTitleFieldId"
                      label="会议标题字段（可选）"
                      placeholder="请选择字段"
                      style={{ width: '100%' }}
                      optionList={bookingFields.map((f) => ({ label: f.name, value: f.id }))}
                      disabled={!bookingFields.length}
                      showClear
                    />
                  </Spin>
                </Col>
                <Col span={12}>
                  <Spin spinning={fetchingBookingFields} wrapperClassName="field-select-spin">
                    <Form.Select
                      field="organizerFieldId"
                      label="组织者字段（可选）"
                      placeholder="请选择字段"
                      style={{ width: '100%' }}
                      optionList={bookingFields.map((f) => ({ label: f.name, value: f.id }))}
                      disabled={!bookingFields.length}
                      showClear
                    />
                  </Spin>
                </Col>
              </Row>

              <Row gutter={[24, 20]}>
                <Col span={12}>
                  <Spin spinning={fetchingBookingFields} wrapperClassName="field-select-spin">
                    <Form.Select
                      field="startTimeFieldId"
                      label="开始时间字段"
                      placeholder="请选择字段"
                      style={{ width: '100%' }}
                      optionList={bookingFields.map((f) => ({ label: f.name, value: f.id }))}
                      rules={[{ required: true, message: '请选择开始时间字段' }]}
                      disabled={!bookingFields.length}
                      showClear
                    />
                  </Spin>
                </Col>
                <Col span={12}>
                  <Spin spinning={fetchingBookingFields} wrapperClassName="field-select-spin">
                    <Form.Select
                      field="endTimeFieldId"
                      label="结束时间字段"
                      placeholder="请选择字段"
                      style={{ width: '100%' }}
                      optionList={bookingFields.map((f) => ({ label: f.name, value: f.id }))}
                      rules={[{ required: true, message: '请选择结束时间字段' }]}
                      disabled={!bookingFields.length}
                      showClear
                    />
                  </Spin>
                </Col>
              </Row>

              <Row gutter={[24, 20]}>
                <Col span={12}>
                  <Spin spinning={fetchingBookingFields} wrapperClassName="field-select-spin">
                    <Form.Select
                      field="bookingStatusFieldId"
                      label="预订状态字段（可选）"
                      placeholder="请选择字段"
                      style={{ width: '100%' }}
                      optionList={bookingFields.map((f) => ({ label: f.name, value: f.id }))}
                      disabled={!bookingFields.length}
                      showClear
                    />
                  </Spin>
                </Col>
                <Col span={12}>
                  <Form.Select
                    field="bookingStatusValue"
                    label="有效预订状态值"
                    placeholder="请选择状态值"
                    style={{ width: '100%' }}
                    optionList={[
                      { label: '已预订', value: '已预订' },
                      { label: '已确认', value: 'confirmed' },
                      { label: '有效', value: 'active' },
                    ]}
                    showClear
                  />
                </Col>
              </Row>

              <Row gutter={[24, 20]}>
                <Col span={12}>
                  <Spin spinning={fetchingBookingFields} wrapperClassName="field-select-spin">
                    <Form.Select
                      field="organizerFieldId"
                      label="组织者字段（可选）"
                      placeholder="请选择字段"
                      style={{ width: '100%' }}
                      optionList={bookingFields.map((f) => ({ label: f.name, value: f.id }))}
                      disabled={!bookingFields.length}
                      showClear
                    />
                  </Spin>
                </Col>
                <Col span={12}>
                  <Spin spinning={fetchingBookingFields} wrapperClassName="field-select-spin">
                    <Form.Select
                      field="participantsFieldId"
                      label="参与人字段（可选）"
                      placeholder="请选择字段"
                      style={{ width: '100%' }}
                      optionList={bookingFields.map((f) => ({ label: f.name, value: f.id }))}
                      disabled={!bookingFields.length}
                      showClear
                    />
                  </Spin>
                </Col>
              </Row>

              <Row gutter={[24, 20]}>
                <Col span={24}>
                  <Spin spinning={fetchingBookingFields} wrapperClassName="field-select-spin">
                    <Form.Select
                      field="usageStatusFieldId"
                      label="使用状态字段（可选）"
                      placeholder="请选择字段，用于提前结束会议"
                      style={{ width: '100%' }}
                      optionList={bookingFields.map((f) => ({ label: f.name, value: f.id }))}
                      disabled={!bookingFields.length}
                      showClear
                    />
                  </Spin>
                </Col>
              </Row>
            </Card>

            {/* 快速预定配置 */}
            <Card
              title={
                <Space>
                  <IconCalendar style={{ color: 'var(--semi-color-warning)' }} />
                  <span style={{ fontWeight: 600 }}>快速预定配置</span>
                </Space>
              }
              style={{ marginBottom: 24 }}
              bodyStyle={{ padding: 24 }}
            >
              <Row gutter={[24, 20]}>
                <Col span={24}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    配置快速预定功能的默认预定人信息
                  </Text>
                </Col>
              </Row>
              <Row gutter={[24, 20]}>
                <Col span={12}>
                  <Form.Input
                    field="quickBookOrganizerId"
                    label="默认快速预定人ID"
                    placeholder="请输入用户ID"
                    style={{ width: '100%' }}
                    showClear
                  />
                </Col>
                <Col span={12}>
                  <Form.Input
                    field="quickBookOrganizerName"
                    label="默认快速预定人名称"
                    placeholder="请输入用户名称"
                    style={{ width: '100%' }}
                    showClear
                  />
                </Col>
              </Row>
            </Card>

            {/* 缓存管理 */}
            {config.mediaAttachmentsFieldId && (
              <Card
                title={
                  <Space>
                    <IconRefresh style={{ color: 'var(--semi-color-primary)' }} />
                    <span style={{ fontWeight: 600 }}>视频缓存管理</span>
                  </Space>
                }
                style={{ marginBottom: 24 }}
                bodyStyle={{ padding: 24 }}
              >
                <Row gutter={[24, 20]}>
                  <Col span={24}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                      视频文件会缓存到本地以提高播放性能，缓存有效期为 24 小时。如果视频内容已更新，可以手动清除缓存。
                    </Text>
                    <Popconfirm
                      title="确定要清除所有视频缓存吗？"
                      content="清除后，下次进入会议室时会重新下载视频文件。"
                      onConfirm={handleClearCache}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="danger"
                        icon={<IconDelete />}
                        loading={clearingCache}
                      >
                        清除所有视频缓存
                      </Button>
                    </Popconfirm>
                  </Col>
                </Row>
              </Card>
            )}

            {/* 底部按钮 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
              <Button type="tertiary" onClick={() => setVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" theme="solid">
                保存配置
              </Button>
            </div>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
