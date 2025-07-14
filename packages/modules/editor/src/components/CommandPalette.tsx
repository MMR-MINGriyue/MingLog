/**
 * 全局命令面板组件
 * 实现类似Notion的Ctrl+P全局搜索和命令执行功能
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Command, Clock, Star, ArrowRight, Keyboard } from 'lucide-react';
import { CommandSystem, CommandItem, CommandContext, CommandType } from '../commands/CommandSystem';
import { useDebounce } from '../hooks/useDebounce';

interface CommandPaletteProps {
  /** 是否显示 */
  visible: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 命令系统实例 */
  commandSystem: CommandSystem;
  /** 编辑器上下文 */
  editorContext?: CommandContext;
  /** 自定义样式类名 */
  className?: string;
}

interface CommandGroup {
  name: string;
  commands: CommandItem[];
}

/**
 * 命令面板组件
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  visible,
  onClose,
  commandSystem,
  editorContext,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<CommandItem[]>([]);
  const [recentCommands, setRecentCommands] = useState<CommandItem[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 150);

  // 获取最近使用的命令
  useEffect(() => {
    if (visible) {
      const recentIds = commandSystem.getRecentCommands();
      const recent = recentIds
        .slice(0, 5)
        .map(id => Array.from(commandSystem['commands'].values()).find(cmd => cmd.id === id))
        .filter(Boolean) as CommandItem[];
      setRecentCommands(recent);
    }
  }, [visible, commandSystem]);

  // 搜索命令
  useEffect(() => {
    if (!visible) return;

    setIsLoading(true);
    
    try {
      const results = commandSystem.searchCommands(debouncedQuery);
      setSearchResults(results.commands);
      setSelectedIndex(0);
    } catch (error) {
      console.error('搜索命令失败:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, visible, commandSystem]);

  // 重置状态
  useEffect(() => {
    if (visible) {
      setQuery('');
      setSelectedIndex(0);
      setSearchResults([]);
      // 聚焦输入框
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  // 按组分类命令
  const commandGroups = useMemo((): CommandGroup[] => {
    const commands = query.trim() ? searchResults : recentCommands;
    
    if (!commands.length) return [];

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
    return Array.from(groups.entries())
      .map(([name, commands]) => ({ name, commands }))
      .sort((a, b) => {
        // 最近使用的分组排在前面
        if (!query.trim()) {
          if (a.name === '最近使用') return -1;
          if (b.name === '最近使用') return 1;
        }
        return a.name.localeCompare(b.name);
      });
  }, [query, searchResults, recentCommands]);

  // 获取所有命令的平铺列表（用于键盘导航）
  const flatCommands = useMemo(() => {
    return commandGroups.flatMap(group => group.commands);
  }, [commandGroups]);

  // 处理键盘事件
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
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
          handleExecuteCommand(flatCommands[selectedIndex]);
        }
        break;
        
      case 'Tab':
        event.preventDefault();
        // Tab键可以用于快速选择第一个结果
        if (flatCommands[0]) {
          handleExecuteCommand(flatCommands[0]);
        }
        break;
    }
  }, [flatCommands, selectedIndex, onClose]);

  // 执行命令
  const handleExecuteCommand = useCallback(async (command: CommandItem) => {
    try {
      const context: CommandContext = {
        editor: editorContext?.editor,
        selection: editorContext?.selection,
        query: query.trim(),
        data: editorContext?.data
      };

      await commandSystem.executeCommand(command.id, context);
      onClose();
    } catch (error) {
      console.error('执行命令失败:', error);
      // 这里可以显示错误提示
    }
  }, [commandSystem, editorContext, query, onClose]);

  // 滚动到选中项
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex]);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-start justify-center pt-20 ${className}`}>
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 命令面板 */}
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* 搜索输入 */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索命令或输入 '/' 查看所有命令..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 text-lg"
          />
          {isLoading && (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* 命令列表 */}
        <div 
          ref={listRef}
          className="max-h-96 overflow-y-auto"
        >
          {commandGroups.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              {query.trim() ? '未找到匹配的命令' : '开始输入以搜索命令...'}
            </div>
          ) : (
            commandGroups.map((group, groupIndex) => (
              <div key={group.name}>
                {/* 分组标题 */}
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
                  {group.name}
                </div>
                
                {/* 分组命令 */}
                {group.commands.map((command, commandIndex) => {
                  const globalIndex = commandGroups
                    .slice(0, groupIndex)
                    .reduce((acc, g) => acc + g.commands.length, 0) + commandIndex;
                  
                  const isSelected = globalIndex === selectedIndex;
                  
                  return (
                    <div
                      key={command.id}
                      onClick={() => handleExecuteCommand(command)}
                      className={`px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        {/* 命令图标 */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center mr-3 ${
                          isSelected ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          {command.icon ? (
                            <Command className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          ) : (
                            <Command className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          )}
                        </div>
                        
                        {/* 命令信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {command.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {command.description}
                          </div>
                        </div>
                      </div>
                      
                      {/* 快捷键提示 */}
                      {command.shortcut && (
                        <div className="flex-shrink-0 ml-3">
                          <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border">
                            {command.shortcut}
                          </kbd>
                        </div>
                      )}
                      
                      {/* 选中指示器 */}
                      {isSelected && (
                        <ArrowRight className="w-4 h-4 text-blue-500 ml-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Keyboard className="w-3 h-3 mr-1" />
                ↑↓ 导航
              </span>
              <span>↵ 执行</span>
              <span>Esc 关闭</span>
            </div>
            {flatCommands.length > 0 && (
              <span>{flatCommands.length} 个命令</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
