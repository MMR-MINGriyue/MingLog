/**
 * 版本管理器测试
 */

import { describe, it, expect } from 'vitest'
import { VersionManager } from '../utils/version-manager'

describe('VersionManager', () => {
  describe('parseVersion', () => {
    it('应该正确解析标准版本', () => {
      const version = VersionManager.parseVersion('1.2.3')
      expect(version).toEqual({
        major: 1,
        minor: 2,
        patch: 3
      })
    })

    it('应该正确解析预发布版本', () => {
      const version = VersionManager.parseVersion('1.2.3-alpha.1')
      expect(version).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'alpha.1'
      })
    })

    it('应该正确解析带构建信息的版本', () => {
      const version = VersionManager.parseVersion('1.2.3+build.1')
      expect(version).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        build: 'build.1'
      })
    })

    it('应该抛出错误对于无效版本', () => {
      expect(() => VersionManager.parseVersion('invalid')).toThrow('Invalid version format')
    })
  })

  describe('compareVersions', () => {
    it('应该正确比较版本', () => {
      expect(VersionManager.compareVersions('1.0.0', '1.0.0')).toBe(0)
      expect(VersionManager.compareVersions('1.0.1', '1.0.0')).toBe(1)
      expect(VersionManager.compareVersions('1.0.0', '1.0.1')).toBe(-1)
      expect(VersionManager.compareVersions('2.0.0', '1.9.9')).toBe(1)
      expect(VersionManager.compareVersions('1.1.0', '1.0.9')).toBe(1)
    })

    it('应该正确处理预发布版本', () => {
      expect(VersionManager.compareVersions('1.0.0-alpha', '1.0.0')).toBe(-1)
      expect(VersionManager.compareVersions('1.0.0', '1.0.0-alpha')).toBe(1)
      expect(VersionManager.compareVersions('1.0.0-alpha', '1.0.0-beta')).toBe(-1)
    })
  })

  describe('satisfiesConstraint', () => {
    it('应该处理精确匹配', () => {
      expect(VersionManager.satisfiesConstraint('1.0.0', '1.0.0')).toBe(true)
      expect(VersionManager.satisfiesConstraint('1.0.1', '1.0.0')).toBe(false)
    })

    it('应该处理 >= 约束', () => {
      expect(VersionManager.satisfiesConstraint('1.0.1', '>=1.0.0')).toBe(true)
      expect(VersionManager.satisfiesConstraint('1.0.0', '>=1.0.0')).toBe(true)
      expect(VersionManager.satisfiesConstraint('0.9.9', '>=1.0.0')).toBe(false)
    })

    it('应该处理 > 约束', () => {
      expect(VersionManager.satisfiesConstraint('1.0.1', '>1.0.0')).toBe(true)
      expect(VersionManager.satisfiesConstraint('1.0.0', '>1.0.0')).toBe(false)
    })

    it('应该处理 <= 约束', () => {
      expect(VersionManager.satisfiesConstraint('1.0.0', '<=1.0.0')).toBe(true)
      expect(VersionManager.satisfiesConstraint('0.9.9', '<=1.0.0')).toBe(true)
      expect(VersionManager.satisfiesConstraint('1.0.1', '<=1.0.0')).toBe(false)
    })

    it('应该处理 < 约束', () => {
      expect(VersionManager.satisfiesConstraint('0.9.9', '<1.0.0')).toBe(true)
      expect(VersionManager.satisfiesConstraint('1.0.0', '<1.0.0')).toBe(false)
    })

    it('应该处理 ^ 约束（兼容版本）', () => {
      expect(VersionManager.satisfiesConstraint('1.2.3', '^1.2.0')).toBe(true)
      expect(VersionManager.satisfiesConstraint('1.3.0', '^1.2.0')).toBe(true)
      expect(VersionManager.satisfiesConstraint('2.0.0', '^1.2.0')).toBe(false)
      expect(VersionManager.satisfiesConstraint('1.1.9', '^1.2.0')).toBe(false)
    })

    it('应该处理 ~ 约束（近似版本）', () => {
      expect(VersionManager.satisfiesConstraint('1.2.3', '~1.2.0')).toBe(true)
      expect(VersionManager.satisfiesConstraint('1.2.9', '~1.2.0')).toBe(true)
      expect(VersionManager.satisfiesConstraint('1.3.0', '~1.2.0')).toBe(false)
      expect(VersionManager.satisfiesConstraint('1.1.9', '~1.2.0')).toBe(false)
    })

    it('应该处理范围约束', () => {
      expect(VersionManager.satisfiesConstraint('1.5.0', '>=1.0.0 <2.0.0')).toBe(true)
      expect(VersionManager.satisfiesConstraint('2.0.0', '>=1.0.0 <2.0.0')).toBe(false)
      expect(VersionManager.satisfiesConstraint('0.9.9', '>=1.0.0 <2.0.0')).toBe(false)
    })
  })

  describe('getLatestSatisfyingVersion', () => {
    it('应该返回满足约束的最新版本', () => {
      const versions = ['1.0.0', '1.1.0', '1.2.0', '2.0.0']
      const latest = VersionManager.getLatestSatisfyingVersion(versions, '^1.0.0')
      expect(latest).toBe('1.2.0')
    })

    it('应该返回null如果没有满足约束的版本', () => {
      const versions = ['1.0.0', '1.1.0', '1.2.0']
      const latest = VersionManager.getLatestSatisfyingVersion(versions, '^2.0.0')
      expect(latest).toBeNull()
    })
  })

  describe('isCompatible', () => {
    it('应该检查版本兼容性', () => {
      expect(VersionManager.isCompatible('1.2.0', '1.0.0')).toBe(true)
      expect(VersionManager.isCompatible('1.0.0', '1.2.0')).toBe(false)
      expect(VersionManager.isCompatible('2.0.0', '1.0.0')).toBe(false)
    })
  })

  describe('getUpgradeSuggestion', () => {
    it('应该提供升级建议', () => {
      const availableVersions = [
        '1.0.0', '1.0.1', '1.0.2',
        '1.1.0', '1.1.1',
        '1.2.0',
        '2.0.0', '2.1.0'
      ]
      
      const suggestions = VersionManager.getUpgradeSuggestion('1.0.0', availableVersions)
      
      expect(suggestions.patch).toBe('1.0.2')
      expect(suggestions.minor).toBe('1.2.0')
      expect(suggestions.major).toBe('2.1.0')
    })
  })

  describe('validation', () => {
    it('应该验证版本格式', () => {
      expect(VersionManager.isValidVersion('1.0.0')).toBe(true)
      expect(VersionManager.isValidVersion('1.0.0-alpha')).toBe(true)
      expect(VersionManager.isValidVersion('1.0.0+build')).toBe(true)
      expect(VersionManager.isValidVersion('invalid')).toBe(false)
    })

    it('应该验证约束格式', () => {
      expect(VersionManager.isValidConstraint('^1.0.0')).toBe(true)
      expect(VersionManager.isValidConstraint('~1.0.0')).toBe(true)
      expect(VersionManager.isValidConstraint('>=1.0.0 <2.0.0')).toBe(true)
      expect(VersionManager.isValidConstraint('1.0.0')).toBe(true)
    })
  })
})
