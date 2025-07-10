/**
 * PluginSystem 单元测试
 * 测试插件系统的注册、激活、停用和管理功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginSystem } from './PluginSystem';
import { testUtils, mocks } from '@test/setup';
import type { Plugin, PluginManifest, PluginAPI } from './PluginSystem';

describe('PluginSystem', () => {
  let pluginSystem: PluginSystem;
  let mockAPI: PluginAPI;
  let mockPlugin: Plugin;

  beforeEach(() => {
    // 创建模拟API
    mockAPI = {
      links: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        find: vi.fn()
      },
      search: {
        index: vi.fn(),
        query: vi.fn()
      },
      ui: {
        addMenuItem: vi.fn(),
        addPanel: vi.fn(),
        showNotification: vi.fn(),
        openModal: vi.fn()
      },
      fs: {
        read: vi.fn(),
        write: vi.fn(),
        exists: vi.fn(),
        list: vi.fn()
      }
    };

    pluginSystem = new PluginSystem(mockAPI);

    // 创建模拟插件
    mockPlugin = {
      manifest: {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        main: 'index.js',
        permissions: ['ui:menu', 'storage:read']
      },
      activate: vi.fn(),
      deactivate: vi.fn()
    };
  });

  describe('插件注册', () => {
    it('应该能够注册有效的插件', async () => {
      await pluginSystem.registerPlugin(mockPlugin);
      
      const plugins = pluginSystem.getPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].id).toBe('test-plugin');
    });

    it('应该验证插件清单', async () => {
      const invalidPlugin = {
        ...mockPlugin,
        manifest: {
          ...mockPlugin.manifest,
          id: '' // 无效ID
        }
      };

      await expect(pluginSystem.registerPlugin(invalidPlugin))
        .rejects.toThrow('Missing required field in manifest: id');
    });

    it('应该验证插件ID格式', async () => {
      const invalidPlugin = {
        ...mockPlugin,
        manifest: {
          ...mockPlugin.manifest,
          id: 'Invalid_ID!' // 无效格式
        }
      };

      await expect(pluginSystem.registerPlugin(invalidPlugin))
        .rejects.toThrow('Plugin ID must contain only lowercase letters, numbers, and hyphens');
    });

    it('应该验证版本格式', async () => {
      const invalidPlugin = {
        ...mockPlugin,
        manifest: {
          ...mockPlugin.manifest,
          version: 'invalid-version'
        }
      };

      await expect(pluginSystem.registerPlugin(invalidPlugin))
        .rejects.toThrow('Plugin version must follow semantic versioning');
    });

    it('应该检查依赖关系', async () => {
      const dependentPlugin = {
        ...mockPlugin,
        manifest: {
          ...mockPlugin.manifest,
          id: 'dependent-plugin',
          dependencies: ['nonexistent-plugin']
        }
      };

      await expect(pluginSystem.registerPlugin(dependentPlugin))
        .rejects.toThrow('Missing dependency: nonexistent-plugin');
    });

    it('应该发出插件注册事件', async () => {
      const eventSpy = vi.fn();
      pluginSystem.on('plugin-registered', eventSpy);

      await pluginSystem.registerPlugin(mockPlugin);

      expect(eventSpy).toHaveBeenCalledWith('test-plugin');
    });
  });

  describe('插件激活', () => {
    beforeEach(async () => {
      await pluginSystem.registerPlugin(mockPlugin);
    });

    it('应该能够激活已注册的插件', async () => {
      await pluginSystem.activatePlugin('test-plugin');
      
      expect(mockPlugin.activate).toHaveBeenCalled();
      expect(pluginSystem.isPluginActive('test-plugin')).toBe(true);
    });

    it('应该传递正确的上下文给插件', async () => {
      await pluginSystem.activatePlugin('test-plugin');
      
      const context = vi.mocked(mockPlugin.activate).mock.calls[0][0];
      expect(context.id).toBe('test-plugin');
      expect(context.api).toBe(mockAPI);
      expect(context.logger).toBeDefined();
      expect(context.storage).toBeDefined();
      expect(context.events).toBeDefined();
    });

    it('应该在激活依赖插件后激活插件', async () => {
      // 注册依赖插件
      const dependencyPlugin = {
        ...mockPlugin,
        manifest: {
          ...mockPlugin.manifest,
          id: 'dependency-plugin'
        }
      };
      await pluginSystem.registerPlugin(dependencyPlugin);

      // 注册依赖于第一个插件的插件
      const dependentPlugin = {
        ...mockPlugin,
        manifest: {
          ...mockPlugin.manifest,
          id: 'dependent-plugin',
          dependencies: ['dependency-plugin']
        },
        activate: vi.fn()
      };
      await pluginSystem.registerPlugin(dependentPlugin);

      await pluginSystem.activatePlugin('dependent-plugin');

      expect(pluginSystem.isPluginActive('dependency-plugin')).toBe(true);
      expect(pluginSystem.isPluginActive('dependent-plugin')).toBe(true);
    });

    it('应该处理激活错误', async () => {
      vi.mocked(mockPlugin.activate).mockRejectedValue(new Error('Activation failed'));

      await expect(pluginSystem.activatePlugin('test-plugin'))
        .rejects.toThrow('Activation failed');
      
      expect(pluginSystem.isPluginActive('test-plugin')).toBe(false);
    });

    it('应该发出插件激活事件', async () => {
      const eventSpy = vi.fn();
      pluginSystem.on('plugin-activated', eventSpy);

      await pluginSystem.activatePlugin('test-plugin');

      expect(eventSpy).toHaveBeenCalledWith('test-plugin');
    });

    it('应该忽略重复激活', async () => {
      await pluginSystem.activatePlugin('test-plugin');
      await pluginSystem.activatePlugin('test-plugin');

      expect(mockPlugin.activate).toHaveBeenCalledTimes(1);
    });
  });

  describe('插件停用', () => {
    beforeEach(async () => {
      await pluginSystem.registerPlugin(mockPlugin);
      await pluginSystem.activatePlugin('test-plugin');
    });

    it('应该能够停用已激活的插件', async () => {
      await pluginSystem.deactivatePlugin('test-plugin');
      
      expect(mockPlugin.deactivate).toHaveBeenCalled();
      expect(pluginSystem.isPluginActive('test-plugin')).toBe(false);
    });

    it('应该在停用插件前停用依赖它的插件', async () => {
      // 注册依赖插件
      const dependentPlugin = {
        ...mockPlugin,
        manifest: {
          ...mockPlugin.manifest,
          id: 'dependent-plugin',
          dependencies: ['test-plugin']
        },
        activate: vi.fn(),
        deactivate: vi.fn()
      };
      await pluginSystem.registerPlugin(dependentPlugin);
      await pluginSystem.activatePlugin('dependent-plugin');

      await pluginSystem.deactivatePlugin('test-plugin');

      expect(dependentPlugin.deactivate).toHaveBeenCalled();
      expect(mockPlugin.deactivate).toHaveBeenCalled();
    });

    it('应该处理停用错误', async () => {
      vi.mocked(mockPlugin.deactivate).mockRejectedValue(new Error('Deactivation failed'));

      await expect(pluginSystem.deactivatePlugin('test-plugin'))
        .rejects.toThrow('Deactivation failed');
    });

    it('应该发出插件停用事件', async () => {
      const eventSpy = vi.fn();
      pluginSystem.on('plugin-deactivated', eventSpy);

      await pluginSystem.deactivatePlugin('test-plugin');

      expect(eventSpy).toHaveBeenCalledWith('test-plugin');
    });

    it('应该忽略停用未激活的插件', async () => {
      await pluginSystem.deactivatePlugin('test-plugin');
      await pluginSystem.deactivatePlugin('test-plugin');

      expect(mockPlugin.deactivate).toHaveBeenCalledTimes(1);
    });
  });

  describe('插件卸载', () => {
    beforeEach(async () => {
      await pluginSystem.registerPlugin(mockPlugin);
      await pluginSystem.activatePlugin('test-plugin');
    });

    it('应该能够卸载插件', async () => {
      await pluginSystem.unregisterPlugin('test-plugin');
      
      expect(pluginSystem.getPlugins()).toHaveLength(0);
      expect(pluginSystem.isPluginActive('test-plugin')).toBe(false);
    });

    it('应该在卸载前停用插件', async () => {
      await pluginSystem.unregisterPlugin('test-plugin');
      
      expect(mockPlugin.deactivate).toHaveBeenCalled();
    });

    it('应该发出插件卸载事件', async () => {
      const eventSpy = vi.fn();
      pluginSystem.on('plugin-unregistered', eventSpy);

      await pluginSystem.unregisterPlugin('test-plugin');

      expect(eventSpy).toHaveBeenCalledWith('test-plugin');
    });
  });

  describe('插件配置', () => {
    beforeEach(async () => {
      await pluginSystem.registerPlugin(mockPlugin);
    });

    it('应该能够获取插件配置', () => {
      const config = pluginSystem.getPluginConfig('test-plugin');
      expect(config).toBeDefined();
    });

    it('应该能够更新插件配置', async () => {
      const newConfig = { theme: 'dark', enabled: true };
      
      await pluginSystem.updatePluginConfig('test-plugin', newConfig);
      
      const config = pluginSystem.getPluginConfig('test-plugin');
      expect(config.theme).toBe('dark');
      expect(config.enabled).toBe(true);
    });

    it('应该发出配置更新事件', async () => {
      const eventSpy = vi.fn();
      pluginSystem.on('plugin-config-updated', eventSpy);

      const newConfig = { theme: 'dark' };
      await pluginSystem.updatePluginConfig('test-plugin', newConfig);

      expect(eventSpy).toHaveBeenCalledWith('test-plugin', newConfig);
    });

    it('应该保存配置到存储', async () => {
      const newConfig = { theme: 'dark' };
      await pluginSystem.updatePluginConfig('test-plugin', newConfig);

      // 验证localStorage被调用
      expect(mocks.localStorage.setItem).toHaveBeenCalledWith(
        'plugin-config-test-plugin',
        JSON.stringify(expect.objectContaining(newConfig))
      );
    });
  });

  describe('插件查询', () => {
    beforeEach(async () => {
      await pluginSystem.registerPlugin(mockPlugin);
      
      const anotherPlugin = {
        ...mockPlugin,
        manifest: {
          ...mockPlugin.manifest,
          id: 'another-plugin',
          name: 'Another Plugin'
        }
      };
      await pluginSystem.registerPlugin(anotherPlugin);
      await pluginSystem.activatePlugin('test-plugin');
    });

    it('应该返回所有插件列表', () => {
      const plugins = pluginSystem.getPlugins();
      expect(plugins).toHaveLength(2);
      expect(plugins.map(p => p.id)).toContain('test-plugin');
      expect(plugins.map(p => p.id)).toContain('another-plugin');
    });

    it('应该返回激活的插件列表', () => {
      const activePlugins = pluginSystem.getActivePlugins();
      expect(activePlugins).toHaveLength(1);
      expect(activePlugins[0].id).toBe('test-plugin');
    });

    it('应该返回插件状态', () => {
      const state = pluginSystem.getPluginState('test-plugin');
      expect(state).toBeDefined();
      expect(state!.active).toBe(true);
      expect(state!.plugin.manifest.id).toBe('test-plugin');
    });

    it('应该检查插件是否激活', () => {
      expect(pluginSystem.isPluginActive('test-plugin')).toBe(true);
      expect(pluginSystem.isPluginActive('another-plugin')).toBe(false);
      expect(pluginSystem.isPluginActive('nonexistent-plugin')).toBe(false);
    });
  });

  describe('错误处理', () => {
    it('应该处理激活不存在的插件', async () => {
      await expect(pluginSystem.activatePlugin('nonexistent-plugin'))
        .rejects.toThrow('Plugin not found: nonexistent-plugin');
    });

    it('应该处理更新不存在插件的配置', async () => {
      await expect(pluginSystem.updatePluginConfig('nonexistent-plugin', {}))
        .rejects.toThrow('Plugin not found: nonexistent-plugin');
    });

    it('应该发出插件错误事件', async () => {
      const eventSpy = vi.fn();
      pluginSystem.on('plugin-error', eventSpy);

      await pluginSystem.registerPlugin(mockPlugin);
      vi.mocked(mockPlugin.activate).mockRejectedValue(new Error('Test error'));

      try {
        await pluginSystem.activatePlugin('test-plugin');
      } catch (error) {
        // 忽略错误，我们只关心事件
      }

      expect(eventSpy).toHaveBeenCalledWith('test-plugin', expect.any(Error));
    });
  });

  describe('插件上下文', () => {
    beforeEach(async () => {
      await pluginSystem.registerPlugin(mockPlugin);
      await pluginSystem.activatePlugin('test-plugin');
    });

    it('应该提供日志记录器', () => {
      const context = vi.mocked(mockPlugin.activate).mock.calls[0][0];
      
      expect(context.logger.info).toBeDefined();
      expect(context.logger.warn).toBeDefined();
      expect(context.logger.error).toBeDefined();
      expect(context.logger.debug).toBeDefined();
    });

    it('应该提供存储访问器', async () => {
      const context = vi.mocked(mockPlugin.activate).mock.calls[0][0];
      
      await context.storage.set('test-key', 'test-value');
      const value = await context.storage.get('test-key');
      
      expect(value).toBe('test-value');
    });

    it('应该提供事件发射器', () => {
      const context = vi.mocked(mockPlugin.activate).mock.calls[0][0];
      
      const eventSpy = vi.fn();
      context.events.on('test-event', eventSpy);
      context.events.emit('test-event', 'test-data');
      
      expect(eventSpy).toHaveBeenCalledWith('test-data');
    });

    it('应该提供API访问器', () => {
      const context = vi.mocked(mockPlugin.activate).mock.calls[0][0];
      
      expect(context.api).toBe(mockAPI);
    });
  });
});
