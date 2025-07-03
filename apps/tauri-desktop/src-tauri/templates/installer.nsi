; 明志桌面版 NSIS 安装脚本
; 使用现代UI界面

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "WinVer.nsh"

; 安装程序信息
!define PRODUCT_NAME "明志桌面版"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "MingLog Team"
!define PRODUCT_WEB_SITE "https://minglog.com"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\minglog-desktop.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

; 安装程序属性
Name "${PRODUCT_NAME}"
OutFile "明志桌面版安装程序.exe"
InstallDir "$PROGRAMFILES\${PRODUCT_NAME}"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show
RequestExecutionLevel admin
Unicode True

; 版本信息
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey "ProductVersion" "${PRODUCT_VERSION}"
VIAddVersionKey "CompanyName" "${PRODUCT_PUBLISHER}"
VIAddVersionKey "FileDescription" "${PRODUCT_NAME} 安装程序"
VIAddVersionKey "FileVersion" "${PRODUCT_VERSION}"
VIAddVersionKey "LegalCopyright" "Copyright © 2024 ${PRODUCT_PUBLISHER}"

; 现代UI设置
!define MUI_ABORTWARNING
!define MUI_ICON "installer.ico"
!define MUI_UNICON "installer.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "sidebar.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "sidebar.bmp"

; 欢迎页面
!define MUI_WELCOMEPAGE_TITLE "欢迎使用 ${PRODUCT_NAME} 安装向导"
!define MUI_WELCOMEPAGE_TEXT "这个向导将指导您完成 ${PRODUCT_NAME} 的安装过程。$\r$\n$\r$\n${PRODUCT_NAME} 是一个现代化的知识管理工具，帮助您整理想法、创建连接并构建个人知识库。$\r$\n$\r$\n建议您在继续安装前关闭所有其他应用程序。这将允许安装程序更新相关的系统文件，而无需重新启动您的计算机。$\r$\n$\r$\n点击 下一步 继续。"
!insertmacro MUI_PAGE_WELCOME

; 许可协议页面
!insertmacro MUI_PAGE_LICENSE "license.txt"

; 组件选择页面
!insertmacro MUI_PAGE_COMPONENTS

; 安装目录选择页面
!insertmacro MUI_PAGE_DIRECTORY

; 安装进度页面
!insertmacro MUI_PAGE_INSTFILES

; 完成页面
!define MUI_FINISHPAGE_RUN "$INSTDIR\明志桌面版.exe"
!define MUI_FINISHPAGE_RUN_TEXT "启动 ${PRODUCT_NAME}"
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\README.txt"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "查看说明文件"
!define MUI_FINISHPAGE_LINK "访问 ${PRODUCT_NAME} 官方网站"
!define MUI_FINISHPAGE_LINK_LOCATION "${PRODUCT_WEB_SITE}"
!insertmacro MUI_PAGE_FINISH

; 卸载页面
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; 语言设置
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

; 安装类型
InstType "完整安装"
InstType "最小安装"

; 安装节
Section "主程序" SEC01
  SectionIn RO 1 2
  SetOutPath "$INSTDIR"
  SetOverwrite ifnewer
  
  ; 主程序文件
  File "明志桌面版.exe"
  File "WebView2Loader.dll"
  
  ; 创建快捷方式
  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\明志桌面版.exe"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\卸载 ${PRODUCT_NAME}.lnk" "$INSTDIR\uninst.exe"
  
  ; 注册表项
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\明志桌面版.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\明志桌面版.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "NoModify" 1
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "NoRepair" 1
  
  ; 文件关联
  WriteRegStr HKLM "Software\Classes\.minglog" "" "MingLog.Document"
  WriteRegStr HKLM "Software\Classes\MingLog.Document" "" "MingLog 文档"
  WriteRegStr HKLM "Software\Classes\MingLog.Document\DefaultIcon" "" "$INSTDIR\明志桌面版.exe,0"
  WriteRegStr HKLM "Software\Classes\MingLog.Document\shell\open\command" "" '"$INSTDIR\明志桌面版.exe" "%1"'
  
  ; URL协议注册
  WriteRegStr HKLM "Software\Classes\minglog" "" "MingLog Protocol"
  WriteRegStr HKLM "Software\Classes\minglog" "URL Protocol" ""
  WriteRegStr HKLM "Software\Classes\minglog\DefaultIcon" "" "$INSTDIR\明志桌面版.exe,0"
  WriteRegStr HKLM "Software\Classes\minglog\shell\open\command" "" '"$INSTDIR\明志桌面版.exe" "%1"'
SectionEnd

Section "桌面快捷方式" SEC02
  SectionIn 1
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\明志桌面版.exe"
SectionEnd

Section "自动启动" SEC03
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_NAME}" "$INSTDIR\明志桌面版.exe --minimized"
SectionEnd

Section "Visual C++ 运行库" SEC04
  SectionIn 1 2
  ; 检查并安装 VC++ 运行库
  SetOutPath "$TEMP"
  File "vcredist_x64.exe"
  ExecWait '"$TEMP\vcredist_x64.exe" /quiet /norestart'
  Delete "$TEMP\vcredist_x64.exe"
SectionEnd

; 节描述
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC01} "安装 ${PRODUCT_NAME} 主程序文件和必需的组件。"
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC02} "在桌面创建 ${PRODUCT_NAME} 的快捷方式。"
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC03} "设置 ${PRODUCT_NAME} 随系统启动。"
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC04} "安装 Microsoft Visual C++ 运行库（如果尚未安装）。"
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; 安装前检查
Function .onInit
  ; 检查系统版本
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_OK|MB_ICONSTOP "此应用程序需要 Windows 10 或更高版本。"
    Abort
  ${EndIf}
  
  ; 检查是否已安装
  ReadRegStr $R0 ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString"
  StrCmp $R0 "" done
  
  MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
  "${PRODUCT_NAME} 已经安装。$\n$\n点击 确定 卸载之前的版本，或点击 取消 取消此次安装。" \
  IDOK uninst
  Abort
  
uninst:
  ClearErrors
  ExecWait '$R0 _?=$INSTDIR'
  
  IfErrors no_remove_uninstaller done
    no_remove_uninstaller:
  
done:
FunctionEnd

; 卸载节
Section Uninstall
  ; 删除文件
  Delete "$INSTDIR\明志桌面版.exe"
  Delete "$INSTDIR\WebView2Loader.dll"
  Delete "$INSTDIR\uninst.exe"
  Delete "$INSTDIR\README.txt"
  
  ; 删除快捷方式
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\卸载 ${PRODUCT_NAME}.lnk"
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  
  ; 删除目录
  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"
  RMDir "$INSTDIR"
  
  ; 删除注册表项
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  DeleteRegKey HKLM "Software\Classes\.minglog"
  DeleteRegKey HKLM "Software\Classes\MingLog.Document"
  DeleteRegKey HKLM "Software\Classes\minglog"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_NAME}"
  
  SetAutoClose true
SectionEnd

; 卸载前检查
Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "您确实要完全移除 $(^Name) 及其所有的组件吗？" IDYES +2
  Abort
FunctionEnd

Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK "$(^Name) 已成功地从您的计算机中移除。"
FunctionEnd
