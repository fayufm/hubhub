; -- hubhub_installer.iss --
[Setup]
AppName=HubHub
AppVersion=1.0
AppPublisher=Your Company
DefaultDirName={autopf}\HubHub
DefaultGroupName=HubHub
OutputBaseFilename=HubHub_Setup
OutputDir=.\Output
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
SetupIconFile=resources\01-ico.ico
UninstallDisplayIcon={app}\resources\38-ico.ico
WizardResizable=no
WizardSizePercent=100,100
DisableWelcomePage=yes
DisableDirPage=no
DisableProgramGroupPage=yes
DisableReadyPage=yes

[Files]
Source: "..\dist\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs
Source: "resources\background.bmp"; Flags: dontcopy
Source: "resources\DirBrowseButton.bmp"; Flags: dontcopy
Source: "resources\NextButton.bmp"; Flags: dontcopy
Source: "resources\CancelButton.bmp"; Flags: dontcopy
Source: "resources\InstallButton.bmp"; Flags: dontcopy
Source: "resources\FinishButton.bmp"; Flags: dontcopy

[Icons]
Name: "{autodesktop}\HubHub"; Filename: "{app}\hubhub.exe"; IconFilename: "{app}\resources\38-ico.ico"
Name: "{autoprograms}\HubHub"; Filename: "{app}\hubhub.exe"; IconFilename: "{app}\resources\38-ico.ico"

[Tasks]
Name: "desktopicon"; Description: "创建桌面快捷方式"; GroupDescription: "快捷方式:"; Flags: unchecked

[Code]
// ====== 全局变量声明 ======
var
  StatusLabel: TNewStaticText;
  AppTitle: TNewStaticText;
  AppDescription: TNewStaticText;
  IsInstalling: Boolean;
  InstallationStarted: Boolean;

// ====== 目录浏览按钮处理函数 ======
procedure SelectDirButtonOnClick(Sender: TObject);
var
  Dir: String;
begin
  Dir := WizardForm.DirEdit.Text;
  if SelectDirectory(Dir, [sdAllowCreate, sdPerformCreate, sdPrompt], 0) then
    WizardForm.DirEdit.Text := Dir;
end;

// ====== 下一步按钮处理函数 ======
procedure NextButtonOnClick(Sender: TObject);
begin
  WizardForm.NextButton.Click;
end;

// ====== 取消按钮处理函数 ======
procedure CancelButtonOnClick(Sender: TObject);
begin
  WizardForm.CancelButton.Click;
end;

// ====== 初始化向导 ======
procedure InitializeWizard();
var
  BackgroundImage: TBitmapImage;
begin
  IsInstalling := False;
  InstallationStarted := False;

  // ====== 隐藏全部默认元素 ======
  WizardForm.Bevel.Visible := False;
  WizardForm.Bevel1.Visible := False;
  WizardForm.BeveledLabel.Visible := False;
  WizardForm.PageNameLabel.Visible := False;
  WizardForm.PageDescriptionLabel.Visible := False;
  WizardForm.BackButton.Visible := False;
  WizardForm.OuterNotebook.Visible := False;
  WizardForm.InnerNotebook.Visible := False;
  WizardForm.WelcomeLabel1.Visible := False;
  WizardForm.WelcomeLabel2.Visible := False;
  WizardForm.ComponentsList.Visible := False;
  WizardForm.RunList.Visible := False;
  WizardForm.ReadyMemo.Visible := False;
  WizardForm.FinishedHeadingLabel.Visible := False;
  WizardForm.FinishedLabel.Visible := False;
  WizardForm.SelectDirBrowseLabel.Visible := False;

  // ====== 窗口尺寸 ======
  WizardForm.ClientWidth := 800;
  WizardForm.ClientHeight := 600;
  WizardForm.Caption := 'HubHub 安装向导';

  // ====== 背景图加载 ======
  ExtractTemporaryFile('background.bmp');
  BackgroundImage := TBitmapImage.Create(WizardForm);
  BackgroundImage.Parent := WizardForm;
  BackgroundImage.Align := alClient;
  BackgroundImage.Bitmap.LoadFromFile(ExpandConstant('{tmp}\background.bmp'));
  BackgroundImage.Stretch := True;

  // ====== 应用标题 ======
  AppTitle := TNewStaticText.Create(WizardForm);
  with AppTitle do
  begin
    Parent := WizardForm;
    Caption := 'HubHub';
    Font.Size := 24;
    Font.Style := [fsBold];
    Font.Color := clWhite;
    SetBounds(50, 50, 300, 40);
    Transparent := True;
    BringToFront;
  end;

  // ====== 应用描述 ======
  AppDescription := TNewStaticText.Create(WizardForm);
  with AppDescription do
  begin
    Parent := WizardForm;
    Caption := 'GitHub项目搜索与下载工具';
    Font.Size := 12;
    Font.Color := clWhite;
    SetBounds(50, 95, 500, 20);
    Transparent := True;
    BringToFront;
  end;

  // ====== 目录选择控件 ======
  with WizardForm.SelectDirLabel do
  begin
    Parent := WizardForm;
    Caption := ' 安装位置：';
    Font.Size := 10;
    Font.Color := clWhite;
    Top := 300;
    Left := 50;
    Width := 700;
    Transparent := True;
    BringToFront;
  end;

  with WizardForm.DirEdit do
  begin
    Parent := WizardForm;
    Top := 330;
    Left := 50;
    Width := 550;
    Height := 25;
    Font.Size := 9;
    Color := $F8F8F8;
    BringToFront;
  end;

  // ====== 目录浏览按钮 ======
  with WizardForm.DirBrowseButton do
  begin
    Parent := WizardForm;
    Top := 330;
    Left := 610;
    Width := 130;
    Height := 40;
    Caption := '';
    OnClick := @SelectDirButtonOnClick; // 这里使用我们自己定义的函数
    BringToFront;
  end;

  with TBitmapImage.Create(WizardForm) do
  begin
    Parent := WizardForm.DirBrowseButton;
    Align := alClient;
    ExtractTemporaryFile('DirBrowseButton.bmp');
    Bitmap.LoadFromFile(ExpandConstant('{tmp}\DirBrowseButton.bmp'));
  end;

  // ====== 状态标签 ======
  StatusLabel := TNewStaticText.Create(WizardForm);
  with StatusLabel do
  begin
    Parent := WizardForm;
    Caption := '准备安装...';
    Font.Size := 10;
    Font.Color := clWhite;
    Top := 430;
    Left := 50;
    Width := 700;
    Transparent := True;
    BringToFront;
  end;

  // ====== 进度条配置 ======
  WizardForm.ProgressGauge.Parent := WizardForm;
  WizardForm.ProgressGauge.Top := 450;
  WizardForm.ProgressGauge.Left := 50;
  WizardForm.ProgressGauge.Width := 700;
  WizardForm.ProgressGauge.Height := 20;
  WizardForm.ProgressGauge.BringToFront;

  // ====== 操作按钮配置 ======
  with WizardForm.NextButton do
  begin
    Parent := WizardForm;
    Top := 520;
    Left := 470;
    Width := 130;
    Height := 60;
    Caption := '';
    OnClick := @NextButtonOnClick; // 使用新的函数名
    BringToFront;
  end;

  ExtractTemporaryFile('NextButton.bmp');
  ExtractTemporaryFile('InstallButton.bmp');
  ExtractTemporaryFile('FinishButton.bmp');

  with TBitmapImage.Create(WizardForm) do
  begin
    Parent := WizardForm.NextButton;
    Name := 'NextButtonImage';
    Align := alClient;
    Bitmap.LoadFromFile(ExpandConstant('{tmp}\NextButton.bmp'));
  end;

  with WizardForm.CancelButton do
  begin
    Parent := WizardForm;
    Top := 520;
    Left := 620;
    Width := 130;
    Height := 60;
    Caption := '';
    OnClick := @CancelButtonOnClick; // 使用新的函数名
    BringToFront;
  end;

  with TBitmapImage.Create(WizardForm) do
  begin
    Parent := WizardForm.CancelButton;
    Align := alClient;
    ExtractTemporaryFile('CancelButton.bmp');
    Bitmap.LoadFromFile(ExpandConstant('{tmp}\CancelButton.bmp'));
  end;
  
  // 创建桌面快捷方式选项
  WizardForm.TasksList.Parent := WizardForm;
  WizardForm.TasksList.Visible := True;
  WizardForm.TasksList.Left := 50;
  WizardForm.TasksList.Top := 370;
  WizardForm.TasksList.Width := 700;
  WizardForm.TasksList.Height := 40;
  WizardForm.TasksList.Color := clNone;
  WizardForm.TasksList.Flat := True;
  WizardForm.TasksList.WantTabs := True;
  WizardForm.TasksList.MinItemHeight := 30;
  WizardForm.TasksList.ShowLines := False;
  WizardForm.TasksList.BorderStyle := bsNone;
  WizardForm.TasksList.Font.Color := clWhite;
  WizardForm.TasksList.BringToFront;
end;

// ====== 页面切换处理 ======
procedure CurPageChanged(CurPageID: Integer);
var
  NextButtonImage: TBitmapImage;
begin
  NextButtonImage := TBitmapImage(WizardForm.FindComponent('NextButtonImage'));
  if NextButtonImage = nil then Exit;

  case CurPageID of
    wpSelectDir: 
    begin
      WizardForm.DirEdit.Visible := True;
      WizardForm.DirBrowseButton.Visible := True;
      WizardForm.SelectDirLabel.Visible := True;
      WizardForm.TasksList.Visible := True;
      StatusLabel.Caption := '选择安装位置并点击"下一步"开始安装';
      NextButtonImage.Bitmap.LoadFromFile(ExpandConstant('{tmp}\NextButton.bmp'));
    end;
    wpInstalling: 
    begin
      WizardForm.DirEdit.Visible := False;
      WizardForm.DirBrowseButton.Visible := False;
      WizardForm.SelectDirLabel.Visible := False;
      WizardForm.TasksList.Visible := False;
      StatusLabel.Caption := '正在安装...';
      IsInstalling := True;
      NextButtonImage.Bitmap.LoadFromFile(ExpandConstant('{tmp}\InstallButton.bmp'));
    end;
    wpFinished: 
    begin
      StatusLabel.Caption := '安装完成!';
      WizardForm.CancelButton.Visible := False;
      NextButtonImage.Bitmap.LoadFromFile(ExpandConstant('{tmp}\FinishButton.bmp'));
    end;
  end;
end;

// ====== 安装进度更新 ======
procedure UpdateProgress(CurProgress, MaxProgress: Integer);
begin
  if IsInstalling then
  begin
    if not InstallationStarted then
    begin
      InstallationStarted := True;
    end;
    
    // 计算百分比并显示
    if MaxProgress > 0 then
      StatusLabel.Caption := Format('正在安装... %d%%', [(CurProgress * 100) div MaxProgress]);
  end;
end;

// ====== 安装后处理 ======
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssInstall then
  begin
    // 安装开始
    IsInstalling := True;
    InstallationStarted := True;
    StatusLabel.Caption := '开始安装...';
  end
  else if CurStep = ssPostInstall then
  begin
    // 安装完成后的操作
    RegWriteStringValue(HKEY_CURRENT_USER, 'Environment', 'HubHub_Path', ExpandConstant('{app}'));
    StatusLabel.Caption := '安装完成!';
  end;
end;

// ====== 自定义安装页面信息 ======
function UpdateReadyMemo(Space, NewLine, MemoUserInfoInfo, MemoDirInfo, MemoTypeInfo, MemoComponentsInfo, MemoGroupInfo, MemoTasksInfo: String): String;
begin
  Result := '';
  if MemoUserInfoInfo <> '' then
    Result := Result + MemoUserInfoInfo + NewLine + NewLine;
  if MemoDirInfo <> '' then
    Result := Result + MemoDirInfo + NewLine + NewLine;
end;