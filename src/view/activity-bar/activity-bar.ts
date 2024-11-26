import { FileItem, FileTreeProvider } from '../../provider';
import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import { MenuOption } from './constants';

export function ActivityBar(context: vscode.ExtensionContext) {
  // 初始化文件树提供器
  const fileTreeProvider = new FileTreeProvider(context);
  vscode.window.registerTreeDataProvider('fileTreeExplorer', fileTreeProvider);
  fileTreeProvider.init();

  // 注册选择文件/文件夹命令
  vscode.commands.registerCommand('fileTreeExplorer.selectFolderOrFile', async () => {
    const uris = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: true,
      canSelectMany: true,
      openLabel: 'Select',
    });

    if (uris && uris.length > 0) {
      // 定义允许的文件类型
      const allowedExtensions = [
        // 文本文件类型
        '.txt', '.md', '.json', '.csv', '.xml', '.yaml', '.yml',
        // 图片文件类型
        '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp', '.tiff',
        // 视频文件类型
        '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.webm', '.flv',
      ];

      // 递归构建文件夹及文件的层级结构
      const buildFileTree = (folderPath: string): any => {
        const tree: Record<string, any> = {};
        const items = fs.readdirSync(folderPath);

        items.forEach((item) => {
          const fullPath = path.join(folderPath, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            // 对子文件夹递归处理

            tree[item] = buildFileTree(fullPath);
          } else if (stat.isFile()) {
            const ext = path.extname(fullPath).toLowerCase();
            if (allowedExtensions.includes(ext)) {
              // 保留符合条件的文件
              tree[item] = fullPath;
            }
          }
        });

        return tree;
      };

      // 构建选择结果的层级结构
      const resultTree: Record<string, any> = {};

      uris.forEach((uri) => {
        const filePath = uri.fsPath;
        const stat = fs.lstatSync(filePath);
        const fileName = path.basename(filePath);
        if (stat.isDirectory()) {
          // 对文件夹构建层级结构
          resultTree[fileName] = buildFileTree(filePath);
        } else if (stat.isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          if (allowedExtensions.includes(ext)) {
            resultTree[fileName] = filePath;
          }
        }
      });

      const newData = {
        ...fileTreeProvider.getTreeData(),
        ...resultTree,
      };

      // 更新文件树
      fileTreeProvider.setTreeData(newData);

      vscode.window.showInformationMessage('Selection updated.');
    }
  });


  vscode.commands.registerCommand('fileTreeExplorer.openContextMenu', async () => {
    const selectedOption = await vscode.window.showQuickPick(
      [MenuOption.ClearAllSelected],
      { placeHolder: 'File Tree Actions' }
    );

    if (selectedOption === MenuOption.ClearAllSelected) {
      vscode.commands.executeCommand('fileTreeExplorer.clearAll');
    }
  });

  vscode.commands.registerCommand('fileTreeExplorer.clearAll', async () => {
    const confirmation = await vscode.window.showWarningMessage(
      'Are you sure you want to clear all selected files and folders?',
      { modal: true },
      'Yes'
    );

    if (confirmation === 'Yes') {

      // 刷新视图
      fileTreeProvider.clear();

      vscode.window.showInformationMessage('All selected files and folders have been cleared.');
    }
  });

  vscode.commands.registerCommand('fileTreeExplorer.itemClicked', async (file: FileItem) => {
    const { filePath, isFolder } = file;
    if (!filePath) {
      return;
    };

    const folderPath = isFolder ? filePath : filePath.replace(`/${path.basename(filePath)}`, '');
    // 记录选中路径
    context.globalState.update('lastClickedPath', filePath);
    context.globalState.update('lastClickedFolderPath', folderPath);
    // 打开文件
    const uri = vscode.Uri.file(filePath);
    !isFolder && (await vscode.commands.executeCommand('vscode.open', uri));
  });

  // 注册点击文件/文件夹的命令
  vscode.commands.registerCommand('fileTreeExplorer.selectItem', async (file: FileItem) => {
    const { filePath, isFolder } = file;
    if (!filePath) {
      return;
    };
    const folderPath = isFolder ? filePath : filePath.replace(`/${path.basename(filePath)}`, '');
    context.globalState.update('lastClickedFolderPath', folderPath);
  });
}