import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from './store/index.js';
import { meetingRoomApi, baseApi } from './api/client.js';

/**
 * 使用当前时间
 */
export function useCurrentTime() {
  const currentTime = useAppStore((state) => state.currentTime);
  const updateCurrentTime = useAppStore((state) => state.updateCurrentTime);

  useEffect(() => {
    const interval = setInterval(() => {
      updateCurrentTime();
    }, 1000);

    return () => clearInterval(interval);
  }, [updateCurrentTime]);

  return currentTime;
}

/**
 * 使用会议室数据
 */
export function useMeetingRooms() {
  const meetingRooms = useAppStore((state) => state.meetingRooms);
  const setMeetingRooms = useAppStore((state) => state.setMeetingRooms);
  const isLoading = useAppStore((state) => state.isLoading);
  const setIsLoading = useAppStore((state) => state.setIsLoading);
  const error = useAppStore((state) => state.error);
  const setError = useAppStore((state) => state.setError);
  const config = useAppStore((state) => state.config);
  const auth = useAppStore((state) => state.auth);

  const loadData = useCallback(async () => {
    if (!auth) {
      setError('请先配置认证信息');
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
      setError('配置不完整，请先完成配置');
      return;
    }

    // 避免重复请求
    if (isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await meetingRoomApi.loadMeetingData(config);
      setMeetingRooms(data.rooms);
    } catch (err: any) {
      console.error('加载会议室数据失败:', err);
      setError(err.message || '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [config, auth, setMeetingRooms, setIsLoading, setError, isLoading]);

  // 自动刷新
  useEffect(() => {
    if (!auth) return;

    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 60000); // 每分钟刷新一次

    return () => clearInterval(interval);
  }, [loadData, auth]);

  return {
    meetingRooms,
    isLoading,
    error,
    loadData,
  };
}

/**
 * 使用表格列表
 */
export function useTables() {
  const [tables, setTables] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAppStore((state) => state.auth);

  const loadTables = useCallback(async () => {
    if (!auth) {
      setError('请先配置认证信息');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await baseApi.getTableList();
      setTables(data);
    } catch (err: any) {
      console.error('加载表格列表失败:', err);
      setError(err.message || '加载表格列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    if (auth) {
      loadTables();
    }
  }, [auth, loadTables]);

  return { tables, isLoading, error, loadTables };
}

/**
 * 使用字段列表
 */
export function useFields(tableId: string) {
  const [fields, setFields] = useState<Array<{ id: string; name: string; type: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAppStore((state) => state.auth);

  const loadFields = useCallback(async () => {
    if (!auth || !tableId) {
      setFields([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await baseApi.getFieldList(tableId);
      setFields(data);
    } catch (err: any) {
      console.error('加载字段列表失败:', err);
      setError(err.message || '加载字段列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [auth, tableId]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  return { fields, isLoading, error, loadFields };
}

/**
 * 使用主题
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 检测系统主题
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#1a1a1a';

  return { isDark, bgColor, textColor };
}

export default {
  useCurrentTime,
  useMeetingRooms,
  useTables,
  useFields,
  useTheme,
};
