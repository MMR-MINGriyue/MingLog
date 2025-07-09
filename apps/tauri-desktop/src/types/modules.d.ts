// Type declarations for missing modules

declare module '@minglog/editor' {
  import { ComponentType } from 'react'
  
  interface BlockEditorProps {
    block: any
    onUpdate: (content: string) => void
    onEnter?: () => void
    onBackspace?: () => void
    onTab?: () => void
    onShiftTab?: () => void
    onArrowUp?: () => void
    onArrowDown?: () => void
    onArrowLeft?: () => void
    onArrowRight?: () => void
    onFocus?: () => void
    onBlur?: () => void
    showToolbar?: boolean
  }
  
  const BlockEditor: ComponentType<BlockEditorProps>
  export default BlockEditor
}

declare module '@minglog/search' {
  export interface SearchEngine {
    search(query: string): Promise<any[]>
    index(content: any): Promise<void>
    clear(): Promise<void>
  }
  
  export const SearchEngine: {
    new(): SearchEngine
  }
}

declare module '@tauri-apps/api/tauri' {
  export function invoke<T = any>(command: string, args?: Record<string, any>): Promise<T>
}

declare module '@tauri-apps/api/core' {
  export function invoke<T = any>(command: string, args?: Record<string, any>): Promise<T>
}
