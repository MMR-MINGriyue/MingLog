/**
 * 版本管理工具
 * 处理模块版本约束和兼容性检查
 */

export interface SemanticVersion {
  major: number
  minor: number
  patch: number
  prerelease?: string
  build?: string
}

export class VersionManager {
  /**
   * 解析语义化版本
   */
  static parseVersion(version: string): SemanticVersion {
    const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/
    const match = version.match(regex)
    
    if (!match) {
      throw new Error(`Invalid version format: ${version}`)
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4],
      build: match[5]
    }
  }

  /**
   * 比较两个版本
   * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
   */
  static compareVersions(v1: string, v2: string): number {
    const version1 = this.parseVersion(v1)
    const version2 = this.parseVersion(v2)

    // 比较主版本号
    if (version1.major !== version2.major) {
      return version1.major > version2.major ? 1 : -1
    }

    // 比较次版本号
    if (version1.minor !== version2.minor) {
      return version1.minor > version2.minor ? 1 : -1
    }

    // 比较修订版本号
    if (version1.patch !== version2.patch) {
      return version1.patch > version2.patch ? 1 : -1
    }

    // 比较预发布版本
    if (version1.prerelease && version2.prerelease) {
      return version1.prerelease.localeCompare(version2.prerelease)
    }

    if (version1.prerelease && !version2.prerelease) {
      return -1 // 预发布版本小于正式版本
    }

    if (!version1.prerelease && version2.prerelease) {
      return 1 // 正式版本大于预发布版本
    }

    return 0
  }

  /**
   * 检查版本是否满足约束
   */
  static satisfiesConstraint(version: string, constraint: string): boolean {
    // 移除空格
    constraint = constraint.trim()

    // 精确匹配
    if (!constraint.match(/[<>=^~]/)) {
      return this.compareVersions(version, constraint) === 0
    }

    // 处理范围约束
    if (constraint.includes(' ')) {
      const parts = constraint.split(/\s+/)
      return parts.every(part => this.satisfiesSingleConstraint(version, part))
    }

    return this.satisfiesSingleConstraint(version, constraint)
  }

  /**
   * 检查单个约束条件
   */
  private static satisfiesSingleConstraint(version: string, constraint: string): boolean {
    // >= 约束
    if (constraint.startsWith('>=')) {
      const targetVersion = constraint.slice(2).trim()
      return this.compareVersions(version, targetVersion) >= 0
    }

    // > 约束
    if (constraint.startsWith('>')) {
      const targetVersion = constraint.slice(1).trim()
      return this.compareVersions(version, targetVersion) > 0
    }

    // <= 约束
    if (constraint.startsWith('<=')) {
      const targetVersion = constraint.slice(2).trim()
      return this.compareVersions(version, targetVersion) <= 0
    }

    // < 约束
    if (constraint.startsWith('<')) {
      const targetVersion = constraint.slice(1).trim()
      return this.compareVersions(version, targetVersion) < 0
    }

    // = 约束
    if (constraint.startsWith('=')) {
      const targetVersion = constraint.slice(1).trim()
      return this.compareVersions(version, targetVersion) === 0
    }

    // ^ 约束（兼容版本）
    if (constraint.startsWith('^')) {
      const targetVersion = constraint.slice(1).trim()
      return this.satisfiesCaretConstraint(version, targetVersion)
    }

    // ~ 约束（近似版本）
    if (constraint.startsWith('~')) {
      const targetVersion = constraint.slice(1).trim()
      return this.satisfiesTildeConstraint(version, targetVersion)
    }

    // 默认为精确匹配
    return this.compareVersions(version, constraint) === 0
  }

  /**
   * 检查 ^ 约束（兼容版本）
   * ^1.2.3 := >=1.2.3 <2.0.0
   */
  private static satisfiesCaretConstraint(version: string, targetVersion: string): boolean {
    const v = this.parseVersion(version)
    const target = this.parseVersion(targetVersion)

    // 主版本号必须相同
    if (v.major !== target.major) {
      return false
    }

    // 版本必须大于等于目标版本
    return this.compareVersions(version, targetVersion) >= 0
  }

  /**
   * 检查 ~ 约束（近似版本）
   * ~1.2.3 := >=1.2.3 <1.3.0
   */
  private static satisfiesTildeConstraint(version: string, targetVersion: string): boolean {
    const v = this.parseVersion(version)
    const target = this.parseVersion(targetVersion)

    // 主版本号和次版本号必须相同
    if (v.major !== target.major || v.minor !== target.minor) {
      return false
    }

    // 版本必须大于等于目标版本
    return this.compareVersions(version, targetVersion) >= 0
  }

  /**
   * 获取满足约束的最新版本
   */
  static getLatestSatisfyingVersion(versions: string[], constraint: string): string | null {
    const satisfyingVersions = versions.filter(version => 
      this.satisfiesConstraint(version, constraint)
    )

    if (satisfyingVersions.length === 0) {
      return null
    }

    return satisfyingVersions.sort((a, b) => this.compareVersions(b, a))[0]
  }

  /**
   * 检查版本兼容性
   */
  static isCompatible(currentVersion: string, requiredVersion: string): boolean {
    const current = this.parseVersion(currentVersion)
    const required = this.parseVersion(requiredVersion)

    // 主版本号不同时不兼容
    if (current.major !== required.major) {
      return false
    }

    // 当前版本必须大于等于所需版本
    return this.compareVersions(currentVersion, requiredVersion) >= 0
  }

  /**
   * 获取版本升级建议
   */
  static getUpgradeSuggestion(
    currentVersion: string, 
    availableVersions: string[]
  ): {
    patch?: string
    minor?: string
    major?: string
  } {
    const current = this.parseVersion(currentVersion)
    const suggestions: { patch?: string; minor?: string; major?: string } = {}

    // 查找补丁版本升级
    const patchVersions = availableVersions.filter(v => {
      const version = this.parseVersion(v)
      return version.major === current.major && 
             version.minor === current.minor && 
             version.patch > current.patch
    })
    if (patchVersions.length > 0) {
      suggestions.patch = patchVersions.sort((a, b) => this.compareVersions(b, a))[0]
    }

    // 查找次版本升级
    const minorVersions = availableVersions.filter(v => {
      const version = this.parseVersion(v)
      return version.major === current.major && 
             version.minor > current.minor
    })
    if (minorVersions.length > 0) {
      suggestions.minor = minorVersions.sort((a, b) => this.compareVersions(b, a))[0]
    }

    // 查找主版本升级
    const majorVersions = availableVersions.filter(v => {
      const version = this.parseVersion(v)
      return version.major > current.major
    })
    if (majorVersions.length > 0) {
      suggestions.major = majorVersions.sort((a, b) => this.compareVersions(b, a))[0]
    }

    return suggestions
  }

  /**
   * 验证版本字符串格式
   */
  static isValidVersion(version: string): boolean {
    try {
      this.parseVersion(version)
      return true
    } catch {
      return false
    }
  }

  /**
   * 验证约束字符串格式
   */
  static isValidConstraint(constraint: string): boolean {
    try {
      // 测试约束是否有效
      return this.satisfiesConstraint('1.0.0', constraint) !== undefined
    } catch {
      return false
    }
  }
}
