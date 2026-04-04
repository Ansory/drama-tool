; DramaTool NSIS Installer Script
; Untuk Windows
; FIXED: Section CUDA tidak lagi SectionIn RO, asset files direferensikan dengan benar

;--------------------------------
; Includes
!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "Sections.nsh"

;--------------------------------
; General
!define PRODUCT_NAME        "DramaTool"
!define PRODUCT_VERSION     "1.0.0"
!define PRODUCT_PUBLISHER   "DramaTool Team"
!define PRODUCT_WEB_SITE    "https://github.com/Ansory/drama-tool"
!define PRODUCT_DIR_REGKEY  "Software\Microsoft\Windows\CurrentVersion\App Paths\DramaTool.exe"
!define PRODUCT_UNINST_KEY  "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

Name    "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "DramaTool-Setup-${PRODUCT_VERSION}.exe"

InstallDir          "$PROGRAMFILES\DramaTool"
InstallDirRegKey    HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails     show
ShowUnInstDetails   show
RequestExecutionLevel admin

;--------------------------------
; Interface Settings
!define MUI_ABORTWARNING

; FIXED: Referensikan asset dari folder assets/ yang ada di repo
; Pastikan file-file ini ada sebelum build:
;   assets/installer.ico
;   assets/banner.bmp
;   assets/LICENSE.txt
!define MUI_ICON                        "assets\installer.ico"
!define MUI_UNICON                      "assets\installer.ico"
!define MUI_WELCOMEFINISHPAGE_BITMAP    "assets\banner.bmp"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP          "assets\banner.bmp"

;--------------------------------
; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "assets\LICENSE.txt"
!insertmacro MUI_PAGE_COMPONENTS
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
; Section Descriptions
LangString DESC_SEC01 ${LANG_ENGLISH}   "DramaTool main application files."
LangString DESC_SEC02 ${LANG_ENGLISH}   "FFmpeg for video processing."
LangString DESC_SEC03 ${LANG_ENGLISH}   "Python runtime and required packages."
LangString DESC_SEC04 ${LANG_ENGLISH}   "Optional CUDA support for GPU acceleration."

;--------------------------------
; Installer Sections

Section "DramaTool (Required)" SEC01
  ; Section ini wajib — tidak bisa di-uncheck
  SectionIn RO

  SetOutPath "$INSTDIR"
  File /r "..\dist\win-unpacked\*.*"

  SetOutPath "$INSTDIR\resources"
  File /r "..\resources\*.*"

  ; Buat shortcut di Start Menu dan Desktop
  CreateDirectory "$SMPROGRAMS\DramaTool"
  CreateShortCut "$SMPROGRAMS\DramaTool\DramaTool.lnk" "$INSTDIR\DramaTool.exe"
  CreateShortCut "$DESKTOP\DramaTool.lnk" "$INSTDIR\DramaTool.exe"

  ; Registry untuk uninstall
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\DramaTool.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName"      "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString"  "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon"      "$INSTDIR\DramaTool.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion"   "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout"     "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher"        "${PRODUCT_PUBLISHER}"

  ; Hitung ukuran instalasi
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "EstimatedSize" "$0"

  WriteUninstaller "$INSTDIR\uninst.exe"
SectionEnd

Section "FFmpeg" SEC02
  SetOutPath "$INSTDIR\ffmpeg"
  File /r "..\ffmpeg\*.*"

  ; Tambahkan ffmpeg ke PATH sistem
  WriteRegExpandStr HKLM \
    "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" \
    "Path" \
    "$INSTDIR\ffmpeg\bin;$INSTDIR\ffmpeg"
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
SectionEnd

Section "Python Runtime" SEC03
  SetOutPath "$INSTDIR\python"
  File /r "..\python\*.*"

  SetOutPath "$INSTDIR\backend"
  File /r "..\backend\*.*"

  ; Install Python packages
  nsExec::ExecToLog '"$INSTDIR\python\python.exe" -m pip install -r "$INSTDIR\backend\requirements.txt"'
SectionEnd

; FIXED: Hapus "SectionIn RO" — CUDA adalah fitur opsional, user harus bisa pilih
Section /o "CUDA Support (Optional)" SEC04
  SetOutPath "$INSTDIR\cuda"
  File /r "..\cuda\*.*"
SectionEnd

; Tampilkan deskripsi tiap section di installer
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC01} $(DESC_SEC01)
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC02} $(DESC_SEC02)
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC03} $(DESC_SEC03)
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC04} $(DESC_SEC04)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

;--------------------------------
; Uninstaller Section

Section "Uninstall"
  Delete "$INSTDIR\uninst.exe"
  Delete "$DESKTOP\DramaTool.lnk"
  Delete "$SMPROGRAMS\DramaTool\DramaTool.lnk"
  RMDir  "$SMPROGRAMS\DramaTool"

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
  ; Cek apakah sudah terinstall
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
