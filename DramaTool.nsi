; DramaTool NSIS Installer Script
; Variabel PRODUCT_NAME, VERSION, MUI_ICON, dll sudah dikirim oleh electron-builder
; via command line -- JANGAN !define ulang variabel tersebut di sini

;--------------------------------
; Includes
!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "Sections.nsh"

;--------------------------------
; Konstanta internal (tidak bentrok dengan electron-builder)
!define PRODUCT_WEB_SITE    "https://github.com/Ansory/drama-tool"
!define PRODUCT_DIR_REGKEY  "Software\Microsoft\Windows\CurrentVersion\App Paths\DramaTool.exe"
!define PRODUCT_UNINST_KEY  "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

;--------------------------------
; General
Name    "${PRODUCT_NAME} ${VERSION}"
OutFile "DramaTool-Setup-${VERSION}.exe"

InstallDir       "$PROGRAMFILES\${PRODUCT_NAME}"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails     show
ShowUnInstDetails   show
RequestExecutionLevel admin

;--------------------------------
; Interface Settings
!define MUI_ABORTWARNING

; MUI_ICON dan MUI_UNICON sudah dikirim electron-builder via command line
; MUI_WELCOMEFINISHPAGE_BITMAP juga sudah dikirim
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "${MUI_WELCOMEFINISHPAGE_BITMAP}"

;--------------------------------
; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_COMPONENTS
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
; Section Descriptions
LangString DESC_SEC01 ${LANG_ENGLISH} "DramaTool main application files."
LangString DESC_SEC02 ${LANG_ENGLISH} "FFmpeg for video processing."
LangString DESC_SEC03 ${LANG_ENGLISH} "Python backend (Gemini Load Balancer)."
LangString DESC_SEC04 ${LANG_ENGLISH} "Optional CUDA support for GPU acceleration."

;--------------------------------
; Installer Sections

Section "DramaTool (Required)" SEC01
  SectionIn RO

  SetOutPath "$INSTDIR"
  File /r "..\dist\win-unpacked\*.*"

  SetOutPath "$INSTDIR\resources"
  File /r "..\resources\*.*"

  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_FILENAME}.exe"
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_FILENAME}.exe"

  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\${PRODUCT_FILENAME}.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName"     "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon"     "$INSTDIR\${PRODUCT_FILENAME}.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion"  "${VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout"    "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher"       "${COMPANY_NAME}"

  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "EstimatedSize" "$0"

  WriteUninstaller "$INSTDIR\uninst.exe"
SectionEnd

Section "FFmpeg" SEC02
  SetOutPath "$INSTDIR\ffmpeg"
  File /r "..\ffmpeg\*.*"

  WriteRegExpandStr HKLM \
    "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" \
    "Path" \
    "$INSTDIR\ffmpeg\bin;$INSTDIR\ffmpeg"
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
SectionEnd

Section "Python Backend" SEC03
  ; Python sudah di-bundle via PyInstaller menjadi gemini_load_balancer.exe
  SetOutPath "$INSTDIR\backend"
  File /r "..\backend\*.*"
SectionEnd

Section /o "CUDA Support (Optional)" SEC04
  SetOutPath "$INSTDIR\cuda"
  File /r "..\cuda\*.*"
SectionEnd

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC01} $(DESC_SEC01)
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC02} $(DESC_SEC02)
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC03} $(DESC_SEC03)
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC04} $(DESC_SEC04)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

;--------------------------------
; Uninstaller

Section "Uninstall"
  Delete "$INSTDIR\uninst.exe"
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  RMDir  "$SMPROGRAMS\${PRODUCT_NAME}"
  RMDir /r "$INSTDIR"

  MessageBox MB_YESNO "Hapus folder data pengguna juga? (Documents\DramaTool)" IDNO NoDeleteData
    RMDir /r "$DOCUMENTS\DramaTool"
  NoDeleteData:

  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"

  SetAutoClose true
SectionEnd

;--------------------------------
; Functions

Function .onInit
  ReadRegStr $R0 HKLM "${PRODUCT_DIR_REGKEY}" ""
  ${If} $R0 != ""
    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
      "${PRODUCT_NAME} sudah terinstall.$\n$\nKlik OK untuk menghapus versi sebelumnya." \
      IDOK uninst
    Abort

    uninst:
      ExecWait '"$INSTDIR\uninst.exe" _?=$INSTDIR'
      Delete "$INSTDIR\uninst.exe"
      RMDir  "$INSTDIR"
  ${EndIf}
FunctionEnd
