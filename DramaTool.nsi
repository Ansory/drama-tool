; DramaTool NSIS Installer Script
; Untuk Windows

;--------------------------------
; Includes
!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"

;--------------------------------
; General
!define PRODUCT_NAME "DramaTool"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "DramaTool Team"
!define PRODUCT_WEB_SITE "https://dramatool.com"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\DramaTool.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "DramaTool-Setup-${PRODUCT_VERSION}.exe"
InstallDir "$PROGRAMFILES\DramaTool"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show
RequestExecutionLevel admin

;--------------------------------
; Interface Settings
!define MUI_ABORTWARNING
!define MUI_ICON "installer.ico"
!define MUI_UNICON "installer.ico"
!define MUI_WELCOMEFINISHPAGE_BITMAP "banner.bmp"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "banner.bmp"

;--------------------------------
; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

;--------------------------------
; Languages
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "Indonesian"

;--------------------------------
; Installer Sections
Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  
  ; Copy aplikasi utama
  File /r "..\dist\win-unpacked\*.*"
  
  ; Copy Python backend
  File /r "..\backend\*.*"
  
  ; Copy FFmpeg
  File /r "..\ffmpeg\*.*"
  
  ; Copy dependencies
  SetOutPath "$INSTDIR\\resources"
  File /r "..\resources\*.*"
  
  ; Buat shortcut di Start Menu
  CreateDirectory "$SMPROGRAMS\DramaTool"
  CreateShortCut "$SMPROGRAMS\DramaTool\DramaTool.lnk" "$INSTDIR\DramaTool.exe"
  CreateShortCut "$DESKTOP\DramaTool.lnk" "$INSTDIR\DramaTool.exe"
  
  ; Registry untuk uninstall
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\DramaTool.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\DramaTool.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  
  ; Hitung ukuran instalasi
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "EstimatedSize" "$0"
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\uninst.exe"
SectionEnd

Section "FFmpeg" SEC02
  SetOutPath "$INSTDIR\\ffmpeg"
  File /r "..\ffmpeg\*.*"
  
  ; Add to PATH
  WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path" "$INSTDIR\ffmpeg\bin;$INSTDIR\ffmpeg"
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
SectionEnd

Section "Python Runtime" SEC03
  SetOutPath "$INSTDIR\\python"
  File /r "..\python\*.*"
  
  ; Install Python packages
  nsExec::ExecToLog '"$INSTDIR\python\python.exe" -m pip install -r "$INSTDIR\backend\requirements.txt"'
SectionEnd

Section "CUDA Support (Optional)" SEC04
  SectionIn RO
  SetOutPath "$INSTDIR\\cuda"
  File /r "..\cuda\*.*"
SectionEnd

;--------------------------------
; Uninstaller Section
Section "Uninstall"
  ; Hapus file
  Delete "$INSTDIR\uninst.exe"
  Delete "$DESKTOP\DramaTool.lnk"
  Delete "$SMPROGRAMS\DramaTool\DramaTool.lnk"
  RMDir "$SMPROGRAMS\DramaTool"
  
  ; Hapus folder aplikasi
  RMDir /r "$INSTDIR"
  
  ; Tanya apakah mau hapus data user
  MessageBox MB_YESNO "Do you want to delete your data folder? (Documents\DramaTool)" IDNO NoDeleteData
    RMDir /r "$DOCUMENTS\DramaTool"
  NoDeleteData:
  
  ; Hapus registry
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  
  SetAutoClose true
SectionEnd

;--------------------------------
; Functions
Function .onInit
  ; Cek apakah sudah terinstall
  ReadRegStr $R0 HKLM "${PRODUCT_DIR_REGKEY}" ""
  ${If} $R0 != ""
    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
      "${PRODUCT_NAME} is already installed. $\n$\nClick OK to remove the previous version." \
      IDOK uninst
    Abort
    uninst:
      ExecWait '"$INSTDIR\uninst.exe" _?=$INSTDIR'
      Delete $INSTDIR\uninst.exe
      RMDir $INSTDIR
  ${EndIf}
FunctionEnd