/**
 * 增强的块菜单组件
 * 支持智能搜索、拼音匹配、使用频率统计、最近使用等功能
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Clock, Star, TrendingUp } from 'lucide-react';
import { CommandSystem, CommandItem, CommandType } from '../commands/CommandSystem';
import { useDebounce } from '../hooks/useDebounce';

interface EnhancedBlockMenuProps {
  /** 菜单位置 */
  position: { x: number; y: number };
  /** 选择回调 */
  onSelect: (commandId: string) => void;
  /** 关闭回调 */
  onClose: () => void;
  /** 命令系统实例 */
  commandSystem: CommandSystem;
  /** 允许的块类型 */
  allowedBlocks?: string[];
  /** 初始查询 */
  initialQuery?: string;
  /** 自定义样式类名 */
  className?: string;
}

interface CommandGroup {
  name: string;
  icon: React.ReactNode;
  commands: CommandItem[];
  priority: number;
}

/**
 * 增强的块菜单组件
 */
export const EnhancedBlockMenu: React.FC<EnhancedBlockMenuProps> = ({
  position,
  onSelect,
  onClose,
  commandSystem,
  allowedBlocks,
  initialQuery = '',
  className = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 100);

  // 搜索命令
  const searchResults = useMemo(() => {
    setIsLoading(true);
    
    try {
      const results = commandSystem.searchCommands(debouncedQuery, CommandType.SLASH);
      
      // 过滤允许的块类型
      let filteredCommands = results.commands;
      if (allowedBlocks && allowedBlocks.length > 0) {
        filteredCommands = results.commands.filter(cmd => 
          allowedBlocks.includes(cmd.id.replace('slash-', ''))
        );
      }

      return {
        commands: filteredCommands,
        stats: results.stats
      };
    } catch (error) {
      console.error('搜索命令失败:', error);
      return { commands: [], stats: { total: 0, filtered: 0, searchTime: 0 } };
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, commandSystem, allowedBlocks]);

  // 获取使用统计
  const usageStats = useMemo(() => {
    return commandSystem.getUsageStats();
  }, [commandSystem]);

  // 获取最近使用的命令
  const recentCommands = useMemo(() => {
    const recentIds = commandSystem.getRecentCommands();
    return recentIds
      .slice(0, 5)
      .map(id => searchResults.commands.find(cmd => cmd.id === id))
      .filter(Boolean) as CommandItem[];
  }, [commandSystem, searchResults.commands]);

  // 按组分类命令
  const commandGroups = useMemo((): CommandGroup[] => {
    const { commands } = searchResults;
    
    if (commands.length === 0) return [];

    // 如果没有查询，显示最近使用
    if (!query.trim() && recentCommands.length > 0) {
      return [{
        name: '最近使用',
        icon: <Clock className="w-4 h-4" />,
        commands: recentCommands,
        priority: 10
      }];
    }

    // 按分组归类
    const groups = new Map<string, CommandItem[]>();
    
    commands.forEach(cmd => {
      const groupName = cmd.group || '其他';
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(cmd);
    });

    // 转换为数组并排序
    const groupArray = Array.from(groups.entries()).map(([name, commands]): CommandGroup => {
      let icon: React.ReactNode;
      let priority = 0;

      switch (name) {
        case '基础':
          icon = <Star className="w-4 h-4" />;
          priority = 10;
          break;
        case '提及':
          icon = <TrendingUp className="w-4 h-4" />;
          priority = 8;
          break;
        case '链接':
          icon = <TrendingUp className="w-4 h-4" />;
          priority = 6;
          break;
        default:
          icon = <Star className="w-4 h-4" />;
          priority = 0;
      }

      return { name, icon, commands, priority };
    });

    return groupArray.sort((a, b) => b.priority - a.priority);
  }, [searchResults, query, recentCommands]);

  // 获取所有命令的平铺列表（用于键盘导航）
  const flatCommands = useMemo(() => {
    return commandGroups.flatMap(group => group.commands);
  }, [commandGroups]);

  // 重置状态
  useEffect(() => {
    setQuery(initialQuery);
    setSelectedIndex(0);
    
    // 聚焦搜索输入框
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, [initialQuery]);

  // 处理键盘事件
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < flatCommands.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : flatCommands.length - 1
        );
        break;
        
      case 'Enter':
        event.preventDefault();
        if (flatCommands[selectedIndex]) {
          handleSelectCommand(flatCommands[selectedIndex]);
        }
        break;
        
      case 'Tab':
        event.preventDefault();
        // Tab键快速选择第一个结果
        if (flatCommands[0]) {
          handleSelectCommand(flatCommands[0]);
        }
        break;
    }
  };

  // 处理命令选择
  const handleSelectCommand = (command: CommandItem) => {
    onSelect(command.id);
    onClose();
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // 滚动到选中项
  useEffect(() => {
    if (menuRef.current && selectedIndex >= 0) {
      const selectedElement = menuRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex]);

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
      style={{
        left: position.x,
        top: position.y,
        maxHeight: '400px'
      }}
    >
      {/* 搜索输入 */}
      <div className="flex items-center px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <Search className="w-4 h-4 text-gray-400 mr-2" />
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索块类型..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500"
        />
        {isLoading && (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* 命令列表 */}
      <div className="max-h-80 overflow-y-auto">
        {commandGroups.length === 0 ? (
          <div className="px-3 py-8 text-center text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">
              {query.trim() ? '未找到匹配的块类型' : '开始输入以搜索...'}
            </p>
          </div>
        ) : (
          commandGroups.map((group, groupIndex) => (
            <div key={group.name}>
              {/* 分组标题 */}
              <div className="flex items-center px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                {group.icon}
                <span className="ml-2">{group.name}</span>
                <span className="ml-auto text-gray-400">
                  {group.commands.length}
                </span>
              </div>
              
              {/* 分组命令 */}
              {group.commands.map((command, commandIndex) => {
                const globalIndex = commandGroups
                  .slice(0, groupIndex)
                  .reduce((acc, g) => acc + g.commands.length, 0) + commandIndex;
                
                const isSelected = globalIndex === selectedIndex;
                const usageCount = usageStats.get(command.id) || 0;
                
                return (
                  <div
                    key={command.id}
                    data-index={globalIndex}
                    onClick={() => handleSelectCommand(command)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      {/* 命令图标 */}
                      <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center mr-3 ${
                        isSelected ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <span className="text-xs">
                          {command.icon || command.title.charAt(0)}
                        </span>
                      </div>
                      
                      {/* 命令信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {command.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {command.description}
                        </div>
                      </div>
                    </div>
                    
                    {/* 使用统计 */}
                    {usageCount > 0 && (
                      <div className="flex-shrink-0 ml-2">
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 rounded">
                          {usageCount}
                        </span>
                      </div>
                    )}
                    
                    {/* 快捷键 */}
                    {command.shortcut && (
                      <div className="flex-shrink-0 ml-2">
                        <kbd className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1 rounded">
                          {command.shortcut}
                        </kbd>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* 底部统计信息 */}
      {searchResults.stats.filtered > 0 && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {searchResults.stats.filtered} 个结果
              {searchResults.stats.searchTime > 0 && (
                <span className="ml-2">
                  ({searchResults.stats.searchTime.toFixed(1)}ms)
                </span>
              )}
            </span>
            <span>↑↓ 导航 ↵ 选择</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedBlockMenu;
